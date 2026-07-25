import { useState } from "react";
import { ArrowRight, Banknote, Lock, ShieldCheck, ShoppingCart, Unlock, User } from "lucide-react";
import { Auth } from "../db";
import { LOGO } from "../assets/logo";
import { MANAGER_PIN } from "../lib/constants";
import { rp } from "../lib/format";

function RoleGate({ onEnter, pin: managerPin }) {
  const [mode, setMode] = useState(null); // null | "cashier" | "manager"
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [opening, setOpening] = useState(""); // modal awal kas di laci (wajib saat buka shift)
  const [err, setErr] = useState(false);
  const submit = () => { if (pin === (managerPin || MANAGER_PIN)) onEnter("manager"); else setErr(true); };
  const enterCashier = () => { if (name.trim() && opening !== "") onEnter("cashier", name.trim(), Number(String(opening).replace(/\D/g, "")) || 0); };

  return (
    <div className="gate">
      <div className="gate-bg" aria-hidden="true">
        <div className="gate-spot" />
        <span className="gate-orb orb-a" />
        <span className="gate-orb orb-b" />
        <span className="gate-orb orb-c" />
        <span className="gate-orb orb-d" />
        <svg className="gate-steam" viewBox="0 0 60 96" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M18 90c0-13 7-16 7-29S18 33 18 20" />
          <path d="M30 90c0-13 7-16 7-29S30 33 30 20" />
          <path d="M42 90c0-13 7-16 7-29S42 33 42 20" />
        </svg>
        {["bean-1", "bean-2", "bean-3", "bean-4", "bean-5", "bean-6"].map((c) => (
          <svg key={c} className={`gate-bean ${c}`} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="32" cy="32" rx="26" ry="17" transform="rotate(-30 32 32)" /><path d="M16 41C26 31 38 33 48 23" />
          </svg>
        ))}
        <div className="gate-grain" />
        <div className="gate-vignette" />
      </div>

      <div className="gate-card">
        <div className="gate-logo-ring"><img className="gate-logo" src={LOGO} alt="Conflux" /></div>
        <div className="gate-title">CONFLUX</div>
        <div className="gate-sub">Coffee Club · Sistem Toko</div>

        {mode === null ? (
          <div className="gate-roles">
            <button className="gate-role" onClick={() => { setMode("cashier"); setName(""); }}>
              <div className="gate-ic cashier"><ShoppingCart size={22} /></div>
              <b>Kasir</b><span>Untuk karyawan — input penjualan</span>
            </button>
            <button className="gate-role" onClick={() => { setMode("manager"); setPin(""); setErr(false); }}>
              <div className="gate-ic manager"><ShieldCheck size={22} /></div>
              <b>Manajer</b><span>Kelola stok, laporan & pengaturan</span>
              <span className="gate-lock"><Lock size={12} /> PIN</span>
            </button>
          </div>
        ) : mode === "cashier" ? (
          <div className="gate-pin">
            <div className="gate-pin-label"><User size={15} /> Nama kasir hari ini</div>
            <input
              className="pin-input" type="text" autoFocus placeholder="cth. Rani"
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") enterCashier(); }}
            />
            <div className="gate-pin-label" style={{ marginTop: 10 }}><Banknote size={15} /> Modal awal kas di laci (Rp)</div>
            <input
              className="pin-input" inputMode="numeric" placeholder="cth. 200.000"
              value={opening} onChange={(e) => setOpening(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") enterCashier(); }}
            />
            {opening !== "" && <div className="pin-hint">Terbaca: <b>{rp(Number(String(opening).replace(/\D/g, "")) || 0)}</b></div>}
            <div className="gate-pin-actions">
              <button className="btn ghost" onClick={() => { setMode(null); setName(""); setOpening(""); }}>Kembali</button>
              <button className="btn" disabled={!name.trim() || opening === ""} onClick={enterCashier}><ArrowRight size={15} /> Buka Shift</button>
            </div>
            <div className="pin-hint">Hitung uang fisik di laci sebelum mulai — jumlah ini menjadi dasar cocokan kas saat shift ditutup.</div>
          </div>
        ) : (
          <div className="gate-pin">
            <div className="gate-pin-label"><Lock size={15} /> Masukkan PIN manajer</div>
            <input
              className={`pin-input ${err ? "err" : ""}`} type="password" inputMode="numeric" autoFocus
              placeholder="••••" value={pin}
              onChange={(e) => { setPin(e.target.value); setErr(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            />
            {err && <div className="pin-err">PIN salah. Coba lagi.</div>}
            <div className="gate-pin-actions">
              <button className="btn ghost" onClick={() => { setMode(null); setPin(""); setErr(false); }}>Kembali</button>
              <button className="btn" onClick={submit}><Unlock size={15} /> Masuk</button>
            </div>
          </div>
        )}
        <div className="gate-foot">Brewing Connection, One Cup at a Time</div>
      </div>
    </div>
  );
}

// Latar estetik dipakai bersama oleh layar login
function GateBg() {
  return (
    <div className="gate-bg" aria-hidden="true">
      <div className="gate-spot" />
      <span className="gate-orb orb-a" />
      <span className="gate-orb orb-b" />
      <span className="gate-orb orb-c" />
      <span className="gate-orb orb-d" />
      <svg className="gate-steam" viewBox="0 0 60 96" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M18 90c0-13 7-16 7-29S18 33 18 20" />
        <path d="M30 90c0-13 7-16 7-29S30 33 30 20" />
        <path d="M42 90c0-13 7-16 7-29S42 33 42 20" />
      </svg>
      {["bean-1", "bean-2", "bean-3", "bean-4", "bean-5", "bean-6"].map((c) => (
        <svg key={c} className={`gate-bean ${c}`} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="32" cy="32" rx="26" ry="17" transform="rotate(-30 32 32)" /><path d="M16 41C26 31 38 33 48 23" />
        </svg>
      ))}
      <div className="gate-grain" />
      <div className="gate-vignette" />
    </div>
  );
}

function AuthSplash() {
  return (
    <div className="gate">
      <GateBg />
      <div className="gate-card">
        <div className="gate-logo-ring"><img className="gate-logo" src={LOGO} alt="Conflux" /></div>
        <div className="gate-title">CONFLUX</div>
        <div className="gate-sub">Menyiapkan…</div>
      </div>
    </div>
  );
}

function Login({ flash }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!email.trim() || !pw) return;
    setBusy(true); setErr("");
    try { await Auth.signIn(email.trim(), pw); }
    catch (e) { setErr("Email atau kata sandi salah."); setBusy(false); }
  };
  return (
    <div className="gate">
      <GateBg />
      <div className="gate-card">
        <div className="gate-logo-ring"><img className="gate-logo" src={LOGO} alt="Conflux" /></div>
        <div className="gate-title">CONFLUX</div>
        <div className="gate-sub">Coffee Club · Masuk</div>
        <div className="gate-pin">
          <label className="fld" style={{ width: "100%" }}><span>Email</span>
            <input className="pin-input" type="email" autoFocus value={email} placeholder="email@conflux"
              onChange={(e) => { setEmail(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} /></label>
          <label className="fld" style={{ width: "100%" }}><span>Kata sandi</span>
            <input className="pin-input" type="password" value={pw} placeholder="••••••••"
              onChange={(e) => { setPw(e.target.value); setErr(""); }} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} /></label>
          {err && <div className="pin-err">{err}</div>}
          <button className="btn full" disabled={busy || !email.trim() || !pw} onClick={submit}>
            {busy ? "Memeriksa…" : <><Unlock size={15} /> Masuk</>}
          </button>
        </div>
        <div className="gate-foot">Akses hanya untuk staf Conflux</div>
      </div>
    </div>
  );
}

function CashierNameGate({ onEnter, onBack }) {
  const [name, setName] = useState("");
  const [opening, setOpening] = useState(""); // modal awal kas (wajib)
  const [busy, setBusy] = useState(false);
  const openVal = Number(String(opening).replace(/\D/g, "")) || 0;
  const ready = name.trim() && opening !== "" && !busy;
  const go = async () => {
    if (!ready) return;
    setBusy(true);
    try { await onEnter(name.trim(), openVal); } catch (e) { console.error(e); }
    setBusy(false);
  };
  return (
    <div className="gate">
      <GateBg />
      <div className="gate-card">
        <div className="gate-logo-ring"><img className="gate-logo" src={LOGO} alt="Conflux" /></div>
        <div className="gate-title">CONFLUX</div>
        <div className="gate-sub">Coffee Club · Buka Shift Kasir</div>
        <div className="gate-pin">
          <div className="gate-pin-label"><User size={15} /> Nama kasir hari ini</div>
          <input className="pin-input" autoFocus value={name} placeholder="cth. Rani"
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(); }} />
          <div className="gate-pin-label" style={{ marginTop: 10 }}><Banknote size={15} /> Modal awal kas di laci (Rp)</div>
          <input className="pin-input" inputMode="numeric" value={opening} placeholder="cth. 200.000"
            onChange={(e) => setOpening(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") go(); }} />
          {opening !== "" && <div className="pin-hint">Terbaca: <b>{rp(openVal)}</b></div>}
          <div className="gate-pin-actions">
            <button className="btn ghost" disabled={busy} onClick={onBack}>Keluar</button>
            <button className="btn" disabled={!ready} onClick={go}><ArrowRight size={15} /> {busy ? "Membuka…" : "Buka Shift"}</button>
          </div>
          <div className="pin-hint">Hitung uang fisik di laci sebelum mulai. Nama & modal awal terkunci ke shift ini dan tidak bisa diubah.</div>
        </div>
      </div>
    </div>
  );
}

export {
  AuthSplash,
  CashierNameGate,
  GateBg,
  Login,
  RoleGate
};
