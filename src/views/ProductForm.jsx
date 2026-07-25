import { useState } from "react";
import { Check, Handshake, RefreshCcw } from "lucide-react";
import { Modal, PickOrAdd } from "../components/ui";
import { cfgStok } from "../lib/config";
import { num, rp } from "../lib/format";
import { effPrice, rop } from "../lib/inventory";
import { genSku } from "../lib/seed";

/* ============================ Product Form (Tambah / Edit) ============================ */

function ProductForm({ product, products, categories, onClose, onSave }) {
  // Nilai bawaan barang baru (satuan, pemakaian harian, lead time, stok aman)
  // diatur di Pengaturan → Stok & Re-stok, jadi tidak perlu diketik ulang tiap
  // menambah barang.
  const S = cfgStok();
  const [f, setF] = useState(
    product || {
      name: "", sku: "", category: "", unit: S.newUnit, price: 0, cost: 0, stock: 0,
      cartonSize: 0, priceCarton: 0, promo: { active: false, type: "percent", value: 0 },
      dailyUsage: S.newDailyUsage, leadTime: S.newLeadTime, safetyStock: S.newSafetyStock,
      isConsign: false, supplier: "",
    }
  );
  const [skuTouched, setSkuTouched] = useState(!!product); // mode edit: jangan auto-ganti
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const n = (k, v) => set(k, v === "" ? "" : Math.max(0, Number(v)));
  const setPromo = (patch) => setF((s) => ({ ...s, promo: { ...(s.promo || { active: false, type: "percent", value: 0 }), ...patch } }));
  const valid = String(f.name).trim().length > 0;

  const allProducts = products || [];
  // Daftar satuan = satuan yang sudah dipakai di katalog + daftar dari Pengaturan
  const unitOptions = Array.from(new Set([...allProducts.map((p) => p.unit).filter(Boolean), ...S.units]));
  const supplierOptions = Array.from(new Set(allProducts.map((p) => p.supplier).filter(Boolean)));

  // Saat kategori berganti, SKU ikut dibuat otomatis (selama belum diubah manual)
  const onCategory = (v) =>
    setF((s) => ({ ...s, category: v, sku: !product && !skuTouched ? genSku(v, allProducts) : s.sku }));
  const regenSku = () => { setSkuTouched(false); set("sku", genSku(f.category, allProducts)); };

  const csize = Number(f.cartonSize) || 0;
  const promo = f.promo || { active: false, type: "percent", value: 0 };
  const effUnit = effPrice(Number(f.price) || 0, promo);
  const effCtn = effPrice(Number(f.priceCarton) || 0, promo);

  const save = () => {
    if (!valid) return;
    const cat = String(f.category || "Lainnya").trim();
    onSave({
      name: String(f.name).trim(),
      sku: String(f.sku || "").trim().toUpperCase() || genSku(cat, allProducts),
      category: cat, unit: String(f.unit || S.newUnit || "pcs").trim(),
      price: Number(f.price) || 0, cost: Number(f.cost) || 0,
      // Mode edit: kolom stok yang DIKOSONGKAN berarti "tidak diubah" (bukan nol).
      // Tanpa ini, mengedit harga sambil tak sengaja menghapus isi kolom stok akan
      // memicu opname ke 0 di server — stok lenyap tanpa disadari.
      stock: f.stock === "" && product ? (Number(product.stock) || 0) : (Number(f.stock) || 0),
      cartonSize: csize, priceCarton: csize > 0 ? Number(f.priceCarton) || 0 : 0,
      promo: { active: !!promo.active, type: promo.type || "percent", value: Number(promo.value) || 0 },
      dailyUsage: Number(f.dailyUsage) || 0, leadTime: Number(f.leadTime) || 0, safetyStock: Number(f.safetyStock) || 0,
      isConsign: !!f.isConsign, supplier: f.isConsign ? String(f.supplier || "").trim() : "",
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={580}
      title={product ? `Edit Barang · ${product.code}` : "Tambah Barang Baru"}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Batal</button>
          <button className="btn" disabled={!valid} onClick={save}><Check size={15} /> {product ? "Simpan perubahan" : "Tambah barang"}</button>
        </>
      }
    >
      <div className="form">
        {product && (
          <div className="form-prod">
            <span>ID Barang</span>
            <span className="idcode lg">{product.code}</span>
          </div>
        )}
        <label className="fld">
          <span>Nama barang *</span>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="cth. Dripp Syrup Caramel 760ml" autoFocus />
        </label>
        <div className="grid2">
          <label className="fld">
            <span>Kategori</span>
            <PickOrAdd value={f.category} options={categories} onChange={onCategory} placeholder="Pilih kategori" addLabel="Kategori baru…" />
          </label>
          <label className="fld">
            <span>SKU / Kode Item <span className="auto-tag">otomatis</span></span>
            <div className="inline-fld">
              <input value={f.sku} onChange={(e) => { set("sku", e.target.value.toUpperCase()); setSkuTouched(true); }} placeholder="otomatis dari kategori" />
              <button type="button" className="btn ghost sm" onClick={regenSku} title="Buat ulang otomatis"><RefreshCcw size={14} /></button>
            </div>
          </label>
        </div>
        <div className="grid2">
          <label className="fld">
            <span>Satuan</span>
            <PickOrAdd value={f.unit} options={unitOptions} onChange={(v) => set("unit", v)} placeholder="Pilih satuan" addLabel="Satuan baru…" />
          </label>
          <label className="fld">
            <span>Harga modal / satuan (Rp)</span>
            <input type="number" value={f.cost} onChange={(e) => n("cost", e.target.value)} />
            {product && <span className="hint">Referensi modal terbaru. HPP penjualan mengikuti harga batch FIFO masing-masing.</span>}
          </label>
        </div>

        <div className="promo-box">
          <div className="promo-row">
            <button type="button" className={`switch ${f.isConsign ? "on" : ""}`} onClick={() => set("isConsign", !f.isConsign)}>
              <span className="knob" />
            </button>
            <span className="promo-label"><Handshake size={14} style={{ verticalAlign: "-2px" }} /> Barang titip jual (konsinyasi)</span>
          </div>
          {f.isConsign && (
            <>
              <label className="fld">
                <span>Distributor / pemilik barang</span>
                <PickOrAdd value={f.supplier} options={supplierOptions} onChange={(v) => set("supplier", v)} placeholder="Pilih distributor" addLabel="Distributor baru…" />
              </label>
              <div className="muted xs">
                Barang milik distributor — dibayar hanya setelah laku. Harga modal di atas = nilai setoran per satuan.
                Stoknya tidak dihitung sebagai aset toko, dan kewajiban setor tercatat otomatis di menu <b>Titip Jual</b> saat barang terjual.
              </div>
            </>
          )}
        </div>

        <div className="form-section">Harga jual & promo</div>
        <div className="grid2">
          <label className="fld">
            <span>Harga jual / satuan (Rp)</span>
            <input type="number" value={f.price} onChange={(e) => n("price", e.target.value)} />
            <span className="hint">Margin {f.cost > 0 && f.price > 0 ? Math.round(((f.price - f.cost) / f.price) * 100) : 0}%</span>
          </label>
          <label className="fld">
            <span>Isi per karton (satuan)</span>
            <input type="number" value={f.cartonSize} onChange={(e) => n("cartonSize", e.target.value)} placeholder="0 = tidak dijual per karton" />
          </label>
        </div>
        {csize > 0 && (
          <label className="fld">
            <span>Harga jual / karton (Rp)</span>
            <div className="inline-fld">
              <input type="number" value={f.priceCarton} onChange={(e) => n("priceCarton", e.target.value)} />
              <button type="button" className="btn ghost sm" onClick={() => set("priceCarton", (Number(f.price) || 0) * csize)}>= satuan × {csize}</button>
            </div>
            <span className="hint">Tanpa diskon: {rp((Number(f.price) || 0) * csize)}</span>
          </label>
        )}

        <div className="promo-box">
          <div className="promo-row">
            <button type="button" className={`switch ${promo.active ? "on" : ""}`} onClick={() => setPromo({ active: !promo.active })}>
              <span className="knob" />
            </button>
            <span className="promo-label">Aktifkan promo / diskon</span>
          </div>
          {promo.active && (
            <>
              <div className="grid2">
                <div className="seg">
                  <button type="button" className={promo.type === "percent" ? "on" : ""} onClick={() => setPromo({ type: "percent" })}>Persen (%)</button>
                  <button type="button" className={promo.type === "amount" ? "on" : ""} onClick={() => setPromo({ type: "amount" })}>Potongan (Rp)</button>
                </div>
                <label className="fld">
                  <span>{promo.type === "percent" ? "Diskon (%)" : "Potongan (Rp)"}</span>
                  <input type="number" value={promo.value} onChange={(e) => setPromo({ value: Math.max(0, Number(e.target.value)) })} />
                </label>
              </div>
              <div className="promo-preview">
                Harga setelah promo: <b>{rp(effUnit)}</b> / {f.unit || "satuan"}
                {csize > 0 && <> · <b>{rp(effCtn)}</b> / karton</>}
              </div>
            </>
          )}
        </div>

        <label className="fld">
          <span>Jumlah stok ({f.unit || "satuan"})</span>
          <input type="number" value={f.stock} onChange={(e) => n("stock", e.target.value)} />
          {product && <span className="hint">Perubahan di sini tercatat sebagai penyesuaian & disinkronkan ke batch FIFO. Untuk pembelian baru, gunakan tombol “Masuk” agar harga beli tercatat per batch.</span>}
        </label>

        <div className="form-section">Parameter perhitungan ROP</div>
        <div className="grid3">
          <label className="fld">
            <span>Pemakaian / hari</span>
            <input type="number" value={f.dailyUsage} onChange={(e) => n("dailyUsage", e.target.value)} />
          </label>
          <label className="fld">
            <span>Lead time (hari)</span>
            <input type="number" value={f.leadTime} onChange={(e) => n("leadTime", e.target.value)} />
          </label>
          <label className="fld">
            <span>Stok aman</span>
            <input type="number" value={f.safetyStock} onChange={(e) => n("safetyStock", e.target.value)} />
          </label>
        </div>
        <div className="rop-preview">
          Titik pesan ulang (ROP): <b>{num(rop({ dailyUsage: Number(f.dailyUsage) || 0, leadTime: Number(f.leadTime) || 0, safetyStock: Number(f.safetyStock) || 0 }))}</b> {f.unit || "satuan"}
        </div>
      </div>
    </Modal>
  );
}

export {
  ProductForm
};
