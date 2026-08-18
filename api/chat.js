export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ reply: 'Gunakan POST.' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return res.status(500).json({ reply: 'Sistem error: API Key belum di-setting.' });

    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: 'Pesan tidak boleh kosong.' });

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen/qwen3.6-27b', 
                messages: [
                    { 
                        role: 'system', 
                        content: `Kamu adalah Genius AI, asisten pelajar. Jawab dengan ramah, gunakan "Aku/Kamu".
ATURAN MUTLAK:
1. JANGAN gunakan Markdown (seperti bintang ganda).
2. DILARANG KERAS menampilkan proses berpikir (seperti "Here's a thinking process"). Langsung berikan jawaban akhir.
3. Jika pengguna mengetik '/add', beritahu bahwa tugasnya sudah otomatis tersimpan di Kalender dan Home Work.`
                    },
                    { role: 'user', content: message }
                ],
                temperature: 0.6,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(500).json({ reply: `Error API Groq: ${data.error?.message || 'Tidak diketahui'}` });
        }

        // TANGKAP JAWABAN AI
        let aiReply = data.choices[0].message.content;

        // FILTER AJAIB: Buang teks proses berpikir jika model masih bandel
        aiReply = aiReply.replace(/Here's a thinking process:[\s\S]*?(?=\n\n|\n-|\nHai)/i, '').trim();
        aiReply = aiReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        return res.status(200).json({ reply: aiReply });

    } catch (error) {
        return res.status(500).json({ reply: `Gagal melakukan request: ${error.message}` });
    }
}
