-- =====================================================================
--  CONFLUX COFFEE CLUB — Skema Database (Supabase / PostgreSQL)
--  Cara pakai: buka Supabase → SQL Editor → New query → tempel semua
--  isi file ini → Run. Aman dijalankan ulang (drop + create).
-- =====================================================================

-- Hapus dulu kalau sudah ada (biar bisa dijalankan ulang dari nol)
drop table if exists sales_log cascade;
drop table if exists movements cascade;
drop table if exists orders cascade;
drop table if exists debts cascade;
drop table if exists expenses cascade;
drop table if exists capital cascade;
drop table if exists products cascade;
drop table if exists settings cascade;

-- =========================== TABEL ===================================

create table products (
  id           uuid primary key default gen_random_uuid(),
  code         text,                       -- BRG-001
  name         text not null,
  sku          text,
  category     text,
  unit         text default 'pcs',
  cost         numeric default 0,          -- harga modal / satuan
  price        numeric default 0,          -- harga jual / satuan
  carton_size  integer default 0,          -- isi per karton (0 = tanpa karton)
  price_carton numeric default 0,
  stock        numeric default 0,
  daily_usage  numeric default 1,          -- pemakaian / hari (untuk ROP)
  lead_time    integer default 1,          -- hari
  safety_stock numeric default 0,
  promo_active boolean default false,
  promo_type   text default 'percent',     -- 'percent' | 'amount'
  promo_value  numeric default 0,
  created_at   timestamptz default now()
);

create table movements (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  type       text not null,                -- 'in' | 'out'
  qty        numeric not null default 0,
  note       text,
  created_at timestamptz default now()
);

create table orders (
  id         text primary key,             -- ORD-2041
  customer   text,
  channel    text,                         -- WhatsApp / Instagram / Marketplace
  status     text default 'baru',          -- baru | diproses | dikirim | selesai
  items      jsonb default '[]',           -- [{ pid, qty }]
  total      numeric default 0,
  created_at timestamptz default now()
);

create table debts (
  id         text primary key,             -- HTG-001
  debtor     text,
  business   text,
  phone      text,
  items      jsonb default '[]',           -- [{ name, qtyLabel, lineTotal }]
  total      numeric default 0,
  status     text default 'belum',         -- belum | lunas
  date       text,
  paid_at    text,
  created_at timestamptz default now()
);

create table capital (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  amount     numeric default 0,
  date       text,
  created_at timestamptz default now()
);

create table expenses (
  id         uuid primary key default gen_random_uuid(),
  category   text default 'Lain-lain',
  name       text not null,
  amount     numeric default 0,
  date       text,
  created_at timestamptz default now()
);

create table sales_log (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  qty        numeric default 0,
  revenue    numeric default 0,
  cost       numeric default 0,
  date       text,
  created_at timestamptz default now()
);

create table settings (
  id   integer primary key default 1,
  data jsonb not null,
  constraint settings_single_row check (id = 1)
);

-- ===================== DATA AWAL (katalog asli) ======================

insert into products
  (code,name,sku,category,unit,cost,price,carton_size,price_carton,stock,daily_usage,lead_time,safety_stock,promo_active,promo_type,promo_value) values
-- Benih (biji kopi)
('BRG-001','Robusta Temanggung (Fine)','BNH-ROB','Benih','kg',185250,195000,0,0,14,2,5,6,false,'percent',0),
('BRG-002','Sulawesi Blend 70% (Toraja-Robusta)','BNH-SL70','Benih','kg',247000,260000,0,0,8,2,5,5,false,'percent',0),
('BRG-003','Sulawesi Blend 50% (Toraja-Robusta)','BNH-SL50','Benih','kg',228000,240000,0,0,22,1,5,4,false,'percent',0),
('BRG-004','Java Blend 70% (Ijen-Robusta)','BNH-JV70','Benih','kg',247000,260000,0,0,4,2,5,5,false,'percent',0),
('BRG-005','Java Blend 50% (Ijen-Robusta)','BNH-JV50','Benih','kg',228000,240000,0,0,16,1,5,4,false,'percent',0),
-- Dripp (syrup, 1 karton = 6 botol)
('BRG-006','Dripp Syrup Caramel 760ml','DRP-CRM','Dripp','botol',99900,118000,6,690000,54,5,7,24,true,'percent',10),
('BRG-007','Dripp Syrup Butterscotch 760ml','DRP-BTS','Dripp','botol',99900,118000,6,690000,30,5,7,30,false,'percent',0),
('BRG-008','Dripp Syrup Cinnamon 760ml','DRP-CNM','Dripp','botol',99900,118000,6,690000,18,3,7,18,false,'percent',0),
('BRG-009','Dripp Syrup Hazelnut 760ml','DRP-HZL','Dripp','botol',99900,118000,6,690000,84,4,7,24,false,'percent',0),
('BRG-010','Dripp Syrup Passion Fruit 760ml','DRP-PSF','Dripp','botol',99900,118000,6,690000,42,3,7,24,false,'percent',0),
('BRG-011','Dripp Syrup Vanilla 760ml','DRP-VNL','Dripp','botol',99900,118000,6,690000,96,4,7,24,false,'percent',0),
('BRG-012','Dripp Syrup Sea Salt 760ml','DRP-SST','Dripp','botol',99900,118000,6,690000,24,3,7,24,false,'percent',0),
-- Masterista (powder & syrup)
('BRG-013','Masterista Gula Aren Pouch 1000g','LL4020','Masterista','pcs',60125,75000,0,0,30,3,3,10,false,'percent',0),
('BRG-014','Masterista Ice Shaken Lemon Tea 1kg','LL3481','Masterista','pcs',69375,85000,0,0,8,2,3,8,false,'percent',0),
('BRG-015','Masterista Syrup Classic Caramel 850ml','LL3861','Masterista','pcs',101750,125000,0,0,20,2,3,8,false,'percent',0),
('BRG-016','Masterista Syrup French Vanilla 850ml','LL3860','Masterista','pcs',101750,125000,0,0,12,2,3,8,false,'percent',0),
('BRG-017','Masterista Syrup Premium Hazelnut 850ml','LL3863','Masterista','pcs',101750,125000,0,0,18,2,3,8,false,'percent',0),
('BRG-018','Masterista Powder Classic Chocolate Base 800g','LL3064','Masterista','pcs',155400,190000,0,0,24,3,3,12,false,'percent',0),
('BRG-019','Masterista Powder Butterscotch Expecta 800g','LL3068','Masterista','pcs',146150,180000,0,0,14,3,3,12,false,'percent',0),
('BRG-020','Masterista Powder Dark Chocolate 800g','LL2895','Masterista','pcs',155400,190000,0,0,9,2,3,10,false,'percent',0),
('BRG-021','Masterista Powder Matcha Vanilla 800g','LL2892','Masterista','pcs',161875,195000,0,0,22,2,3,10,false,'percent',0),
('BRG-022','Masterista Powder Original Matcha 800g','LL3066','Masterista','pcs',161875,195000,0,0,16,2,3,10,false,'percent',0),
('BRG-023','Masterista Powder Taro Expecta 800g','LL2894','Masterista','pcs',146150,180000,0,0,11,2,3,10,false,'percent',0),
('BRG-024','Masterista Powder Red Velvet 800g','LL2891','Masterista','pcs',146150,180000,0,0,7,2,3,10,false,'percent',0),
('BRG-025','Masterista Syrup Butterscotch 850ml','LL6072','Masterista','pcs',101750,125000,0,0,19,2,3,8,false,'percent',0);

insert into capital (name, amount, date) values
('Renovasi & interior kedai', 45000000, 'Modal awal'),
('Mesin sangrai (roaster) & grinder', 60000000, 'Modal awal'),
('Mesin espresso & peralatan bar', 35000000, 'Modal awal'),
('Furniture & dekorasi', 18000000, 'Modal awal'),
('Branding, logo & signage', 8000000, 'Modal awal'),
('Sewa & deposit awal', 24000000, 'Modal awal'),
('Perizinan & legalitas', 5000000, 'Modal awal');

insert into expenses (category, name, amount, date) values
('Sewa', 'Sewa tempat (bulanan)', 8000000, 'Bln ini'),
('Gaji', 'Gaji karyawan', 12000000, 'Bln ini'),
('Utilitas', 'Listrik & air', 2400000, 'Bln ini'),
('Utilitas', 'Internet', 500000, 'Bln ini'),
('Marketing', 'Konten & iklan IG', 1500000, 'Bln ini'),
('Operasional', 'Transport & pengiriman', 1200000, 'Bln ini'),
('Operasional', 'Kemasan & ATK', 900000, 'Bln ini');

-- Log penjualan contoh (± 1 bulan) supaya laporan akuntansi langsung terisi
insert into sales_log (product_id, qty, revenue, cost, date)
select id,
       round(daily_usage * 24),
       price * round(daily_usage * 24),
       cost  * round(daily_usage * 24),
       'Bln ini'
from products;

-- Profil toko (1 baris)
insert into settings (id, data) values (1, '{
  "name": "Conflux Coffee Club",
  "addr1": "Tomohon · Manado, Sulawesi Utara",
  "addr2": "Brewing Connection, One Cup at a Time",
  "phone": "@conflux.coffee",
  "footer": "Terima kasih sudah berbelanja!",
  "paper": 58,
  "method": "browser"
}'::jsonb);

-- ===================== KEAMANAN (RLS) ================================
-- Mengaktifkan Row Level Security + izin akses.
--
-- CATATAN PENTING: kebijakan di bawah mengizinkan SIAPA SAJA yang punya
-- anon key (yang ikut ter-publish di frontend) untuk baca & tulis.
-- Ini OK untuk MULAI / alat internal toko Anda. Untuk produksi yang
-- lebih aman, ganti dengan Supabase Auth (login) lalu batasi policy ke
-- "authenticated" saja. Lihat DEPLOY.md bagian "Mengamankan data".

alter table products  enable row level security;
alter table movements enable row level security;
alter table orders    enable row level security;
alter table debts     enable row level security;
alter table capital   enable row level security;
alter table expenses  enable row level security;
alter table sales_log enable row level security;
alter table settings  enable row level security;

-- Izin tabel (diperlukan untuk Data API, terutama proyek baru 2026+)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

-- Policy "boleh semua" untuk anon & authenticated
do $$
declare t text;
begin
  foreach t in array array['products','movements','orders','debts','capital','expenses','sales_log','settings']
  loop
    execute format('drop policy if exists "allow all %1$s" on %1$I;', t);
    execute format(
      'create policy "allow all %1$s" on %1$I for all to anon, authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Selesai. Cek: Table Editor harus menampilkan 25 produk, 7 modal, 7 biaya.
