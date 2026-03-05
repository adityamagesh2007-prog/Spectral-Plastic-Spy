import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a materials science AI assistant specialized in polymer identification using optical spectroscopy data from RGB+Clear+IR sensors (like TCS34725).

You receive normalized sensor readings and must classify the plastic type based on spectral signature analysis.

PLASTIC TYPES TO CLASSIFY:
1. PET (Polyethylene Terephthalate) - Recycling code 1
2. HDPE (High-Density Polyethylene) - Recycling code 2
3. PVC (Polyvinyl Chloride) - Recycling code 3
4. LDPE (Low-Density Polyethylene) - Recycling code 4
5. PP (Polypropylene) - Recycling code 5
6. PS (Polystyrene) - Recycling code 6
7. Other / Unknown - Recycling code 7

RULES:
- Provide scientifically accurate polymer information
- Include chemical composition explanation (monomers and structure type)
- Explain why the spectral signature matches the predicted plastic
- If confidence is below 60%, label as "Uncertain – Additional Data Needed"
- Do NOT guess if data is insufficient
- Keep summaries detailed but technically precise
- List top 3 ranked predictions if multiple plastics are possible
- Include sustainability rating (Low / Medium / High environmental impact)

You MUST respond using the suggest_classification tool.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { red, green, blue, clear, ir, surface_reflectance } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Normalize sensor data
    const total = clear || (red + green + blue);
    const norm_r = red / total;
    const norm_g = green / total;
    const norm_b = blue / total;
    const norm_ir = ir ? ir / total : null;

    const userPrompt = `Analyze the following plastic sensor data and classify the material:

Raw sensor values: R=${red}, G=${green}, B=${blue}, Clear=${clear}${ir ? `, IR=${ir}` : ''}${surface_reflectance ? `, Surface Reflectance=${surface_reflectance}` : ''}

Normalized ratios: R=${norm_r.toFixed(4)}, G=${norm_g.toFixed(4)}, B=${norm_b.toFixed(4)}${norm_ir ? `, IR=${norm_ir.toFixed(4)}` : ''}

Provide your classification with full scientific reasoning.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_classification",
              description: "Return structured plastic classification result",
              parameters: {
                type: "object",
                properties: {
                  predicted_plastic: { type: "string", description: "Name of predicted plastic type" },
                  recycling_code: { type: "number", description: "Recycling code 1-7" },
                  confidence_score: { type: "number", description: "Confidence 0-100" },
                  recyclability: { type: "string", description: "Recyclability assessment" },
                  common_uses: { type: "array", items: { type: "string" }, description: "Common uses" },
                  chemical_structure_summary: { type: "string" },
                  health_risks: { type: "string" },
                  environmental_impact: { type: "string", enum: ["Low", "Medium", "High"] },
                  decomposition_time_estimate: { type: "string" },
                  recommended_disposal_method: { type: "string" },
                  scientific_reasoning: { type: "string" },
                  alternative_predictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        plastic_type: { type: "string" },
                        confidence: { type: "number" },
                        recycling_code: { type: "number" },
                      },
                      required: ["plastic_type", "confidence", "recycling_code"],
                    },
                    description: "Top alternative predictions ranked by confidence"
                  },
                },
                required: ["predicted_plastic", "recycling_code", "confidence_score", "recyclability", "common_uses", "chemical_structure_summary", "health_risks", "environmental_impact", "decomposition_time_estimate", "recommended_disposal_method", "scientific_reasoning", "alternative_predictions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_classification" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No classification returned");

    const classification = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
