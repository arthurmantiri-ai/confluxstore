import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Modal } from "../components/ui";
import { periodLabel, rp, thisPeriod } from "../lib/format";
import { expenseCats } from "../lib/seed";

function EntryForm({ kind, entry, defaultPeriod, onClose, onSave }) {
  // Daftar kategori biaya diambil dari Pengaturan. Kategori entri LAMA yang sudah
  // dihapus dari daftar tetap ditampilkan supaya nilainya tidak diam-diam berubah
  // saat entri itu diedit.
  const expCats = (() => {
    const base = expenseCats();
    const cur = String(entry?.category || "").trim();
    return cur && !base.includes(cur) ? [...base, cur] : base;
  })();
  const [f, setF] = useState(entry || {
    name: "", amount: 0,
    date: kind === "capital" ? "Modal awal" : "Bln ini",
    category: expCats.includes("Operasional") ? "Operasional" : expCats[0],
    period: defaultPeriod || thisPeriod(),
    items: [],
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const items = f.items || [];
  const itemsTotal = items.reduce((a, it) => a + (Number(it.amount) || 0), 0);
  const useItems = kind === "expense" && items.length > 0;
  const total = useItems ? itemsTotal : Number(f.amount) || 0;

  const addItem = () => setF((s) => ({ ...s, items: [...(s.items || []), { label: "", amount: 0 }] }));
  const setItem = (i, k, v) => setF((s) => ({ ...s, items: s.items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)) }));
  const delItem = (i) => setF((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== i) }));

  const valid = String(f.name).trim().length > 0 && total > 0 && (!useItems || items.every((it) => String(it.label).trim()));
  const save = () => {
    if (!valid) return;
    if (kind === "expense") {
      const period = f.period || thisPeriod();
      const cleanItems = items.map((it) => ({ label: String(it.label).trim(), amount: Number(it.amount) || 0 })).filter((it) => it.label);
      onSave({ name: String(f.name).trim(), amount: total, category: f.category || expCats[expCats.length - 1] || "Lain-lain", period, date: periodLabel(period), items: cleanItems });
    } else {
      onSave({ name: String(f.name).trim(), amount: Number(f.amount) || 0, date: String(f.date || "").trim() || "-" });
    }
  };
  return (
    <Modal
      open onClose={onClose} width={480}
      title={`${entry ? "Edit" : "Tambah"} ${kind === "capital" ? "Modal / Investasi" : "Biaya Operasional"}`}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn" disabled={!valid} onClick={save}><Check size={15} /> Simpan</button>
      </>}
    >
      <div className="form">
        <label className="fld"><span>Nama / keterangan</span>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder={kind === "capital" ? "cth. Mesin sangrai" : "cth. Gaji karyawan"} autoFocus /></label>
        {kind === "expense" && (
          <label className="fld"><span>Kategori</span>
            <select className="sim-select" value={f.category} onChange={(e) => set("category", e.target.value)}>
              {expCats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></label>
        )}

        {kind === "expense" && (
          <div className="fld">
            <div className="rincian-head">
              <span>Rincian (opsional)</span>
              <button type="button" className="btn ghost xs" onClick={addItem}><Plus size={13} /> Tambah rincian</button>
            </div>
            {items.length === 0 && <div className="muted xs">Tanpa rincian, cukup isi total di bawah. Dengan rincian (mis. Karyawan 1, Karyawan 2), total dijumlah otomatis.</div>}
            {items.map((it, i) => (
              <div key={i} className="rincian-row">
                <input className="ri-label" value={it.label} onChange={(e) => setItem(i, "label", e.target.value)} placeholder={`cth. ${f.category === "Gaji" ? "Karyawan " + (i + 1) : f.category === "Utilitas" ? "Listrik" : "Item " + (i + 1)}`} />
                <input className="ri-amt" type="number" min="0" value={it.amount} onChange={(e) => setItem(i, "amount", Math.max(0, Number(e.target.value)))} placeholder="0" />
                <button type="button" className="icon-btn xs danger-h" onClick={() => delItem(i)}><X size={14} /></button>
              </div>
            ))}
          </div>
        )}

        <div className="grid2">
          <label className="fld"><span>{useItems ? "Total (otomatis)" : "Nilai (Rp)"}</span>
            {useItems
              ? <input value={rp(total)} disabled />
              : <input type="number" value={f.amount} onChange={(e) => set("amount", Math.max(0, Number(e.target.value)))} />}
          </label>
          {kind === "expense" ? (
            <label className="fld"><span>Bulan</span>
              <input type="month" value={f.period} onChange={(e) => set("period", e.target.value)} /></label>
          ) : (
            <label className="fld"><span>Tanggal / periode</span>
              <input value={f.date} onChange={(e) => set("date", e.target.value)} placeholder="cth. Modal awal" /></label>
          )}
        </div>
      </div>
    </Modal>
  );
}

export {
  EntryForm
};
