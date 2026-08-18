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

    // Ambil API Key Groq dari Vercel
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        return res.status(500).json({ reply: 'Sistem error: GROQ_API_KEY belum di-setting di Vercel.' });
    }

    // Tangkap Judul dan Instruksi yang dikirim dari home-work.html
    const { title, instruction } = req.body;
    
    if (!instruction) {
        return res.status(400).json({ reply: 'Instruksi tugas tidak ditemukan.' });
    }

    try {
        // 2. PROMPT SISTEM YANG SANGAT TEGAS, RAPI, DAN CERDAS
        const systemPrompt = `Kamu adalah "Genius AI", seorang guru privat dan pemecah masalah akademis bertaraf profesor.
Tugas utamamu adalah memberikan bantuan pengerjaan tugas kepada siswa dengan cerdas, solutif, dan mudah dipahami.

PANDUAN MENJAWAB (WAJIB DIIKUTI):
1. JANGAN PERNAH MENGERJAKAN TUGASNYA 100%. Berikan "Kerangka Jawaban", "Poin-Poin Utama", atau "Langkah Penyelesaian" agar siswa tetap berpikir.
2. Jelaskan dengan bahasa Indonesia baku namun santai (Gunakan Aku/Kamu).
3. DILARANG KERAS menggunakan format Markdown (seperti **tebal** atau *miring*). Jika ingin menebalkan huruf, GUNAKAN HURUF KAPITAL.
4. Gunakan list menggunakan angka (1, 2, 3) atau dash (-) biasa.
5. Awali jawaban dengan kalimat penyemangat, dan akhiri dengan pertanyaan pancingan agar siswa paham materinya.`;

        // 3. FETCH KE GROQ (Tanpa module eksternal, anti-error di Vercel)
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b', // Menggunakan model dari daftar provider yang sudah terbukti sukses
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Bantu aku memahami dan merencanakan pengerjaan tugas ini.\nJudul: ${title || 'Tidak ada judul'}\nInstruksi: ${instruction}` }
                ],
                temperature: 0.5, // Suhu diturunkan agar jawaban fokus dan tidak bertele-tele
                max_tokens: 1500
            })
        });

        const data = await response.json();

        // Tangani Error jika Groq bermasalah
        if (!response.ok) {
            console.error("Groq Error Response:", data);
            return res.status(500).json({ reply: `Error dari Server API: ${data.error?.message || 'Tidak diketahui'}` });
        }

        // 4. KIRIM BALASAN SUKSES
        let aiReply = data.choices[0].message.content;

        // Pembersihan esktra jika model Qwen mengeluarkan "thinking process" bawaannya
        aiReply = aiReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        return res.status(200).json({ reply: aiReply });

    } catch (error) {
        console.error("Fetch API Error:", error);
        return res.status(500).json({ reply: `Gagal memproses rekomendasi: ${error.message}` });
    }
}
