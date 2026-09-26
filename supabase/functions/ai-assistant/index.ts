import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    const { type, messages, context } = await req.json();

    let systemPrompt = "";
    let userMessages = messages || [];
    let useStream = false;
    let useTools = false;
    let tools: any[] = [];
    let toolChoice: any = undefined;

    switch (type) {
      case "chat":
        useStream = true;
        systemPrompt = `You are BookFlow AI, a friendly booking assistant for a service scheduling platform. You help users book appointments, answer questions about services, and provide guidance.

You support both English and Japanese (日本語). Detect the user's language and respond accordingly.

Available services context: ${JSON.stringify(context?.services || [])}
Business hours context: ${JSON.stringify(context?.businessHours || [])}

Guidelines:
- Be concise and helpful
- If user wants to book, guide them through service selection, date, and time
- Provide service details when asked
- Answer in the same language the user writes in
- Use a warm, professional tone`;
        break;

      case "recommend_slots":
        systemPrompt = `You are an AI scheduling optimizer. Analyze booking patterns and recommend the best time slots.`;
        useTools = true;
        tools = [{
          type: "function",
          function: {
            name: "recommend_time_slots",
            description: "Return recommended time slots with reasoning",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      time: { type: "string", description: "Time in HH:MM format" },
                      score: { type: "number", description: "Recommendation score 1-10" },
                      reason: { type: "string", description: "Brief reason for recommendation" },
                    },
                    required: ["time", "score", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "recommend_time_slots" } };
        userMessages = [{
          role: "user",
          content: `Given these available slots: ${JSON.stringify(context?.availableSlots || [])}
Service: ${context?.serviceName || "Unknown"}
Day: ${context?.dayOfWeek || "Unknown"}
Existing booking patterns: ${JSON.stringify(context?.bookingPatterns || [])}

Recommend the top 3 best time slots considering:
1. Least busy times for better service
2. Optimal scheduling gaps
3. Common preferences for this type of service`,
        }];
        break;

      case "no_show_prediction":
        systemPrompt = `You are an AI that predicts appointment no-show risk based on patterns.`;
        useTools = true;
        tools = [{
          type: "function",
          function: {
            name: "predict_no_show",
            description: "Return no-show risk assessment for appointments",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      appointment_id: { type: "string" },
                      risk_level: { type: "string", enum: ["low", "medium", "high"] },
                      risk_score: { type: "number", description: "0-100 percentage" },
                      factors: { type: "array", items: { type: "string" } },
                    },
                    required: ["appointment_id", "risk_level", "risk_score", "factors"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["predictions"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "predict_no_show" } };
        userMessages = [{
          role: "user",
          content: `Analyze these upcoming appointments for no-show risk:
${JSON.stringify(context?.appointments || [])}

Historical no-show data: ${JSON.stringify(context?.historicalData || { total: 0, noShows: 0 })}

Consider factors like:
1. Day of week and time
2. Whether it's a new or returning customer
3. How far in advance it was booked
4. Historical patterns`,
        }];
        break;

      case "demand_forecast":
        systemPrompt = `You are an AI demand forecasting analyst for a booking platform.`;
        useTools = true;
        tools = [{
          type: "function",
          function: {
            name: "forecast_demand",
            description: "Return demand forecast for upcoming days",
            parameters: {
              type: "object",
              properties: {
                forecast: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string", description: "Day name e.g. Monday" },
                      predicted_bookings: { type: "number" },
                      confidence: { type: "string", enum: ["low", "medium", "high"] },
                      peak_hours: { type: "array", items: { type: "string" } },
                      suggestion: { type: "string" },
                    },
                    required: ["day", "predicted_bookings", "confidence", "peak_hours", "suggestion"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string", description: "Overall demand summary" },
              },
              required: ["forecast", "summary"],
              additionalProperties: false,
            },
          },
        }];
        toolChoice = { type: "function", function: { name: "forecast_demand" } };
        userMessages = [{
          role: "user",
          content: `Forecast booking demand for the next 7 days based on this data:
Historical bookings by day: ${JSON.stringify(context?.weeklyPattern || {})}
Total bookings: ${context?.totalBookings || 0}
Services offered: ${JSON.stringify(context?.services || [])}
Current date: ${new Date().toISOString().split("T")[0]}

Provide realistic predictions with peak hours and actionable suggestions.`,
        }];
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const body: any = {
      messages: [
        { role: "system", content: systemPrompt },
        ...userMessages,
      ],
    };

    if (useStream) body.stream = true;
    if (useTools) {
      body.tools = tools;
      body.tool_choice = toolChoice;
    }

    // Try models in order; fall back if a model is unavailable for this key
    const MODELS = [
      "llama-3.3-70b-versatile",
      "openai/gpt-oss-120b",
      "meta-llama/llama-4-maverick-17b-128e-instruct",
      "openai/gpt-oss-20b",
      "llama-3.1-8b-instant",
    ];
    let response!: Response;
    for (const model of MODELS) {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body, model }),
      });
      if (response.status !== 404 && response.status !== 400) break;
      const errText = await response.clone().text();
      if (!errText.includes("model")) break;
      console.warn(`Groq model ${model} unavailable, trying next`);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid Groq API key." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Groq API error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error", status: response.status, details: t.slice(0, 500) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (useStream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();

    // Extract tool call results
    if (useTools && data.choices?.[0]?.message?.tool_calls?.[0]) {
      const toolCall = data.choices[0].message.tool_calls[0];
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content: data.choices?.[0]?.message?.content || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
