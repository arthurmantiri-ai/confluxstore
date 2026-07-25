import { useMemo, useState } from "react";
import { ChevronRight, ClipboardList, Clock, Crown, Download, ExternalLink, Filter, Merge, MessageCircle, Pencil, RefreshCcw, Repeat, Search, Send, Trash2, User, UserPlus, Users, Wallet, X } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Modal, Stat } from "../components/ui";
import { cfgCrm } from "../lib/config";
import { PAY_LABEL } from "../lib/constants";
import { custKey, custLabel, custSub, custTitle, isBiz, normPhone, waLink } from "../lib/customers";
import { num, rp } from "../lib/format";
import { buildWaText } from "../lib/waText";

/* ============================ Titip Jual (Konsinyasi) ============================ */

/* ============================ Data Customer (CRM) ============================
   Semua data pelanggan yang terkumpul dari kasir, order online, dan buku hutang
   berkumpul di sini: tabel lengkap + tautan WhatsApp siap-kirim, grafik
   pelanggan kembali (returning), grafik jumlah pelanggan harian, sebaran
   frekuensi belanja, dan peringkat pelanggan terbesar.

   HANYA-BACA terhadap penjualan: layar ini tidak pernah menyentuh stok, kas,
   maupun sales_log. Perubahan hanya pada data pelanggan itu sendiri.          */

const DAY = 86400000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const fmtDay = (t) => (t ? new Date(t).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtDayShort = (t) => (t ? new Date(t).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "—");
const daysAgo = (t) => (t ? Math.floor((Date.now() - t) / DAY) : null);
const agoLabel = (t) => {
  const d = daysAgo(t);
  if (d == null) return "Belum pernah";
  if (d <= 0) return "Hari ini";
  if (d === 1) return "Kemarin";
  if (d < 30) return `${d} hari lalu`;
  if (d < 365) return `${Math.floor(d / 30)} bln lalu`;
  return `${Math.floor(d / 365)} thn lalu`;
};

// Pelanggan dianggap "pasif" bila sudah pernah belanja tapi lama tidak kembali.
// Ambangnya (dan rentang "baru") diatur di Pengaturan → Pelanggan.
const pasifDays = () => cfgCrm().pasifDays;
const newDays = () => cfgCrm().newDays;

// Dijadikan FUNGSI (bukan array tetap) supaya label ikut berubah begitu ambangnya
// diubah dari layar Pengaturan, tanpa perlu muat ulang aplikasi.
const custFilters = () => [
  ["all", "Semua"],
  ["returning", "Pelanggan kembali"],
  ["baru", `Baru (${newDays()} hari)`],
  ["bisnis", "Bisnis"],
  ["individu", "Individu"],
  ["hutang", "Punya hutang"],
  ["pasif", `Pasif >${pasifDays()} hari`],
  ["nophone", "Tanpa no. telp"],
];
const CUST_SORTS = [
  ["spend", "Total belanja"],
  ["txn", "Paling sering"],
  ["recent", "Terakhir belanja"],
  ["name", "Nama A–Z"],
];

// ===== Pesan WhatsApp siap-kirim (tetap bisa diedit sebelum dikirim) =====
const WA_TPL = [
  { key: "sapa", label: "Sapa / terima kasih" },
  { key: "promo", label: "Promo" },
  { key: "stok", label: "List stok & harga" },
  { key: "hutang", label: "Pengingat hutang" },
];

function CustomersView({
  customers = [], visits = [], salesLog = [], debts = [], products = [], store,
  managerMode, pending = 0, onSave, onDelete, onMerge, onRefresh, flash,
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("spend");
  const [detail, setDetail] = useState(null);    // pelanggan yang dibuka rinciannya
  const [editing, setEditing] = useState(null);  // { id|null, name, business, phone, kind, note }
  const [saveErr, setSaveErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [wa, setWa] = useState(null);            // { c, tpl, text }
  const [del, setDel] = useState(null);
  const [mergeFor, setMergeFor] = useState(null);// pelanggan yang akan menyerap duplikat
  const [mergeQ, setMergeQ] = useState("");
  const [exporting, setExporting] = useState(false);

  // ===== Hutang belum lunas dicocokkan ke pelanggan (nomor telp > nama+usaha) =====
  const debtBy = useMemo(() => {
    const m = {};
    (debts || []).filter((d) => d.status === "belum").forEach((d) => {
      const k = custKey({ phone: d.phone, name: d.debtor, business: d.business });
      if (!m[k]) m[k] = { total: 0, list: [] };
      m[k].total += Number(d.total) || 0;
      m[k].list.push({ id: d.id, date: d.date, total: Number(d.total) || 0 });
    });
    return m;
  }, [debts]);
  const unpaidOf = (c) => debtBy[custKey(c)] || null;

  // ===== Kunjungan per pelanggan =====
  const visitsBy = useMemo(() => {
    const m = {};
    (visits || []).forEach((v) => { (m[v.customerId] = m[v.customerId] || []).push(v); });
    Object.values(m).forEach((l) => l.sort((a, b) => (b.at || 0) - (a.at || 0)));
    return m;
  }, [visits]);
  // Kunjungan PERTAMA tiap pelanggan — penentu "baru" vs "kembali" pada grafik
  const firstVisitAt = useMemo(() => {
    const m = {};
    (visits || []).forEach((v) => { if (!m[v.customerId] || v.at < m[v.customerId]) m[v.customerId] = v.at; });
    return m;
  }, [visits]);

  // ===== Ringkasan =====
  const stats = useMemo(() => {
    const total = customers.length;
    const returning = customers.filter((c) => (c.txnCount || 0) >= 2).length;
    const spend = customers.reduce((a, c) => a + (c.totalSpent || 0), 0);
    const txns = customers.reduce((a, c) => a + (c.txnCount || 0), 0);
    const since = Date.now() - 30 * DAY;
    const aktif30 = new Set((visits || []).filter((v) => (v.at || 0) >= since).map((v) => v.customerId)).size;
    const baru30 = customers.filter((c) => (c.firstTxnAt || 0) >= since).length;
    const punyaHutang = customers.filter((c) => unpaidOf(c)).length;
    return {
      total, returning, spend, txns, aktif30, baru30, punyaHutang,
      rate: total ? (returning / total) * 100 : 0,
      avg: total ? spend / total : 0,
      avgTxn: txns ? spend / txns : 0,
    };
  }, [customers, visits, debtBy]);

  // ===== Grafik 1: jumlah pelanggan per hari (30 hari), baru vs kembali =====
  const daily = useMemo(() => {
    const t0 = startOfToday();
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const s = t0 - i * DAY, e = s + DAY;
      const baru = new Set(), lama = new Set();
      (visits || []).forEach((v) => {
        const at = v.at || 0;
        if (at >= s && at < e) ((firstVisitAt[v.customerId] || 0) >= s ? baru : lama).add(v.customerId);
      });
      out.push({ d: fmtDayShort(s), baru: baru.size, lama: lama.size, total: baru.size + lama.size });
    }
    return out;
  }, [visits, firstVisitAt]);
  const dailyTotal = daily.reduce((a, d) => a + d.total, 0);

  // ===== Grafik 2: tren pelanggan kembali per minggu (8 minggu) =====
  const weekly = useMemo(() => {
    const t0 = startOfToday();
    const out = [];
    for (let i = 7; i >= 0; i--) {
      const e = t0 - i * 7 * DAY + DAY, s = e - 7 * DAY;
      const aktif = new Set(), kembali = new Set();
      (visits || []).forEach((v) => {
        const at = v.at || 0;
        if (at >= s && at < e) {
          aktif.add(v.customerId);
          if ((firstVisitAt[v.customerId] || 0) < s) kembali.add(v.customerId);
        }
      });
      out.push({
        d: fmtDayShort(s),
        rate: aktif.size ? Math.round((kembali.size / aktif.size) * 100) : 0,
        aktif: aktif.size,
      });
    }
    return out;
  }, [visits, firstVisitAt]);

  // ===== Grafik 3: sebaran frekuensi belanja =====
  const freq = useMemo(() => {
    const b = [
      { d: "1×", n: 0, note: "sekali saja" },
      { d: "2–3×", n: 0, note: "mulai langganan" },
      { d: "4–9×", n: 0, note: "langganan" },
      { d: "10×+", n: 0, note: "pelanggan setia" },
    ];
    customers.forEach((c) => {
      const t = c.txnCount || 0;
      if (t <= 0) return;
      if (t === 1) b[0].n++;
      else if (t <= 3) b[1].n++;
      else if (t <= 9) b[2].n++;
      else b[3].n++;
    });
    return b;
  }, [customers]);

  // ===== Grafik 4: 10 pelanggan terbesar =====
  const top10 = useMemo(() =>
    [...customers]
      .filter((c) => (c.totalSpent || 0) > 0)
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 10)
      .map((c) => ({ d: custTitle(c).slice(0, 16), v: c.totalSpent || 0, id: c.id })),
    [customers]);

  // ===== Tabel =====
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    const sinceNew = Date.now() - newDays() * DAY;   // rentang "pelanggan baru" dari Pengaturan
    let out = customers.filter((c) => {
      if (term) {
        const hay = `${c.name || ""} ${c.business || ""} ${c.note || ""}`.toLowerCase();
        const ph = String(c.phone || "").replace(/\D/g, "");
        if (!hay.includes(term) && !(digits.length >= 3 && ph.includes(digits))) return false;
      }
      if (filter === "returning") return (c.txnCount || 0) >= 2;
      if (filter === "baru") return (c.firstTxnAt || 0) >= sinceNew;
      if (filter === "bisnis") return isBiz(c);
      if (filter === "individu") return !isBiz(c);
      if (filter === "hutang") return !!unpaidOf(c);
      if (filter === "pasif") return (c.txnCount || 0) >= 1 && c.lastTxnAt && (daysAgo(c.lastTxnAt) || 0) > pasifDays();
      if (filter === "nophone") return !normPhone(c.phone);
      return true;
    });
    out = out.sort((a, b) => {
      if (sort === "txn") return (b.txnCount || 0) - (a.txnCount || 0) || (b.totalSpent || 0) - (a.totalSpent || 0);
      if (sort === "recent") return (b.lastTxnAt || 0) - (a.lastTxnAt || 0);
      if (sort === "name") return String(a.name || "").localeCompare(String(b.name || ""), "id");
      return (b.totalSpent || 0) - (a.totalSpent || 0) || (b.txnCount || 0) - (a.txnCount || 0);
    });
    return out;
  }, [customers, q, filter, sort, debtBy]);

  // ===== Aksi =====
  const openWa = (c, tpl) => {
    if (!normPhone(c.phone)) { flash && flash(`${custTitle(c)} belum punya nomor telepon — lengkapi dulu lewat tombol Ubah.`); return; }
    setWa({ c, tpl, text: buildWaText(tpl, c, { storeName: store?.name, products, unpaid: unpaidOf(c) }) });
  };
  const submitEdit = async () => {
    const p = editing;
    if (!p) return;
    if (!String(p.name || "").trim() && !normPhone(p.phone)) { setSaveErr("Isi nama pelanggan atau nomor teleponnya."); return; }
    setBusy(true); setSaveErr("");
    try {
      const row = await onSave({
        id: p.id || null, name: String(p.name || "").trim(), business: String(p.business || "").trim(),
        phone: String(p.phone || "").trim(), kind: String(p.business || "").trim() ? "bisnis" : (p.kind || "individu"),
        note: String(p.note || "").trim(),
      });
      setEditing(null);
      if (detail && row && detail.id === p.id) setDetail(row);
      flash && flash(p.id ? "Data pelanggan diperbarui" : "Pelanggan baru ditambahkan");
    } catch (e) {
      setSaveErr(e?.message || "Gagal menyimpan — cek koneksi");
    } finally { setBusy(false); }
  };
  const submitDelete = async () => {
    setBusy(true);
    try {
      await onDelete(del.id);
      setDel(null); setDetail(null);
      flash && flash("Data pelanggan dihapus");
    } catch (e) { flash && flash(e?.message || "Gagal menghapus"); }
    finally { setBusy(false); }
  };
  const submitMerge = async (drop) => {
    setBusy(true);
    try {
      const row = await onMerge(mergeFor.id, drop.id);
      setMergeFor(null); setMergeQ("");
      if (row) setDetail(row);
      flash && flash(`${custTitle(drop)} digabung ke ${custTitle(mergeFor)}`);
    } catch (e) { flash && flash(e?.message || "Gagal menggabungkan"); }
    finally { setBusy(false); }
  };

  // ===== Export Excel daftar pelanggan =====
  const exportXlsx = async () => {
    if (!list.length) { flash && flash("Tidak ada pelanggan untuk diexport"); return; }
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "Conflux Coffee Club";
      wb.created = new Date();
      const C = {
        dark: "FF121A16", cream: "FFECE7DA", coral: "FFE2514D", teal: "FF3E7D5A",
        rowA: "FFFFFFFF", rowB: "FFFAF4EA", hair: "FFE7E0D2", ink: "FF24302B",
      };
      const money = '"Rp"#,##0';
      const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
      const ws = wb.addWorksheet("Data Pelanggan", { views: [{ state: "frozen", ySplit: 5 }] });
      const cols = [
        { h: "No", w: 5 }, { h: "Pelanggan", w: 28 }, { h: "Kontak", w: 22 }, { h: "Jenis", w: 11 },
        { h: "No. WhatsApp", w: 18 }, { h: "Transaksi", w: 11 }, { h: "Total belanja", w: 16 },
        { h: "Rata-rata / transaksi", w: 20 }, { h: "Pertama", w: 14 }, { h: "Terakhir", w: 14 },
        { h: "Hutang belum lunas", w: 19 }, { h: "Catatan", w: 30 },
      ];
      ws.columns = cols.map((c) => ({ width: c.w }));
      ws.mergeCells(1, 1, 2, cols.length);
      const b = ws.getCell(1, 1);
      b.value = "CONFLUX COFFEE CLUB — DATA PELANGGAN";
      b.font = { name: "Arial Black", size: 15, color: { argb: C.cream } };
      b.alignment = { vertical: "middle", horizontal: "center" };
      for (let i = 1; i <= cols.length; i++) { ws.getCell(1, i).fill = fill(C.dark); ws.getCell(2, i).fill = fill(C.dark); }
      ws.getRow(1).height = 24; ws.getRow(2).height = 12;
      const sub = ws.getCell(3, 1);
      ws.mergeCells(3, 1, 3, cols.length);
      sub.value = `Dicetak ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} · ${list.length} pelanggan · Saringan: ${(custFilters().find((f) => f[0] === filter) || [])[1] || "Semua"}${q.trim() ? ` · Kata kunci "${q.trim()}"` : ""}`;
      sub.font = { size: 10, italic: true, color: { argb: "FF6B675C" } };
      sub.alignment = { horizontal: "center" };
      ws.getRow(4).height = 6;
      cols.forEach((c, i) => {
        const cell = ws.getCell(5, i + 1);
        cell.value = c.h;
        cell.font = { bold: true, size: 10.5, color: { argb: C.cream } };
        cell.fill = fill(C.ink);
        cell.alignment = { vertical: "middle", horizontal: i === 1 || i === 2 || i === 11 ? "left" : "center", wrapText: true };
      });
      ws.getRow(5).height = 26;
      list.forEach((c, i) => {
        const r = 6 + i;
        const u = unpaidOf(c);
        const vals = [
          i + 1, custTitle(c), custSub(c) || "—", isBiz(c) ? "Bisnis" : "Individu",
          normPhone(c.phone) ? "+" + normPhone(c.phone) : "—",
          c.txnCount || 0, c.totalSpent || 0, (c.txnCount ? (c.totalSpent || 0) / c.txnCount : 0),
          fmtDay(c.firstTxnAt), fmtDay(c.lastTxnAt), u ? u.total : 0, c.note || "",
        ];
        vals.forEach((v, j) => {
          const cell = ws.getCell(r, j + 1);
          cell.value = v;
          cell.font = { size: 10.5, color: { argb: "FF24302B" } };
          cell.fill = fill(i % 2 ? C.rowB : C.rowA);
          cell.alignment = { vertical: "middle", horizontal: j === 1 || j === 2 || j === 11 ? "left" : (j === 0 || j === 3 || j === 4 ? "center" : "right"), wrapText: j === 11 };
          cell.border = { bottom: { style: "thin", color: { argb: C.hair } } };
          if (j === 6 || j === 7 || j === 10) cell.numFmt = money;
          if (j === 10 && v > 0) cell.font = { size: 10.5, bold: true, color: { argb: C.coral } };
          if (j === 5 && Number(v) >= 2) cell.font = { size: 10.5, bold: true, color: { argb: C.teal } };
        });
      });
      const rT = 6 + list.length;
      ws.getCell(rT, 2).value = "TOTAL";
      ws.getCell(rT, 6).value = list.reduce((a, c) => a + (c.txnCount || 0), 0);
      ws.getCell(rT, 7).value = list.reduce((a, c) => a + (c.totalSpent || 0), 0);
      ws.getCell(rT, 11).value = list.reduce((a, c) => a + (unpaidOf(c)?.total || 0), 0);
      for (let i = 1; i <= cols.length; i++) {
        const cell = ws.getCell(rT, i);
        cell.fill = fill(C.ink);
        cell.font = { bold: true, size: 11, color: { argb: C.cream } };
        cell.alignment = { horizontal: i === 2 ? "left" : "right" };
        if (i === 7 || i === 11) cell.numFmt = money;
      }
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const now = new Date();
      const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const a = document.createElement("a");
      a.href = url; a.download = `Data-Pelanggan-Conflux-${iso}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      flash && flash(`Data ${list.length} pelanggan diunduh`);
    } catch (e) {
      console.error(e);
      flash && flash("Gagal membuat Excel — coba lagi");
    } finally { setExporting(false); }
  };

  const tipAxis = { tickLine: false, axisLine: false, tick: { fill: "#6F8077", fontSize: 11 } };
  const tipStyle = {
    contentStyle: { borderRadius: 12, border: "1px solid #2C3A33", background: "#1B2521", color: "#ECE7DA", fontFamily: "Inter", fontSize: 13 },
    labelStyle: { color: "#9DAEA3" }, itemStyle: { color: "#ECE7DA" },
  };

  return (
    <div className="stack">
      <div className="grid-4">
        <Stat icon={Users} accent label="Total pelanggan" value={num(stats.total)}
          sub={`${num(stats.baru30)} baru dalam 30 hari`} />
        <Stat icon={Repeat} label="Pelanggan kembali" value={`${stats.rate.toFixed(0)}%`}
          sub={`${num(stats.returning)} dari ${num(stats.total)} pernah belanja ≥2×`} />
        <Stat icon={Wallet} label="Rata-rata belanja" value={rp(stats.avg)}
          sub={`${rp(stats.avgTxn)} per transaksi`} />
        <Stat icon={ClipboardList} label="Punya hutang" value={num(stats.punyaHutang)}
          sub={`${num(stats.aktif30)} pelanggan aktif 30 hari`} />
      </div>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head">
            <h2>Pelanggan per hari (30 hari)</h2>
            <div className="trend-legend">
              <span><i style={{ background: "#E2514D" }} /> Baru</span>
              <span><i style={{ background: "#6FAE92" }} /> Kembali</span>
            </div>
          </div>
          <div className="chart-wrap">
            {dailyTotal === 0 && <div className="chart-empty">Belum ada transaksi dengan data pelanggan. Grafik terisi otomatis begitu kasir mulai mencatat pelanggan.</div>}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#2C3A33" vertical={false} />
                <XAxis dataKey="d" interval={4} {...tipAxis} />
                <YAxis allowDecimals={false} width={34} {...tipAxis} />
                <Tooltip {...tipStyle} formatter={(v, n) => [`${num(v)} orang`, n === "baru" ? "Baru" : "Kembali"]} />
                <Bar dataKey="lama" stackId="a" fill="#6FAE92" radius={[0, 0, 0, 0]} />
                <Bar dataKey="baru" stackId="a" fill="#E2514D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Frekuensi belanja</h2><span className="muted xs">jumlah pelanggan</span></div>
          <div className="chart-wrap">
            {stats.total === 0 && <div className="chart-empty">Belum ada data pelanggan.</div>}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={freq} layout="vertical" margin={{ top: 4, right: 22, left: 6, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="d" width={52} {...tipAxis} />
                <Tooltip {...tipStyle} formatter={(v, n, p) => [`${num(v)} pelanggan`, p?.payload?.note || ""]} />
                <Bar dataKey="n" radius={[0, 8, 8, 0]} barSize={22}>
                  {freq.map((f, i) => <Cell key={i} fill={["#6F8077", "#E0A53C", "#6FAE92", "#E2514D"][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head">
            <h2>Tren pelanggan kembali (8 minggu)</h2>
            <span className="muted xs">% pelanggan aktif yang bukan pembeli pertama kali</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weekly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gcust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6FAE92" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#6FAE92" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#2C3A33" vertical={false} />
                <XAxis dataKey="d" {...tipAxis} />
                <YAxis domain={[0, 100]} width={38} tickFormatter={(v) => `${v}%`} {...tipAxis} />
                <Tooltip {...tipStyle} formatter={(v, n, p) => [`${v}% kembali · ${num(p?.payload?.aktif || 0)} pelanggan aktif`, "Minggu ini"]} />
                <Area type="monotone" dataKey="rate" stroke="#6FAE92" strokeWidth={2.4} fill="url(#gcust)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>10 pelanggan terbesar</h2><Crown size={16} className="muted" /></div>
          <div className="chart-wrap">
            {top10.length === 0 && <div className="chart-empty">Belum ada belanja tercatat.</div>}
            <ResponsiveContainer width="100%" height={Math.max(200, top10.length * 30)}>
              <BarChart data={top10} layout="vertical" margin={{ top: 4, right: 20, left: 6, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="d" width={104} {...tipAxis} />
                <Tooltip {...tipStyle} formatter={(v) => rp(v)} />
                <Bar dataKey="v" radius={[0, 8, 8, 0]} barSize={16}>
                  {top10.map((e, i) => <Cell key={i} fill={i === 0 ? "#E0A53C" : "#E2514D"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Daftar pelanggan</h2>
          <div className="cust-actions">
            {pending > 0 && <span className="cust-pending" title="Menunggu terkirim ke server">{num(pending)} menunggu sinkron</span>}
            <button className="btn ghost sm" onClick={() => onRefresh && onRefresh()}><RefreshCcw size={14} /> Segarkan</button>
            <button className="btn ghost sm" disabled={exporting} onClick={exportXlsx}>
              <Download size={14} /> {exporting ? "Menyiapkan…" : "Export Excel"}
            </button>
            <button className="btn sm" onClick={() => { setEditing({ id: null, name: "", business: "", phone: "", kind: "individu", note: "" }); setSaveErr(""); }}>
              <UserPlus size={14} /> Tambah pelanggan
            </button>
          </div>
        </div>

        <div className="cust-toolbar">
          <div className="search">
            <Search size={17} />
            <input placeholder="Cari nama, usaha, atau nomor telepon…" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="icon-btn xs" onClick={() => setQ("")}><X size={14} /></button>}
          </div>
          <div className="chips">
            {custFilters().map(([k, label]) => (
              <button key={k} className={`chip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>{label}</button>
            ))}
          </div>
          <div className="cust-sort">
            <Filter size={14} className="muted" />
            <select className="sim-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {CUST_SORTS.map(([k, label]) => <option key={k} value={k}>Urut: {label}</option>)}
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="empty">
            {customers.length === 0
              ? "Belum ada data pelanggan. Data terisi otomatis setiap kasir mencatat pelanggan saat transaksi."
              : "Tidak ada pelanggan yang cocok dengan pencarian/saringan ini."}
          </div>
        ) : (
          <div className="cust-table-wrap">
            <table className="tbl cust-tbl">
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th>Jenis</th>
                  <th>WhatsApp</th>
                  <th className="r">Transaksi</th>
                  <th className="r">Total belanja</th>
                  <th className="r">Rata-rata</th>
                  <th>Terakhir</th>
                  <th className="r">Hutang</th>
                  <th className="r">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const u = unpaidOf(c);
                  const t = c.txnCount || 0;
                  const ph = normPhone(c.phone);
                  const pasif = t >= 1 && c.lastTxnAt && (daysAgo(c.lastTxnAt) || 0) > pasifDays();
                  return (
                    <tr key={c.id}>
                      <td>
                        <button className="cust-name-btn" onClick={() => setDetail(c)}>
                          <div className="cust-ava sm">{custTitle(c).charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="cust-name">{custTitle(c)}</div>
                            {custSub(c) && <div className="muted xs">Kontak: {custSub(c)}</div>}
                          </div>
                        </button>
                      </td>
                      <td>
                        <span className={`cust-tag ${isBiz(c) ? "biz" : ""}`}>{isBiz(c) ? "Bisnis" : "Individu"}</span>
                        {t >= 2 && <span className="cust-tag ret"><Repeat size={10} /> Kembali</span>}
                        {pasif && <span className="cust-tag pasif">Pasif</span>}
                      </td>
                      <td>
                        {ph
                          ? <a className="wa-link" href={waLink(c.phone, buildWaText("sapa", c, { storeName: store?.name, products, unpaid: u }))} target="_blank" rel="noreferrer">
                              <MessageCircle size={13} /> {c.phone}
                            </a>
                          : <span className="muted xs">belum ada</span>}
                      </td>
                      <td className="r tab">{num(t)}</td>
                      <td className="r tab strong">{rp(c.totalSpent || 0)}</td>
                      <td className="r tab muted">{rp(t ? (c.totalSpent || 0) / t : 0)}</td>
                      <td>
                        <div>{agoLabel(c.lastTxnAt)}</div>
                        <div className="muted xs">{fmtDay(c.lastTxnAt)}</div>
                      </td>
                      <td className="r tab">{u ? <span className="cust-debt">{rp(u.total)}</span> : <span className="muted">—</span>}</td>
                      <td className="r">
                        <div className="row-actions">
                          {ph && (
                            <>
                              <button className="icon-btn xs" title="Kirim promo lewat WhatsApp" onClick={() => openWa(c, "promo")}><Send size={14} /></button>
                              {u && <button className="icon-btn xs warn" title="Ingatkan hutang lewat WhatsApp" onClick={() => openWa(c, "hutang")}><Clock size={14} /></button>}
                            </>
                          )}
                          <button className="icon-btn xs" title="Rincian pelanggan" onClick={() => setDetail(c)}><ChevronRight size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>{num(list.length)} pelanggan ditampilkan</td>
                  <td className="r tab">{num(list.reduce((a, c) => a + (c.txnCount || 0), 0))}</td>
                  <td className="r tab">{rp(list.reduce((a, c) => a + (c.totalSpent || 0), 0))}</td>
                  <td />
                  <td />
                  <td className="r tab">{rp(list.reduce((a, c) => a + (unpaidOf(c)?.total || 0), 0))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ===================== Rincian pelanggan ===================== */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        width={620}
        title={detail ? custLabel(detail) : ""}
        footer={detail && (
          <>
            {managerMode && <button className="btn ghost danger" onClick={() => setDel(detail)}><Trash2 size={15} /> Hapus</button>}
            {managerMode && <button className="btn ghost" onClick={() => { setMergeFor(detail); setMergeQ(""); }}><Merge size={15} /> Gabungkan duplikat</button>}
            <button className="btn ghost" onClick={() => { setEditing({ ...detail }); setSaveErr(""); }}><Pencil size={15} /> Ubah data</button>
            <button className="btn" onClick={() => setDetail(null)}>Tutup</button>
          </>
        )}
      >
        {detail && (() => {
          const u = unpaidOf(detail);
          const vs = visitsBy[detail.id] || [];
          const byTxn = {};
          (salesLog || []).forEach((s) => { if (s.txnId) (byTxn[s.txnId] = byTxn[s.txnId] || []).push(s); });
          const ph = normPhone(detail.phone);
          return (
            <div className="stack-sm">
              <div className="cust-detail-head">
                <div className="cust-ava big">{custTitle(detail).charAt(0).toUpperCase()}</div>
                <div>
                  <div className="cust-detail-name">{custTitle(detail)}</div>
                  <div className="muted xs">
                    {isBiz(detail) ? `Bisnis${custSub(detail) ? ` · kontak ${custSub(detail)}` : ""}` : "Individu"}
                    {detail.phone ? ` · ${detail.phone}` : " · belum ada nomor telepon"}
                  </div>
                  {detail.note && <div className="muted xs cust-note">{detail.note}</div>}
                </div>
              </div>

              <div className="cust-detail-stats">
                <div><span className="muted xs">Transaksi</span><b className="tab">{num(detail.txnCount || 0)}×</b></div>
                <div><span className="muted xs">Total belanja</span><b className="tab">{rp(detail.totalSpent || 0)}</b></div>
                <div><span className="muted xs">Rata-rata</span><b className="tab">{rp(detail.txnCount ? (detail.totalSpent || 0) / detail.txnCount : 0)}</b></div>
                <div><span className="muted xs">Pertama</span><b>{fmtDay(detail.firstTxnAt)}</b></div>
                <div><span className="muted xs">Terakhir</span><b>{fmtDay(detail.lastTxnAt)}</b></div>
                <div><span className="muted xs">Status</span><b>{(detail.txnCount || 0) >= 2 ? "Pelanggan kembali" : "Pelanggan baru"}</b></div>
              </div>

              {ph && (
                <div className="cust-wa-row">
                  {WA_TPL.filter((t) => t.key !== "hutang" || u).map((t) => (
                    <button key={t.key} className="btn ghost sm" onClick={() => openWa(detail, t.key)}>
                      <MessageCircle size={13} /> {t.label}
                    </button>
                  ))}
                </div>
              )}

              {u && (
                <div className="cust-debt-box">
                  <div className="cust-debt-head"><ClipboardList size={14} /> Belum lunas — {rp(u.total)}</div>
                  {u.list.map((d) => (
                    <div key={d.id} className="cust-debt-row"><span>{d.id} · {d.date}</span><span className="tab">{rp(d.total)}</span></div>
                  ))}
                </div>
              )}

              <div className="cust-hist">
                <div className="cust-hist-head">Riwayat belanja {vs.length > 0 && <span className="muted xs">{num(vs.length)} transaksi tercatat</span>}</div>
                {vs.length === 0 && <div className="empty">Belum ada transaksi tercatat untuk pelanggan ini.</div>}
                {vs.slice(0, 20).map((v) => {
                  const items = byTxn[v.txnId] || [];
                  return (
                    <div key={v.txnId} className="cust-hist-row">
                      <div>
                        <div className="strong">{fmtDay(v.at)}</div>
                        <div className="muted xs">
                          {PAY_LABEL[v.method] || v.method || "—"}{v.cashier ? ` · ${v.cashier}` : ""}
                          {items.length > 0 && ` · ${items.map((i) => `${i.qtyLabel || num(i.qty)}`).join(", ")}`}
                        </div>
                        {v.pickedBy && <div className="cust-picked"><User size={11} /> Diambil oleh {v.pickedBy}</div>}
                      </div>
                      <div className="tab strong">{rp(v.amount)}</div>
                    </div>
                  );
                })}
                {vs.length > 20 && <div className="muted xs center">…dan {num(vs.length - 20)} transaksi lainnya</div>}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ===================== Tambah / ubah pelanggan ===================== */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        width={460}
        title={editing?.id ? "Ubah data pelanggan" : "Tambah pelanggan"}
        footer={
          <>
            <button className="btn ghost" onClick={() => setEditing(null)}>Batal</button>
            <button className="btn" disabled={busy} onClick={submitEdit}>{busy ? "Menyimpan…" : "Simpan"}</button>
          </>
        }
      >
        {editing && (
          <div className="form">
            <div className="cust-kind">
              {[["individu", "Individu"], ["bisnis", "Bisnis"]].map(([k, label]) => (
                <button key={k} type="button"
                  className={`cust-kind-btn ${(editing.business ? "bisnis" : editing.kind) === k ? "on" : ""}`}
                  onClick={() => setEditing((e) => ({ ...e, kind: k }))}>{label}</button>
              ))}
            </div>
            <label className="fld"><span>Nama pelanggan</span>
              <input autoFocus value={editing.name} placeholder="cth. Ibu Meilani"
                onChange={(e) => setEditing((x) => ({ ...x, name: e.target.value }))} /></label>
            <label className="fld"><span>Nama usaha / warung (opsional)</span>
              <input value={editing.business} placeholder="cth. Warung Kopi Sejahtera"
                onChange={(e) => setEditing((x) => ({ ...x, business: e.target.value }))} /></label>
            <label className="fld"><span>No. WhatsApp</span>
              <input inputMode="tel" value={editing.phone} placeholder="cth. 0812xxxxxxx"
                onChange={(e) => setEditing((x) => ({ ...x, phone: e.target.value }))} /></label>
            <label className="fld"><span>Catatan (opsional)</span>
              <input value={editing.note} placeholder="cth. Ambil sendiri tiap Sabtu"
                onChange={(e) => setEditing((x) => ({ ...x, note: e.target.value }))} /></label>
            <div className="muted xs">
              Untuk pelanggan <b>bisnis</b>, nama usaha adalah identitasnya: satu warung/cafe tetap
              satu baris walau yang datang mengambil orang yang berbeda-beda. Nama di atas dipakai
              sebagai kontak utama. Untuk pelanggan <b>perorangan</b>, nomor telepon yang jadi patokan
              supaya tidak ada data ganda.
            </div>
            {saveErr && <div className="pin-err">{saveErr}</div>}
          </div>
        )}
      </Modal>

      {/* ===================== Kirim WhatsApp ===================== */}
      <Modal
        open={!!wa}
        onClose={() => setWa(null)}
        width={520}
        title={wa ? `Kirim WhatsApp ke ${custTitle(wa.c)}` : ""}
        footer={wa && (
          <>
            <button className="btn ghost" onClick={() => setWa(null)}>Batal</button>
            <a className="btn" href={waLink(wa.c.phone, wa.text)} target="_blank" rel="noreferrer" onClick={() => setWa(null)}>
              <ExternalLink size={15} /> Buka WhatsApp
            </a>
          </>
        )}
      >
        {wa && (
          <div className="stack-sm">
            <div className="cust-wa-row">
              {WA_TPL.filter((t) => t.key !== "hutang" || unpaidOf(wa.c)).map((t) => (
                <button key={t.key} className={`chip ${wa.tpl === t.key ? "on" : ""}`}
                  onClick={() => setWa((w) => ({ ...w, tpl: t.key, text: buildWaText(t.key, w.c, { storeName: store?.name, products, unpaid: unpaidOf(w.c) }) }))}>
                  {t.label}
                </button>
              ))}
            </div>
            <textarea className="wa-textarea" rows={12} value={wa.text}
              onChange={(e) => setWa((w) => ({ ...w, text: e.target.value }))} />
            <div className="muted xs">
              Pesan bisa diedit dulu sebelum dikirim. Tombol di bawah membuka WhatsApp ke nomor <b>{wa.c.phone}</b> dengan pesan ini sudah terisi.
            </div>
          </div>
        )}
      </Modal>

      {/* ===================== Gabungkan duplikat ===================== */}
      <Modal
        open={!!mergeFor}
        onClose={() => { setMergeFor(null); setMergeQ(""); }}
        width={520}
        title={mergeFor ? `Gabungkan ke ${custTitle(mergeFor)}` : ""}
        footer={<button className="btn ghost" onClick={() => { setMergeFor(null); setMergeQ(""); }}>Tutup</button>}
      >
        {mergeFor && (
          <div className="stack-sm">
            <div className="pay-note warn">
              Pilih data pelanggan yang sebenarnya <b>orang yang sama</b>. Seluruh riwayat belanjanya
              akan dipindahkan ke <b>{custTitle(mergeFor)}</b>, lalu data ganda dihapus. Tindakan ini permanen.
            </div>
            <div className="search sm">
              <Search size={15} />
              <input autoFocus placeholder="Cari data pelanggan yang mau digabung…" value={mergeQ} onChange={(e) => setMergeQ(e.target.value)} />
            </div>
            <div className="cust-hits">
              {customers
                .filter((c) => c.id !== mergeFor.id)
                .filter((c) => {
                  const t = mergeQ.trim().toLowerCase();
                  if (!t) return true;
                  return `${c.name || ""} ${c.business || ""} ${c.phone || ""}`.toLowerCase().includes(t);
                })
                .slice(0, 8)
                .map((c) => (
                  <button key={c.id} className="cust-hit" disabled={busy} onClick={() => submitMerge(c)}>
                    <div className="cust-ava sm">{custTitle(c).charAt(0).toUpperCase()}</div>
                    <div className="cust-hit-info">
                      <div className="cust-hit-name">{custTitle(c)}</div>
                      <div className="muted xs">{custSub(c) || (isBiz(c) ? "Bisnis" : "Individu")}{c.phone ? ` · ${c.phone}` : ""} · {num(c.txnCount || 0)}× · {rp(c.totalSpent || 0)}</div>
                    </div>
                    <Merge size={14} className="muted" />
                  </button>
                ))}
            </div>
          </div>
        )}
      </Modal>

      {/* ===================== Hapus pelanggan ===================== */}
      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        width={420}
        title="Hapus data pelanggan?"
        footer={
          <>
            <button className="btn ghost" onClick={() => setDel(null)}>Batal</button>
            <button className="btn danger" disabled={busy} onClick={submitDelete}>{busy ? "Menghapus…" : "Hapus"}</button>
          </>
        }
      >
        {del && (
          <p className="confirm-text">
            Data pelanggan <b>{custLabel(del)}</b> beserta riwayat kunjungannya akan dihapus permanen.
            Transaksi penjualannya sendiri <b>tidak</b> ikut terhapus — hanya keterangan pelanggannya yang hilang.
          </p>
        )}
      </Modal>
    </div>
  );
}

export {
  CUST_SORTS,
  CustomersView,
  DAY,
  WA_TPL,
  agoLabel,
  custFilters,
  daysAgo,
  fmtDay,
  fmtDayShort,
  newDays,
  pasifDays,
  startOfToday
};
