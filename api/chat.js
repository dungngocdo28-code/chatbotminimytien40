// /api/chat.js — Chatbot HR Mỹ Tiên (tối ưu tốc độ)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { message, contextIndex } = req.body || {};
  if (!message) return res.status(400).json({ error: "No message provided" });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY)
    return res.status(500).json({ error: "OPENAI_API_KEY not configured" });

  const systemPrompt = `
  Bạn là Mỹ Tiên — chuyên viên nhân sự thân thiện, nói chuyện tự nhiên, 
  phản hồi ngắn gọn, lịch sự bằng tiếng Việt, giọng vui vẻ, chuyên nghiệp.
  Đừng lặp lại câu hỏi của người dùng, hãy phản hồi như đang nói chuyện thật.
  `;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ⚡ nhanh hơn, phí thấp hơn
        max_tokens: 100,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
      }),
    });

    if (!r.ok) {
      const err = await r.text().catch(() => "");
      console.error("ChatGPT error:", err);
      return res.status(502).json({ error: "OpenAI API error", detail: err });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "Cảm ơn bạn nhé!";
    res.status(200).json({ reply });
  } catch (err) {
    console.error("💥 Chat error:", err);
    res.status(500).json({ error: err.message });
  }
}
