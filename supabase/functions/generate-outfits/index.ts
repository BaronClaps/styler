import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const GeminiOutfitSchema = {
    type: "object",
    properties: {
        selected_clothing_ids: {
            type: "array",
            items: { type: "string" },
            description: "List of item UUIDs extracted exclusively from the user's provided wardrobe assets list."
        },
        classification_tags: {
            type: "array",
            items: { type: "string" },
            description: "Core aesthetic vibe and descriptor tag markers describing the overall outfit compilation style."
        },
        ai_reasoning: {
            type: "string",
            description: "A concise 1-2 sentence explanation detailing why these specific pieces match together elegantly."
        }
    },
    required: ["selected_clothing_ids", "classification_tags", "ai_reasoning"]
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { data: job, error: jobError } = await supabase
            .from('outfits')
            .select('*')
            .eq('status', 'pending')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (jobError) throw jobError
        if (!job) {
            return new Response(
                JSON.stringify({ status: "No tasks available in queue." }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }

        await supabase.from('outfits').update({ status: 'processing' }).eq('id', job.id)
        const { data: wardrobe, error: wError } = await supabase
            .from('clothing_items')
            .select('id, category, sub_category, primary_color_hex, style_tags, weather_tags, occasions')
            .eq('user_id', job.user_id)
            .eq('status', 'completed')

        if (wError) throw wError
        if (!wardrobe || wardrobe.length < 2) {
            throw new Error("Insufficient parsed wardrobe depth to construct matching combos.")
        }

        let executionDirectives = ""
        if (job.prompt) {
            executionDirectives = `The user submitted an explicit TEXT PROMPT context parameter. You MUST prioritize and format the garment selections to match this description: "${job.prompt}". You must use your judgement to make an outfit that fits this the best.`;
        } else if (job.category_filter || job.style_filter || job.weather_filter || job.occasion_filter) {
            executionDirectives = `The user submitted explicit MANUAL TAG metadata filters. You MUST build an outfit layout matching these tags:`;
            if (job.category_filter) executionDirectives += `\n- Core Focus Category: ${job.category_filter}`
            if (job.style_filter) executionDirectives += `\n- Vibe Style Tag: ${job.style_filter}`
            if (job.weather_filter) executionDirectives += `\n- Target Weather Bounds: ${job.weather_filter}`
            if (job.occasion_filter) executionDirectives += `\n- Context Environment: ${job.occasion_filter}`
        } else {
            executionDirectives = "Create a highly fashionable, balanced, and aesthetically versatile look from the available wardrobe items.";
        }

        const systemInstructions = `
    You are a premier, highly selective modern personal fashion stylist AI. Your objective is to craft EXACTLY ONE highly synchronized, cohesive outfit layout by matching the user's intent with the available wardrobe items provided below.

    === STRUCTURAL CONFIGURATION RULES ===
    1. BASE LAYER MANDATE: Every single generated outfit configuration MUST contain exactly one "Tops" item AND exactly one "Bottoms" item. This is non-negotiable. An outfit without both a top and a bottom is incomplete.
    2. OPTIONAL EXPANSIONS: If the available wardrobe allows for a more comprehensive and styling-forward aesthetic, you SHOULD expand the look by incorporating:
       - Exactly one "Outerwear" piece (if appropriate for the prompt, style context, or weather).
       - Exactly one "Footwear" match (to complete the entire silhouette from head to toe).
    3. NO REPETITION: Do not duplicate items or category functions. Never assign multiple items of the exact same category sub-type (e.g., do not combine two sweaters or two pairs of sneakers in the same look).
    4. INVENTORY BOUNDARY: You may ONLY use the unique UUID string identifiers present in the "Available Wardrobe Database" list. Never fabricate or hallucinate an item UUID.
    5. MATCH: All pieces should work cohesively to make a match and a complete outfit that aligns with the user's prompt and/or specified tag filters. The overall look should be stylish, balanced, and contextually appropriate.

    === PROMPT ALIGNMENT AND MATCHING CRITERIA ===
    - PRIORITY ONE: The user submitted an explicit text prompt context parameter: "${job.prompt}". You MUST interpret the stylistic tone, mood, color harmony, and aesthetic vibe of this prompt, using it as your primary steering guide.
    - COHESION CRITERIA: Ensure items match across style categories (e.g., if the user asks for a street-wear vibe, prioritize graphic tees, cargo pants, or sneakers over formal dress shoes). Match complementary color palettes utilizing the item color metadata.

    ${executionDirectives}

    === AVAILABLE WARDROBE DATABASE ===
    ${JSON.stringify(wardrobe, null, 2)}
`;

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemInstructions }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: GeminiOutfitSchema,
                        temperature: 0.75
                    }
                })
            }
        )

        if (!geminiResponse.ok) throw new Error(`Gemini service fault: ${await geminiResponse.text()}`)

        const resJson = await geminiResponse.json()
        const parsed = JSON.parse(resJson.candidates[0].content.parts[0].text)

        await supabase.from('outfits').update({
            status: 'processed',
            classification_tags: parsed.classification_tags,
            ai_reasoning: parsed.ai_reasoning,
            updated_at: new Date().toISOString()
        }).eq('id', job.id)

        const compilationInserts = parsed.selected_clothing_ids.map((id: string) => ({
            outfit_id: job.id,
            clothing_item_id: id
        }))
        await supabase.from('outfit_items').insert(compilationInserts)

        return new Response(
            JSON.stringify({ success: true, outfit_id: job.id }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )

    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
    }
})