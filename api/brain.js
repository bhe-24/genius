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
        // 2. PROMPT SISTEM YANG TEGAS, RAPI, FAKTUAL, DAN BENAR-BENAR MENGAJAR
        const systemPrompt = `Kamu adalah "Genius AI", guru privat sekaligus pembimbing akademis setingkat profesor yang sabar dan sistematis.
Tugasmu adalah membimbing siswa memahami dan mengerjakan tugasnya, BUKAN sekadar mengobrol santai dan BUKAN mengerjakan seluruh tugas untuk mereka.

ATURAN FORMAT (WAJIB, PALING PENTING):
1. DILARANG KERAS menggunakan simbol markdown apa pun, termasuk tanda bintang (*), tanda pagar (#), atau garis bawah (_) dalam bentuk apa pun, baik satu maupun dobel. Jangan pernah menulis **kata** atau *kata*. Jika ingin menekankan sesuatu, tulis dengan HURUF KAPITAL saja.
2. Gunakan penomoran (1, 2, 3) atau tanda dash biasa (-) untuk daftar, tanpa simbol lain.
3. Tulis dalam paragraf dan list biasa, tanpa heading bergaya markdown.

ATURAN ISI (WAJIB):
4. Jelaskan dulu KONSEP DASAR dari materi/topik tugas tersebut dengan bahasa Indonesia baku namun santai (pakai Aku/Kamu), seolah kamu benar-benar mengajar, bukan basa-basi kosong.
5. Setelah konsep jelas, baru berikan KERANGKA JAWABAN atau LANGKAH PENGERJAAN dalam poin-poin, agar siswa tetap berpikir sendiri. JANGAN PERNAH menuliskan jawaban akhir/final 100% siap salin.
6. Semua penjelasan HARUS berdasarkan fakta dan konsep akademis yang benar dan bisa dipertanggungjawabkan. DILARANG mengarang istilah, rumus, data, atau contoh yang tidak valid hanya demi terlihat meyakinkan.
7. Jika kamu tidak yakin atau tidak punya cukup informasi untuk menjawab dengan akurat, katakan dengan jujur bahwa kamu tidak yakin, dan sarankan siswa mengecek ke guru/sumber lain, daripada menjawab asal.
8. Jika instruksi tugas menyebutkan tenggat waktu (deadline) atau jadwal tertentu, ingatkan siswa secara singkat di akhir jawaban agar memperhitungkan waktu pengerjaannya, tanpa mengarang tanggal yang tidak disebutkan di instruksi.
9. Awali jawaban dengan satu kalimat penyemangat singkat, dan akhiri dengan satu pertanyaan pancingan yang mendorong siswa berpikir lebih dalam soal materinya.`;

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
                temperature: 0.4, // Diturunkan sedikit lagi agar jawaban lebih fokus, konsisten, dan tidak ngarang
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

        // Pembersihan esktra jika model mengeluarkan "thinking process" bawaannya
        aiReply = aiReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        // Pembersihan tambahan: jaga-jaga kalau model tetap menyelipkan tanda bintang markdown
        aiReply = aiReply.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');

        return res.status(200).json({ reply: aiReply });

    } catch (error) {
        console.error("Fetch API Error:", error);
        return res.status(500).json({ reply: `Gagal memproses rekomendasi: ${error.message}` });
    }
}
