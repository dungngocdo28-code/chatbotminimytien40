// /api/tts.js — FPT.AI TTS Giọng nữ Ban Mai (Node 18+ — hoạt động trên Vercel)
const FPT_TTS_ENDPOINT = "https://api.fpt.ai/hmi/tts/v5";
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { text } = req.body || {};
  if (!text || text.trim().length < 2)
    return res.status(400).json({ error: "No text provided" });

  const API_KEY = process.env.FPT_API_KEY;
  if (!API_KEY)
    return res.status(500).json({ error: "FPT_API_KEY not configured" });

  try {
    const headers = {
      "api_key": API_KEY,
      "voice": "banmai", // 👩 Giọng nữ miền Bắc (Ban Mai)
      "speed": "0",
      "format": "mp3",
      "Cache-Control": "no-cache"
    };

    // 1️⃣ Gửi yêu cầu TTS đến FPT.AI
    const ttsResp = await fetch(FPT_TTS_ENDPOINT, {
      method: "POST",
      headers,
      body: text
    });

    if (!ttsResp.ok) {
      const txt = await ttsResp.text().catch(() => "");
      console.error("❌ Lỗi FPT:", txt);
      return res.status(502).json({ error: "FPT request failed", detail: txt });
    }

    // 2️⃣ Nhận đường dẫn async URL
    const data = await ttsResp.json().catch(() => null);
    const asyncUrl = data?.async || data?.message;
    if (!asyncUrl)
      return res.status(500).json({ error: "No async URL from FPT", data });

    // 3️⃣ Đợi FPT tạo file audio (poll 10 lần)
    let attempt = 0;
    let audioResp = null;
    while (attempt < 10) {
      attempt++;
      audioResp = await fetch(asyncUrl);
      if (audioResp.ok) break;
      await sleep(1000);
    }

    if (!audioResp || !audioResp.ok)
      return res.status(202).json({ message: "Audio not ready", asyncUrl });

    // 4️⃣ Gửi file âm thanh cho trình duyệt
    const buf = Buffer.from(await audioResp.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(buf);
  } catch (err) {
    console.error("💥 FPT TTS Error:", err);
    res.status(500).json({ error: err.message });
  }
};
