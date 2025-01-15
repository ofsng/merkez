const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Uygulama ayarları
const app = express();
const PORT = 3000;
const DATA_FILE = 'data.json';

// Middleware'ler
app.use(bodyParser.json());
app.use(cors());
app.get('/', (req, res) => {
    res.send('Merhaba! API çalışıyor. Lütfen /api/bloglar rotasını deneyin.');
});

// Eğer data.json yoksa bir tane oluştur
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ topluluklar: [], bloglar: [] }, null, 2));
}

// API anahtarı doğrulama fonksiyonu
function dogrulaApiAnahtari(apiKey) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    return data.topluluklar.find(topluluk => topluluk.apiKey === apiKey);
}

// Topluluk ekleme (manuel bir topluluk eklemek için endpoint)
app.post('/api/topluluk-ekle', (req, res) => {
    const { isim, apiKey } = req.body;
    if (!isim || !apiKey) return res.status(400).json({ error: 'İsim ve API anahtarı gerekli!' });

    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    data.topluluklar.push({ isim, apiKey });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, topluluk: { isim, apiKey } });
});

// Blog ekleme
app.post('/api/blog-ekle', (req, res) => {
    const { apiKey, baslik, icerik } = req.body;

    if (!apiKey || !baslik || !icerik) {
        return res.status(400).json({ error: 'API anahtarı, başlık ve içerik gerekli!' });
    }

    const topluluk = dogrulaApiAnahtari(apiKey);
    if (!topluluk) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı!' });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const yeniBlog = {
        id: data.bloglar.length + 1,
        toplulukIsim: topluluk.isim,
        baslik,
        icerik,
        tarih: new Date().toISOString(),
    };
    data.bloglar.push(yeniBlog);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json(yeniBlog);
});

// Blogları listeleme (sadece API anahtarı ile erişim)
app.get('/api/bloglar', (req, res) => {
    const { apiKey } = req.query;
    if (!apiKey) return res.status(400).json({ error: 'API anahtarı gerekli!' });

    const topluluk = dogrulaApiAnahtari(apiKey);
    if (!topluluk) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı!' });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const toplulukBloglari = data.bloglar.filter(blog => blog.toplulukIsim === topluluk.isim);
    res.json(toplulukBloglari);
});

// Herkese açık blogları listeleme
app.get('/api/bloglar-herkese-acik', (req, res) => {
    const { toplulukIsim } = req.query;
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    let bloglar = data.bloglar;

    // Eğer topluluk adı verilmişse filtrele
    if (toplulukIsim) {
        bloglar = bloglar.filter(blog => blog.toplulukIsim === toplulukIsim);
    }

    res.json(bloglar);
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor!`);
});
