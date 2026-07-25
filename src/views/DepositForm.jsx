import { useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "../components/ui";
import { cfgAkun } from "../lib/config";
import { rp } from "../lib/format";

// Form setoran kas -> rekening. Field: jumlah, tanggal, rekening tujuan, catatan.
// Sengaja TERPISAH dari EntryForm (biaya/modal) supaya jelas ini bukan pengeluaran.
function DepositForm({ entry, defaultAccount, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  // Daftar rekening dari Pengaturan → Akuntansi. Kolom tetap bisa diketik bebas;
  // daftar hanya mempercepat & menyeragamkan penulisan nama rekening.
  const accounts = cfgAkun().accounts;
  const [f, setF] = useState(entry || { amount: 0, depositedAt: today, account: defaultAccount || accounts[0] || "", note: "" });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const amount = Number(f.amount) || 0;
  const date = f.depositedAt || today;
  const valid = amount > 0 && !!date;
  const save = () => {
    if (!valid) return;
    onSave({
      amount,
      depositedAt: date,
      account: String(f.account || "").trim(),
      note: String(f.note || "").trim(),
      period: String(date).slice(0, 7),
    });
  };
  return (
    <Modal
      open onClose={onClose} width={460}
      title={`${entry ? "Edit" : "Catat"} Setoran ke Rekening`}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Batal</button>
        <button className="btn" disabled={!valid} onClick={save}><Check size={15} /> Simpan</button>
      </>}
    >
      <div className="form">
        <div className="muted xs" style={{ lineHeight: 1.5, marginBottom: 2 }}>
          Uang tunai dari kas yang dipindah ke rekening bank. <b style={{ color: "var(--teal)" }}>Bukan biaya</b> — hanya pindah tempat, tidak mengubah laba.
        </div>
        <div className="grid2">
          <label className="fld"><span>Jumlah (Rp)</span>
            <input inputMode="numeric" type="number" min="0" value={f.amount} onChange={(e) => set("amount", Math.max(0, Number(e.target.value)))} autoFocus /></label>
          <label className="fld"><span>Tanggal setor</span>
            <input type="date" value={date} onChange={(e) => e.target.value && set("depositedAt", e.target.value)} /></label>
        </div>
        <label className="fld"><span>Rekening tujuan</span>
          <input list="conflux-akun-bank" value={f.account} onChange={(e) => set("account", e.target.value)} placeholder="cth. BCA 1234567890 a.n. Conflux" />
          <datalist id="conflux-akun-bank">{accounts.map((a) => <option key={a} value={a} />)}</datalist>
          {accounts.length === 0 && <span className="hint">Daftar rekening bisa disiapkan di Pengaturan → Akuntansi agar tidak diketik ulang setiap kali.</span>}
        </label>
        <label className="fld"><span>Catatan (opsional)</span>
          <input value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="cth. setoran hasil 3 hari" /></label>
        {amount > 0 && <div className="muted xs">Akan dicatat: <b style={{ color: "var(--teal)" }}>{rp(amount)}</b> disetor {new Date(date + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</div>}
      </div>
    </Modal>
  );
}

export {
  DepositForm
};
