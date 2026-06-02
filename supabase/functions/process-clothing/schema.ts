// Remove the ": string[]" type annotations so "as const" can do its job
export const CLOTHING_CATEGORIES = ["Tops", "Bottoms", "Outerwear", "Footwear"] as const;

export const CLOTHING_SUB_CATEGORIES = [
    "T-Shirt", "Button-Down Shirt", "Hoodie", "Sweater", "Polo",
    "Chinos", "Jeans", "Cargo Pants", "Shorts", "Sweatpants",
    "Denim Jacket", "Bomber Jacket", "Overcoat", "Windbreaker",
    "Sneakers", "Chelsea Boots", "Loafers", "Dress Shoes"
] as const;

export const CLOTHING_PATTERNS = ["Solid", "Stripes", "Polka Dot", "Plaid", "Graphic Print", "Floral"] as const;

export const CLOTHING_STYLES = ["minimalist", "streetwear", "vintage", "preppy", "gorpcore", "casual", "formal"] as const;

export const CLOTHING_WEATHER = ["hot", "cold", "freezing", "mild", "rainy", "humid"] as const;

export const CLOTHING_OCCASIONS = ["lounge", "gym", "work", "date_night", "party", "casual_outing"] as const;

export const GeminiClothingSchema = {
    type: "object",
    properties: {
        category: {
            type: "string",
            enum: [...CLOTHING_CATEGORIES]
        },
        sub_category: {
            type: "string",
            enum: [...CLOTHING_SUB_CATEGORIES],
            description: "Match the item to exactly ONE of these specific subcategories."
        },
        primary_color_hex: {
            type: "string",
            description: "The primary dominant color of the item as a 7-character hex code starting with # (e.g., #FFFFFF, #000000)."
        },
        secondary_color_hex: {
            type: "string",
            description: "The secondary accent color as a 7-character hex code starting with #. If it is entirely solid-colored, return the exact same hex code as the primary_color_hex."
        },
        is_patterned: { type: "boolean" },
        pattern_type: {
            type: "string",
            enum: CLOTHING_PATTERNS,
            description: "If is_patterned is false, this MUST be 'Solid'."
        },
        style_tags: {
            type: "array",
            items: { type: "string", enum: [...CLOTHING_STYLES] },
            description: "Select all style vibes that apply to this item from the allowed enum list."
        },
        weather_tags: {
            type: "array",
            items: { type: "string", enum: [...CLOTHING_WEATHER] },
            description: "Select all applicable weather bounds from the allowed enum list. Pick all that apply reasonably."
        },
        occasions: {
            type: "array",
            items: { type: "string", enum: [...CLOTHING_OCCASIONS] },
            description: "Select all matching contexts from the allowed enum list."
        }
    },
    required: [
        "category", "sub_category", "primary_color_hex", "secondary_color_hex",
        "is_patterned", "pattern_type", "style_tags", "weather_tags", "occasions"
    ]
};