// File: api/chat.js
import OpenAI from 'openai';

// INISIALISASI GROQ (Menggunakan SDK OpenAI karena API Groq kompatibel dengan OpenAI)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_API_KEY ? new OpenAI({ 
    apiKey: GROQ_API_KEY, 
    baseURL: 'https://api.groq.com/openai/v1' 
}) : null;

export default async function handler(req, res) {
    // ATUR CORS UNTUK SEMUA REQUEST (PENTING AGAR TIDAK ERROR DI HP/BROWSER)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: true, reply: 'Metode tidak diizinkan. Gunakan POST.' });
    }

    if (!groq) {
        return res.status(500).json({ error: true, reply: 'Sistem error: API Key belum dikonfigurasi di Vercel.' });
    }

    try {
        const { message, userName, history } = req.body || {};

        if (!message || message.trim() === '') {
            return res.status(400).json({ error: true, reply: 'Pesan tidak boleh kosong.' });
        }

        // PROMPT SISTEM (PERSONA GENIUS AI)
        const systemPrompt = `Kamu adalah Genius AI, asisten virtual super pintar di aplikasi Genius Home Work.
Nama pengguna yang menyapamu adalah: ${userName || 'Siswa'}.

ATURAN WAJIB:
1. Sikapmu ramah, antusias, suportif, dan gaul (Gunakan "Aku" dan "Kamu").
2. Bantu pengguna mengatur jadwal belajar, merangkum pelajaran, atau menyelesaikan tugas.
3. JANGAN memakai markdown bintang ganda (**teks**) karena frontend belum mendukungnya. Gunakan huruf kapital untuk penekanan.
4. Gunakan maksimal 2 emoji per pesan.`;

        const formattedMessages = [
            { role: 'system', content: systemPrompt }
        ];

        // MEMBATASI MEMORI HISTORI (Maksimal 4 chat terakhir agar API tidak berat/error)
        if (history && Array.isArray(history)) {
            const recentHistory = history.slice(-4);
            recentHistory.forEach(h => {
                formattedMessages.push({
                    role: h.role === 'user' ? 'user' : 'assistant',
                    content: h.content
                });
            });
        }

        formattedMessages.push({ role: 'user', content: message });

        // MEMANGGIL API GROQ DENGAN MODEL QWEN
        const completion = await groq.chat.completions.create({
            model: 'qwen-2.5-32b', // Model Qwen yang cerdas, cepat, dan aktif di Groq
            messages: formattedMessages,
            temperature: 0.7,
            max_tokens: 1024 
        });

        let finalAnswer = completion.choices[0]?.message?.content || "";
        
        // Membersihkan format markdown code block jika model tidak sengaja mengeluarkannya
        finalAnswer = finalAnswer.replace(/```[\w]*\n?/g, '').trim();

        if (!finalAnswer) throw new Error('Groq mengembalikan jawaban kosong');

        return res.status(200).json({
            error: false,
            reply: finalAnswer,
            model: 'qwen-2.5-32b'
        });

    } catch (error) {
        console.error('API Error Breakdown:', error?.message || error);
        return res.status(500).json({ 
            error: true, 
            reply: 'Waduh, Genius AI lagi pusing nih (Server Error). Coba sapa aku lagi beberapa saat lagi ya! 🔌' 
        });
    }
}
