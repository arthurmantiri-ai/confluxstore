# Panduan Naik Produksi — Conflux Coffee Club

Tiga langkah: **(1) GitHub → (2) Database Supabase → (3) Deploy hosting.**
Semuanya **gratis** dan **boleh untuk usaha/komersial**. Tidak perlu kartu kredit.

Ringkasan pilihan (sudah saya pilihkan yang paling pas):

| Bagian   | Pilihan            | Kenapa                                                              |
|----------|--------------------|--------------------------------------------------------------------|
| Database | **Supabase** (free)| Postgres 500 MB, 50.000 user, boleh komersial, tanpa kartu kredit. |
| Hosting  | **Cloudflare Pages** (free) | Boleh komersial, bandwidth tak terbatas. (Alternatif: Netlify) |

> Catatan: **Vercel paket gratis (Hobby) MELARANG penggunaan komersial** — karena ini toko sungguhan, kita pakai Cloudflare Pages / Netlify, bukan Vercel gratis.

---

## 1) Taruh kode di GitHub

1. Buat akun di https://github.com (gratis), lalu buat repository baru, mis. `conflux` (boleh Private).
2. Di komputer Anda, ekstrak `conflux.zip`, buka terminal di folder `conflux`, jalankan:
   ```bash
   git init
   git add .
   git commit -m "Conflux POS awal"
   git branch -M main
   git remote add origin https://github.com/USERNAME/conflux.git
   git push -u origin main
   ```
   Ganti `USERNAME` dengan nama akun GitHub Anda.

> File `.env` (berisi kunci rahasia) sudah otomatis **tidak ikut** ter-upload (diabaikan `.gitignore`). Aman.

---

## 2) Buat database di Supabase

1. Daftar di https://supabase.com (gratis) → **New project**.
   - Beri nama (mis. `conflux`), pilih region terdekat (**Singapore** paling dekat untuk Indonesia), dan buat **Database Password** (catat).
   - Tunggu ± 2 menit sampai proyek siap.
2. Buka menu **SQL Editor** → **New query** → buka file `supabase/schema.sql` dari proyek ini → **salin seluruh isinya** → tempel → tekan **Run**.
   - Setelah sukses, buka **Table Editor**: harus ada **25 produk**, 7 modal, 7 biaya. Database siap.
3. Ambil 2 nilai koneksi: menu **Project Settings → API** (atau **Data API**):
   - **Project URL** → ini `VITE_SUPABASE_URL`
   - **anon public key** → ini `VITE_SUPABASE_ANON_KEY`
   - (Jangan pakai `service_role` key — itu rahasia, tidak boleh masuk frontend.)

---

## 3) Deploy ke Cloudflare Pages

1. Daftar di https://dash.cloudflare.com (gratis).
2. **Workers & Pages → Create → Pages → Connect to Git** → pilih repo `conflux`.
3. Isi pengaturan build:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Buka **Environment variables (Production)** dan tambahkan dua variabel dari langkah 2:
   - `VITE_SUPABASE_URL` = (Project URL Anda)
   - `VITE_SUPABASE_ANON_KEY` = (anon public key Anda)
5. **Save and Deploy.** Tunggu ± 1–2 menit. Anda dapat URL `https://conflux-xxx.pages.dev`.

Setiap kali Anda `git push` perubahan, Cloudflare otomatis build & deploy ulang.

### Alternatif: Netlify
Sama mudahnya: https://netlify.com → **Add new site → Import from Git** → pilih repo →
build command `npm run build`, publish directory `dist`, lalu tambahkan dua Environment
variables yang sama → Deploy.

---

## Pasang di tablet Android (POS)
Buka URL `*.pages.dev` di Chrome tablet → menu **⋮ → Add to Home screen**. Aplikasi
muncul seperti app biasa (fullscreen). Untuk **cetak struk via Bluetooth thermal printer**,
nanti kita bungkus dengan Capacitor (Web Serial tidak jalan di Android) — beri tahu saya saat
sudah sampai tahap itu.

---

## Status integrasi data (penting)

Saat ini aplikasi masih memakai **data contoh di memori** (reset saat refresh). Proyek sudah
**disiapkan penuh** untuk Supabase:
- `src/supabaseClient.js` — koneksi (membaca env, ada flag `hasSupabase`).
- `src/db.js` — lapisan data lengkap (baca/tulis semua tabel) yang siap dipakai.
- `supabase/schema.sql` — skema + katalog asli Anda.

**Langkah berikutnya** (saya yang kerjakan): menyambungkan layar (Stok, Kasir, Order, Hutang,
Akuntansi) ke `src/db.js` supaya data benar-benar tersimpan & sinkron antar perangkat
(kasir di tablet, manajer di laptop, real-time). Itu paling aman dikerjakan **setelah** proyek
Supabase Anda jadi — kabari saya kalau langkah 1–3 sudah beres, atau minta saya kerjakan
sekarang dan Anda yang menguji.

---

## Mengamankan data (untuk nanti)

Skema sekarang memakai kebijakan **"boleh semua"** lewat anon key supaya cepat jalan
(cocok untuk alat internal). Untuk produksi lebih ketat, aktifkan **Supabase Auth** (login
email/password untuk Anda & karyawan), lalu ubah policy di `schema.sql` dari `to anon,
authenticated` menjadi `to authenticated` saja. Login peran (Kasir/Manajer) di aplikasi nanti
bisa disambungkan ke akun Auth ini sehingga benar-benar aman. Saya bantu saat dibutuhkan.
