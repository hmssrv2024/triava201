import { calculatorTool } from "./tools/calculator.js";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages = [], tools = [] } = await readJson(req);
    const toolResults = await maybeRunTools(messages, tools);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY no configurada" });

    const systemPrompt = [
      `You are ${process.env.AGENT_NAME || "Agent"}.`,
      "Speak Spanish by default for this user (Moi).",
      "If the user asks for calculations, you may call the 'calculator' tool.",
    ].join(" ");

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const controller = new AbortController();

    const body = {
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        ...(toolResults.length
          ? [{ role: "system", content: `Tool results:\n${JSON.stringify(toolResults)}` }]
          : []),
      ],
      temperature: 0.2,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!resp.ok || !resp.body) {
      const text = await resp.text().catch(() => "");
      res.write(`event: error\ndata: ${JSON.stringify({ error: text || resp.statusText })}\n\n`);
      return res.end();
    }

    const reader = resp.body.getReader();
    res.write(`event: open\ndata: {}\n\n`);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n").filter(Boolean);

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;

          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content || "";
            if (delta) {
              res.write(`event: message\ndata: ${JSON.stringify({ delta })}\n\n`);
            }
          } catch {
            // ignore
          }
        }
      }
      await new Promise((r) => setImmediate(r));
    }

    res.write(`event: done\ndata: {}\n\n`);
    return res.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Agent error", detail: String(err?.message || err) });
  }
}

async function readJson(req) {
  const buf = await new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
  return JSON.parse(buf.toString() || "{}");
}

async function maybeRunTools(messages, requestedTools) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  const toolCalls = (last && last.toolCalls) || [];
  const enabled = new Set((requestedTools || []).map((t) => t.name));
  const results = [];
  for (const call of toolCalls) {
    if (!enabled.has(call.name)) continue;
    if (call.name === "calculator") {
      const r = await calculatorTool(call.args || {});
      results.push({ name: "calculator", input: call.args, output: r });
    }
  }
  return results;
}
