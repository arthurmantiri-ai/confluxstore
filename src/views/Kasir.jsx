import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Building2, Check, ChevronUp, Clock, LayoutGrid, Minus, Phone, Plus, Repeat, Search, ShoppingCart, Trash2, User, UserPlus, Users, Wallet, X } from "lucide-react";
import { cfgKasir } from "../lib/config";
import { PAY_LABEL, PAY_METHODS, SPLIT_METHODS, catIcon } from "../lib/constants";
import { custLabel, custSub, custTitle, isBiz, normPhone } from "../lib/customers";
import { num, rp } from "../lib/format";
import { effPrice, hasCarton, hasPromo } from "../lib/inventory";

/* ============================ Kasir / POS ============================ */

function Kasir({ products, customers = [], onCheckout }) {
  // Aturan kasir (metode bayar aktif, tombol uang cepat, kewajiban isi) berasal
  // dari Pengaturan → Kasir. Dibaca tiap render supaya perubahan langsung terasa.
  const K = cfgKasir();
  const payMethods = PAY_METHODS.filter((m) => K.methods.includes(m.key));
  const [q, setQ] = useState("");
  const [cart, setCart] = useState({}); // "pid|mode" -> qty
  const [sheetOpen, setSheetOpen] = useState(false); // lembar keranjang (mobile) terbuka?
  const [paid, setPaid] = useState("");
  const [method, setMethod] = useState(K.defaultMethod);
  const [cat, setCat] = useState("all");
  // Metode yang sedang dipilih baru saja dimatikan manajer -> pindah ke bawaan,
  // jangan biarkan kasir memakai metode yang sudah tidak berlaku.
  useEffect(() => {
    if (!K.methods.includes(method)) setMethod(K.defaultMethod);
  }, [K.methods.join(","), K.defaultMethod]);

  // ===== Pelanggan (dicatat untuk SEMUA transaksi, bukan hanya hutang) =====
  const [cust, setCust] = useState(null);       // pelanggan lama yang dipilih
  const [custQ, setCustQ] = useState("");       // kotak cari pelanggan
  const [newOpen, setNewOpen] = useState(false);// form pelanggan baru terbuka
  const [nName, setNName] = useState("");
  const [nBiz, setNBiz] = useState("");
  const [nPhone, setNPhone] = useState("");
  const [nKind, setNKind] = useState("individu");
  // Untuk pelanggan USAHA: siapa yang datang mengambil hari ini. Tidak memecah
  // data usaha — hanya jejak per transaksi.
  const [pickedBy, setPickedBy] = useState("");
  const resetCust = () => {
    setCust(null); setCustQ(""); setNewOpen(false); setPickedBy("");
    setNName(""); setNBiz(""); setNPhone(""); setNKind("individu");
  };
  // Pelanggan yang akan ikut tercatat pada transaksi ini (null = tanpa pelanggan)
  const custPickRaw = cust
    ? { id: cust.id, name: cust.name, business: cust.business, phone: cust.phone, kind: cust.kind }
    : (nName.trim() || nBiz.trim() || normPhone(nPhone)
        ? { id: null, name: nName.trim() || nBiz.trim() || nPhone.trim(), business: nBiz.trim(), phone: nPhone.trim(), kind: nBiz.trim() ? "bisnis" : nKind }
        : null);
  const custIsBiz = !!custPickRaw && isBiz(custPickRaw);
  const custPick = custPickRaw
    ? { ...custPickRaw, pickedBy: custIsBiz ? pickedBy.trim() : "" }
    : null;
  // Nama usaha yang diketik ternyata SUDAH terdaftar -> jangan sampai riwayat
  // usaha yang sama terpecah dua. Tawarkan memilih yang sudah ada.
  const bizClash = (!cust && nBiz.trim())
    ? customers.find((c) => String(c.business || "").trim().toLowerCase() === nBiz.trim().toLowerCase())
    : null;
  // Pencarian pelanggan: nama, nama usaha, atau potongan nomor telepon
  const custHits = (() => {
    const term = custQ.trim().toLowerCase();
    const digits = custQ.replace(/\D/g, "");
    const pool = [...customers];
    if (!term) {
      return pool
        .filter((c) => (c.txnCount || 0) > 0)
        .sort((a, b) => (b.lastTxnAt || 0) - (a.lastTxnAt || 0))
        .slice(0, 6);
    }
    return pool
      .filter((c) => {
        const hay = `${c.name || ""} ${c.business || ""}`.toLowerCase();
        const ph = String(c.phone || "").replace(/\D/g, "");
        return hay.includes(term) || (digits.length >= 3 && ph.includes(digits));
      })
      .sort((a, b) => (b.txnCount || 0) - (a.txnCount || 0) || (b.lastTxnAt || 0) - (a.lastTxnAt || 0))
      .slice(0, 6);
  })();

  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const list = products.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    const hay = (p.name + " " + p.sku + " " + p.code + " " + p.category).toLowerCase();
    const term = q.trim().toLowerCase();
    // alias: "beans" -> kategori biji kopi (Benih)
    const aliased = term === "beans" || term === "biji" || term === "kopi" ? "benih" : term;
    return hay.includes(aliased);
  });
  const satuanPer = (p, mode) => (mode === "carton" ? p.cartonSize : 1);
  const modePrice = (p, mode) => effPrice(mode === "carton" ? p.priceCarton : p.price, p.promo);

  // total satuan dari produk p yang sudah masuk keranjang (semua mode)
  const committed = (pid) =>
    Object.entries(cart).reduce((a, [k, qty]) => {
      const [id, mode] = k.split("|");
      if (id !== pid) return a;
      const p = products.find((x) => x.id === pid);
      return a + qty * satuanPer(p, mode);
    }, 0);

  const add = (p, mode) => {
    const need = satuanPer(p, mode);
    if (committed(p.id) + need > p.stock) return; // stok tak cukup
    setCart((c) => ({ ...c, [`${p.id}|${mode}`]: (c[`${p.id}|${mode}`] || 0) + 1 }));
  };
  const dec = (key) => setCart((c) => {
    const n = (c[key] || 0) - 1;
    const next = { ...c };
    if (n <= 0) delete next[key]; else next[key] = n;
    return next;
  });
  const remove = (key) => setCart((c) => { const n = { ...c }; delete n[key]; return n; });

  const lines = Object.entries(cart).map(([key, qty]) => {
    const [pid, mode] = key.split("|");
    const p = products.find((x) => x.id === pid);
    const each = modePrice(p, mode);
    const satuan = satuanPer(p, mode) * qty;
    return { key, pid, mode, qty, p, each, satuan, lineTotal: each * qty };
  });
  const total = lines.reduce((a, l) => a + l.lineTotal, 0);
  const change = (Number(paid) || 0) - total;
  const isCash = method === "cash";
  const isHutang = method === "hutang";
  const isSplit = method === "split";

  // ===== Pembayaran campur (split payment): beberapa metode dalam 1 transaksi =====
  const FRESH_PARTS = [{ method: "cash", amount: "" }, { method: "qris", amount: "" }];
  const [parts, setParts] = useState(FRESH_PARTS);
  const setPart = (i, patch) => setParts((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const removePart = (i) => setParts((ps) => ps.filter((_, j) => j !== i));
  const splitParts = parts.map((p) => ({ method: p.method, amount: Number(p.amount) || 0 }));
  const splitSum = splitParts.reduce((a, p) => a + p.amount, 0);
  const splitNonCash = splitParts.filter((p) => p.method !== "cash").reduce((a, p) => a + p.amount, 0);
  const splitChange = Math.max(0, splitSum - total);
  const splitChangeOk = splitNonCash <= total; // kembalian hanya boleh dari porsi tunai
  const splitOk = splitParts.filter((p) => p.amount > 0).length >= 2 && total > 0 && splitSum >= total && splitChangeOk;

  // Bon hutang TANPA nama = piutang yang tidak bisa ditagih. Karena itu nama
  // pelanggan WAJIB untuk metode hutang (metode lain tetap opsional).
  // Wajib isi "uang diterima" saat tunai (opsional, dari Pengaturan): mencegah
  // kembalian dikira-kira dan selisih kas saat tutup shift.
  const paidOk = !isCash || (!K.requirePaid ? change >= 0 : (paid !== "" && change >= 0));
  // Wajib mencatat pelanggan (opsional): berguna untuk toko yang ingin riwayat
  // pembelian lengkap. Metode hutang SELALU wajib bernama.
  const custOk = (!K.requireCustomer || !!custPick?.name || !!custPick?.business) && (!isHutang || !!custPick?.name);
  const canPay = lines.length > 0 && (isSplit ? splitOk : paidOk) && custOk;

  // Rem anti klik-ganda: keranjang baru kosong SETELAH re-render, jadi klik kedua
  // yang sangat cepat masih lolos canPay dan bisa membuat transaksi kembar.
  const payBusyRef = useRef(false);
  const checkout = () => {
    if (!canPay || payBusyRef.current) return;
    payBusyRef.current = true;
    setTimeout(() => { payBusyRef.current = false; }, 800);
    // Rincian bayar campur: paidParts = yang diserahkan (gross, untuk nota);
    // payments = net per metode (jumlah persis = total, kembalian dipotong dari tunai) — untuk arsip & kas.
    let splitMeta = {};
    if (isSplit) {
      const paidParts = splitParts.filter((p) => p.amount > 0);
      let sisaKembalian = splitChange;
      const merged = {};
      paidParts.forEach((p) => {
        let amt = p.amount;
        if (p.method === "cash" && sisaKembalian > 0) { const cut = Math.min(amt, sisaKembalian); amt -= cut; sisaKembalian -= cut; }
        if (amt > 0) merged[p.method] = (merged[p.method] || 0) + amt;
      });
      const payments = Object.entries(merged).map(([m, amount]) => ({ method: m, amount }));
      splitMeta = { paid: splitSum, change: splitChange, payments, paidParts };
    }
    const meta = {
      debtor: custPick?.name || "", business: custPick?.business || "", phone: custPick?.phone || "",
      customer: custPick,
      paid: isCash ? Number(paid) || total : total,
      change: isCash ? Math.max(0, change) : 0,
      ...splitMeta,
      items: lines.map((l) => ({
        pid: l.pid,
        name: l.p.name,
        qtyLabel: `${l.qty} ${l.mode === "carton" ? "karton" : l.p.unit}`,
        qty: l.satuan,
        lineTotal: l.lineTotal,
      })),
    };
    onCheckout(lines.map((l) => ({ pid: l.pid, qty: l.satuan })), total, method, meta);
    setCart({}); setPaid(""); setMethod(K.defaultMethod); setParts(FRESH_PARTS); resetCust(); setSheetOpen(false);
  };

  // Tombol uang cepat: uang pas + pembulatan ke atas sesuai pecahan di Pengaturan
  // (mis. 50.000 & 100.000). Nilai duplikat & nol disaring saat dirender.
  const quickPay = [total, ...K.quickCash.map((v) => Math.ceil(total / v) * v)];

  return (
    <div className="pos">
      <section className="pos-products">
        <div className="cat-tabs">
          <button className={`cat-tab ${cat === "all" ? "on" : ""}`} onClick={() => setCat("all")}>
            <LayoutGrid size={15} /> Semua
          </button>
          {cats.map((c) => {
            const I = catIcon(c);
            return (
              <button key={c} className={`cat-tab ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>
                <I size={15} /> {c}
              </button>
            );
          })}
        </div>
        <div className="search big">
          <Search size={18} />
          <input placeholder="Cari barang untuk ditambahkan…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="pos-grid">
          {list.length === 0 && <div className="empty pos-empty">Tidak ada barang cocok.</div>}
          {list.map((p) => {
            const left = p.stock - committed(p.id);
            const unitEff = effPrice(p.price, p.promo);
            const cartonEff = effPrice(p.priceCarton, p.promo);
            const carton = hasCarton(p);
            const Icon = catIcon(p.category);
            return (
              <div key={p.id} className={`pos-card ${left <= 0 ? "out" : ""}`}>
                <Icon className="pos-card-wm" size={62} strokeWidth={1.4} />
                <div className="pos-card-top">
                  <span className="pos-cat"><Icon size={12} /> {p.category}</span>
                  <span className={`pos-stock ${left <= 0 ? "zero" : ""}`}>{left <= 0 ? "Habis" : `${num(left)} ${p.unit}`}</span>
                </div>
                <div className="pos-name">{p.name}{hasPromo(p) && <span className="promo-tag">PROMO</span>}</div>
                <div className="pos-price">
                  {hasPromo(p) && <span className="strike">{rp(p.price)}</span>}
                  {rp(unitEff)} <span className="per">/ {p.unit}</span>
                </div>
                <div className="pos-add">
                  <button className="add-btn" disabled={left < 1} onClick={() => add(p, "unit")}><Plus size={13} /> Satuan</button>
                  {carton && (
                    <button className="add-btn carton" disabled={left < p.cartonSize} onClick={() => add(p, "carton")}>
                      <Plus size={13} /> Karton<span className="add-sub">{rp(cartonEff)}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bilah keranjang tetap (mobile/tablet 1 kolom): total SELALU terlihat di
          bawah; ketuk untuk membuka lembar penuh. Di desktop bilah, scrim, dan
          pegangan ini disembunyikan oleh CSS — keranjang tetap kolom kanan biasa. */}
      <button
        type="button"
        className="cart-bar"
        disabled={lines.length === 0}
        onClick={() => { if (lines.length) setSheetOpen(true); }}
      >
        <span className="cart-bar-ic">
          <ShoppingCart size={18} />
          {lines.length > 0 && <span className="cart-bar-count">{lines.length}</span>}
        </span>
        <span className="cart-bar-mid">
          {lines.length === 0 ? (
            <span className="cart-bar-empty">Keranjang masih kosong</span>
          ) : (
            <>
              <span className="cart-bar-total tab">{rp(total)}</span>
              <span className="cart-bar-label">{lines.length} item · ketuk untuk bayar</span>
            </>
          )}
        </span>
        {lines.length > 0 && <ChevronUp className="cart-bar-caret" size={20} />}
      </button>
      {sheetOpen && <div className="sheet-scrim" onClick={() => setSheetOpen(false)} />}

      <aside className={`cart ${sheetOpen ? "sheet-open" : ""}`}>
        <button type="button" className="sheet-close" onClick={() => setSheetOpen(false)} aria-label="Tutup keranjang">
          <span className="sheet-grip" />
        </button>
        <div className="cart-head"><ShoppingCart size={18} /> <span>Keranjang</span><span className="cart-count" key={lines.length}>{lines.length}</span></div>
        <div className="cart-lines">
          {lines.length === 0 && (
            <div className="cart-empty">
              <svg viewBox="0 0 80 80" width="84" height="84" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path className="steam" d="M34 12c0 4-4 5-4 9s4 5 4 9" opacity=".55" />
                <path className="steam" d="M46 12c0 4-4 5-4 9s4 5 4 9" opacity=".4" />
                <path d="M18 38h40v8a18 18 0 0 1-18 18h-4A18 18 0 0 1 18 46z" />
                <path d="M58 41h6a7 7 0 0 1 0 14h-2" />
                <line x1="22" y1="70" x2="54" y2="70" />
              </svg>
              <div className="cart-empty-title">Keranjang masih kosong</div>
              <div className="cart-empty-sub">Pilih barang di kiri untuk mulai transaksi</div>
            </div>
          )}
          {lines.map((l) => (
            <div key={l.key} className="cart-line">
              <div className="cart-line-info">
                <div className="cart-line-name">{l.p.name}</div>
                <div className="muted xs">
                  {l.mode === "carton" ? `karton (${l.p.cartonSize} ${l.p.unit})` : `per ${l.p.unit}`} · {rp(l.each)}
                </div>
              </div>
              <div className="stepper sm">
                <button onClick={() => dec(l.key)}><Minus size={14} /></button>
                <span>{l.qty}</span>
                <button onClick={() => add(l.p, l.mode)}><Plus size={14} /></button>
              </div>
              <div className="cart-line-total tab">{rp(l.lineTotal)}</div>
              <button className="icon-btn xs" onClick={() => remove(l.key)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="cart-foot">
          <div className="cart-total"><span>Total</span><span className="tab big" key={total}>{rp(total)}</span></div>

          {/* ===== Pelanggan: dicatat di SETIAP transaksi =====
              Pelanggan lama tinggal dipilih dari daftar (tanpa mengetik ulang),
              pelanggan baru cukup diisi sekali lalu otomatis masuk master. */}
          <div className="cust-box">
            <div className="cust-box-head">
              <span className="cust-box-title"><Users size={14} /> Pelanggan</span>
              {isHutang
                ? <span className="cust-req">wajib untuk hutang</span>
                : <span className="muted xs">opsional</span>}
            </div>

            {cust ? (
              <div className="cust-chip">
                <div className="cust-ava">{custTitle(cust).charAt(0).toUpperCase()}</div>
                <div className="cust-chip-info">
                  <div className="cust-chip-name">{custTitle(cust)}</div>
                  <div className="muted xs">
                    {custSub(cust) || (isBiz(cust) ? "Bisnis" : "Individu")}{cust.phone ? ` · ${cust.phone}` : ""}
                  </div>
                </div>
                {(cust.txnCount || 0) > 0 && (
                  <span className="cust-badge" title="Jumlah transaksi sebelumnya"><Repeat size={11} /> {num(cust.txnCount)}×</span>
                )}
                <button className="icon-btn xs" title="Ganti pelanggan" onClick={resetCust}><X size={14} /></button>
              </div>
            ) : (
              <>
                <div className="search sm cust-search">
                  <Search size={15} />
                  <input
                    placeholder="Cari pelanggan lama (nama / usaha / no. telp)"
                    value={custQ}
                    onChange={(e) => setCustQ(e.target.value)}
                  />
                  {custQ && <button className="icon-btn xs" onClick={() => setCustQ("")}><X size={13} /></button>}
                </div>

                {custHits.length > 0 && (
                  <>
                    {!custQ.trim() && <div className="cust-hint">Pelanggan terakhir</div>}
                    <div className="cust-hits">
                      {custHits.map((c) => (
                        <button key={c.id} className="cust-hit" onClick={() => { setCust(c); setNewOpen(false); setCustQ(""); }}>
                          <div className="cust-ava sm">{custTitle(c).charAt(0).toUpperCase()}</div>
                          <div className="cust-hit-info">
                            <div className="cust-hit-name">{custTitle(c)}</div>
                            <div className="muted xs">{custSub(c) || (isBiz(c) ? "Bisnis" : "Individu")}{c.phone ? ` · ${c.phone}` : ""}</div>
                          </div>
                          {(c.txnCount || 0) > 0 && <span className="cust-badge"><Repeat size={11} /> {num(c.txnCount)}×</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {custQ.trim() && custHits.length === 0 && (
                  <div className="cust-hint">Belum ada pelanggan bernama itu.</div>
                )}

                {!newOpen ? (
                  <button
                    type="button"
                    className="btn ghost sm cust-new-btn"
                    onClick={() => {
                      const t = custQ.trim();
                      setNewOpen(true);
                      // Yang sudah diketik di kotak cari langsung dipakai: kalau
                      // berupa angka -> jadi nomor telepon, selain itu jadi nama.
                      if (t) { if (normPhone(t)) setNPhone(t); else setNName(t); }
                      setCustQ("");
                    }}
                  >
                    <UserPlus size={13} /> Pelanggan baru
                  </button>
                ) : (
                  <div className="cust-new">
                    <div className="cust-kind">
                      {[["individu", "Individu"], ["bisnis", "Bisnis"]].map(([k, label]) => (
                        <button
                          key={k}
                          type="button"
                          className={`cust-kind-btn ${(nBiz.trim() ? "bisnis" : nKind) === k ? "on" : ""}`}
                          onClick={() => setNKind(k)}
                        >{label}</button>
                      ))}
                      <button type="button" className="icon-btn xs cust-new-close" title="Batal"
                        onClick={() => { setNewOpen(false); setNName(""); setNBiz(""); setNPhone(""); setNKind("individu"); }}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="pay-row">
                      <User size={15} />
                      <input className="pay-input" placeholder="Nama pelanggan" value={nName} onChange={(e) => setNName(e.target.value)} />
                    </div>
                    <div className="pay-row">
                      <Building2 size={15} />
                      <input className="pay-input" placeholder="Nama usaha / warung (opsional)" value={nBiz} onChange={(e) => setNBiz(e.target.value)} />
                    </div>
                    {bizClash && (
                      <button type="button" className="cust-clash" onClick={() => { setCust(bizClash); setNewOpen(false); setNName(""); setNBiz(""); setNPhone(""); }}>
                        <AlertTriangle size={13} />
                        <span><b>{bizClash.business}</b> sudah terdaftar. Klik di sini untuk memakainya agar riwayat usahanya tidak terpecah.</span>
                      </button>
                    )}
                    <div className="pay-row">
                      <Phone size={15} />
                      <input className="pay-input" inputMode="tel" placeholder="No. WhatsApp (opsional)" value={nPhone} onChange={(e) => setNPhone(e.target.value)} />
                    </div>
                    {custPick && <div className="cust-hint ok">Akan disimpan sebagai <b>{custLabel(custPick)}</b></div>}
                  </div>
                )}
              </>
            )}

            {/* Pelanggan USAHA: catat siapa yang datang mengambil hari ini.
                Datanya menempel di transaksi, BUKAN memecah data usahanya —
                jadi satu warung tetap satu baris di Data Customer. */}
            {custIsBiz && (
              <div className="pay-row">
                <User size={15} />
                <input
                  className="pay-input"
                  placeholder="Diambil / dipesan oleh (opsional)"
                  value={pickedBy}
                  onChange={(e) => setPickedBy(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="pay-methods">
            {payMethods.map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.key} className={`pay-method ${method === m.key ? "on" : ""}`} onClick={() => setMethod(m.key)}>
                  <Icon size={17} /><span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {isCash && (
            <>
              <div className="pay-row">
                <Wallet size={15} />
                <input className="pay-input" type="number" placeholder="Uang diterima" value={paid} onChange={(e) => setPaid(e.target.value)} />
              </div>
              <div className="quick-pay">
                {[...new Set(quickPay)].filter((v) => v > 0).map((v) => (
                  <button key={v} onClick={() => setPaid(String(v))}>{rp(v)}</button>
                ))}
              </div>
              {paid !== "" && total > 0 && (
                <div className={`change ${change < 0 ? "neg" : ""}`}>
                  <span>{change < 0 ? "Kurang" : "Kembalian"}</span>
                  <span className="tab">{rp(Math.abs(change))}</span>
                </div>
              )}
            </>
          )}

          {(method === "transfer" || method === "qris" || method === "card") && total > 0 && (
            <div className="pay-note">Tagih <b>{rp(total)}</b> via {PAY_LABEL[method]}. Konfirmasi setelah dana masuk.</div>
          )}

          {isSplit && (
            <div className="split-pane">
              {parts.map((pt, i) => {
                const others = splitParts.reduce((a, x, j) => a + (j === i ? 0 : x.amount), 0);
                const sisa = Math.max(0, total - others);
                return (
                  <div key={i} className="split-row">
                    <select className="split-select" value={pt.method} onChange={(e) => setPart(i, { method: e.target.value })}>
                      {SPLIT_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                    <div className="pay-row slim">
                      <input className="pay-input" type="number" placeholder="Jumlah" value={pt.amount} onChange={(e) => setPart(i, { amount: e.target.value })} />
                    </div>
                    <button type="button" className="split-fill" title="Isi sisa tagihan" onClick={() => setPart(i, { amount: String(sisa) })}>sisa</button>
                    {parts.length > 2 && <button type="button" className="icon-btn xs" onClick={() => removePart(i)}><X size={13} /></button>}
                  </div>
                );
              })}
              {parts.length < 4 && (
                <button type="button" className="btn ghost sm split-add" onClick={() => setParts((ps) => [...ps, { method: "transfer", amount: "" }])}>
                  <Plus size={13} /> Tambah pembayaran
                </button>
              )}
              {total > 0 && (
                splitSum < total ? (
                  <div className="change neg"><span>Kurang</span><span className="tab">{rp(total - splitSum)}</span></div>
                ) : !splitChangeOk ? (
                  <div className="pay-note warn">Non-tunai <b>{rp(splitNonCash)}</b> melebihi total — kembalian hanya bisa dari porsi <b>tunai</b>.</div>
                ) : splitChange > 0 ? (
                  <div className="change"><span>Kembalian (dari tunai)</span><span className="tab">{rp(splitChange)}</span></div>
                ) : (
                  <div className="change"><span>Pas</span><span className="tab">{rp(0)}</span></div>
                )
              )}
            </div>
          )}

          {isHutang && (
            custPick?.name
              ? <div className="pay-note warn">Dicatat sebagai <b>hutang</b> atas nama <b>{custLabel(custPick)}</b> di menu Hutang — bisa ditandai lunas saat dibayar.</div>
              : <div className="pay-note warn">Pilih pelanggan lama atau isi <b>pelanggan baru</b> di atas dulu — bon hutang tanpa nama tidak bisa ditagih.</div>
          )}

          {/* Tombol bayar mati BUKAN tanpa sebab: aturan dari Pengaturan selalu
              dijelaskan, supaya kasir tidak mengira aplikasinya macet. */}
          {lines.length > 0 && !isHutang && !custOk && (
            <div className="pay-note warn">Toko ini mewajibkan <b>data pelanggan</b> pada setiap transaksi — pilih pelanggan lama atau isi pelanggan baru di atas.</div>
          )}
          {lines.length > 0 && isCash && K.requirePaid && paid === "" && (
            <div className="pay-note warn">Isi <b>uang diterima</b> dulu — wajib agar kembalian & kas laci tetap cocok saat tutup shift.</div>
          )}

          <button className={`btn full pay ${isHutang ? "hutang" : ""}`} disabled={!canPay} onClick={checkout}>
            {isHutang ? <Clock size={16} /> : <Check size={16} />}
            {isHutang ? "Catat hutang" : "Bayar"} {total > 0 ? rp(total) : ""}
          </button>
        </div>
      </aside>
    </div>
  );
}

export {
  Kasir
};
