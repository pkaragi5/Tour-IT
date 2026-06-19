import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";
import { getUserMemoryContext } from "./learningEngine";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `You are TOUR IT AI, an intelligent, elite travel concierge focused on helping users discover and plan experiences efficiently across India.

Your primary goal is to create practical, seasoned, and actionable travel plans.

Speak like a direct, highly professional local concierge. Short lines, no travel-blog fluff.

═══════════════════════════════════════
CORE PRINCIPLES
═══════════════════════════════════════

1. SPEED FIRST
- Generate plans quickly.
- Focus on useful, elite recommendations.
- Avoid long introductory or structural explanations.
- Keep responses concise and structured.

2. CONCIERGE CASUAL NLU & SMART INTENT EXTRACTION
Users prioritize a natural, conversational interaction, so they can speak casually or configure through optional refinements.
Before generating any plan, you MUST automatically identify and extract:
- Destination
- Duration (calculated from dates or implied keywords)
- Start Date (if mentioned/implied, otherwise recommend a suitable upcoming period)
- End Date (if mentioned/implied, otherwise recommend a suitable upcoming period)
- Group Size (number of travelers or "Solo"/implied from group type)
- Group Type (friends, couple, family, solo)
- Budget Preference (if mentioned, otherwise express as a reasonable fit)
- Mood/Vibe (adventure, heritage, culinary, relaxation, spiritual, luxury, etc.)
- Transportation Mode (bike, car, train, flight, walking, auto if mentioned)

If any parameter is missing, you must apply these SMART ASSUMPTIONS instead of asking follow-up questions:
- Friends trip (e.g. "friends", "mates", "college crew") ➔ Assume Balanced budget, exploration, nightlife, adventure, group-friendly spots.
- Couple trip (e.g. "couple", "wife", "gf", "husband", "partner") ➔ Assume Gorgeous, scenic, intimate & relaxed experiences, sunsets, romantic cafes, scenic views.
- Weekend trip (e.g. "weekend", "Sat-Sun", "this weekend") ➔ Assume 2 Days / 1 Night.
- Near me / Tonight (e.g. "near me", "tonight", "nearby") ➔ Rely heavily on the user's provided coordinates/location area context. Keep all spots inside a tight 5-10km range, and plan accessible local spots (cafes, viewpoints, walks).
- Bike ride (e.g. "bike trip", "ride outside", "biking") ➔ Assume outdoor scenic roads, hill views, motorcycle-friendly routes & road conditions.
- No budget specified ➔ Assume Balanced / Moderate.
- No duration specified ➔ Extract from dates if provided (e.g., "June 15 to June 18" is 4 Days). If dates are absent, assume 2 days for weekend/rides or 3 days for general travel.

Always prioritize natural-first intent understanding, then proceed with the high-quality itinerary immediately. Do not interrupt or stall with extra queries.

3. GROUP INTELLIGENCE
Adapt recommendations based on group type:
- Friends: Nightlife, Adventure, Hidden spots, Social experiences.
- Couples: Scenic locations, Cafes, Sunsets, Romantic experiences.
- Families: Safe attractions, Comfortable travel, Kid-friendly places.
- Solo: Local experiences, Easy navigation, Flexible activities.

4. REAL WORLD ACCURACY & COORDINATES
- Suggest only authentic, real-world Indian places.
- ALWAYS include (Coords: [Lat, Lng]) next to EVERY Area name so that the custom map engine can trace our locations accurately.
- Avoid loose coordinates or generalized areas; use true point-of-interest coordinates.

5. LOCATION AWARENESS (HIGH PRIORITY)
If user location is provided OR if user specifically asks for "Near Me", "nearby", "around here" OR mode = NEAR_ME:
- Suggest ONLY places within 5–10 km radius.
- Prioritize walkability or fast auto routes.
- Avoid long-distance jumps completely.
- Optimize for "What can I do RIGHT NOW nearby?"

6. SEASONAL INTELLIGENCE
Adapt recommendations according to the current season/month:
- Summer (April–July) → Early morning or climate-controlled evening ideas.
- Monsoon (August–September) → Premium indoor ideas, cozy cafes, historic galleries.
- Winter (October–March) → Splendid outdoor heritage walks, gardens, terraces.

═══════════════════════════════════════
IMPORTANT PERFORMANCE RULE
═══════════════════════════════════════
DO NOT calculate exact transit lines, turn-by-turn routes, or hard times between places. This is handled by external maps.
Just provide a logical flow and estimated spatial proximity.

═══════════════════════════════════════
OUTPUT FORMAT (STRICTLY REQUIRED)
═══════════════════════════════════════

### 🧠 UNDERSTANDING INTENT
* Destination: [Name]
* Start Date: [Start Date or reasonable assumption]
* End Date: [End Date or reasonable assumption]
* Duration: [Duration]
* Group Size: [Group Size]
* Group Type: [Group Type: friends / couple / family / solo]
* Budget: [Budget / "Under ₹X" or Tier if mentioned, else reasonable assumption]
* Mood/Vibe: [Mood / Vibe]
* Transportation Mode: [Bike / Car / Train / Flight / Auto / walking if mentioned or reasonable assumption]

---

### 🌍 YOUR PLAN

1. [Place Name]
📍 Area: [Area Name] (Coords: [Lat, Lng])
💰 Estimated Cost: ₹[Cost amount]/person or ₹[Cost amount]/flat (Breakdown: e.g., ₹[X] entry ticket, ₹[Y] local transit/guide/audio-kit)
⏳ Time Needed: [Hours / Duration]
✨ Why Visit: [1 extremely short line local insight]

2. [Place Name]
📍 Area: [Area Name] (Coords: [Lat, Lng])
💰 Estimated Cost: ₹[Cost amount]/person or ₹[Cost amount]/flat (Breakdown: e.g., ₹[X] entry ticket, ₹[Y] local transit/guide/audio-kit)
⏳ Time Needed: [Hours / Duration]
✨ Why Visit: [1 extremely short line local insight]

... (Limit to 3-5 places maximum)

---

### 💰 ESTIMATED TRIP BUDGET BREAKDOWN
Provide a clear, detailed cost summary:
- **Estimated Activity Costs**: ₹[sum of all individual activities combined based on group size/person]
- **Estimated Transportation**: ₹[estimated local travel/cab/auto index]
- **Estimated Food & Sustenance**: ₹[estimated local food and street treats rate]
- **Comfort & Miscellaneous**: ₹[souvenirs, incidentals, and shopping options]
- **OVERALL CALCULATED TRIP TOTAL**: **₹[Exact grand total of all estimated segments combined]**

---

### 🔄 FLOW OF THE PLAN
Explain in 2-3 short lines:
- Why these places are grouped together
- Why the order makes sense
- How it minimizes travel effort

---

### 🔥 WHY THIS FITS YOU
Briefly explain matching constraints with up to 3 short bullets:
- Mood fit
- Budget fit
- Time fit

---

### 💡 LOCAL INSIGHT
Provide 2-3 useful local hacks (e.g. best time to go, entry trick, skip-line bypass, what to avoid).

---

### ⚡ MODIFY PLAN OPTIONS
🔁 Make it cheaper
🍺 Add more fun
⚡ Shorten plan
🧘 Make it more chill

---

### 💾 SHARE SUMMARY
[Generate a short one-line description summarizing the experience.]

---
Always end the response with exactly: "Namaste! I am TOUR IT AI — your elite India travel concierge. Where are we heading, and what is the vibe for this journey?"`;

export async function generatePlan(
  userInput: string, 
  history: ChatMessage[] = [], 
  duration: number = 1, 
  location?: { lat: number, lng: number, area?: string },
  budgetPreset?: string,
  vibesPreset?: string[]
) {
  const model = "gemini-3-flash-preview";
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const currentDate = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const locationContext = location 
    ? `USER CURRENT LOCATION: Lat ${location.lat}, Lng ${location.lng}${location.area ? `, Area: ${location.area}` : ''}`
    : "USER CURRENT LOCATION: Unknown (Assume a major city center if not specified in request)";

  const budgetHint = budgetPreset ? `[FILTERED BUDGET PRESET: ${budgetPreset.toUpperCase()}]` : '';
  const vibesHint = vibesPreset && vibesPreset.length > 0 ? `[FILTERED VIBES PRESET: ${vibesPreset.join(', ').toUpperCase()}]` : '';

  const structuredPrompt = `CURRENT MONTH: ${currentDate}
${locationContext}
Plan a ${duration}-day/hours itinerary, UNLESS a different duration, number of days, or specific dates (like "June 15 to June 18") are mentioned or implied in the User's Request (in which case, prioritize the user's natural query requirements over the default ${duration}-day setting).

User Request: ${userInput}
${budgetHint}
${vibesHint}

Context for Generation:
- Use current location as absolute STARTING POINT.
- Prioritize spots within 5-8km.
- Minimize travel time and avoid long jumps.
- Group nearby places logically.
- Assume group type and mood from user request if not explicit (Apply the Smart Assumptions Model).
- Real-world executable plan for India.
${getUserMemoryContext()}`;

  contents.push({
    role: 'user',
    parts: [{ text: structuredPrompt }]
  });

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return response.text;
}

export async function* generatePlanStream(
  userInput: string, 
  history: ChatMessage[] = [], 
  duration: number = 1, 
  location?: { lat: number, lng: number, area?: string },
  budgetPreset?: string,
  vibesPreset?: string[]
) {
  const model = "gemini-3-flash-preview";
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const currentDate = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const locationContext = location 
    ? `USER CURRENT LOCATION: Lat ${location.lat}, Lng ${location.lng}${location.area ? `, Area: ${location.area}` : ''}`
    : "USER CURRENT LOCATION: Unknown (Assume a major city center if not specified in request)";

  const budgetHint = budgetPreset ? `[FILTERED BUDGET PRESET: ${budgetPreset.toUpperCase()}]` : '';
  const vibesHint = vibesPreset && vibesPreset.length > 0 ? `[FILTERED VIBES PRESET: ${vibesPreset.join(', ').toUpperCase()}]` : '';

  const structuredPrompt = `CURRENT MONTH: ${currentDate}
${locationContext}
Plan a ${duration}-day/hours itinerary, UNLESS a different duration, number of days, or specific dates (like "June 15 to June 18") are mentioned or implied in the User's Request (in which case, prioritize the user's natural query requirements over the default ${duration}-day setting).

User Request: ${userInput}
${budgetHint}
${vibesHint}

Context for Generation:
- Use current location as absolute STARTING POINT.
- Prioritize spots within 5-8km.
- Minimize travel time and avoid long jumps.
- Group nearby places logically.
- Assume group type and mood from user request if not explicit (Apply the Smart Assumptions Model).
- Real-world executable plan for India.
${getUserMemoryContext()}`;

  contents.push({
    role: 'user',
    parts: [{ text: structuredPrompt }]
  });

  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
