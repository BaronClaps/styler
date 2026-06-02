# Initial Brainstorming for the project

Figuring out what to wear is always a hassle, and there are no free options to scan your wardrobe to stitch your wardrobe together.

## Pipeline:
1. scan wardrobe
    - parse and classify clothing
    - sort clothing by type and purpose
    - create
2. preferencing
    - style - clothing should match the person
    - ~~face scanner?~~ decided on just doing color preferencing instead of trying to match clothing to the person's face
    - occasion (work, casual, party, etc.)
    - weather / season
3. outfit generation
    - some sort of algorithm to generate outfits based on the clothing in the wardrobe and the preferencing
    - learn the user's style over time and generate better outfits
    - show styles in a tinder format for swipe left or right and learn from discards

## Research Dialogue:
- first step is figure out vision classification. 
  - i need the cheapest (hopefully free) and fastest processing possible. 
  - taking photos feels very strenuous unless you can just press the button a bunch of times?? like instead of having to do the whole "use photo" dialogue
    - i'm going to take a zero confirmation approach - you just click the button and then it gets instantly uploaded for classification
- queue and store using supabase database
  - async processing :P
- gemini for processing image
  - classify clothing type (shirt, pants, etc.)
  - classify color(s)
  - classify style (casual, formal, etc.)
  - classify temperatures / weather to be worn in (hot, cold, rainy, etc.)
  - classify occasions to be worn for (work, party, etc.)
  - classify patterns (stripes, polka dots, etc.)