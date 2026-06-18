# Conflux — Sistem Manajemen Toko (Conflux Coffee Club)

POS + manajemen stok untuk toko suplai kopi: stok keluar/masuk, kasir
(multi-metode bayar, promo, karton), order online, hutang, re-stok berbasis
ROP, simulasi stok, dan **akuntansi** (modal, biaya, laba-rugi, analisa
penjualan per barang, export Excel ber-template).

## Menjalankan secara lokal
```bash
npm install
npm run dev
```
Buka URL yang muncul (biasanya http://localhost:5173).
Login: **Kasir** (tanpa PIN) atau **Manajer** (PIN demo: `1234`).

## Naik ke produksi (GitHub + Database + Deploy)
Lihat **[DEPLOY.md](./DEPLOY.md)** — panduan langkah-demi-langkah:
GitHub → Supabase (gratis) → Cloudflare Pages / Netlify (gratis, boleh komersial).

## Konfigurasi database (Supabase)
1. Jalankan `supabase/schema.sql` di SQL Editor Supabase (membuat tabel + data awal).
2. Salin `.env.example` menjadi `.env`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
3. File terkait: `src/supabaseClient.js` (koneksi) dan `src/db.js` (lapisan data).

> Tanpa `.env`, aplikasi tetap jalan memakai data contoh di memori (reset saat refresh).

## Catatan
- PIN manajer demo: `1234`. Untuk produksi, sambungkan ke Supabase Auth (lihat DEPLOY.md).
- Cetak struk Bluetooth di Android perlu Capacitor (tahap berikutnya).
