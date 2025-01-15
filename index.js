const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Uygulama ayarları
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = 'data.json';

// Middleware (JSON verileri okumak ve CORS desteği sağlamak için)
app.use(bodyParser.json());
app.use(cors());

// Eğer data.json yoksa, bir başlangıç dosyası oluştur
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ topluluklar: [], bloglar: [] }, null, 2));
}

// API anahtarı doğrulama fonksiyonu
function dogrulaApiAnahtari(apiKey) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    return data.topluluklar.find(topluluk => topluluk.apiKey === apiKey);
}

// 1. API Anahtarı ile Giriş (Doğrulama)
app.post('/api/auth', (req, res) => {
    const { apiKey } = req.body;
    const topluluk = dogrulaApiAnahtari(apiKey);
    if (!topluluk) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı!' });
    }
    res.json({ success: true, topluluk });
});

// 2. Blog Listeleme
app.get('/api/bloglar', (req, res) => {
    const { apiKey } = req.query;
    const topluluk = dogrulaApiAnahtari(apiKey);
    if (!topluluk) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı!' });
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const toplulukBloglari = data.bloglar.filter(blog => blog.topluluk === topluluk.isim);
    res.json(toplulukBloglari);
});

// 3. Blog Ekleme
app.post('/api/blog-ekle', (req, res) => {
    const { apiKey, baslik, icerik, kategori } = req.body;

    // API anahtarı doğrula
    const topluluk = dogrulaApiAnahtari(apiKey);
    if (!topluluk) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı!' });
    }

    // Yeni blog oluştur
    const yeniBlog = {
        id: Date.now(),
        topluluk: topluluk.isim,
        baslik,
        icerik,
        kategori,
        tarih: new Date().toISOString(),
    };

    // Blogu kaydet
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    data.bloglar.push(yeniBlog);
    if (!data.kategoriler) {
        data.kategoriler = {};
    }
    if (!data.kategoriler[topluluk.isim]) {
        data.kategoriler[topluluk.isim] = [];
    }
    if (kategori && !data.kategoriler[topluluk.isim].includes(kategori)) {
        data.kategoriler[topluluk.isim].push(kategori);
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true, blog: yeniBlog });
});
app.post('/api/kategoriler-ekle', (req, res) => {
    const { apiKey, kategori } = req.body;
    const topluluk = dogrulaApiAnahtari(apiKey);
    if (!topluluk) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı!' });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    if (!data.kategoriler) {
        data.kategoriler = {};
    }
    if (!data.kategoriler[topluluk.isim]) {
        data.kategoriler[topluluk.isim] = [];
    }

    if (!data.kategoriler[topluluk.isim].includes(kategori)) {
        data.kategoriler[topluluk.isim].push(kategori);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }

    res.json({ success: true });
});
app.get('/api/kategoriler', (req, res) => {
    const { apiKey } = req.query;
    const topluluk = dogrulaApiAnahtari(apiKey);
    if (!topluluk) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı!' });
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    const kategoriler = data.kategoriler[topluluk.isim] || [];
    res.json(kategoriler);
});

// 4. Blog Silme
app.post('/api/blog-sil', (req, res) => {
    const { apiKey, blogId } = req.body;

    // API anahtarı doğrula
    const topluluk = dogrulaApiAnahtari(apiKey);
    if (!topluluk) {
        return res.status(403).json({ error: 'Geçersiz API anahtarı!' });
    }

    // Blogu sil
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    data.bloglar = data.bloglar.filter(blog => blog.id !== parseInt(blogId));
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json({ success: true });
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor!`);
});
