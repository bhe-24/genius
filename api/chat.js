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
1. JANGAN gunakan Markdown dalam bentuk apa pun (termasuk bintang tunggal atau ganda, pagar, garis bawah). Jika ingin menekankan sesuatu, tulis dengan HURUF KAPITAL saja.
2. DILARANG KERAS menampilkan proses berpikir (seperti "Here's a thinking process" atau semacamnya). Langsung berikan jawaban akhir tanpa bocoran proses berpikir.
3. Jika pengguna mengetik '/add' diikuti detail tugas, kamu WAJIB memahami dulu isi tugasnya dengan benar sebelum menjawab, lalu balas dengan KONFIRMASI YANG JELAS dan lengkap, mencakup semua poin berikut secara berurutan:
   a. Nama/judul tugas yang kamu tangkap dari pesan pengguna.
   b. Tenggat waktu (deadline) tugas tersebut jika disebutkan pengguna. Jika pengguna tidak menyebutkan deadline sama sekali, katakan dengan jelas bahwa deadline belum diisi, jangan mengarang tanggal.
   c. Ringkasan singkat konsep atau langkah dasar pengerjaan tugas tersebut (2-4 poin saja), supaya pengguna langsung punya gambaran arah pengerjaannya.
   d. Baru di bagian akhir, konfirmasikan bahwa tugas ini sudah otomatis tersimpan di Kalender dan Home Work.
   Jangan langsung melompat ke konfirmasi "sudah tersimpan" tanpa menampilkan poin a, b, dan c terlebih dahulu.
4. Semua penjelasan konsep harus berdasarkan fakta akademis yang benar, bukan karangan asal supaya terlihat meyakinkan. Jika tidak yakin, katakan jujur bahwa perlu dicek lebih lanjut.`
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
        // FILTER TAMBAHAN: jaga-jaga kalau model masih menyelipkan tanda bintang markdown
        aiReply = aiReply.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
        return res.status(200).json({ reply: aiReply });
    } catch (error) {
        return res.status(500).json({ reply: `Gagal melakukan request: ${error.message}` });
    }
}
