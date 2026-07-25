import { useEffect, useState } from "react";
import { ArrowUpRight, Boxes, Calendar, Coins, Download, Hammer, Handshake, Landmark, Package, Pencil, Plus, RefreshCcw, Trash2, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Products, Sales } from "../db";
import { hasSupabase } from "../supabaseClient";
import { LOGO } from "../assets/logo";
import { Modal, Stat } from "../components/ui";
import { num, periodLabel, prevPeriod, rp, thisPeriod } from "../lib/format";
import { DepositForm } from "./DepositForm";
import { EntryForm } from "./EntryForm";

/* ============================ Akuntansi (khusus manajer) ============================ */

function Accounting({ products, capital, expenses, salesLog, consigns = [], consignPayments = [], cashDeposits = [], flash, onAddCapital, onUpdateCapital, onDeleteCapital, onAddExpense, onUpdateExpense, onDeleteExpense, onAddDeposit, onUpdateDeposit, onDeleteDeposit }) {
  const [form, setForm] = useState(null); // { kind:'capital'|'expense', entry }
  const [depForm, setDepForm] = useState(null); // { entry } untuk setoran kas -> rekening
  const [del, setDel] = useState(null);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const isAll = month === "all"; // periode "Semua waktu" (all time)
  const [exporting, setExporting] = useState(false);

  const totalModal = capital.reduce((a, c) => a + c.amount, 0);

  // Agregat penjualan untuk periode terpilih (dihitung di server agar akurat & ringan)
  const [tot, setTot] = useState({ revenue: 0, cost: 0, qty: 0 });
  const [byProd, setByProd] = useState([]);
  const [loadingAcc, setLoadingAcc] = useState(hasSupabase);

  useEffect(() => {
    let fromISO, toISO;
    if (isAll) {
      // Semua waktu: pakai rentang sangat lebar agar seluruh riwayat terhitung
      fromISO = new Date(2000, 0, 1).toISOString();
      toISO = new Date(Date.now() + 86400000).toISOString();
    } else {
      const [yy, mm] = month.split("-").map(Number);
      fromISO = new Date(yy, mm - 1, 1).toISOString();
      toISO = new Date(yy, mm, 1).toISOString();
    }
    if (!hasSupabase) {
      const a = salesLog.reduce((x, s) => ({ revenue: x.revenue + s.revenue, cost: x.cost + s.cost, qty: x.qty + s.qty }), { revenue: 0, cost: 0, qty: 0 });
      const m = {};
      salesLog.forEach((s) => { if (!m[s.productId]) m[s.productId] = { productId: s.productId, qty: 0, revenue: 0, cost: 0 }; m[s.productId].qty += s.qty; m[s.productId].revenue += s.revenue; m[s.productId].cost += s.cost; });
      setTot(a); setByProd(Object.values(m)); setLoadingAcc(false);
      return;
    }
    let alive = true; setLoadingAcc(true);
    Promise.all([Sales.agg(fromISO, toISO), Sales.byProduct(fromISO, toISO)])
      .then(([a, bp]) => { if (!alive) return; setTot(a); setByProd(bp); })
      .catch((e) => { console.error("[acc]", e); flash && flash("Gagal memuat ringkasan akuntansi"); })
      .finally(() => { if (alive) setLoadingAcc(false); });
    return () => { alive = false; };
  }, [month, salesLog]);

  const revenue = tot.revenue;
  const cogs = tot.cost;
  const gross = revenue - cogs;

  // Biaya operasional periode terpilih + bulan sebelumnya (deteksi kebocoran)
  const prev = isAll ? null : prevPeriod(month);
  const monthExpenses = isAll ? expenses : expenses.filter((e) => (e.period || "") === month);
  const prevExpenses = isAll ? [] : expenses.filter((e) => (e.period || "") === prev);
  const opex = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const prevOpex = prevExpenses.reduce((a, e) => a + e.amount, 0);
  const net = gross - opex;
  // Setoran kas -> rekening (periode terpilih). PINDAH ASET, tidak memengaruhi laba.
  const depPeriod = (d) => d.period || String(d.depositedAt || "").slice(0, 7);
  const monthDeposits = (isAll ? cashDeposits : cashDeposits.filter((d) => depPeriod(d) === month))
    .slice().sort((a, b) => String(b.depositedAt || "").localeCompare(String(a.depositedAt || "")));
  const depositTotal = monthDeposits.reduce((a, d) => a + (d.amount || 0), 0);
  const lastAccount = (cashDeposits.find((d) => d.account) || {}).account || "";
  const fmtDepDate = (s) => (s ? new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—");
  // Nilai stok kini (MILIK TOKO, tanpa titipan): dari harga batch FIFO (server);
  // fallback stok × modal terbaru
  const [invValue, setInvValue] = useState(() => products.reduce((a, p) => a + (p.isConsign ? 0 : p.cost * p.stock), 0));
  useEffect(() => {
    const local = products.reduce((a, p) => a + (p.isConsign ? 0 : p.cost * p.stock), 0);
    setInvValue(local);
    if (!hasSupabase) return;
    let alive = true;
    Products.inventoryValue().then((v) => { if (alive) setInvValue(v); }).catch(() => {});
    return () => { alive = false; };
  }, [products]);

  // ===== Titip jual (konsinyasi) =====
  const hasConsign = consigns.length > 0 || products.some((p) => p.isConsign);
  const consignOwed = consigns.filter((c) => c.status === "belum").reduce((a, c) => a + (c.amount - (c.paidAmount || 0)), 0);
  const [consignValue, setConsignValue] = useState(0);
  useEffect(() => {
    const local = products.reduce((a, p) => a + (p.isConsign ? (p.cost || 0) * (p.stock || 0) : 0), 0);
    setConsignValue(local);
    if (!hasSupabase) return;
    let alive = true;
    Products.inventoryValueConsign().then((v) => { if (alive) setConsignValue(v); }).catch(() => {});
    return () => { alive = false; };
  }, [products]);
  const grossMargin = revenue > 0 ? Math.round((gross / revenue) * 100) : 0;
  const paybackMonths = !isAll && net > 0 ? Math.ceil(totalModal / net) : null; // estimasi memakai laba per bulan
  const roiBulan = totalModal > 0 ? (net / totalModal) * 100 : 0;

  // opex per kategori (bulan terpilih)
  const opexCat = {};
  monthExpenses.forEach((e) => { opexCat[e.category] = (opexCat[e.category] || 0) + e.amount; });
  const prevOpexCat = {};
  prevExpenses.forEach((e) => { prevOpexCat[e.category] = (prevOpexCat[e.category] || 0) + e.amount; });
  // perbandingan per kategori: bulan lalu vs bulan ini
  const catCompare = [...new Set([...Object.keys(opexCat), ...Object.keys(prevOpexCat)])]
    .map((cat) => { const now = opexCat[cat] || 0; const was = prevOpexCat[cat] || 0; return { cat, now, was, delta: now - was, pct: was > 0 ? Math.round(((now - was) / was) * 100) : (now > 0 ? 100 : 0) }; })
    .sort((a, b) => b.delta - a.delta);

  // rasio biaya terhadap pendapatan (efisiensi) — naik = perlu dicek
  const opexRatio = revenue > 0 ? Math.round((opex / revenue) * 100) : 0;

  const copyLastMonth = () => {
    if (isAll) return;
    const have = new Set(monthExpenses.map((e) => (e.name + "|" + e.category).toLowerCase()));
    const src = prevExpenses.filter((e) => !have.has((e.name + "|" + e.category).toLowerCase()));
    if (src.length === 0) { flash && flash(`Tidak ada biaya baru untuk disalin dari ${periodLabel(prev)}`); return; }
    src.forEach((e) => onAddExpense({ name: e.name, amount: e.amount, category: e.category, period: month, date: periodLabel(month), items: e.items || [] }));
    flash && flash(`${src.length} biaya disalin dari ${periodLabel(prev)} — silakan sesuaikan nilainya`);
  };

  // Tren 6 bulan (pendapatan, biaya, laba bersih)
  const [trend, setTrend] = useState([]);
  useEffect(() => {
    const base = new Date();
    const periods = [];
    for (let i = 5; i >= 0; i--) { const d = new Date(base.getFullYear(), base.getMonth() - i, 1); periods.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); }
    const opexByP = {};
    expenses.forEach((e) => { if (e.period) opexByP[e.period] = (opexByP[e.period] || 0) + e.amount; });
    const build = (sm) => periods.map((p) => { const s = sm[p] || { revenue: 0, cost: 0 }; const op = opexByP[p] || 0; const rev = Number(s.revenue || 0), cost = Number(s.cost || 0); return { period: p, label: periodLabel(p), pendapatan: rev, biaya: op, laba: rev - cost - op }; });
    if (!hasSupabase) {
      const sm = {};
      salesLog.forEach((s) => { if (s.ts) { const k = new Date(s.ts).toISOString().slice(0, 7); if (!sm[k]) sm[k] = { revenue: 0, cost: 0 }; sm[k].revenue += s.revenue; sm[k].cost += s.cost; } });
      setTrend(build(sm)); return;
    }
    let alive = true;
    const fromISO = new Date(base.getFullYear(), base.getMonth() - 5, 1).toISOString();
    Sales.monthly(fromISO).then((rows) => { if (!alive) return; setTrend(build(Object.fromEntries(rows.map((r) => [r.period, r])))); }).catch((e) => console.error("[trend]", e));
    return () => { alive = false; };
  }, [salesLog, expenses]);

  // analisa per barang (dari agregat server)
  const items = byProd.map((v) => {
    const p = products.find((x) => x.id === v.productId);
    const profit = v.revenue - v.cost;
    return { pid: v.productId, name: p?.name || "—", sku: p?.sku || "", unit: p?.unit || "", qty: v.qty, revenue: v.revenue, cost: v.cost, profit, margin: v.revenue > 0 ? Math.round((profit / v.revenue) * 100) : 0 };
  }).sort((a, b) => b.profit - a.profit);
  const topChart = items.slice(0, 7).map((i) => ({ name: i.sku || i.name.slice(0, 10), profit: i.profit }));

  const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const monthLabel = (ym) => { if (ym === "all") return "Semua Waktu"; const [y, m] = ym.split("-").map(Number); return `${MONTHS_ID[(m || 1) - 1]} ${y}`; };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "Conflux Coffee Club";
      wb.created = new Date();
      const period = monthLabel(month);
      const money = '"Rp"#,##0';
      const C = { dark: "FF121A16", surface: "FF1B2521", cream: "FFECE7DA", coral: "FFE2514D", teal: "FF6FAE92", line: "FF2C3A33", ok: "FF3E7D5A", rowA: "FFFFFFFF", rowB: "FFFAF4EA", ink: "FF24302B", hairline: "FFE7E0D2" };
      let imgId = null;
      try { imgId = wb.addImage({ base64: LOGO.split(",")[1], extension: "jpeg" }); } catch (e) {}

      const fill = (argb) => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

      // banner di atas tiap sheet; mengembalikan baris awal konten
      const banner = (ws, subtitle) => {
        ws.views = [{ showGridLines: false }];
        ws.mergeCells("A1:F2");
        const t = ws.getCell("A1");
        t.value = { richText: [
          { text: "CONFLUX ", font: { bold: true, size: 18, color: { argb: C.coral }, name: "Arial" } },
          { text: "COFFEE CLUB", font: { bold: true, size: 18, color: { argb: C.cream }, name: "Arial" } },
        ] };
        t.alignment = { vertical: "middle", horizontal: "left", indent: imgId != null ? 6 : 1 };
        ws.mergeCells("A3:F3");
        const s = ws.getCell("A3");
        s.value = `${subtitle}  ·  Periode: ${period}`;
        s.font = { italic: true, size: 11, color: { argb: C.cream }, name: "Arial" };
        s.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        for (let r = 1; r <= 2; r++) for (let c = 1; c <= 6; c++) ws.getCell(r, c).fill = fill(C.dark);
        for (let c = 1; c <= 6; c++) ws.getCell(3, c).fill = fill(C.surface);
        ws.getRow(1).height = 20; ws.getRow(2).height = 20; ws.getRow(3).height = 18;
        if (imgId != null) ws.addImage(imgId, { tl: { col: 0.15, row: 0.2 }, ext: { width: 46, height: 46 } });
        return 5;
      };
      const sectionTitle = (ws, row, text) => {
        ws.mergeCells(row, 1, row, 6);
        const c = ws.getCell(row, 1);
        c.value = text; c.fill = fill(C.teal);
        c.font = { bold: true, size: 12, color: { argb: C.dark }, name: "Arial" };
        c.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        ws.getRow(row).height = 22;
      };
      const headRow = (ws, row, cols) => {
        cols.forEach((cc, i) => {
          const c = ws.getCell(row, i + 1);
          c.value = cc.h;
          c.fill = fill(C.surface);
          c.font = { bold: true, size: 11, color: { argb: C.cream }, name: "Arial" };
          c.alignment = { vertical: "middle", horizontal: cc.a || "left" };
          c.border = { bottom: { style: "thin", color: { argb: C.coral } } };
        });
        ws.getRow(row).height = 20;
      };
      const dataRow = (ws, row, cols, idx) => {
        cols.forEach((cc, i) => {
          const c = ws.getCell(row, i + 1);
          c.value = cc.v;
          c.fill = fill(idx % 2 ? C.rowB : C.rowA);
          c.font = { size: 11, color: { argb: C.ink }, name: "Arial", bold: !!cc.b };
          c.alignment = { vertical: "middle", horizontal: cc.a || "left" };
          if (cc.fmt) c.numFmt = cc.fmt;
          c.border = { bottom: { style: "hair", color: { argb: C.hairline } } };
        });
      };
      const totalRow = (ws, row, label, value, span, argb) => {
        ws.mergeCells(row, 1, row, span);
        const l = ws.getCell(row, 1);
        l.value = label; l.fill = fill(argb || C.coral);
        l.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Arial" };
        l.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        const v = ws.getCell(row, span + 1);
        v.value = value; v.fill = fill(argb || C.coral); v.numFmt = money;
        v.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" }, name: "Arial" };
        v.alignment = { vertical: "middle", horizontal: "right" };
        ws.getRow(row).height = 22;
      };

      // ---------- Sheet 1: Ringkasan / Laba Rugi ----------
      const s1 = wb.addWorksheet("Ringkasan");
      s1.columns = [{ width: 36 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }];
      let r = banner(s1, "Laporan Akuntansi");
      sectionTitle(s1, r, "LAPORAN LABA RUGI"); r++;
      headRow(s1, r, [{ h: "Keterangan" }, { h: "Nilai", a: "right" }]); r++;
      let i = 0;
      dataRow(s1, r++, [{ v: "Pendapatan penjualan" }, { v: revenue, a: "right", fmt: money }], i++);
      dataRow(s1, r++, [{ v: "HPP (modal barang terjual)" }, { v: -cogs, a: "right", fmt: money }], i++);
      dataRow(s1, r++, [{ v: "Laba kotor", b: true }, { v: gross, a: "right", fmt: money, b: true }], i++);
      Object.entries(opexCat).forEach(([cat, amt]) => dataRow(s1, r++, [{ v: "Biaya — " + cat }, { v: -amt, a: "right", fmt: money }], i++));
      dataRow(s1, r++, [{ v: "Total biaya operasional", b: true }, { v: -opex, a: "right", fmt: money, b: true }], i++);
      totalRow(s1, r++, net >= 0 ? "LABA BERSIH (untung)" : "LABA BERSIH (rugi)", net, 1, net >= 0 ? C.ok : C.coral);
      r++;
      sectionTitle(s1, r, "RINGKASAN MODAL & BALIK MODAL"); r++;
      headRow(s1, r, [{ h: "Keterangan" }, { h: "Nilai", a: "right" }]); r++;
      i = 0;
      dataRow(s1, r++, [{ v: "Total modal tertanam" }, { v: totalModal, a: "right", fmt: money }], i++);
      dataRow(s1, r++, [{ v: hasConsign ? "Nilai stok saat ini (milik toko)" : "Nilai stok saat ini" }, { v: invValue, a: "right", fmt: money }], i++);
      if (hasConsign) {
        dataRow(s1, r++, [{ v: "Nilai stok titipan (milik distributor)" }, { v: consignValue, a: "right", fmt: money }], i++);
        dataRow(s1, r++, [{ v: "Hutang titip jual (belum disetor)" }, { v: consignOwed, a: "right", fmt: money }], i++);
      }
      dataRow(s1, r++, [{ v: "ROI per bulan" }, { v: roiBulan / 100, a: "right", fmt: "0.0%" }], i++);
      dataRow(s1, r++, [{ v: "Estimasi balik modal (bulan)" }, { v: paybackMonths || "—", a: "right" }], i++);

      // ---------- Sheet 2: Modal & Investasi ----------
      const s2 = wb.addWorksheet("Modal & Investasi");
      s2.columns = [{ width: 40 }, { width: 18 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }];
      r = banner(s2, "Modal & Investasi");
      sectionTitle(s2, r, "MODAL PEMBANGUNAN & INVESTASI"); r++;
      headRow(s2, r, [{ h: "Item" }, { h: "Periode" }, { h: "Nilai", a: "right" }]); r++;
      capital.forEach((c, idx) => dataRow(s2, r++, [{ v: c.name }, { v: c.date }, { v: c.amount, a: "right", fmt: money }], idx));
      totalRow(s2, r++, "TOTAL MODAL", totalModal, 2, C.coral);

      // ---------- Sheet 3: Biaya Operasional ----------
      const s3 = wb.addWorksheet("Biaya Operasional");
      s3.columns = [{ width: 36 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 12 }, { width: 12 }];
      r = banner(s3, "Biaya Operasional");
      sectionTitle(s3, r, `BIAYA OPERASIONAL — ${period}`); r++;
      headRow(s3, r, [{ h: "Biaya" }, { h: "Kategori" }, { h: "Periode" }, { h: "Nilai", a: "right" }]); r++;
      monthExpenses.forEach((e, idx) => {
        dataRow(s3, r++, [{ v: e.name }, { v: e.category }, { v: e.period ? periodLabel(e.period) : e.date }, { v: e.amount, a: "right", fmt: money }], idx);
        (e.items || []).forEach((it) => dataRow(s3, r++, [{ v: "   • " + it.label }, { v: "" }, { v: "" }, { v: it.amount, a: "right", fmt: money }], idx));
      });
      totalRow(s3, r++, "TOTAL OPERASIONAL", opex, 3, C.coral);

      // ---------- Sheet 4: Penjualan per Barang ----------
      const s4 = wb.addWorksheet("Penjualan per Barang");
      s4.columns = [{ width: 34 }, { width: 14 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 10 }];
      r = banner(s4, "Analisa Penjualan per Barang");
      sectionTitle(s4, r, `PENJUALAN PER BARANG — ${period}`); r++;
      headRow(s4, r, [{ h: "Barang" }, { h: "SKU" }, { h: "Terjual", a: "right" }, { h: "Pendapatan", a: "right" }, { h: "HPP", a: "right" }, { h: "Laba", a: "right" }, { h: "Margin", a: "right" }]); r++;
      items.forEach((it, idx) => dataRow(s4, r++, [
        { v: it.name }, { v: it.sku }, { v: it.qty, a: "right" },
        { v: it.revenue, a: "right", fmt: money }, { v: it.cost, a: "right", fmt: money },
        { v: it.profit, a: "right", fmt: money }, { v: it.margin / 100, a: "right", fmt: "0%" },
      ], idx));
      // baris total penjualan
      const tQty = items.reduce((a, x) => a + x.qty, 0);
      const trow = s4.getRow(r);
      [["Total", "left"], ["", "left"], [tQty, "right"], [revenue, "right", money], [cogs, "right", money], [gross, "right", money], ["", "right"]].forEach((cell, i) => {
        const c = s4.getCell(r, i + 1);
        c.value = cell[0]; c.fill = fill(C.dark);
        c.font = { bold: true, size: 11, color: { argb: C.cream }, name: "Arial" };
        c.alignment = { vertical: "middle", horizontal: cell[1] };
        if (cell[2]) c.numFmt = cell[2];
      });
      trow.height = 20;

      // ---------- Sheet 5: Titip Jual (Konsinyasi) ----------
      if (hasConsign) {
        let cFrom = 0, cTo = Infinity;
        if (!isAll) {
          const [yy, mm] = month.split("-").map(Number);
          cFrom = new Date(yy, mm - 1, 1).getTime();
          cTo = new Date(yy, mm, 1).getTime();
        }
        const cRows = consigns
          .filter((c) => c.ts == null || (c.ts >= cFrom && c.ts < cTo))
          .sort((a, b) => (b.ts || 0) - (a.ts || 0));
        const cOwedP = cRows.filter((c) => c.status === "belum").reduce((a, c) => a + (c.amount - (c.paidAmount || 0)), 0);
        const s5 = wb.addWorksheet("Titip Jual");
        s5.columns = [{ width: 15 }, { width: 30 }, { width: 20 }, { width: 8 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 18 }];
        r = banner(s5, "Titip Jual (Konsinyasi)");
        sectionTitle(s5, r, `SETORAN TITIP JUAL — ${period}`); r++;
        headRow(s5, r, [{ h: "Terjual" }, { h: "Barang" }, { h: "Distributor" }, { h: "Qty", a: "right" }, { h: "Setoran", a: "right" }, { h: "Terbayar", a: "right" }, { h: "Sisa", a: "right" }, { h: "Status" }]); r++;
        cRows.forEach((c, idx) => {
          const paid = c.paidAmount || 0;
          const sisa = c.amount - paid;
          dataRow(s5, r++, [
            { v: c.ts ? new Date(c.ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
            { v: c.productName }, { v: c.supplier || "—" }, { v: c.qty, a: "right" },
            { v: c.amount, a: "right", fmt: money },
            { v: paid, a: "right", fmt: money },
            { v: sisa, a: "right", fmt: money },
            { v: c.status === "lunas" ? `Lunas${c.paidAt ? " · " + c.paidAt : ""}` : (paid > 0 ? "Sebagian disetor" : "Belum disetor") },
          ], idx);
        });
        totalRow(s5, r++, "SISA BELUM DISETOR (periode ini)", cOwedP, 6, C.coral);

        // Riwayat setoran (pembayaran bertahap) dalam periode
        const pRows = (consignPayments || [])
          .filter((p) => p.ts == null || (p.ts >= cFrom && p.ts < cTo))
          .sort((a, b) => (b.ts || 0) - (a.ts || 0));
        if (pRows.length) {
          r++;
          sectionTitle(s5, r, `RIWAYAT SETORAN — ${period}`); r++;
          headRow(s5, r, [{ h: "Tanggal" }, { h: "Distributor" }, { h: "" }, { h: "" }, { h: "Disetor", a: "right" }, { h: "" }, { h: "" }, { h: "Catatan" }]); r++;
          pRows.forEach((p, idx) => dataRow(s5, r++, [
            { v: p.paidAt || (p.ts ? new Date(p.ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—") },
            { v: p.supplier || "—" }, { v: "" }, { v: "" },
            { v: p.amount, a: "right", fmt: money }, { v: "" }, { v: "" },
            { v: p.note || "—" },
          ], idx));
          totalRow(s5, r++, "TOTAL DISETOR (periode ini)", pRows.reduce((a, p) => a + p.amount, 0), 6, C.ok);
        }
      }

      // ---------- Sheet: Setoran ke Rekening (Kas -> Bank) ----------
      if (monthDeposits.length) {
        const sD = wb.addWorksheet("Setoran ke Rekening");
        sD.columns = [{ width: 16 }, { width: 30 }, { width: 30 }, { width: 18 }, { width: 12 }, { width: 12 }];
        r = banner(sD, "Setoran Kas ke Rekening");
        sectionTitle(sD, r, `SETORAN KAS \u2192 BANK — ${period}`); r++;
        sD.mergeCells(r, 1, r, 6);
        const nc = sD.getCell(r, 1);
        nc.value = "Pindah aset (Kas \u2192 Bank) — bukan biaya, tidak memengaruhi laba/rugi.";
        nc.font = { italic: true, size: 10, color: { argb: C.ink }, name: "Arial" };
        nc.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
        sD.getRow(r).height = 18; r++;
        headRow(sD, r, [{ h: "Tanggal" }, { h: "Rekening tujuan" }, { h: "Catatan" }, { h: "Jumlah", a: "right" }]); r++;
        monthDeposits.forEach((d, idx) => dataRow(sD, r++, [
          { v: fmtDepDate(d.depositedAt) }, { v: d.account || "—" }, { v: d.note || "—" }, { v: d.amount, a: "right", fmt: money },
        ], idx));
        totalRow(sD, r++, "TOTAL DISETOR (periode ini)", depositTotal, 3, C.teal);
      }

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `Akuntansi-Conflux-${month === "all" ? "semua-waktu" : month}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      flash && flash(`Laporan Excel ${period} diunduh`);
    } catch (err) {
      flash && flash("Gagal membuat Excel — coba lagi");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="stack">
      <div className="acc-toolbar">
        <div className="acc-period">
          <Calendar size={15} />
          <span className="muted">Periode</span>
          {!isAll && <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />}
          <button type="button" className={`acc-all ${isAll ? "on" : ""}`}
            onClick={() => setMonth(isAll ? thisPeriod() : "all")}>
            Semua waktu
          </button>
          {loadingAcc && <span className="muted xs">· memuat…</span>}
        </div>
        <button className="btn" onClick={exportExcel} disabled={exporting}>
          <Download size={16} /> {exporting ? "Menyiapkan…" : "Export ke Excel"}
        </button>
      </div>

      <div className="acc-grid">
        <Stat icon={Hammer} label="Modal tertanam" value={rp(totalModal)} sub="pembangunan & investasi" />
        <Stat icon={ArrowUpRight} accent label={isAll ? "Pendapatan (total)" : "Pendapatan (bln)"} value={rp(revenue)} sub={`${num(items.reduce((a, i) => a + i.qty, 0))} unit terjual`} />
        <Stat icon={Package} label="HPP (modal barang)" value={rp(cogs)} sub="cost of goods sold" />
        <Stat icon={TrendingUp} label="Laba kotor" value={rp(gross)} sub={`margin ${grossMargin}%`} />
        <Stat icon={Coins} label="Biaya operasional" value={rp(opex)} sub={isAll ? "semua waktu" : "per bulan"} />
        <Stat icon={Wallet} label={isAll ? "Laba bersih (total)" : "Laba bersih (bln)"} value={rp(net)}
          sub={<span className={net >= 0 ? "up" : "down"}>{net >= 0 ? "untung" : "rugi"}</span>} />
      </div>

      {hasConsign && (
        <section className="card cs-strip">
          <div className="cs-item">
            <Handshake size={17} />
            <div>
              <div className="muted xs">Hutang titip jual (belum disetor)</div>
              <b className="tab">{rp(consignOwed)}</b>
            </div>
          </div>
          <div className="cs-item">
            <Boxes size={17} />
            <div>
              <div className="muted xs">Nilai stok titipan (milik distributor)</div>
              <b className="tab">{rp(consignValue)}</b>
            </div>
          </div>
          <div className="muted xs cs-note">
            Nilai stok & laba di atas hanya menghitung <b>barang milik toko</b>. Modal barang titipan masuk HPP saat laku —
            setorannya tidak dihitung lagi sebagai biaya. Kelola di menu <b>Titip Jual</b>.
          </div>
        </section>
      )}

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head"><h2>Laporan Laba Rugi</h2><span className="muted">{isAll ? "semua waktu" : "per bulan (estimasi)"}</span></div>
          <div className="pl">
            <div className="pl-row"><span>Pendapatan penjualan</span><b>{rp(revenue)}</b></div>
            <div className="pl-row sub"><span>− HPP (modal barang terjual)</span><span>{rp(cogs)}</span></div>
            <div className="pl-row total"><span>Laba kotor</span><b>{rp(gross)}</b></div>
            <div className="pl-sec">Biaya operasional</div>
            {Object.entries(opexCat).map(([cat, amt]) => (
              <div key={cat} className="pl-row sub"><span>− {cat}</span><span>{rp(amt)}</span></div>
            ))}
            <div className="pl-row sub"><span>Total biaya operasional</span><span>{rp(opex)}</span></div>
            <div className={`pl-net ${net >= 0 ? "pos" : "neg"}`}>
              <span>Laba bersih {net >= 0 ? "(untung)" : "(rugi)"}</span><b>{rp(net)}</b>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Balik modal</h2></div>
          <div className="payback">
            <div className="pay-big">{paybackMonths ? `± ${num(paybackMonths)} bln` : "—"}</div>
            <div className="muted xs">{isAll ? "pilih periode bulanan untuk estimasi balik modal" : "estimasi waktu balik modal dengan laba saat ini"}</div>
            <div className="payback-bar"><div style={{ width: `${Math.min(100, Math.max(0, roiBulan))}%` }} /></div>
            <div className="payback-meta">
              <div><span className="muted xs">Total modal</span><b>{rp(totalModal)}</b></div>
              <div><span className="muted xs">{isAll ? "ROI total" : "ROI / bulan"}</span><b>{roiBulan.toFixed(1)}%</b></div>
              <div><span className="muted xs">Nilai stok kini</span><b>{rp(invValue)}</b></div>
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>Analisa penjualan per barang</h2><span className="muted">7 teratas berdasarkan laba</span></div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={Math.max(180, topChart.length * 34)}>
            <BarChart data={topChart} layout="vertical" margin={{ top: 4, right: 16, left: 6, bottom: 4 }}>
              <CartesianGrid stroke="#2C3A33" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${Math.round(v / 1000000)}jt`} tick={{ fill: "#6F8077", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fill: "#9DAEA3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => rp(v)} contentStyle={{ borderRadius: 12, border: "1px solid #2C3A33", background: "#1B2521", color: "#ECE7DA", fontSize: 13 }} labelStyle={{ color: "#9DAEA3" }} cursor={{ fill: "rgba(226,81,77,.08)" }} />
              <Bar dataKey="profit" radius={[0, 5, 5, 0]}>
                {topChart.map((e, i) => <Cell key={i} fill="#E2514D" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card pad0" style={{ marginTop: 8 }}>
          <table className="tbl">
            <thead><tr><th>Barang</th><th className="r">Terjual</th><th className="r">Pendapatan</th><th className="r">HPP</th><th className="r">Laba</th><th className="r">Margin</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.pid}>
                  <td><div className="strong">{i.name}</div><div className="muted xs">{i.sku}</div></td>
                  <td className="r tab">{num(i.qty)} {i.unit}</td>
                  <td className="r tab">{rp(i.revenue)}</td>
                  <td className="r tab muted">{rp(i.cost)}</td>
                  <td className="r tab strong" style={{ color: "var(--ok)" }}>{rp(i.profit)}</td>
                  <td className="r tab">{i.margin}%</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="empty">Belum ada penjualan tercatat.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head"><h2>Tren 6 bulan</h2><span className="muted">pendapatan vs biaya</span></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={trend} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                <CartesianGrid stroke="#2C3A33" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#6F8077", fontSize: 11 }} />
                <YAxis tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${Math.round(v / 1000)}rb` : v)} tickLine={false} axisLine={false} tick={{ fill: "#6F8077", fontSize: 11 }} width={42} />
                <Tooltip formatter={(v, n) => [rp(v), n]} contentStyle={{ borderRadius: 12, border: "1px solid #2C3A33", background: "#1B2521", color: "#ECE7DA", fontFamily: "Inter", fontSize: 13 }} labelStyle={{ color: "#9DAEA3" }} />
                <Bar dataKey="pendapatan" name="Pendapatan" fill="#6FAE92" radius={[4, 4, 0, 0]} />
                <Bar dataKey="biaya" name="Biaya" fill="#E2514D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="trend-legend">
            <span><i className="dot teal" /> Pendapatan</span>
            <span><i className="dot coral" /> Biaya operasional</span>
            <span className="muted xs">Laba {isAll ? "total" : periodLabel(month)}: <b style={{ color: net >= 0 ? "var(--ok)" : "var(--crit)" }}>{rp(net)}</b></span>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Deteksi kebocoran</h2></div>
          <div className="leak-ratio">
            <div>
              <div className="muted xs">Rasio biaya / pendapatan</div>
              <div className={`leak-big ${opexRatio > 60 ? "bad" : opexRatio > 40 ? "warn" : "ok"}`}>{opexRatio}%</div>
            </div>
            <div className="muted xs" style={{ textAlign: "right" }}>{periodLabel(month)}<br />makin tinggi makin perlu dicek</div>
          </div>
          <div className="leak-list">
            {isAll ? (
              <div className="empty">Perbandingan antar bulan hanya tersedia pada periode bulanan.</div>
            ) : (<>
            <div className="leak-head"><span>Kategori</span><span className="r">{periodLabel(prev)}</span><span className="r">{periodLabel(month)}</span><span className="r">Selisih</span></div>
            {catCompare.length === 0 && <div className="empty">Belum ada biaya pada periode ini.</div>}
            {catCompare.map((c) => (
              <div key={c.cat} className="leak-row">
                <span className="leak-cat">{c.cat}</span>
                <span className="r muted tab">{rp(c.was)}</span>
                <span className="r tab">{rp(c.now)}</span>
                <span className={`r tab leak-delta ${c.delta > 0 ? "up" : c.delta < 0 ? "down" : ""}`}>
                  {c.delta > 0 ? "+" : ""}{rp(c.delta)}{c.was > 0 ? ` (${c.pct > 0 ? "+" : ""}${c.pct}%)` : ""}
                </span>
              </div>
            ))}
            </>)}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="card pad0">
          <div className="card-head" style={{ padding: "18px 18px 0" }}>
            <h2>Modal & Investasi</h2>
            <button className="btn sm" onClick={() => setForm({ kind: "capital", entry: null })}><Plus size={14} /> Tambah</button>
          </div>
          <table className="tbl">
            <thead><tr><th>Item</th><th className="r">Nilai</th><th className="r">Aksi</th></tr></thead>
            <tbody>
              {capital.map((c) => (
                <tr key={c.id}>
                  <td><div className="strong">{c.name}</div><div className="muted xs">{c.date}</div></td>
                  <td className="r tab">{rp(c.amount)}</td>
                  <td className="r"><div className="row-actions">
                    <button className="icon-btn xs" onClick={() => setForm({ kind: "capital", entry: c })}><Pencil size={14} /></button>
                    <button className="icon-btn xs danger-h" onClick={() => setDel({ kind: "capital", entry: c })}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td className="strong">Total modal</td><td className="r tab strong">{rp(totalModal)}</td><td /></tr></tfoot>
          </table>
        </section>

        <section className="card pad0">
          <div className="card-head" style={{ padding: "18px 18px 0", flexWrap: "wrap", gap: 8 }}>
            <h2>Biaya Operasional · {periodLabel(month)}</h2>
            <div className="row-actions">
              {!isAll && <button className="btn ghost sm" onClick={copyLastMonth}><RefreshCcw size={14} /> Salin {periodLabel(prev)}</button>}
              <button className="btn sm" onClick={() => setForm({ kind: "expense", entry: null })}><Plus size={14} /> Tambah</button>
            </div>
          </div>
          <table className="tbl">
            <thead><tr><th>Biaya</th><th>Kategori</th><th className="r">Nilai</th><th className="r">Aksi</th></tr></thead>
            <tbody>
              {monthExpenses.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="strong">{e.name}</div>
                    {(e.items && e.items.length > 0)
                      ? <>
                          {isAll && <div className="muted xs">{e.period ? periodLabel(e.period) : e.date}</div>}
                          <div className="exp-items">{e.items.map((it, i) => <span key={i} className="exp-item">{it.label} · {rp(it.amount)}</span>)}</div>
                        </>
                      : <div className="muted xs">{e.period ? periodLabel(e.period) : e.date}</div>}
                  </td>
                  <td><span className="cat-tag">{e.category}</span></td>
                  <td className="r tab">{rp(e.amount)}</td>
                  <td className="r"><div className="row-actions">
                    <button className="icon-btn xs" onClick={() => setForm({ kind: "expense", entry: e })}><Pencil size={14} /></button>
                    <button className="icon-btn xs danger-h" onClick={() => setDel({ kind: "expense", entry: e })}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
              {monthExpenses.length === 0 && <tr><td colSpan={4} className="empty">{isAll ? "Belum ada biaya tercatat." : <>Belum ada biaya untuk {periodLabel(month)}. Klik “Salin {periodLabel(prev)}” atau “Tambah”.</>}</td></tr>}
            </tbody>
            <tfoot><tr><td className="strong" colSpan={2}>Total operasional</td><td className="r tab strong">{rp(opex)}</td><td /></tr></tfoot>
          </table>
        </section>
      </div>

      <section className="card pad0">
        <div className="card-head" style={{ padding: "18px 18px 0", flexWrap: "wrap", gap: 8 }}>
          <h2><Landmark size={17} style={{ verticalAlign: "-3px", marginRight: 6, color: "var(--teal)" }} />Setoran Kas ke Rekening</h2>
          <div className="row-actions" style={{ alignItems: "center", gap: 10 }}>
            <span className="muted xs">{isAll ? "Total disetor (semua waktu)" : `Disetor ${periodLabel(month)}`}: <b className="tab" style={{ color: "var(--teal)" }}>{rp(depositTotal)}</b></span>
            <button className="btn sm" onClick={() => setDepForm({ entry: null })}><Plus size={14} /> Catat setoran</button>
          </div>
        </div>
        <div className="muted xs" style={{ padding: "8px 18px 0", lineHeight: 1.5 }}>
          Uang tunai dari kas yang dipindah/transfer ke rekening bank. Ini <b style={{ color: "var(--teal)" }}>pindah aset (Kas → Bank)</b>, <b>bukan biaya</b> — tidak memengaruhi laba/rugi. Dicatat terpisah, setelah shift kasir ditutup.
        </div>
        <table className="tbl">
          <thead><tr><th>Tanggal</th><th>Rekening</th><th>Catatan</th><th className="r">Jumlah</th><th className="r">Aksi</th></tr></thead>
          <tbody>
            {monthDeposits.map((d) => (
              <tr key={d.id}>
                <td className="tab">{fmtDepDate(d.depositedAt)}</td>
                <td>{d.account ? <span className="strong">{d.account}</span> : <span className="muted">—</span>}</td>
                <td className="muted">{d.note || "—"}</td>
                <td className="r tab strong" style={{ color: "var(--teal)" }}>{rp(d.amount)}</td>
                <td className="r"><div className="row-actions">
                  <button className="icon-btn xs" onClick={() => setDepForm({ entry: d })}><Pencil size={14} /></button>
                  <button className="icon-btn xs danger-h" onClick={() => setDel({ kind: "deposit", entry: d })}><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}
            {monthDeposits.length === 0 && <tr><td colSpan={5} className="empty">{isAll ? "Belum ada setoran ke rekening tercatat." : <>Belum ada setoran untuk {periodLabel(month)}. Klik “Catat setoran” saat kas disetor ke bank.</>}</td></tr>}
          </tbody>
          <tfoot><tr><td className="strong" colSpan={3}>Total disetor</td><td className="r tab strong" style={{ color: "var(--teal)" }}>{rp(depositTotal)}</td><td /></tr></tfoot>
        </table>
      </section>

      {form && (
        <EntryForm
          kind={form.kind} entry={form.entry} defaultPeriod={isAll ? thisPeriod() : month}
          onClose={() => setForm(null)}
          onSave={(data) => {
            if (form.kind === "capital") form.entry ? onUpdateCapital(form.entry.id, data) : onAddCapital(data);
            else form.entry ? onUpdateExpense(form.entry.id, data) : onAddExpense(data);
            setForm(null);
          }}
        />
      )}

      {depForm && (
        <DepositForm
          entry={depForm.entry} defaultAccount={lastAccount}
          onClose={() => setDepForm(null)}
          onSave={(data) => {
            depForm.entry ? onUpdateDeposit(depForm.entry.id, data) : onAddDeposit(data);
            setDepForm(null);
          }}
        />
      )}

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title={del?.kind === "deposit" ? "Hapus setoran?" : "Hapus entri?"}
        footer={<>
          <button className="btn ghost" onClick={() => setDel(null)}>Batal</button>
          <button className="btn danger" onClick={() => {
            if (del.kind === "capital") onDeleteCapital(del.entry.id);
            else if (del.kind === "deposit") onDeleteDeposit(del.entry.id);
            else onDeleteExpense(del.entry.id);
            setDel(null);
          }}><Trash2 size={15} /> Hapus</button>
        </>}
      >
        {del && (del.kind === "deposit"
          ? <p className="confirm-text">Hapus setoran <b>{rp(del.entry.amount)}</b>{del.entry.account ? <> ke <b>{del.entry.account}</b></> : ""} ({fmtDepDate(del.entry.depositedAt)})?</p>
          : <p className="confirm-text">Hapus <b>{del.entry.name}</b> ({rp(del.entry.amount)})?</p>)}
      </Modal>
    </div>
  );
}

export {
  Accounting
};
