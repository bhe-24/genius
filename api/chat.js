export default async function handler(req, res) {
    // 1. IZINKAN CORS DARI FRONTEND
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tangani preflight request dari browser
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Hanya izinkan POST
    if (req.method !== 'POST') {
        return res.status(405).json({ reply: 'Metode tidak diizinkan. Gunakan POST.' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ reply: 'Sistem error: API Key Groq belum di-setting di Vercel.' });
    }

    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ reply: 'Pesan tidak boleh kosong.' });
    }

    try {
        // 2. FETCH LANGSUNG KE GROQ MENGGUNAKAN NATIVE FETCH (Tanpa Library)
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen-2.5-32b', // Model Qwen terbaru yang super cerdas
                messages: [
                    { 
                        role: 'system', 
                        content: 'Kamu adalah Genius AI, asisten virtual pelajar. Jawablah dengan ramah, suportif, dan bahasa Indonesia santai (Aku/Kamu). JANGAN gunakan Markdown seperti bintang ganda untuk bold.' 
                    },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        // 3. TANGANI ERROR DARI GROQ
        if (!response.ok) {
            console.error("Groq Error Response:", data);
            return res.status(500).json({ 
                reply: `Error dari Server Groq: ${data.error?.message || 'Tidak diketahui'}` 
            });
        }

        // 4. KIRIM BALASAN SUKSES
        return res.status(200).json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Fetch Error:", error);
        return res.status(500).json({ reply: `Gagal melakukan request: ${error.message}` });
    }
}
