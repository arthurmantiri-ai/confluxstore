import { useEffect, useRef, useState } from "react";
import { Bluetooth, Check, Download, LineChart, Package, Plus, Printer, RefreshCcw, ShieldCheck, ShoppingCart, Store, Upload, Users, X } from "lucide-react";
import { hasSupabase } from "../supabaseClient";
import { Receipt } from "../components/Receipt";
import { DEFAULT_STORE, clampInt, normStore } from "../lib/config";
import { PAY_METHODS } from "../lib/constants";
import { printProfile, rp, stampNo } from "../lib/format";
import { WA_DEFAULT, WA_VARS } from "../lib/waText";

/* ============================ Pengaturan ============================
   Satu tempat untuk mengubah perilaku sistem tanpa menyentuh kode.

   Prinsip yang dipegang layar ini:
   1. DRAF DULU. Semua perubahan ditahan di memori; database hanya ditulis
      saat tombol "Simpan perubahan" ditekan. Salah klik tidak langsung
      mengubah cara toko berjualan.
   2. SELALU ADA JALAN PULANG. Tombol "Batalkan" mengembalikan draf ke
      kondisi tersimpan, dan tiap bagian punya "kembalikan bawaan".
   3. AKIBATNYA DIJELASKAN. Tiap pengaturan diberi keterangan singkat soal
      apa yang berubah di layar kasir / stok / laporan.
   ==================================================================== */

// Baris kolom isian dengan keterangan di bawahnya
function SetFld({ label, hint, children, wide }) {
  return (
    <label className={`set-fld ${wide ? "wide" : ""}`}>
      <span className="set-lbl">{label}</span>
      {children}
      {hint && <span className="set-hint">{hint}</span>}
    </label>
  );
}

// Sakelar hidup/mati
function SetToggle({ label, hint, on, onChange }) {
  return (
    <button type="button" className={`set-toggle ${on ? "on" : ""}`} onClick={() => onChange(!on)}>
      <span className={`set-sw ${on ? "on" : ""}`}><i /></span>
      <span className="set-toggle-txt">
        <b>{label}</b>
        {hint && <span className="set-hint">{hint}</span>}
      </span>
    </button>
  );
}

// Daftar teks/angka yang bisa ditambah & dihapus (satuan, kategori, rekening, ...)
function SetList({ items, onChange, placeholder, numeric, hint, min = 1 }) {
  const [v, setV] = useState("");
  const add = () => {
    const raw = v.trim();
    if (!raw) return;
    const val = numeric ? String(Math.max(0, Math.round(Number(raw.replace(/\D/g, "")) || 0))) : raw;
    if (numeric && Number(val) <= 0) return;
    if (items.some((x) => String(x) === val)) { setV(""); return; }
    onChange([...items, numeric ? Number(val) : val]);
    setV("");
  };
  const del = (i) => onChange(items.filter((_, j) => j !== i));
  return (
    <div className="set-list">
      <div className="set-chips">
        {items.map((x, i) => (
          <span key={`${x}-${i}`} className="set-chip">
            {numeric ? rp(x) : x}
            {/* Daftar tidak boleh dikosongkan habis: sistem butuh minimal satu
                nilai agar tidak jatuh ke keadaan tanpa pilihan sama sekali. */}
            {items.length > min && (
              <button type="button" onClick={() => del(i)} title="Hapus"><X size={12} /></button>
            )}
          </span>
        ))}
        {items.length === 0 && <span className="set-empty">Belum ada isi</span>}
      </div>
      <div className="set-add">
        <input
          value={v}
          inputMode={numeric ? "numeric" : "text"}
          placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button type="button" className="btn ghost sm" onClick={add}><Plus size={14} /> Tambah</button>
      </div>
      {hint && <span className="set-hint">{hint}</span>}
    </div>
  );
}

/* ---------- Pengaturan printer khusus perangkat ini ---------- */
// Lebar kertas & cara cetak sering BERBEDA antar alat: tablet kasir memakai
// Bluetooth 58 mm, laptop manajer memakai dialog browser 80 mm. Kalau disimpan
// di server, satu alat akan terus menimpa setelan alat lain. Karena itu di sini
// tersedia timpaan lokal yang hanya berlaku di perangkat yang sedang dipakai.
function DevicePrinter({ device, setDevice, store, btName, onConnect, onTest, managerMode }) {
  const eff = printProfile(store, device);
  return (
    <div className="form">
      <SetToggle
        label="Pakai setelan printer khusus perangkat ini"
        hint="Kalau mati, perangkat ini mengikuti setelan printer dari Pengaturan toko."
        on={device.on}
        onChange={(v) => setDevice({ on: v })}
      />

      <div className={device.on ? "" : "set-locked"}>
        <label className="fld"><span>Lebar kertas</span>
          <div className="seg">
            <button type="button" disabled={!device.on} className={eff.paper === 58 ? "on" : ""} onClick={() => setDevice({ paper: 58 })}>58 mm</button>
            <button type="button" disabled={!device.on} className={eff.paper === 80 ? "on" : ""} onClick={() => setDevice({ paper: 80 })}>80 mm</button>
          </div>
        </label>
        <label className="fld"><span>Metode cetak</span>
          <div className="seg seg-3">
            <button type="button" disabled={!device.on} className={eff.method === "browser" ? "on" : ""} onClick={() => setDevice({ method: "browser" })}>Dialog browser</button>
            <button type="button" disabled={!device.on} className={eff.method === "bluetooth" ? "on" : ""} onClick={() => setDevice({ method: "bluetooth" })}>Bluetooth</button>
            <button type="button" disabled={!device.on} className={eff.method === "serial" ? "on" : ""} onClick={() => setDevice({ method: "serial" })}>USB/Serial</button>
          </div>
        </label>
      </div>

      <div className="set-eff">
        Yang dipakai perangkat ini sekarang: <b>{eff.paper} mm</b> ·{" "}
        <b>{eff.method === "browser" ? "Dialog browser" : eff.method === "bluetooth" ? "Bluetooth" : "USB/Serial"}</b>
        {!device.on && <span className="muted"> (ikut setelan toko)</span>}
      </div>

      {eff.method === "bluetooth" && (
        <div className="bt-box">
          <div className="bt-status">
            <span className={`bt-dot ${btName ? "on" : ""}`} />
            {btName ? <span>Terhubung: <b>{btName}</b></span> : <span className="muted">Belum terhubung ke printer</span>}
          </div>
          <div className="bt-actions">
            <button type="button" className="btn sm" onClick={onConnect}><Bluetooth size={15} /> {btName ? "Hubungkan ulang" : "Hubungkan printer"}</button>
            <button type="button" className="btn ghost sm" disabled={!btName} onClick={onTest}><Printer size={14} /> Tes cetak</button>
          </div>
          <span className="hint">Pairing perlu diulang setiap kali aplikasi dibuka ulang (aturan keamanan browser).</span>
        </div>
      )}
      {eff.method !== "bluetooth" && (
        <button type="button" className="btn ghost full" onClick={onTest}><Printer size={15} /> Tes cetak</button>
      )}

      {!managerMode && (
        <div className="set-note">Pengaturan toko (harga, nota, ambang stok, dan lainnya) hanya bisa diubah dari akun manajer.</div>
      )}
    </div>
  );
}

/* ---------- Halaman Pengaturan (khusus manajer) ---------- */
const SET_TABS = [
  ["toko", "Toko & Nota", Store],
  ["printer", "Printer", Printer],
  ["stok", "Stok & Re-stok", Package],
  ["kasir", "Kasir", ShoppingCart],
  ["crm", "Pelanggan", Users],
  ["akun", "Akuntansi", LineChart],
  ["sistem", "Shift & Sistem", ShieldCheck],
];

function SettingsView({ store, saving, onSave, device, setDevice, theme, onSetTheme, btName, onConnect, onTest, onSample, products = [], flash }) {
  const [tab, setTab] = useState("toko");
  // Draf: salinan kerja. Database baru disentuh saat "Simpan perubahan" ditekan.
  const [d, setD] = useState(store);
  // Kalau pengaturan berubah dari perangkat lain, draf yang BELUM diubah ikut
  // menyegarkan diri; draf yang sedang diedit tidak diganggu supaya ketikan
  // manajer tidak hilang di tengah jalan.
  const dirty = JSON.stringify(d) !== JSON.stringify(store);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => { if (!dirtyRef.current) setD(store); }, [store]);

  const set = (patch) => setD((s) => ({ ...s, ...patch }));
  const sec = (k, patch) => setD((s) => ({ ...s, [k]: { ...s[k], ...patch } }));
  const resetSec = (k) => {
    if (k === "toko") {
      const { name, addr1, addr2, phone, footer } = DEFAULT_STORE;
      setD((s) => ({ ...s, name, addr1, addr2, phone, footer, nota: { ...DEFAULT_STORE.nota } }));
    } else setD((s) => ({ ...s, [k]: { ...DEFAULT_STORE[k] } }));
    flash && flash("Bagian ini dikembalikan ke bawaan — belum disimpan");
  };

  const save = async () => { const ok = await onSave(d); if (ok) setD(normStore(d)); };

  // Cadangkan / pulihkan seluruh pengaturan sebagai satu berkas JSON.
  const exportCfg = () => {
    try {
      const blob = new Blob([JSON.stringify(normStore(d), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pengaturan-conflux-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      flash && flash("Cadangan pengaturan diunduh");
    } catch (e) { flash && flash("Gagal membuat cadangan"); }
  };
  const importCfg = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result));
        setD(normStore(parsed));
        flash && flash("Cadangan dimuat ke draf — periksa lalu tekan Simpan");
      } catch (e) { flash && flash("Berkas tidak bisa dibaca — pastikan hasil unduhan dari menu ini"); }
    };
    r.readAsText(file);
  };

  const N = d.nota, S = d.stok, K = d.kasir, C = d.crm, A = d.akun;
  const nUnits = new Set(products.map((p) => p.unit).filter(Boolean));

  return (
    <div className="set-wrap">
      <div className="set-tabs">
        {SET_TABS.map(([k, label, Icon]) => (
          <button key={k} className={`set-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="set-body">
        {/* ===================== TOKO & NOTA ===================== */}
        {tab === "toko" && (
          <div className="set-cols">
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Tampilan aplikasi</h3></div>
                <p className="set-desc">Mode terang memakai latar cerah — lebih mudah dilihat di ruangan yang terang. Pilihan ini tersimpan di perangkat ini.</p>
                <div className="seg">
                  <button type="button" className={theme !== "light" ? "on" : ""} onClick={() => onSetTheme && onSetTheme("dark")}>Gelap</button>
                  <button type="button" className={theme === "light" ? "on" : ""} onClick={() => onSetTheme && onSetTheme("light")}>Terang</button>
                </div>
              </div>

              <div className="set-card">
                <div className="set-head"><h3>Identitas toko</h3><button className="btn ghost xs" onClick={() => resetSec("toko")}><RefreshCcw size={12} /> Bawaan</button></div>
                <p className="set-desc">Dipakai di kepala nota, pesan WhatsApp ke pelanggan, dan judul berkas export.</p>
                <SetFld label="Nama toko">
                  <input value={d.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} />
                </SetFld>
                <SetFld label="Alamat / lokasi">
                  <input value={d.addr1} onChange={(e) => set({ addr1: e.target.value })} maxLength={90} />
                </SetFld>
                <SetFld label="Baris kedua (tagline)">
                  <input value={d.addr2} onChange={(e) => set({ addr2: e.target.value })} maxLength={90} />
                </SetFld>
                <div className="grid2">
                  <SetFld label="Kontak / IG">
                    <input value={d.phone} onChange={(e) => set({ phone: e.target.value })} maxLength={60} />
                  </SetFld>
                  <SetFld label="Ucapan penutup">
                    <input value={d.footer} onChange={(e) => set({ footer: e.target.value })} maxLength={90} />
                  </SetFld>
                </div>
              </div>

              <div className="set-card">
                <div className="set-head"><h3>Tampilan nota</h3></div>
                <div className="grid2">
                  <SetFld
                    label="Awalan nomor nota"
                    hint="Huruf/angka saja. “RTR” dipakai sistem untuk nota retur, jadi tidak bisa dipilih."
                  >
                    <input
                      value={N.invPrefix}
                      onChange={(e) => sec("nota", { invPrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) })}
                      placeholder="INV"
                    />
                  </SetFld>
                  <SetFld label="Baris merek di kaki nota" hint="Kosongkan untuk menghilangkan baris ini.">
                    <input value={N.brand} onChange={(e) => sec("nota", { brand: e.target.value })} maxLength={60} />
                  </SetFld>
                </div>
                <SetFld label="Catatan kaki tambahan" hint="Mis. syarat retur atau jam buka. Tercetak di atas baris merek." wide>
                  <textarea rows={2} value={N.note} onChange={(e) => sec("nota", { note: e.target.value })} maxLength={240} />
                </SetFld>
                <SetToggle label="Tampilkan logo" hint="Logo di kepala nota." on={N.logo} onChange={(v) => sec("nota", { logo: v })} />
                <SetToggle label="Tampilkan nama kasir" hint="Matikan bila tidak ingin nama karyawan tercetak." on={N.showCashier} onChange={(v) => sec("nota", { showCashier: v })} />
                <SetToggle
                  label="Buka pratinjau nota otomatis"
                  hint="Kalau mati, kasir langsung siap melayani transaksi berikutnya. Nota tetap bisa dicetak dari Riwayat Penjualan."
                  on={N.autoPreview} onChange={(v) => sec("nota", { autoPreview: v })}
                />
              </div>
            </div>

            <div className="set-col">
              <div className="set-card sticky">
                <div className="set-head"><h3>Pratinjau nota</h3></div>
                <p className="set-desc">Berubah langsung mengikuti draf di sebelah kiri.</p>
                <div className="set-preview">
                  <Receipt
                    store={d}
                    data={{
                      kind: "jual", no: stampNo(N.invPrefix || "INV"),
                      date: new Date().toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
                      cashier: "Contoh",
                      items: [
                        { name: "Dripp Syrup Caramel 760ml", qtyLabel: "1 karton", lineTotal: 690000 },
                        { name: "Masterista Powder Matcha 800g", qtyLabel: "2 pcs", lineTotal: 390000 },
                      ],
                      total: 1080000, methodLabel: "Tunai", paid: 1100000, change: 20000,
                    }}
                  />
                </div>
                <button className="btn ghost full" disabled={dirty} onClick={onSample}>
                  <Printer size={15} /> Cetak nota contoh
                </button>
                {dirty && <span className="set-hint">Simpan perubahan dulu supaya hasil cetak sama dengan pratinjau.</span>}
              </div>
            </div>
          </div>
        )}

        {/* ===================== PRINTER ===================== */}
        {tab === "printer" && (
          <div className="set-cols">
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Setelan printer toko</h3></div>
                <p className="set-desc">Berlaku untuk semua perangkat yang tidak punya setelan sendiri.</p>
                <SetFld label="Lebar kertas">
                  <div className="seg">
                    <button type="button" className={d.paper === 58 ? "on" : ""} onClick={() => set({ paper: 58 })}>58 mm</button>
                    <button type="button" className={d.paper === 80 ? "on" : ""} onClick={() => set({ paper: 80 })}>80 mm</button>
                  </div>
                </SetFld>
                <SetFld
                  label="Metode cetak"
                  hint={d.method === "browser"
                    ? "Lewat dialog browser — paling kompatibel di semua perangkat."
                    : d.method === "bluetooth"
                    ? "Langsung ke printer thermal Bluetooth (ESC/POS). Didukung Chrome di Android & ChromeOS; iPhone/iPad belum bisa."
                    : "ESC/POS langsung lewat USB/serial (Chrome/Edge desktop). Bila gagal, otomatis kembali ke dialog browser."}
                >
                  <div className="seg seg-3">
                    <button type="button" className={d.method === "browser" ? "on" : ""} onClick={() => set({ method: "browser" })}>Dialog browser</button>
                    <button type="button" className={d.method === "bluetooth" ? "on" : ""} onClick={() => set({ method: "bluetooth" })}>Bluetooth</button>
                    <button type="button" className={d.method === "serial" ? "on" : ""} onClick={() => set({ method: "serial" })}>USB/Serial</button>
                  </div>
                </SetFld>
              </div>
            </div>
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Perangkat ini</h3></div>
                <p className="set-desc">Timpaan lokal — tidak ikut tersimpan ke server dan tidak memengaruhi perangkat lain.</p>
                <DevicePrinter
                  device={device} setDevice={setDevice} store={store}
                  btName={btName} onConnect={onConnect} onTest={onTest} managerMode
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== STOK ===================== */}
        {tab === "stok" && (
          <div className="set-cols">
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Peringatan & perhitungan</h3><button className="btn ghost xs" onClick={() => resetSec("stok")}><RefreshCcw size={12} /> Bawaan</button></div>
                <div className="grid2">
                  <SetFld label="Ambang dekat kedaluwarsa (hari)" hint="Batch dengan sisa umur ≤ angka ini ditandai kuning di layar Stok.">
                    <input type="number" min="1" max="365" value={S.expiryWarnDays}
                      onChange={(e) => sec("stok", { expiryWarnDays: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                  <SetFld label="Siklus order (hari)" hint="Seberapa sering Anda belanja ke supplier. Dipakai menghitung saran jumlah re-stok.">
                    <input type="number" min="1" max="180" value={S.reviewDays}
                      onChange={(e) => sec("stok", { reviewDays: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                </div>
                <div className="set-formula">
                  Saran jumlah = Pemakaian harian × (Lead time + <b>{clampInt(S.reviewDays, 1, 180, 7)}</b>) + Stok aman − Stok saat ini
                </div>
                <SetToggle
                  label="Tampilkan lonceng “perlu re-stok”"
                  hint="Pemberitahuan di bilah atas untuk manajer. Layar Re-stok tetap bisa dibuka walau ini dimatikan."
                  on={S.lowStockAlert} onChange={(v) => sec("stok", { lowStockAlert: v })}
                />
              </div>
            </div>
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Bawaan barang baru</h3></div>
                <p className="set-desc">Nilai yang otomatis terisi saat menambah barang, supaya tidak diketik ulang setiap kali.</p>
                <div className="grid2">
                  <SetFld label="Pemakaian harian">
                    <input type="number" min="0" value={S.newDailyUsage}
                      onChange={(e) => sec("stok", { newDailyUsage: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                  <SetFld label="Lead time (hari)">
                    <input type="number" min="0" max="365" value={S.newLeadTime}
                      onChange={(e) => sec("stok", { newLeadTime: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                </div>
                <div className="grid2">
                  <SetFld label="Stok aman">
                    <input type="number" min="0" value={S.newSafetyStock}
                      onChange={(e) => sec("stok", { newSafetyStock: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                  <SetFld label="Satuan bawaan">
                    <select className="sim-select" value={S.newUnit} onChange={(e) => sec("stok", { newUnit: e.target.value })}>
                      {S.units.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </SetFld>
                </div>
                <SetFld label="Daftar satuan" wide>
                  <SetList
                    items={S.units}
                    onChange={(v) => sec("stok", { units: v })}
                    placeholder="cth. renceng"
                    hint="Satuan yang sudah dipakai barang di katalog tetap muncul walau tidak ada di daftar ini."
                  />
                </SetFld>
                {[...nUnits].filter((u) => !S.units.includes(u)).length > 0 && (
                  <div className="set-note">
                    Satuan terpakai di katalog tapi belum ada di daftar: <b>{[...nUnits].filter((u) => !S.units.includes(u)).join(", ")}</b>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================== KASIR ===================== */}
        {tab === "kasir" && (
          <div className="set-cols">
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Metode pembayaran</h3><button className="btn ghost xs" onClick={() => resetSec("kasir")}><RefreshCcw size={12} /> Bawaan</button></div>
                <p className="set-desc">Hanya yang dicentang muncul di layar kasir. Transaksi lama dengan metode yang dimatikan tetap utuh di riwayat & laporan.</p>
                <div className="set-checks">
                  {PAY_METHODS.map((m) => {
                    const Icon = m.icon;
                    const on = K.methods.includes(m.key);
                    const locked = m.key === "cash"; // tunai tidak boleh dimatikan
                    return (
                      <button
                        key={m.key} type="button" disabled={locked}
                        className={`set-check ${on ? "on" : ""} ${locked ? "locked" : ""}`}
                        onClick={() => sec("kasir", { methods: on ? K.methods.filter((x) => x !== m.key) : [...K.methods, m.key] })}
                      >
                        <span className="set-box">{on && <Check size={12} />}</span>
                        <Icon size={15} /> {m.label}
                        {locked && <span className="set-lock">wajib</span>}
                      </button>
                    );
                  })}
                </div>
                <SetFld label="Metode terpilih saat kasir dibuka">
                  <select className="sim-select" value={K.defaultMethod} onChange={(e) => sec("kasir", { defaultMethod: e.target.value })}>
                    {PAY_METHODS.filter((m) => K.methods.includes(m.key) && m.key !== "split").map((m) => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </SetFld>
                <div className="set-note">
                  “Campur” butuh minimal dua metode non-hutang aktif; kalau tidak, pilihan itu disembunyikan otomatis.
                </div>
              </div>
            </div>
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Kebiasaan kasir</h3></div>
                <SetFld label="Pecahan tombol uang cepat" wide
                  hint="Tombol dibuat dari pembulatan total ke atas. Contoh total Rp137.000 dengan pecahan 50.000 → tombol Rp150.000.">
                  <SetList
                    items={K.quickCash} numeric
                    onChange={(v) => sec("kasir", { quickCash: v })}
                    placeholder="cth. 20000"
                  />
                </SetFld>
                <SetToggle
                  label="Wajib isi “uang diterima” untuk tunai"
                  hint="Mencegah kembalian dikira-kira — selisih kas saat tutup shift jadi jauh berkurang."
                  on={K.requirePaid} onChange={(v) => sec("kasir", { requirePaid: v })}
                />
                <SetToggle
                  label="Wajib mencatat pelanggan di setiap transaksi"
                  hint="Membuat riwayat pembelian lengkap, tapi memperlambat antrean saat ramai. Metode hutang tetap selalu wajib bernama."
                  on={K.requireCustomer} onChange={(v) => sec("kasir", { requireCustomer: v })}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== PELANGGAN ===================== */}
        {tab === "crm" && (
          <div className="set-cols">
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Pengelompokan pelanggan</h3><button className="btn ghost xs" onClick={() => resetSec("crm")}><RefreshCcw size={12} /> Bawaan</button></div>
                <div className="grid2">
                  <SetFld label="Batas “pasif” (hari)" hint="Pernah belanja tapi tidak kembali selama ini akan masuk saringan Pasif.">
                    <input type="number" min="7" max="730" value={C.pasifDays}
                      onChange={(e) => sec("crm", { pasifDays: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                  <SetFld label="Rentang “baru” (hari)" hint="Pelanggan yang transaksi pertamanya dalam rentang ini dihitung sebagai pelanggan baru.">
                    <input type="number" min="1" max="365" value={C.newDays}
                      onChange={(e) => sec("crm", { newDays: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                </div>
                <SetFld label="Maksimal baris pada pesan “list stok & harga”"
                  hint="Pesan WhatsApp yang terlalu panjang sering terpotong di HP pelanggan.">
                  <input type="number" min="5" max="100" value={C.waStokMax}
                    onChange={(e) => sec("crm", { waStokMax: e.target.value === "" ? "" : Number(e.target.value) })} />
                </SetFld>
              </div>
            </div>
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Templat pesan WhatsApp</h3></div>
                <p className="set-desc">
                  Kosongkan untuk memakai teks bawaan. Kata kunci yang tersedia:{" "}
                  {WA_VARS.map((v) => <code key={v} className="set-var">{v}</code>)}
                </p>
                {[["sapa", "Sapa / terima kasih"], ["promo", "Promo"], ["stok", "List stok & harga"], ["hutang", "Pengingat hutang"]].map(([k, label]) => (
                  <SetFld key={k} label={label} wide>
                    <textarea
                      rows={3}
                      value={C.wa[k]}
                      placeholder={WA_DEFAULT[k]}
                      onChange={(e) => sec("crm", { wa: { ...C.wa, [k]: e.target.value } })}
                    />
                  </SetFld>
                ))}
                <div className="set-note">
                  Pesan tetap bisa diedit lagi oleh kasir sebelum dikirim — templat ini hanya titik awal.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== AKUNTANSI ===================== */}
        {tab === "akun" && (
          <div className="set-cols">
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Kategori biaya</h3><button className="btn ghost xs" onClick={() => resetSec("akun")}><RefreshCcw size={12} /> Bawaan</button></div>
                <p className="set-desc">Pilihan pada form Biaya Operasional dan pengelompokan di laporan laba-rugi.</p>
                <SetList
                  items={A.expenseCats}
                  onChange={(v) => sec("akun", { expenseCats: v })}
                  placeholder="cth. Transportasi"
                  hint="Menghapus kategori tidak mengubah biaya yang sudah tercatat — kategori lama tetap tampil saat entri itu dibuka."
                />
              </div>
            </div>
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Rekening tujuan setoran</h3></div>
                <p className="set-desc">Muncul sebagai saran saat mencatat setoran kas ke bank, supaya nama rekening seragam.</p>
                <SetList
                  items={A.accounts} min={0}
                  onChange={(v) => sec("akun", { accounts: v })}
                  placeholder="cth. BCA 1234567890 a.n. Conflux"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================== SHIFT & SISTEM ===================== */}
        {tab === "sistem" && (
          <div className="set-cols">
            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Shift kasir</h3></div>
                <SetFld label="Batas selisih kas wajar (Rp)"
                  hint="Selisih di bawah nilai ini ditandai wajar pada laporan tutup shift. Selisih tetap dicatat apa adanya — angka ini hanya menandai mana yang perlu ditelusuri.">
                  <input type="number" min="0" step="1000" value={d.shift.cashTolerance}
                    onChange={(e) => sec("shift", { cashTolerance: e.target.value === "" ? "" : Number(e.target.value) })} />
                </SetFld>
                <div className="set-note">
                  Hitungan buta saat tutup shift dan larangan menutup shift ketika masih ada transaksi belum terkirim <b>sengaja tidak bisa dimatikan</b> — keduanya pengaman utama terhadap selisih kas.
                </div>
              </div>

              {!hasSupabase && (
                <div className="set-card">
                  <div className="set-head"><h3>Keamanan</h3></div>
                  <SetFld label="PIN Manajer" hint="Minimal 4 angka. Hanya berlaku pada mode tanpa server; dengan Supabase, peran diambil dari akun login.">
                    <input type="text" inputMode="numeric" maxLength={8} value={d.pin}
                      onChange={(e) => set({ pin: e.target.value.replace(/\D/g, "") })} />
                  </SetFld>
                </div>
              )}
            </div>

            <div className="set-col">
              <div className="set-card">
                <div className="set-head"><h3>Kinerja</h3><button className="btn ghost xs" onClick={() => resetSec("sistem")}><RefreshCcw size={12} /> Bawaan</button></div>
                <div className="grid2">
                  <SetFld label="Tarik ulang data berkala (detik)"
                    hint="Makin kecil makin cepat stok antar perangkat sinkron, tapi makin banyak pemakaian kuota.">
                    <input type="number" min="30" max="3600" step="10" value={d.sistem.refreshSec}
                      onChange={(e) => sec("sistem", { refreshSec: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                  <SetFld label="Riwayat penjualan dimuat (hari)"
                    hint="Rentang data yang ditarik saat aplikasi dibuka. Makin panjang makin berat, terutama di tablet.">
                    <input type="number" min="7" max="730" value={d.sistem.salesDays}
                      onChange={(e) => sec("sistem", { salesDays: e.target.value === "" ? "" : Number(e.target.value) })} />
                  </SetFld>
                </div>
              </div>

              <div className="set-card">
                <div className="set-head"><h3>Cadangan pengaturan</h3></div>
                <p className="set-desc">Simpan seluruh pengaturan sebagai satu berkas, atau pulihkan dari cadangan. Yang dipulihkan masuk ke draf dulu — tetap harus Anda periksa dan simpan.</p>
                <div className="set-backup">
                  <button className="btn ghost sm" onClick={exportCfg}><Download size={14} /> Unduh cadangan</button>
                  <label className="btn ghost sm">
                    <Upload size={14} /> Muat cadangan
                    <input type="file" accept="application/json,.json" style={{ display: "none" }}
                      onChange={(e) => { importCfg(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bilah simpan — selalu terlihat, jelas kapan ada perubahan tertunda */}
      <div className={`set-bar ${dirty ? "dirty" : ""}`}>
        <span className="set-bar-msg">
          {saving ? "Menyimpan…" : dirty ? "Ada perubahan yang belum disimpan" : "Semua perubahan tersimpan"}
        </span>
        <div className="set-bar-act">
          <button className="btn ghost" disabled={!dirty || saving} onClick={() => setD(store)}>Batalkan</button>
          <button className="btn" disabled={!dirty || saving} onClick={save}><Check size={15} /> Simpan perubahan</button>
        </div>
      </div>
    </div>
  );
}

export {
  DevicePrinter,
  SET_TABS,
  SetFld,
  SetList,
  SetToggle,
  SettingsView
};
