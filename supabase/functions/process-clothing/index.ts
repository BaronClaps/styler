import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"
import { GeminiClothingSchema } from "./schema.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

let geminiApiKey = Deno.env.get('GEMINI_API_KEY')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
}

serve(async (req) => {
    console.log("=== Worker Triggered By Queue Poll ===")
    try {
        console.log("Checking database queue via public RPC proxy...")
        const { data: queueData, error: queueError } = await supabase
            .rpc('read_wardrobe_queue', {})

        if (queueError) throw new Error(`Queue Fetch Fault: ${queueError.message}`)

        if (!queueData || queueData.length === 0) {
            console.log("Queue is perfectly clean. Zero jobs waiting.")
            return new Response(JSON.stringify({ status: "No jobs available in queue" }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            })
        }

        const job = queueData[0]
        const msgId = job.msg_id
        const { item_id, image_url } = job.message
        console.log(`Found Active Ticket! Message ID: ${msgId} | Processing Item ID: ${item_id}`)

        console.log(`Locking state to 'processing' for item: ${item_id}`)
        await supabase
            .from('clothing_items')
            .update({ status: 'processing' })
            .eq('id', item_id)

        console.log(`Downloading target garment layout asset: ${image_url}`)
        const imageResponse = await fetch(image_url)
        if (!imageResponse.ok) throw new Error(`Failed to download image. Status: ${imageResponse.status}`)

        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Data = arrayBufferToBase64(imageBuffer)
        const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"

        console.log("Calling Gemini v1beta REST API gateway directly...")

        const geminiPayload = {
            contents: [
                {
                    parts: [
                        { text: "Analyze this piece of clothing closely. Provide highly precise hex codes for color classification and break down its structural attributes." },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: GeminiClothingSchema,
                temperature: 0.1
            }
        }

        // bro idk why google names their apis so fried
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(geminiPayload)
            }
        )

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text()
            throw new Error(`Gemini API Error [${geminiResponse.status}]: ${errorText}`)
        }

        const geminiData = await geminiResponse.json()
        const textResponse = geminiData.candidates[0].content.parts[0].text
        console.log("Gemini v1beta returned raw structured text successfully.")
        const parsedAnalysis = JSON.parse(textResponse)

        console.log(`Injecting clean features directly into row UUID: ${item_id}`)
        const { error: updateError } = await supabase
            .from('clothing_items')
            .update({
                status: 'completed',
                category: parsedAnalysis.category,
                sub_category: parsedAnalysis.sub_category,
                primary_color_hex: parsedAnalysis.primary_color_hex,
                secondary_color_hex: parsedAnalysis.secondary_color_hex,
                is_patterned: parsedAnalysis.is_patterned,
                pattern_type: parsedAnalysis.pattern_type,
                style_tags: parsedAnalysis.style_tags,
                weather_tags: parsedAnalysis.weather_tags,
                occasions: parsedAnalysis.occasions
            })
            .eq('id', item_id)

        if (updateError) throw new Error(`Database Update Error: ${updateError.message}`)
        console.log("Database table updated successfully.")

        console.log(`Archiving compiled processing ticket token: ${msgId}`)
        const { error: archiveError } = await supabase
            .rpc('archive_wardrobe_item', { target_msg_id: msgId })

        if (archiveError) throw new Error(`Queue Archive Error: ${archiveError.message}`)

        console.log("=== Queue Extraction Event Cycle Completed Successfully ===")
        return new Response(JSON.stringify({ success: true, processed_item: item_id }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        })

    } catch (err) {
        console.error("CRITICAL: Worker Execution Failure:", err.message)
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})