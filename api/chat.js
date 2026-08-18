// ISI FILE: api/chat.js (DI GITHUB / VERCEL)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Gunakan POST' });

    const { message } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        return res.status(500).json({ reply: 'Sistem error: API Key Groq tidak ditemukan di Vercel.' });
    }

    try {
        // Menggunakan fetch biasa ke endpoint REST Groq
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192', // Model paling stabil dan paling jarang kena limit di Groq
                messages: [
                    { role: 'system', content: 'Kamu adalah Genius AI, asisten pelajar yang ramah. Jawab dengan singkat dan santai. Jangan gunakan Markdown.' },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("GROQ ERROR:", data);
            return res.status(500).json({ reply: `Error dari Groq: ${data.error?.message || 'Tidak diketahui'}` });
        }

        return res.status(200).json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("FETCH ERROR:", error);
        return res.status(500).json({ reply: `Gagal melakukan request: ${error.message}` });
    }
}
