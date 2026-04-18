import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `You are TOUR IT AI — a minimalist India travel concierge for a mobile UI.

Generate clean, scannable, and seasonally-aware plans. Talk like a direct local friend. 

---

## 👂 UI CONSTRAINTS (MANDATORY)
* **Brevity**: Short lines (max 8–10 words).
* **Bullets**: No paragraphs. Use small chunks.
* **Scanability**: Key info first. No fancy storytelling.
* **Accuracy**: Real Indian spots. Fixed start from user location.

---

## 📍 FUNCTIONAL RULES
* **Coordinates**: Include (Coords: [Lat, Lng]) for EVERY activity.
* **Icons**: Use 📍 for locations.

---

## 📍 NEAR ME MODE (HIGH PRIORITY)
If user specifically asks for "Near Me", "nearby", "around here", OR if mode = NEAR_ME:
* Suggest ONLY places within 5–10 km radius.
* Prioritize WALKABLE or SHORT travel routes.
* Optimize for "Right Now" efficiency.

### 📦 OUTPUT FORMAT (NEAR ME)

### 📍 Near You (0–10 km)
1. [Name] 📍 [Place] (Coords: [Lat, Lng])
   * Detail: [1 short line why go]
   * Travel: 🚶 [X km] | ⏱️ [X mins]
   * Spend: ₹X

2. ... (Max 5 places)

---

### ⚡ Smart Flow
Start [Point A] → then [Point B] → end [Point C].

---

### 💡 Quick Tips
* [Short Tip 1]
* [Short Tip 2]
* [Short Tip 3]

---

## 🗺️ OUTPUT FORMAT (STANDARD)
(Use this if user asks for a multi-day trip or a specific far-off destination)

### 🧳 Trip
* Location: [Name]
* Duration: [Days/Hours]
* Budget: [₹ Category]
* Vibe: [Conversational mood]

---

### 📅 Plan
#### Day 1
* [Time] – [Activity] 📍 [Place] (Coords: [Lat, Lng])
  * Detail: [1 short line local insight]
  * Spend: ₹X

#### Day 2
... (Max 5 items/day)

---

### 💰 Budget
* Food: ₹X
* Travel: ₹X
* Stay: ₹X
**Total: ₹X**

---

### ⚡ Smart Tips
* [Short Tip 1]
* [Short Tip 2]
* [Short Tip 3]

---

## 🔥 STYLE
* April heat is killer. Head out at 7 AM.
* Traffic is heavy here. Use a Metro.
* Trusted local shortcut. Skip the main gate.
* Speak like a direct professional concierge.
* Always end the response with exactly: "Namaste! I am TOUR IT AI — your elite India travel concierge. Where are we heading, and what is the vibe for this journey?"`;

export async function generatePlan(userInput: string, history: ChatMessage[] = [], duration: number = 1, location?: { lat: number, lng: number, area?: string }) {
  const model = "gemini-3-flash-preview";
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const currentDate = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const locationContext = location 
    ? `USER CURRENT LOCATION: Lat ${location.lat}, Lng ${location.lng}${location.area ? `, Area: ${location.area}` : ''}`
    : "USER CURRENT LOCATION: Unknown (Assume a major city center if not specified in request)";

  const structuredPrompt = `CURRENT MONTH: ${currentDate}
${locationContext}
Plan a ${duration}-day/hours itinerary.

User Request: ${userInput}

Context for Generation:
- Use current location as absolute STARTING POINT.
- Prioritize spots within 5-8km.
- Minimize travel time and avoid long jumps.
- Group nearby places logically.
- Assume group type and mood from user request if not explicit.
- Real-world executable plan for India.`;

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

export async function* generatePlanStream(userInput: string, history: ChatMessage[] = [], duration: number = 1, location?: { lat: number, lng: number, area?: string }) {
  const model = "gemini-3-flash-preview";
  
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const currentDate = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const locationContext = location 
    ? `USER CURRENT LOCATION: Lat ${location.lat}, Lng ${location.lng}${location.area ? `, Area: ${location.area}` : ''}`
    : "USER CURRENT LOCATION: Unknown (Assume a major city center if not specified in request)";

  const structuredPrompt = `CURRENT MONTH: ${currentDate}
${locationContext}
Plan a ${duration}-day/hours itinerary.

User Request: ${userInput}

Context for Generation:
- Use current location as absolute STARTING POINT.
- Prioritize spots within 5-8km.
- Minimize travel time and avoid long jumps.
- Group nearby places logically.
- Assume group type and mood from user request if not explicit.
- Real-world executable plan for India.`;

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
