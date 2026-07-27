

/* =============================== Styles =============================== */

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=Anton&display=swap');

      :root{
        --bg:#121A16; --surface:#1B2521; --surface-2:#24302A; --surface-3:#202B26;
        --ink:#ECE7DA; --ink-soft:#9DAEA3; --ink-faint:#6F8077;
        --line:rgba(236,231,218,.09); --line-soft:rgba(236,231,218,.05); --hair:rgba(236,231,218,.06);
        --accent:#E2514D; --accent-d:#C8453B; --accent-soft:rgba(226,81,77,.16);
        --teal:#6FAE92; --teal-d:#5B8F80; --teal-soft:rgba(111,174,146,.16);
        --gold:#E0A53C;
        --ok:#5FB585; --ok-bg:rgba(95,181,133,.16);
        --warn:#E0A53C; --warn-bg:rgba(224,165,60,.16);
        --crit:#E2514D; --crit-bg:rgba(226,81,77,.16);
        --r-lg:20px; --r:16px; --r-sm:11px; --r-xs:8px;
        --shadow:0 2px 4px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.26);
        --shadow-sm:0 1px 2px rgba(0,0,0,.2), 0 4px 12px rgba(0,0,0,.18);
        --shadow-lg:0 8px 24px rgba(0,0,0,.3), 0 24px 60px rgba(0,0,0,.4);
        --shadow-accent:0 6px 22px rgba(226,81,77,.28);
        --ease:cubic-bezier(.22,.61,.36,1);
      }
      /* Kunci pull-to-refresh & overscroll browser (tarik ke bawah tidak me-refresh halaman) */
      html,body{overscroll-behavior:none}
      input,select,textarea{color:var(--ink);background:transparent;font-family:inherit}
      input::placeholder{color:var(--ink-faint)}
      select option{background:#1B2521;color:#ECE7DA}
      select option:disabled{color:#6F8077}
      select option:checked{background:#2C3A33;color:#ECE7DA}
      *{box-sizing:border-box;margin:0;padding:0}
      /* Fokus keyboard yang jelas & konsisten (hanya muncul saat navigasi keyboard,
         tidak saat klik mouse) — banyak tombol kustom sebelumnya tanpa indikator fokus. */
      a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,
      textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--teal);outline-offset:2px}
      /* Hormati preferensi "kurangi gerakan": matikan animasi dekoratif & transisi. */
      @media (prefers-reduced-motion: reduce){
        *,*::before,*::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;
          transition-duration:.001ms !important;scroll-behavior:auto !important}
      }
      .app{font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--bg);
        min-height:100vh;display:flex;-webkit-font-smoothing:antialiased}
      h1,h2,h3{font-family:'Space Grotesk',sans-serif;letter-spacing:-0.01em}
      .tab,.tabular{font-variant-numeric:tabular-nums}
      .muted{color:var(--ink-soft)} .xs{font-size:12px} .strong{font-weight:600}
      .r{text-align:right} .center{text-align:center}
      .up{color:var(--ok);display:inline-flex;align-items:center;gap:2px;font-weight:600}
      .down{color:var(--crit);display:inline-flex;align-items:center;gap:2px;font-weight:600}
      .accent{color:var(--accent)} .danger{color:var(--crit)} .warn-text{color:var(--warn);font-weight:600;font-size:12px}

      /* sidebar */
      .sidebar{width:248px;flex-shrink:0;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:18px 14px;
        border-right:1px solid var(--line);
        background:
          radial-gradient(135% 48% at 0% 0%, rgba(226,81,77,.10), transparent 56%),
          radial-gradient(120% 40% at 100% 100%, rgba(111,174,146,.07), transparent 60%),
          linear-gradient(180deg,#111A15 0%,#0C120F 100%)}
      .sidebar::after{content:"";position:absolute;top:0;right:0;width:1px;height:100%;pointer-events:none;
        background:linear-gradient(180deg,transparent,rgba(111,174,146,.28),rgba(226,81,77,.14),transparent)}
      .brand{display:flex;align-items:center;gap:11px;padding:6px 8px 18px;position:relative;margin-bottom:6px}
      .brand::after{content:"";position:absolute;left:6px;right:6px;bottom:0;height:1px;
        background:linear-gradient(90deg,rgba(226,81,77,.55),rgba(111,174,146,.3),transparent)}
      .brand-logo{width:44px;height:44px;border-radius:var(--r-sm);object-fit:cover;
        box-shadow:0 4px 16px rgba(0,0,0,.5),0 0 22px rgba(226,81,77,.16),0 0 0 1px rgba(236,231,218,.08)}
      .brand-name{font-family:'Anton',sans-serif;font-weight:400;font-size:17px;letter-spacing:.06em;
        line-height:1;text-transform:uppercase;
        background:linear-gradient(180deg,#FBF8F0,#CFC7B6);-webkit-background-clip:text;background-clip:text;color:transparent}
      .brand-sub{font-size:10.5px;color:var(--ink-faint);font-weight:500;letter-spacing:.14em;margin-top:4px;text-transform:uppercase}
      .nav{display:flex;flex-direction:column;gap:3px;flex:1}
      .nav-group{display:flex;flex-direction:column;gap:3px}
      .nav-group-title{font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;
        color:var(--ink-faint);padding:15px 11px 5px;line-height:1;user-select:none;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .nav-group:first-child .nav-group-title{padding-top:3px}
      .nav-item{display:flex;align-items:center;gap:11px;padding:10px 11px;border:none;background:none;
        border-radius:var(--r-sm);font:inherit;font-size:14px;font-weight:500;color:rgba(236,231,218,.72);cursor:pointer;
        width:100%;text-align:left;transition:background .15s,color .15s,transform .12s var(--ease);position:relative}
      .nav-item:hover{background:rgba(236,231,218,.06);color:var(--ink)}
      .nav-item:active{transform:scale(.985)}
      .nav-item.active{background:linear-gradient(90deg,var(--accent-soft),rgba(226,81,77,.03));color:var(--accent);
        font-weight:600;box-shadow:inset 0 0 0 1px rgba(226,81,77,.16)}
      .nav-item.active::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:0 3px 3px 0;
        background:linear-gradient(180deg,var(--accent),var(--accent-d));box-shadow:0 0 12px rgba(226,81,77,.55)}
      .nav-item.active svg{filter:drop-shadow(0 0 6px rgba(226,81,77,.4))}
      .nav-badge{margin-left:auto;background:var(--accent);color:#fff;font-size:11px;font-weight:600;
        min-width:19px;height:19px;border-radius:10px;display:grid;place-items:center;padding:0 5px;box-shadow:var(--shadow-accent)}
      .nav-item.active .nav-badge{background:var(--accent)}
      .nav-lock{margin-left:auto;color:rgba(236,231,218,.45)}
      .sidebar-foot{padding-top:14px;margin-top:8px;position:relative}
      .sidebar-foot::before{content:"";position:absolute;top:0;left:2px;right:2px;height:1px;
        background:linear-gradient(90deg,transparent,rgba(236,231,218,.14),transparent)}
      .store-status{display:flex;align-items:center;gap:6px;color:var(--teal);font-weight:600;font-size:13px}
      .store-meta{font-size:11px;color:var(--ink-faint);margin-top:3px}

      /* main */
      .main{flex:1;min-width:0;display:flex;flex-direction:column}
      .topbar{height:64px;display:flex;align-items:center;gap:14px;padding:0 26px;
        border-bottom:1px solid var(--line);background:rgba(18,26,22,.85);backdrop-filter:blur(8px);
        position:sticky;top:0;z-index:20}
      .topbar h1{font-size:19px;font-weight:600}
      .topbar-right{margin-left:auto}
      .alert-chip{display:flex;align-items:center;gap:7px;background:var(--warn-bg);color:var(--warn);
        border:1px solid rgba(224,165,60,.32);padding:7px 13px;border-radius:999px;font:inherit;font-size:13px;
        font-weight:600;cursor:pointer}
      .content{padding:26px;max-width:1240px;width:100%}
      .stack{display:flex;flex-direction:column;gap:20px}

      /* cards */
      .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px;box-shadow:var(--shadow-sm);min-width:0}
      .card.pad0{padding:0;overflow:hidden}
      .card.pad0{overflow-x:auto}
      .row-actions{display:inline-flex;gap:6px;align-items:center;justify-content:flex-end}
      .card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
      .card-head h2{font-size:15px;font-weight:600}
      .link{background:none;border:none;color:var(--accent);font:inherit;font-size:13px;font-weight:600;
        cursor:pointer;display:inline-flex;align-items:center;gap:2px}
      .empty{color:var(--ink-faint);text-align:center;padding:26px 14px;font-size:14px}
      .empty.tall{padding:64px 14px} .empty.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r)}

      /* grids */
      .grid-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
      .grid-2-1{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:20px;align-items:start}
      .grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;align-items:start}
      .acc-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .pl{display:flex;flex-direction:column;gap:2px;font-size:13.5px}
      .pl-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0}
      .pl-row b{font-family:'Space Grotesk';font-weight:600}
      .pl-row.sub{color:var(--ink-soft);font-size:12.5px;padding:4px 0 4px 10px}
      .pl-row.total{border-top:1px solid var(--line);border-bottom:1px solid var(--line);font-weight:600}
      .pl-sec{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-faint);margin-top:8px;padding-bottom:2px}
      .pl-row.grand{border-top:2px solid var(--line);margin-top:4px;font-weight:700;font-size:15px}
      .pl-row.grand.pos b{color:var(--ok)} .pl-row.grand.neg b{color:var(--crit)}
      .pl-net{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:12px 14px;border-radius:11px;font-weight:700;font-size:15px;flex:0 0 auto}
      .pl-net b{font-family:'Space Grotesk';font-size:17px}
      .pl-net.pos{background:var(--ok-bg);color:var(--ok)}
      .pl-net.neg{background:var(--crit-bg);color:var(--crit)}
      .acc-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
      .acc-period{display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:7px 12px;color:var(--ink-soft)}
      .acc-period input{border:none;background:none;color:var(--ink);font:inherit;font-size:13.5px;outline:none}
      .acc-period input::-webkit-calendar-picker-indicator{filter:invert(.8)}
      .batch-box{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
      .batch-title{font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint)}
      .batch-row{display:flex;align-items:center;gap:10px;font-size:12.5px}
      .batch-row span:first-child{flex:1}
      .batch-item{display:flex;flex-direction:column;gap:5px;padding:7px 0;border-top:1px solid var(--hair)}
      .batch-item:first-of-type{border-top:none;padding-top:2px}
      .batch-exp{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .batch-exp-lbl{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--ink-faint)}
      .batch-exp-input{border:1px solid var(--line);background:var(--surface-2);color:var(--ink);font:inherit;font-size:12px;border-radius:7px;padding:3px 8px;outline:none}
      .batch-exp-input:focus{border-color:var(--ink-faint)}
      .batch-exp-input::-webkit-calendar-picker-indicator{filter:invert(.8);cursor:pointer}
      .batch-exp-input:disabled{opacity:.5}
      .exp-badge{display:inline-flex;align-items:center;gap:4px;margin-top:3px;font-size:10.5px;font-weight:600;padding:2px 7px;border-radius:6px;line-height:1.5}
      .exp-badge.expired{background:var(--crit-bg);color:var(--crit)}
      .exp-badge.soon{background:var(--warn-bg);color:var(--warn)}
      .exp-badge.ok{background:var(--ok-bg);color:var(--ok)}
      /* kelola batch (edit/hapus per batch) */
      .bm-err{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--crit);background:var(--crit-bg);border-radius:8px;padding:7px 10px}
      .bm-card{border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;background:var(--surface)}
      .bm-card.depleted{opacity:.6}
      .bm-card.editing{border-color:var(--accent);background:var(--surface-2)}
      .bm-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .bm-when{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--ink-soft)}
      .bm-tag{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-faint);border:1px solid var(--line);border-radius:5px;padding:1px 5px;margin-left:2px}
      .bm-acts{display:inline-flex;gap:4px}
      .bm-stats{display:flex;align-items:center;gap:12px;font-size:13px;flex-wrap:wrap}
      .bm-exp .exp-badge{margin-top:0}
      .bm-exp .muted{display:inline-flex;align-items:center;gap:4px}
      .bm-note{background:var(--surface-2);border-radius:7px;padding:5px 8px}
      .bm-confirm{border-top:1px solid var(--hair);padding-top:8px;display:flex;flex-direction:column;gap:7px;font-size:12px;color:var(--ink-soft)}
      .bm-confirm-btns,.bm-edit-btns{display:flex;gap:8px;justify-content:flex-end}
      .bm-edit{display:flex;flex-direction:column;gap:9px}
      .bm-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px 12px}
      .bm-grid .fld{gap:4px}
      .bm-grid .fld span{font-size:11.5px}
      .bm-grid input{width:100%}
      .bm-wide{grid-column:1 / -1}
      .bm-hint{line-height:1.45}
      .acc-all{border:1px solid var(--line);background:transparent;color:var(--ink-soft);font:inherit;font-size:12.5px;font-weight:600;padding:5px 11px;border-radius:8px;cursor:pointer;transition:all .15s var(--ease)}
      .acc-all:hover{border-color:var(--ink-faint);color:var(--ink)}
      .acc-all.on{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
      .payback{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
      .pay-big{font-family:'Space Grotesk';font-size:30px;font-weight:700;color:var(--accent);letter-spacing:-.02em}
      .payback-bar{width:100%;height:8px;border-radius:6px;background:var(--surface-2);overflow:hidden;margin-top:4px}
      .payback-bar>div{height:100%;background:var(--accent);border-radius:6px}
      .payback-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:100%;margin-top:8px}
      .payback-meta b{font-family:'Space Grotesk';font-size:14px;display:block;margin-top:2px}
      .trend-legend{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:10px;font-size:12px;color:var(--ink-soft)}
      .trend-legend .dot{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:middle}
      .trend-legend .dot.teal{background:var(--teal)} .trend-legend .dot.coral{background:var(--accent)}
      .leak-ratio{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);padding:12px 14px;margin-bottom:12px}
      .leak-big{font-family:'Space Grotesk';font-weight:700;font-size:26px;line-height:1.1}
      .leak-big.ok{color:var(--ok)} .leak-big.warn{color:var(--gold)} .leak-big.bad{color:var(--crit)}
      .leak-list{display:flex;flex-direction:column}
      .leak-head,.leak-row{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.3fr);gap:8px;align-items:center;padding:8px 2px}
      .leak-head{font-size:11px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--line)}
      .leak-row{border-bottom:1px solid var(--line-soft);font-size:13px}
      .leak-cat{font-weight:600}
      .leak-delta{display:block;text-align:right}
      .leak-delta.up{color:var(--crit)} .leak-delta.down{color:var(--ok)}
      .leak-row .r,.leak-head .r{text-align:right}
      .rincian-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .rincian-head>span{font-size:13px;font-weight:500;color:var(--ink-soft)}
      .btn.xs{padding:5px 9px;font-size:12px;border-radius:8px}
      .rincian-row{display:flex;gap:7px;align-items:center;margin-top:6px}
      .rincian-row .ri-label{flex:1;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:9px 10px;color:var(--ink);font:inherit;font-size:13.5px}
      .rincian-row .ri-amt{width:118px;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:9px 10px;color:var(--ink);font:inherit;font-size:13.5px}
      .exp-items{display:flex;flex-direction:column;gap:1px;margin-top:3px}
      .exp-item{font-size:11.5px;color:var(--ink-faint)}
      .cat-tag{font-size:11px;font-weight:600;color:var(--teal);background:var(--teal-soft);padding:2px 8px;border-radius:6px}
      .tbl tfoot td{padding:12px 16px;border-top:1px solid var(--line);font-size:13.5px;background:var(--surface-2)}
      @media(max-width:980px){ .acc-grid{grid-template-columns:repeat(2,1fr)} .grid-2{grid-template-columns:1fr} }

      /* stat */
      .stat{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px;
        display:flex;gap:13px;align-items:flex-start;box-shadow:var(--shadow-sm);transition:transform .18s var(--ease),box-shadow .18s var(--ease);min-width:0}
      .stat:hover{transform:translateY(-2px);box-shadow:var(--shadow)}
      .stat-ic{width:38px;height:38px;border-radius:var(--r-sm);background:var(--surface-2);color:var(--ink-soft);
        display:grid;place-items:center;flex-shrink:0}
      .stat-ic-accent{background:var(--accent-soft);color:var(--accent)}
      .stat-label{font-size:12.5px;color:var(--ink-soft);font-weight:500}
      .stat-body{min-width:0}
      .stat-value{font-family:'Space Grotesk';font-size:22px;font-weight:600;margin-top:1px;letter-spacing:-.02em;overflow-wrap:anywhere}
      .stat-sub{font-size:12px;color:var(--ink-faint);margin-top:2px;display:flex;align-items:center;gap:3px}

      .chart-wrap{margin:0 -4px}

      /* alert list */
      .alert-list{display:flex;flex-direction:column}
      .alert-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-top:1px solid var(--line-soft)}
      .alert-row:first-child{border-top:none}
      .alert-name{font-weight:600;font-size:14px} .alert-meta{font-size:12px;color:var(--ink-faint);margin-top:2px}

      /* pills */
      .pill{font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:999px;white-space:nowrap}
      .pill-ok{background:var(--ok-bg);color:var(--ok)}
      .pill-warn{background:var(--warn-bg);color:var(--warn)}
      .pill-crit{background:var(--crit-bg);color:var(--crit)}

      /* table */
      .tbl{width:100%;border-collapse:collapse;font-size:13.5px}
      .tbl th{text-align:left;font-weight:500;color:var(--ink-faint);font-size:12px;padding:12px 16px;
        border-bottom:1px solid var(--line);text-transform:none}
      .tbl td{padding:12px 16px;border-bottom:1px solid var(--line-soft);vertical-align:middle}
      .tbl tbody tr:last-child td{border-bottom:none}
      .tbl tbody tr:hover{background:var(--surface-2)}
      .mv{display:inline-flex;align-items:center;gap:4px;font-weight:600;font-size:12.5px}
      .mv.in{color:var(--ok)} .mv.out{color:var(--crit)}
      .row-actions{display:inline-flex;gap:6px}
      .mini{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);background:var(--surface);
        padding:5px 10px;border-radius:8px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer;color:var(--ink-soft)}
      .mini:hover{background:var(--surface-2)}
      .mini.in:hover{border-color:var(--ok);color:var(--ok)}
      .mini.out:hover{border-color:var(--crit);color:var(--crit)}

      /* toolbar */
      .toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
      .search{display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--line);
        border-radius:10px;padding:9px 13px;color:var(--ink-faint);flex:1;min-width:220px}
      .search input{border:none;background:none;outline:none;font:inherit;font-size:14px;color:var(--ink);width:100%}
      .search.big{padding:12px 15px} .search.big input{font-size:15px}
      .chips{display:flex;gap:6px;flex-wrap:wrap}
      .chip{border:1px solid var(--line);background:var(--surface);padding:7px 13px;border-radius:999px;
        font:inherit;font-size:13px;font-weight:500;color:var(--ink-soft);cursor:pointer}
      .chip.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}

      /* buttons */
      .btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:var(--accent);color:#fff;
        border:none;border-radius:var(--r-sm);padding:10px 16px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;
        transition:transform .1s var(--ease),background .15s,box-shadow .2s;box-shadow:var(--shadow-accent)}
      .btn:hover{background:var(--accent-d)}
      .btn:active:not(:disabled){transform:scale(.97)}
      .btn:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
      .btn.ghost{background:var(--surface);color:var(--ink-soft);border:1px solid var(--line);box-shadow:none}
      .btn.ghost:hover{background:var(--surface-2);color:var(--ink)}
      .btn.full{width:100%} .btn.sm{padding:7px 12px;font-size:13px} .btn.pay{padding:13px;font-size:15px;margin-top:4px}
      .icon-btn{background:none;border:none;color:var(--ink-soft);cursor:pointer;padding:7px;border-radius:8px;display:grid;place-items:center}
      .icon-btn:hover{background:var(--surface-2)} .icon-btn.xs{padding:5px}

      /* modal */
      .modal-scrim{position:fixed;inset:0;background:rgba(8,12,10,.55);backdrop-filter:blur(6px);
        display:flex;align-items:center;justify-content:center;z-index:50;padding:20px;overflow:auto;animation:scrim-in .2s ease}
      @keyframes scrim-in{from{opacity:0}to{opacity:1}}
      .modal{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);width:100%;
        max-height:calc(100vh - 40px);max-height:calc(100dvh - 40px);display:flex;flex-direction:column;
        box-shadow:var(--shadow-lg);overflow:hidden;animation:modal-in .26s var(--ease)}
      @keyframes modal-in{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
      .modal-head{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--line-soft)}
      .modal-head h3{font-size:16px;font-weight:600}
      .modal-body{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:20px;-webkit-overflow-scrolling:touch}
      .modal-foot{flex:0 0 auto;padding:16px 20px;border-top:1px solid var(--line-soft);display:flex;gap:10px;justify-content:flex-end}
      @media (max-width:520px){ .modal-scrim{padding:10px} .modal{max-height:calc(100dvh - 20px)} }
      .form{display:flex;flex-direction:column;gap:16px}
      .form-prod{display:flex;flex-direction:column;gap:2px;background:var(--surface-2);padding:12px 14px;border-radius:10px}
      .form-prod span:first-child{font-weight:600}
      .seg{display:flex;background:var(--surface-2);border-radius:10px;padding:3px}
      .seg button{flex:1;border:none;background:none;padding:9px;border-radius:8px;font:inherit;font-weight:600;
        font-size:13.5px;color:var(--ink-soft);cursor:pointer}
      .seg button.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.08)}
      .seg.seg-3 button{font-size:12.5px;padding:9px 4px}
      .bt-box{display:flex;flex-direction:column;gap:10px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);padding:13px}

      /* ===================== Pengaturan ===================== */
      .set-wrap{display:flex;flex-direction:column;gap:16px;padding-bottom:78px}
      .set-tabs{display:flex;gap:7px;overflow-x:auto;padding-bottom:3px;scrollbar-width:none}
      .set-tabs::-webkit-scrollbar{display:none}
      .set-tab{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;border:1px solid var(--line);
        background:var(--surface);color:var(--ink-soft);border-radius:999px;padding:9px 15px;font:inherit;
        font-size:13.5px;font-weight:500;cursor:pointer;transition:.16s var(--ease)}
      .set-tab:hover{color:var(--ink);border-color:var(--line)}
      .set-tab.on{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:var(--shadow-accent)}
      .set-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
      .set-col{display:flex;flex-direction:column;gap:16px;min-width:0}
      .set-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px;
        display:flex;flex-direction:column;gap:14px;min-width:0}
      .set-card.sticky{position:sticky;top:8px}
      .set-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .set-head h3{font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:600;letter-spacing:-.01em}
      .set-desc{font-size:12.5px;color:var(--ink-soft);line-height:1.55;margin-top:-6px}
      .set-fld{display:flex;flex-direction:column;gap:7px}
      .set-fld.wide{grid-column:1/-1}
      .set-lbl{font-size:13px;font-weight:500;color:var(--ink-soft)}
      .set-fld input,.set-fld textarea,.set-fld select{border:1px solid var(--line);border-radius:9px;padding:10px 12px;
        font:inherit;font-size:14px;outline:none;background:var(--surface-2);width:100%}
      .set-fld textarea{resize:vertical;line-height:1.55;font-size:13px}
      .set-fld input:focus,.set-fld textarea:focus,.set-fld select:focus{border-color:var(--accent)}
      .set-hint{font-size:11.5px;color:var(--ink-faint);line-height:1.5}
      .set-note{font-size:12px;color:var(--ink-soft);line-height:1.55;background:var(--surface-2);
        border:1px solid var(--line-soft);border-left:2px solid var(--teal);border-radius:var(--r-xs);padding:10px 12px}
      .set-formula{font-size:12.5px;color:var(--ink-soft);background:var(--surface-2);border:1px solid var(--line-soft);
        border-radius:var(--r-xs);padding:10px 12px;line-height:1.5}
      .set-formula b{color:var(--teal)}
      .set-var{font-family:ui-monospace,monospace;font-size:11px;background:var(--surface-2);border:1px solid var(--line);
        border-radius:5px;padding:1px 5px;margin-right:4px;color:var(--teal);display:inline-block}
      /* sakelar */
      .set-toggle{display:flex;align-items:flex-start;gap:11px;background:var(--surface-2);border:1px solid var(--line);
        border-radius:var(--r-sm);padding:12px 13px;text-align:left;font:inherit;color:var(--ink);cursor:pointer;
        transition:.16s var(--ease);width:100%}
      .set-toggle:hover{border-color:rgba(236,231,218,.16)}
      .set-toggle.on{border-color:var(--teal-soft);background:rgba(111,174,146,.06)}
      .set-toggle-txt{display:flex;flex-direction:column;gap:3px;min-width:0}
      .set-toggle-txt b{font-size:13.5px;font-weight:600}
      .set-sw{width:34px;height:20px;border-radius:999px;background:var(--surface-3);border:1px solid var(--line);
        flex-shrink:0;position:relative;margin-top:1px;transition:.18s var(--ease)}
      .set-sw i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--ink-faint);
        transition:.18s var(--ease)}
      .set-sw.on{background:var(--teal);border-color:var(--teal)}
      .set-sw.on i{left:16px;background:#fff}
      /* daftar chip */
      .set-list{display:flex;flex-direction:column;gap:9px}
      .set-chips{display:flex;flex-wrap:wrap;gap:6px;min-height:26px;align-items:center}
      .set-chip{display:inline-flex;align-items:center;gap:6px;background:var(--surface-2);border:1px solid var(--line);
        border-radius:999px;padding:5px 6px 5px 11px;font-size:12.5px}
      .set-chip button{background:none;border:none;color:var(--ink-faint);cursor:pointer;display:flex;padding:2px;
        border-radius:50%;transition:.15s}
      .set-chip button:hover{color:var(--crit);background:var(--crit-bg)}
      .set-empty{font-size:12px;color:var(--ink-faint)}
      .set-add{display:flex;gap:8px}
      .set-add input{flex:1;min-width:0;border:1px solid var(--line);border-radius:9px;padding:9px 12px;font:inherit;
        font-size:13.5px;outline:none;background:var(--surface-2)}
      .set-add input:focus{border-color:var(--accent)}
      /* centang metode bayar */
      .set-checks{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .set-check{display:flex;align-items:center;gap:8px;background:var(--surface-2);border:1px solid var(--line);
        border-radius:var(--r-sm);padding:11px 12px;font:inherit;font-size:13.5px;color:var(--ink-soft);
        cursor:pointer;transition:.16s var(--ease)}
      .set-check.on{border-color:var(--teal);color:var(--ink);background:rgba(111,174,146,.08)}
      .set-check.locked{opacity:.75;cursor:default}
      .set-box{width:16px;height:16px;border-radius:5px;border:1px solid var(--line);display:flex;align-items:center;
        justify-content:center;flex-shrink:0;color:#fff}
      .set-check.on .set-box{background:var(--teal);border-color:var(--teal)}
      .set-lock{margin-left:auto;font-size:10.5px;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.05em}
      /* pratinjau & lain-lain */
      .set-preview{background:#fff;border-radius:var(--r-sm);padding:12px;display:flex;justify-content:center;
        max-height:460px;overflow:auto}
      .set-eff{font-size:12.5px;color:var(--ink-soft);background:var(--surface-2);border:1px solid var(--line-soft);
        border-radius:var(--r-xs);padding:9px 12px}
      .set-locked{opacity:.45;pointer-events:none}
      .set-backup{display:flex;gap:9px;flex-wrap:wrap}
      .set-backup label{cursor:pointer}
      /* bilah simpan */
      .set-bar{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:12px;
        background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:12px 16px;
        box-shadow:var(--shadow);z-index:5;flex-wrap:wrap}
      .set-bar.dirty{border-color:var(--gold);background:linear-gradient(0deg,rgba(224,165,60,.07),rgba(224,165,60,.07)),var(--surface)}
      .set-bar-msg{font-size:13px;color:var(--ink-soft)}
      .set-bar.dirty .set-bar-msg{color:var(--gold);font-weight:500}
      .set-bar-act{display:flex;gap:9px;margin-left:auto}
      @media(max-width:900px){
        .set-cols{grid-template-columns:1fr}
        .set-card.sticky{position:static}
        .set-checks{grid-template-columns:1fr}
        .set-bar{flex-direction:column;align-items:stretch}
        .set-bar-act{margin-left:0}
        .set-bar-act .btn{flex:1;justify-content:center}
      }
      .bt-status{display:flex;align-items:center;gap:9px;font-size:13.5px}
      .bt-dot{width:9px;height:9px;border-radius:50%;background:var(--ink-faint);flex-shrink:0}
      .bt-dot.on{background:var(--ok);box-shadow:0 0 8px var(--ok)}
      .bt-actions{display:flex;gap:9px;flex-wrap:wrap}
      .fld{display:flex;flex-direction:column;gap:7px}
      .fld>span{font-size:13px;font-weight:500;color:var(--ink-soft)}
      .fld input{border:1px solid var(--line);border-radius:9px;padding:10px 12px;font:inherit;font-size:14px;outline:none}
      .fld input:focus{border-color:var(--accent)}
      .fld .hint{font-size:11.5px;color:var(--ink-faint)}
      .grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .form-section{font-size:12px;font-weight:600;color:var(--ink-faint);text-transform:uppercase;letter-spacing:.04em;
        border-top:1px solid var(--line-soft);padding-top:14px;margin-top:2px}
      .rop-preview{background:var(--accent-soft);color:var(--accent);border-radius:10px;padding:11px 13px;font-size:13px}
      .rop-preview b{font-family:'Space Grotesk';font-size:15px}
      .confirm-text{font-size:14px;color:var(--ink-soft);line-height:1.55}
      .btn.danger{background:var(--crit)} .btn.danger:hover{background:#a23a30}

      /* ID badge */
      .idcode{font-family:'Space Grotesk';font-weight:600;font-size:12px;letter-spacing:.02em;color:var(--accent);
        background:var(--accent-soft);padding:3px 8px;border-radius:7px;white-space:nowrap}
      .idcode.lg{font-size:15px;padding:5px 11px;align-self:flex-start}
      .act-div{width:1px;height:18px;background:var(--line);margin:0 2px}
      .icon-btn.danger-h:hover{background:var(--crit-bg);color:var(--crit)}
      .icon-btn.locked{color:var(--ink-faint);background:var(--surface-2)}
      .icon-btn.locked:hover{color:var(--warn);background:var(--warn-bg)}

      .lock-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--surface);
        padding:8px 13px;border-radius:999px;font:inherit;font-size:13px;font-weight:600;color:var(--ink-soft);cursor:pointer}
      .lock-chip:hover{border-color:var(--warn);color:var(--warn)}
      .lock-chip.on{background:var(--accent-soft);border-color:transparent;color:var(--accent)}
      .lock-chip.on:hover{color:var(--accent);opacity:.85}

      .pin-box{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
      .pin-ic{width:50px;height:50px;border-radius:14px;background:var(--warn-bg);color:var(--warn);display:grid;place-items:center}
      .pin-input{width:100%;border:1px solid var(--line);border-radius:10px;padding:12px 14px;font:inherit;font-size:18px;
        text-align:center;letter-spacing:.3em;outline:none}
      .pin-input:focus{border-color:var(--accent)}
      .pin-input.err{border-color:var(--crit);background:var(--crit-bg)}
      .pin-err{color:var(--crit);font-size:13px;font-weight:600;margin-top:-4px}
      .pin-hint{font-size:12px;color:var(--ink-faint)} .pin-hint b{color:var(--ink-soft)}

      .nav-lock{margin-left:auto;color:rgba(236,231,218,.45)}
      .unit{font-size:11px;font-weight:500;color:var(--ink-faint)}

      .sim-intro{display:flex;gap:15px;align-items:center;background:linear-gradient(180deg,var(--accent-soft),var(--surface))}
      .sim-head-actions{display:flex;gap:8px;flex-wrap:wrap}
      .sim-rows{display:flex;flex-direction:column;gap:8px}
      .sim-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
      .sim-select{flex:1;min-width:180px;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font:inherit;
        font-size:13.5px;background:var(--surface);color:var(--ink);outline:none;cursor:pointer}
      .sim-select:focus{border-color:var(--accent)}
      .sim-seg{width:170px;flex-shrink:0}
      .sim-seg button{padding:7px 6px;font-size:12.5px}
      .sim-unit{min-width:30px}
      .sim-line-val{font-family:'Space Grotesk';font-weight:600;font-size:13.5px;min-width:96px;text-align:right;margin-left:auto}
      .sim-line-val.neg{color:var(--crit)} .sim-line-val.pos{color:var(--ok)}
      .sim-add{margin-top:14px;width:100%}
      .sim-apply{display:flex;align-items:center;justify-content:space-between;gap:14px;
        background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:14px 18px;flex-wrap:wrap}
      @media(max-width:760px){
        .sim-line-val{margin-left:0}
      }
      .stepper{display:flex;align-items:center;border:1px solid var(--line);border-radius:9px;overflow:hidden;width:fit-content}
      .stepper button{border:none;background:var(--surface-2);width:38px;height:38px;display:grid;place-items:center;cursor:pointer;color:var(--ink-soft)}
      .stepper button:hover{background:var(--line)}
      .stepper input{border:none;width:64px;text-align:center;font:inherit;font-size:15px;font-weight:600;outline:none}
      .stepper.sm button{width:28px;height:28px} .stepper.sm span{min-width:26px;text-align:center;font-weight:600;font-size:13.5px}

      /* POS */
      .pos-screen{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:20px;height:calc(100vh - 64px - 52px)}
      .pos-products{display:flex;flex-direction:column;gap:14px;min-height:0;min-width:0}
      .pos-products .search{flex:0 0 auto}
      .pos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:12px;overflow-y:auto;padding-right:4px;align-content:start;flex:1 1 auto;min-height:0;min-width:0}
      .pos-empty{grid-column:1/-1;align-self:start}
      .cat-tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;flex:0 0 auto;scrollbar-width:none}
      .cat-tabs::-webkit-scrollbar{display:none}
      .cat-tab{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;border:1px solid var(--line);
        background:var(--surface);color:var(--ink-soft);border-radius:999px;padding:8px 15px;font:inherit;font-size:13px;
        font-weight:500;cursor:pointer;transition:all .18s var(--ease)}
      .cat-tab:hover{color:var(--ink);border-color:rgba(236,231,218,.18)}
      .cat-tab.on{background:var(--ink);color:var(--bg);border-color:var(--ink);box-shadow:var(--shadow-sm);font-weight:600}
      .cat-tab svg{opacity:.85}
      .pos-card{position:relative;text-align:left;background:var(--surface);border:1px solid var(--line);
        border-radius:var(--r-sm);padding:14px;display:flex;flex-direction:column;gap:7px;transition:transform .18s var(--ease),box-shadow .18s var(--ease),border-color .18s var(--ease)}
      .pos-card:hover{transform:translateY(-2px);box-shadow:var(--shadow);border-color:rgba(236,231,218,.16)}
      .pos-card.out{opacity:.5}
      .pos-card-wm{position:absolute;right:8px;top:34px;color:var(--ink);opacity:.045;pointer-events:none;z-index:0}
      .pos-card-top{display:flex;justify-content:space-between;align-items:center;gap:6px;position:relative;z-index:1}
      .pos-cat{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:var(--ink-faint);font-weight:600;text-transform:uppercase;letter-spacing:.04em;min-width:0}
      .pos-cat svg{color:var(--teal);flex-shrink:0}
      .pos-cat{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .pos-stock{font-size:11px;font-weight:600;color:var(--ok);background:var(--ok-bg);padding:2px 7px;border-radius:var(--r-xs);flex-shrink:0;white-space:nowrap}
      .pos-stock.zero{color:var(--crit);background:var(--crit-bg)}
      .pos-name{font-weight:600;font-size:13.5px;line-height:1.3;flex:1;position:relative;z-index:1;
        display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:35px}
      .pos-price{font-family:'Space Grotesk';font-weight:600;color:var(--accent);font-size:15px;position:relative;z-index:1}
      .pos-price .per{font-family:'Inter';font-weight:500;font-size:11px;color:var(--ink-faint)}
      .pos-price .strike{font-family:'Inter';font-weight:500;font-size:11px;color:var(--ink-faint);text-decoration:line-through;margin-right:5px}
      .promo-tag{display:inline-block;margin-left:6px;font-size:9px;font-weight:700;letter-spacing:.04em;color:#fff;
        background:var(--crit);padding:1px 5px;border-radius:5px;vertical-align:middle}
      .promo-mini{font-size:10.5px;font-weight:600;color:var(--crit);margin-top:2px}
      .per{font-family:'Inter';font-weight:500;font-size:11px;color:var(--ink-faint)}
      .pos-add{display:flex;gap:6px;margin-top:4px;position:relative;z-index:1}
      .add-btn{flex:1;min-height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
        border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:7px 4px;font:inherit;
        font-size:12px;font-weight:600;color:var(--accent);cursor:pointer;transition:transform .1s var(--ease),background .15s,border-color .15s}
      .add-btn:hover:not(:disabled){background:var(--accent-soft);border-color:var(--accent)}
      .add-btn:active:not(:disabled){transform:scale(.94);background:var(--accent);color:#fff;border-color:var(--accent)}
      .add-btn:active:not(:disabled) .add-sub{color:rgba(255,255,255,.85)}
      .add-btn:disabled{opacity:.4;cursor:not-allowed}
      .add-btn.carton{color:var(--ink)}
      .add-btn .add-sub{font-family:'Space Grotesk';font-weight:600;font-size:10.5px;color:var(--ink-faint)}

      .inline-fld{display:flex;gap:8px;align-items:center}
      .inline-fld input{flex:1}
      .promo-box{border:1px solid var(--line);border-radius:11px;padding:13px;display:flex;flex-direction:column;gap:12px;background:var(--surface-2)}
      .promo-row{display:flex;align-items:center;gap:10px}
      .promo-label{font-size:13.5px;font-weight:600}
      .promo-preview{background:var(--crit-bg);color:var(--crit);border-radius:8px;padding:9px 12px;font-size:13px}
      .promo-preview b{font-family:'Space Grotesk'}
      .switch{width:42px;height:24px;border-radius:999px;border:none;background:var(--line);position:relative;cursor:pointer;transition:.18s;flex-shrink:0}
      .switch.on{background:var(--accent)}
      .switch .knob{position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.18s;box-shadow:0 1px 3px rgba(0,0,0,.25)}
      .switch.on .knob{left:21px}

      .cart{background:linear-gradient(180deg,var(--surface-3),var(--surface));border:1px solid var(--line);
        border-radius:var(--r);display:flex;flex-direction:column;min-height:0;box-shadow:var(--shadow)}
      .cart-head{display:flex;align-items:center;gap:9px;padding:16px 18px;border-bottom:1px solid var(--line-soft);font-weight:600;font-size:15px}
      .cart-count{margin-left:auto;background:var(--accent-soft);color:var(--accent);font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;animation:pulse-badge .4s var(--ease)}
      @keyframes pulse-badge{0%{transform:scale(1)}40%{transform:scale(1.35);background:var(--accent);color:#fff}100%{transform:scale(1)}}
      .cart-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:48px 18px;color:var(--teal)}
      .cart-empty svg{color:var(--teal);opacity:.5;margin-bottom:6px}
      .cart-empty .steam{animation:steam 2.6s ease-in-out infinite}
      .cart-empty svg .steam:nth-child(2){animation-delay:.5s}
      @keyframes steam{0%,100%{opacity:.15;transform:translateY(2px)}50%{opacity:.55;transform:translateY(-2px)}}
      .cart-empty-title{font-weight:600;font-size:14px;color:var(--ink-soft)}
      .cart-empty-sub{font-size:12.5px;color:var(--ink-faint);max-width:200px;line-height:1.4}
      .cart-lines{flex:1;overflow-y:auto;padding:8px 14px}
      .cart-line{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line-soft)}
      .cart-line:last-child{border-bottom:none}
      .cart-line-info{min-width:0}
      .cart-line-name{font-weight:600;font-size:13px;line-height:1.2;overflow-wrap:anywhere}
      .cart-line-total{font-weight:600;font-size:13px;min-width:64px;text-align:right}
      .cart-foot{border-top:1px solid var(--line);padding:16px 18px;display:flex;flex-direction:column;gap:10px}
      .cart-total{display:flex;justify-content:space-between;align-items:baseline}
      .cart-total .big{font-family:'Space Grotesk';font-size:22px;font-weight:700;color:var(--ink);display:inline-block;animation:total-bump .28s var(--ease)}
      @keyframes total-bump{0%{transform:scale(1)}35%{transform:scale(1.12);color:var(--accent)}100%{transform:scale(1)}}
      .pay-row{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:var(--r-sm);padding:10px 12px;color:var(--ink-faint);transition:border-color .15s}
      .pay-row:focus-within{border-color:var(--accent)}
      .pay-input{border:none;outline:none;font:inherit;font-size:15px;width:100%;font-weight:600;color:var(--ink)}
      .quick-pay{display:flex;gap:6px}
      .quick-pay button{flex:1;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:8px;
        font:inherit;font-size:12px;font-weight:600;color:var(--ink-soft);cursor:pointer;transition:transform .09s var(--ease),background .15s,color .15s,border-color .15s}
      .quick-pay button:hover{border-color:var(--accent);color:var(--accent)}
      .quick-pay button:active{transform:scale(.93);background:var(--accent);color:#fff;border-color:var(--accent)}
      .change{display:flex;justify-content:space-between;font-weight:600;font-size:14px;color:var(--ok);padding:2px}
      .change.neg{color:var(--crit)}
      .pay-methods{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
      .pay-method{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--line);
        background:var(--surface-2);border-radius:var(--r-sm);padding:9px 4px;font:inherit;font-size:11.5px;font-weight:600;
        color:var(--ink-soft);cursor:pointer;transition:transform .1s var(--ease),background .15s,color .15s,border-color .15s}
      .pay-method:hover{border-color:var(--accent);color:var(--accent)}
      .pay-method:active{transform:scale(.95)}
      .pay-method.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
      /* pembayaran campur (split payment) */
      .split-pane{display:flex;flex-direction:column;gap:6px}
      .split-row{display:grid;grid-template-columns:92px minmax(0,1fr) auto auto;gap:6px;align-items:center}
      .split-select{border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-sm);
        color:var(--ink);font:inherit;font-size:12.5px;font-weight:600;padding:10px 8px;outline:none}
      .split-select:focus{border-color:var(--accent)}
      .pay-row.slim{padding:8px 10px}
      .split-fill{border:1px solid var(--line);background:transparent;color:var(--accent);border-radius:var(--r-sm);
        padding:9px 10px;font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;transition:border-color .15s}
      .split-fill:hover{border-color:var(--accent)}
      .split-add{align-self:flex-start}
      .pay-note{font-size:12.5px;color:var(--ink-soft);background:var(--surface-2);border-radius:9px;padding:9px 12px;line-height:1.45}
      .pay-note b{color:var(--ink)}
      .pay-note.warn{background:var(--warn-bg);color:var(--warn)} .pay-note.warn b{color:var(--warn)}
      .btn.pay.hutang{background:var(--warn)} .btn.pay.hutang:hover{background:#946312}

      /* orders */
      .order-tabs{display:flex;gap:6px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:5px;width:fit-content}
      .order-tab{border:none;background:none;padding:8px 16px;border-radius:8px;font:inherit;font-size:13.5px;font-weight:600;
        color:var(--ink-soft);cursor:pointer;display:flex;align-items:center;gap:7px}
      .order-tab.on{background:var(--ink);color:var(--bg)}
      .tab-count{background:rgba(255,255,255,.25);font-size:11px;padding:1px 7px;border-radius:999px}
      .order-tab:not(.on) .tab-count{background:var(--surface-2);color:var(--ink-soft)}
      .order-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
      .order-card{display:flex;flex-direction:column;gap:13px;min-width:0}
      .order-card-head{display:flex;justify-content:space-between;align-items:flex-start}
      .order-id{font-family:'Space Grotesk';font-weight:700;font-size:15px}
      .channel{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:600;color:var(--ink-soft);
        background:var(--surface-2);padding:4px 9px;border-radius:999px}
      .order-items{display:flex;flex-direction:column;gap:7px;padding:12px 0;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
      .order-item{display:flex;justify-content:space-between;font-size:13px}
      .order-card-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
      .order-total{font-weight:600;font-size:13.5px}
      .order-actions{display:flex;align-items:center;gap:7px}
      .btn.wa{background:#25D366;color:#0a2a16;box-shadow:none;text-decoration:none}
      .btn.wa:hover{background:#1eb456}
      .order-pick{display:flex;gap:8px;align-items:center}
      .order-pick .sim-select{flex:1}
      .order-pick .qty-in{width:74px;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:9px 10px;color:var(--ink);font:inherit}
      .order-line-list{display:flex;flex-direction:column;gap:2px;margin-top:4px}
      .order-line{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:13.5px;border-bottom:1px solid var(--line-soft)}
      .order-line span:first-child{flex:1}
      .order-line.grand{border-bottom:none;border-top:2px solid var(--line);margin-top:2px;padding-top:9px;font-weight:700}
      .order-line.grand b{font-family:'Space Grotesk'}
      .done-tag{display:inline-flex;align-items:center;gap:4px;color:var(--ok);font-weight:600;font-size:13px}
      /* ---- editor jumlah inline pada baris order ---- */
      .ol-qty{display:flex;align-items:center;gap:4px;flex:none}
      .ol-qty .qty-in{width:52px;text-align:center;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-xs);padding:6px 4px;color:var(--ink);font:inherit;font-size:13px}
      .ol-qty .qty-in::-webkit-outer-spin-button,.ol-qty .qty-in::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
      /* ---- kotak tempel pesan WhatsApp ---- */
      .wa-paste{background:var(--surface-2);border:1px solid var(--line-soft);border-radius:var(--r-sm);padding:12px;margin-bottom:12px;display:flex;flex-direction:column;gap:8px}
      .wa-textarea{width:100%;box-sizing:border-box;border:1px solid var(--line);background:var(--surface);border-radius:var(--r-xs);padding:9px 10px;color:var(--ink);font:inherit;font-size:13px;line-height:1.5;resize:vertical;min-height:78px}
      .wa-textarea::placeholder{color:var(--ink-faint)}
      .wa-paste .btn.sm{align-self:flex-start}
      .wa-info{font-size:12px;display:flex;flex-direction:column;gap:3px}
      .ok-text{color:var(--ok);font-weight:600}
      .wa-unmatched{color:var(--ink-soft)} .wa-unmatched em{font-style:italic;color:var(--warn)}

      /* ===== Riwayat Penjualan ===== */
      .chart-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:0 24px;
        color:var(--ink-faint);font-size:13px;z-index:1;pointer-events:none}
      .chart-wrap{position:relative}
      .cashier-chips{display:flex;flex-wrap:wrap;gap:10px}
      .cashier-chip{display:flex;align-items:center;gap:10px;background:var(--surface-2);border:1px solid var(--line);
        border-radius:var(--r-sm);padding:9px 14px 9px 9px}
      .cc-ava{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;
        color:var(--bg);background:linear-gradient(145deg,var(--teal),var(--accent))}
      .cc-name{font-weight:600;font-size:13.5px}
      .cc-val{font-family:'Space Grotesk';font-weight:600;color:var(--accent);font-size:13px}
      .txn-list{display:flex;flex-direction:column;gap:7px}
      .txn{border:1px solid var(--line);border-radius:var(--r-sm);background:var(--surface-2);overflow:hidden}
      .txn.open{border-color:rgba(236,231,218,.18)}
      .txn-head{width:100%;display:grid;grid-template-columns:auto 1fr auto auto auto auto auto;gap:12px;align-items:center;
        background:none;border:none;font:inherit;color:var(--ink);padding:11px 14px;cursor:pointer;text-align:left}
      .txn-head:hover{background:var(--surface-3)}
      .txn-time{font-size:12.5px;color:var(--ink-soft);white-space:nowrap}
      .txn-cashier{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600;color:var(--ink);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .txn-cashier svg{color:var(--teal);flex-shrink:0}
      .txn-method{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--ink-soft);
        background:var(--surface);border:1px solid var(--line);padding:2px 8px;border-radius:999px;white-space:nowrap}
      .txn-method.m-cash{color:var(--ok);background:var(--ok-bg);border-color:transparent}
      .txn-method.m-order{color:var(--teal);background:var(--teal-soft);border-color:transparent}
      .txn-method.m-split{color:var(--gold);background:rgba(224,165,60,.14);border-color:transparent}
      .txn-pays{border-top:1px dashed var(--line);margin-top:4px;padding-top:4px}
      .txn-item.pay span:first-child{color:var(--ink-faint);font-size:12px}
      .txn-qty{font-size:12px;color:var(--ink-faint);white-space:nowrap}
      .txn-total{font-family:'Space Grotesk';font-weight:700;font-size:14px;white-space:nowrap}
      .txn-caret{color:var(--ink-faint);transition:transform .18s var(--ease)}
      .txn.open .txn-caret{transform:rotate(90deg)}
      .txn-items{padding:4px 14px 12px 14px;display:flex;flex-direction:column;gap:5px;border-top:1px dashed var(--line-soft)}
      .txn-item{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:var(--ink-soft);padding-top:6px}
      .txn-item .tab,.shift-row .tab{font-family:'Space Grotesk';font-weight:600;color:var(--ink)}
      .txn-no{font-family:'Space Grotesk';font-size:11px;color:var(--ink-faint);margin-left:6px}
      .txn-acts{display:inline-flex;gap:2px}
      .txn-item-foot{display:flex;gap:8px;flex-wrap:wrap;border-top:1px dashed var(--line-soft);margin-top:6px;padding-top:10px}
      .btn.ghost.danger-h:hover{border-color:var(--crit);color:var(--crit);background:var(--crit-bg)}
      @media (max-width:640px){
        .txn-head{grid-template-columns:1fr auto auto;grid-auto-rows:auto;gap:6px 10px}
        .txn-time{grid-column:1/-1}
        .txn-qty{display:none}
        .txn-acts{display:none}
      }

      /* ===== Titip Jual (Konsinyasi) ===== */
      .consign-tag{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:var(--teal);
        background:var(--teal-soft);border-radius:999px;padding:2px 8px;margin-left:7px;vertical-align:2px;
        text-transform:uppercase;letter-spacing:.04em}
      .chip{display:inline-flex;align-items:center;gap:5px}
      .cs-strip{display:flex;gap:26px;align-items:center;flex-wrap:wrap}
      .cs-item{display:flex;align-items:center;gap:11px}
      .cs-item>svg{color:var(--teal);flex-shrink:0}
      .cs-item b{font-family:'Space Grotesk';font-size:16px}
      .cs-note{flex:1;min-width:240px;text-align:right;line-height:1.5}
      @media (max-width:820px){ .cs-note{text-align:left} }
      .sup-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
      .sup-name{font-weight:700;display:flex;align-items:center;gap:8px}
      .sup-name svg{color:var(--teal)}
      .sup-rows{display:flex;flex-direction:column;gap:7px;margin:11px 0 0;border-top:1px dashed var(--line-soft);padding-top:11px}
      .sup-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:baseline;font-size:13px;color:var(--ink-soft)}
      .sup-row .tab{font-family:'Space Grotesk';font-weight:600;color:var(--ink)}
      .sup-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;border-top:1px dashed var(--line-soft);margin-top:11px;padding-top:11px}
      .link-btn{background:none;border:none;padding:0;font:inherit;font-weight:700;color:var(--teal);cursor:pointer;text-decoration:underline}
      .link-btn:hover{color:var(--ink)}
      .part-pill{display:inline-block;margin-left:6px;font-size:9.5px;font-weight:700;letter-spacing:.02em;text-transform:uppercase;
        color:var(--gold);background:rgba(224,165,60,.14);padding:1px 6px;border-radius:999px;vertical-align:1px}
      .stack-sm{display:flex;flex-direction:column;gap:12px}
      .pay-summary{background:var(--surface-2);border-radius:9px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
      .pay-summary-row{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--ink-soft)}
      .pay-summary-row b{color:var(--ink)}
      .amt-quick{display:flex;gap:6px;margin-top:2px}
      .warn-hint{font-size:11.5px;color:var(--warn)}

      /* ===== Ringkasan Shift ===== */
      .shift{display:flex;flex-direction:column;gap:14px}
      .shift-head{display:flex;align-items:center;gap:12px}
      .shift-ava{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:18px;
        color:var(--bg);background:linear-gradient(145deg,var(--teal),var(--accent))}
      .shift-name{font-weight:700;font-size:16px}
      .shift-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .shift-stat{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);padding:11px;text-align:center}
      .shift-stat span{display:block;font-size:11px;color:var(--ink-faint);margin-bottom:3px}
      .shift-stat b{font-family:'Space Grotesk';font-size:16px}
      .shift-methods{display:flex;flex-direction:column;gap:5px;background:var(--surface-2);border-radius:var(--r-sm);padding:10px 14px}
      .shift-row{display:flex;justify-content:space-between;font-size:13.5px;color:var(--ink-soft)}
      .shift-row.strong{font-weight:700;color:var(--ink)}
      .shift-recon{display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);padding-top:12px}
      .shift-diff{text-align:center;font-weight:700;padding:9px;border-radius:var(--r-sm);font-size:14px}
      .shift-diff.ok{color:var(--ok);background:var(--ok-bg)}
      .shift-diff.over{color:var(--gold);background:var(--warn-bg)}
      .shift-diff.short{color:var(--crit);background:var(--crit-bg)}
      .pm-toggle{display:flex;gap:8px}
      .slog-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
      .slog-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
      .slog-card{border:1px solid var(--line);border-radius:var(--r);padding:14px;background:var(--panel);display:flex;flex-direction:column;gap:10px;min-width:0}
      .slog-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .slog-who{display:flex;align-items:center;gap:10px}
      .slog-name{font-weight:700}
      .slog-badge{font-size:12px;font-weight:700;padding:4px 9px;border-radius:999px;white-space:nowrap}
      .slog-badge.open{color:var(--gold);background:var(--warn-bg)}
      .slog-badge.ok{color:var(--ok);background:var(--ok-bg)}
      .slog-badge.over{color:var(--gold);background:var(--warn-bg)}
      .slog-badge.short{color:var(--crit);background:var(--crit-bg)}
      .slog-rows{display:flex;flex-direction:column;gap:5px}
      .slog-actions{display:flex;justify-content:flex-end}

      .auto-tag{font-size:9.5px;font-weight:700;letter-spacing:.04em;color:var(--teal);background:var(--teal-soft);
        padding:1px 6px;border-radius:5px;margin-left:5px;vertical-align:middle}
      .debt-card{display:flex;flex-direction:column;gap:12px}
      .debt-head{display:flex;justify-content:space-between;align-items:flex-start}
      .debt-id{font-family:'Space Grotesk';font-weight:700;font-size:15px}
      .debt-identity{display:flex;flex-direction:column;gap:5px;padding:11px 12px;background:var(--surface-2);border-radius:10px}
      .debt-line{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-soft)}
      .debt-line b{color:var(--ink);font-weight:600}
      .debt-items{display:flex;flex-direction:column;gap:7px;padding:11px 0;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
      .debt-item{display:flex;justify-content:space-between;gap:10px;font-size:12.5px}
      .debt-foot{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
      .debt-total{display:flex;flex-direction:column}
      .debt-total .tab{font-family:'Space Grotesk';font-weight:700;font-size:16px}
      .pdf-busy{display:flex;align-items:center;gap:9px;color:var(--ink-soft);font-size:13.5px;padding:6px 0}
      .pdf-ready{display:flex;align-items:center;gap:9px;color:var(--ink);font-size:14px}
      .pdf-ready b{font-family:'Space Grotesk';font-weight:600;word-break:break-all}

      /* restock */
      .formula-card{display:flex;gap:15px;align-items:flex-start;background:linear-gradient(180deg,var(--accent-soft),var(--surface))}
      .formula-ic{width:42px;height:42px;border-radius:11px;background:var(--accent);color:#fff;display:grid;place-items:center;flex-shrink:0}
      .formula-title{font-family:'Space Grotesk';font-weight:700;font-size:15px;margin-bottom:7px}
      .formula-line{font-size:13.5px;color:var(--ink-soft);margin-bottom:4px}
      .formula-line b{color:var(--accent)}
      .restock-list{display:flex;flex-direction:column;gap:14px}
      .restock-card{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:20px;align-items:center}
      .restock-main{display:flex;flex-direction:column;gap:13px}
      .restock-name-row{display:flex;justify-content:space-between;align-items:flex-start}
      .rop-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
      .rop-cell{display:flex;flex-direction:column;gap:3px;background:var(--surface-2);padding:10px 12px;border-radius:10px}
      .rop-cell b{font-family:'Space Grotesk';font-size:18px;font-weight:600}
      .rop-cell.highlight{background:var(--accent-soft)}
      .detail-toggle{align-self:flex-start;background:none;border:none;color:var(--ink-soft);font:inherit;font-size:12.5px;
        font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:0}
      .detail-toggle:hover{color:var(--accent)}
      .calc{background:var(--surface-2);border-radius:10px;padding:13px 15px;display:flex;flex-direction:column;gap:8px;font-size:13px}
      .calc>div{display:flex;justify-content:space-between} .calc span{color:var(--ink-soft)} .calc b{font-weight:600}
      .calc hr{border:none;border-top:1px solid var(--line);margin:2px 0}
      .calc-final{font-weight:700} .calc-final b{color:var(--accent)}
      .restock-action{display:flex;flex-direction:column;gap:8px}

      /* ===== Banner sinkronisasi / status koneksi ===== */
      .sync-banner{display:flex;align-items:center;gap:10px;padding:11px 15px;border-radius:14px;
        font-size:13.5px;font-weight:500;margin-bottom:14px;border:1px solid var(--line);
        animation:toast-in .35s var(--ease)}
      .sync-banner b{font-weight:700}
      .sync-banner.offline{background:rgba(214,158,46,.14);border-color:rgba(214,158,46,.42);color:#f0c88a}
      .sync-banner.offline svg{color:#e6b25a;flex-shrink:0}
      .sync-banner.syncing{background:rgba(56,161,199,.14);border-color:rgba(56,161,199,.4);color:#8fd0e6}
      .sync-banner.syncing svg{color:#5fc0e0;flex-shrink:0}
      .sync-banner.pending{background:rgba(214,158,46,.10);border-color:rgba(214,158,46,.32);color:#e8c887}
      .sync-banner.pending svg{color:#e6b25a;flex-shrink:0}
      .sync-banner.dead{background:rgba(224,90,90,.14);border-color:rgba(224,90,90,.45);color:#f0a0a0}
      .sync-banner.dead svg{color:#e56b6b;flex-shrink:0}
      .sync-retry{margin-left:auto;background:rgba(255,255,255,.08);color:inherit;border:1px solid var(--line);
        padding:5px 12px;border-radius:999px;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}
      .sync-retry:hover{background:rgba(255,255,255,.16)}
      .spin{animation:spin 1s linear infinite}
      @keyframes spin{to{transform:rotate(360deg)}}

      /* ===== Panel diagnostik sinkronisasi ===== */
      .diag-state{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px}
      .diag-state>div{display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,.04);
        border:1px solid var(--line);border-radius:11px;padding:9px 12px}
      .diag-state span{font-size:11.5px}
      .diag-state b{font-size:14.5px;font-weight:700}
      .diag-note{border-radius:12px;padding:11px 13px;font-size:13px;border:1px solid var(--line);line-height:1.5}
      .diag-note.ok{background:rgba(56,161,105,.12);border-color:rgba(56,161,105,.38);color:#9fd9b4}
      .diag-note.bad{background:rgba(224,90,90,.12);border-color:rgba(224,90,90,.42);color:#f0a8a8}
      .diag-note .muted{color:inherit;opacity:.78}
      .diag-list{margin-top:10px;display:flex;flex-direction:column;gap:8px;max-height:290px;overflow-y:auto}
      .diag-row{border:1px solid var(--line);border-radius:11px;padding:9px 12px;background:rgba(255,255,255,.03)}
      .diag-row-top{display:flex;align-items:center;gap:8px;font-size:13.5px}
      .diag-row .muted{font-size:12px;margin-top:2px}
      .diag-err{margin-top:5px;font-size:12px;color:#f0a0a0;word-break:break-word}
      .txn-unsynced{margin-left:7px;background:rgba(214,158,46,.18);border:1px solid rgba(214,158,46,.45);
        color:#e8c887;border-radius:999px;padding:1px 8px;font-size:10.5px;font-weight:700;white-space:nowrap}

      /* toast */
      .toast{position:fixed;top:20px;right:20px;background:rgba(27,37,33,.78);color:var(--ink);
        padding:12px 18px;border-radius:999px;font-size:13.5px;font-weight:500;display:flex;align-items:center;gap:9px;
        border:1px solid var(--line);box-shadow:var(--shadow-lg);z-index:80;
        backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);
        animation:toast-in .4s var(--ease)}
      .toast svg{color:var(--teal)}
      @keyframes toast-in{from{opacity:0;transform:translateY(-12px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
      @media(max-width:560px){ .toast{top:14px;right:14px;left:14px;justify-content:center} }

      /* ===== Nota / receipt ===== */
      .debt-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
      .receipt-preview{display:flex;justify-content:center;background:#cfcabb;padding:14px;border-radius:10px}
      .receipt{font-family:'Courier New',ui-monospace,monospace;color:#111;background:#fff;width:256px;
        padding:14px 14px;font-size:12px;line-height:1.5;box-shadow:0 4px 14px rgba(0,0,0,.25)}
      .receipt.w80{width:320px}
      .receipt .r-center{text-align:center}
      .receipt .r-logo{display:block;width:58px;height:58px;object-fit:cover;border-radius:10px;margin:0 auto 8px;
        filter:grayscale(1) contrast(1.15)}
      .receipt .r-store{font-weight:700;font-size:15px;letter-spacing:.04em;margin-bottom:2px;text-transform:uppercase}
      .receipt .r-tag{font-size:10px;font-style:italic;color:#444;margin-bottom:1px}
      .receipt .r-small{font-size:11px}
      .receipt .r-title{font-weight:700;letter-spacing:.1em;margin-bottom:5px}
      .receipt .r-line{border-top:1px dashed #555;margin:7px 0}
      .receipt .r-dash{border-top:1px dashed #777;margin:8px 0}
      .receipt .r-meta{margin:1px 0}
      .receipt .r-row{display:flex;justify-content:space-between;gap:10px}
      .receipt .r-item{margin-bottom:4px}
      .receipt .r-item-name{font-size:12px;font-weight:600}
      .receipt .r-total{font-weight:700;font-size:14px;margin:2px 0;border-top:2px solid #111;border-bottom:2px solid #111;padding:3px 0}
      .receipt .r-stamp{border:1.5px solid #111;text-align:center;font-weight:700;padding:3px;margin:7px 0;letter-spacing:.05em}
      .receipt .r-foot{font-size:11px;margin-top:6px}
      .receipt .r-brand{font-size:11px;font-weight:700;letter-spacing:.14em;margin-top:4px}

      #receipt-print{position:fixed;left:-99999px;top:0;background:#fff}
      @media print{
        html,body{background:#fff !important;margin:0 !important;padding:0 !important}
        .app > *{display:none !important}
        #receipt-print{display:block !important;position:static !important;left:0 !important;width:100% !important}
        #receipt-print .receipt{width:100% !important;box-shadow:none !important;padding:0 3mm !important;font-size:11px;color:#000}
        #receipt-print .r-logo{width:52px !important;height:52px !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      }

      /* ===== Login peran ===== */
      .gate{position:relative;overflow:hidden;min-height:100vh;display:grid;place-items:center;padding:24px;font-family:'Inter',sans-serif;
        background:
          radial-gradient(820px 560px at 16% 6%, rgba(226,81,77,.12), transparent 55%),
          radial-gradient(860px 600px at 86% 10%, rgba(111,174,146,.12), transparent 55%),
          radial-gradient(900px 640px at 78% 104%, rgba(224,165,60,.08), transparent 55%),
          radial-gradient(760px 520px at 8% 96%, rgba(111,174,146,.07), transparent 55%),
          linear-gradient(158deg,#0E1512 0%,#101813 46%,#090E0B 100%)}
      .gate-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
      .gate-spot{position:absolute;top:50%;left:50%;width:720px;height:720px;transform:translate(-50%,-50%);
        background:radial-gradient(circle,rgba(111,174,146,.12),rgba(226,81,77,.06) 42%,transparent 68%);animation:spot-pulse 9s ease-in-out infinite}
      @keyframes spot-pulse{0%,100%{opacity:.65;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.07)}}
      .gate-orb{position:absolute;border-radius:50%;filter:blur(70px)}
      .orb-a{width:420px;height:420px;background:radial-gradient(circle,rgba(226,81,77,.36),transparent 70%);top:-100px;left:-80px;animation:orb-a 15s ease-in-out infinite}
      .orb-b{width:360px;height:360px;background:radial-gradient(circle,rgba(111,174,146,.32),transparent 70%);bottom:-90px;right:-70px;animation:orb-b 18s ease-in-out infinite}
      .orb-c{width:300px;height:300px;background:radial-gradient(circle,rgba(224,165,60,.18),transparent 70%);top:40%;left:56%;animation:orb-c 21s ease-in-out infinite}
      .orb-d{width:340px;height:340px;background:radial-gradient(circle,rgba(111,174,146,.20),transparent 70%);top:8%;right:24%;animation:orb-c 24s ease-in-out infinite reverse}
      @keyframes orb-a{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,38px)}}
      @keyframes orb-b{0%,100%{transform:translate(0,0)}50%{transform:translate(-38px,-30px)}}
      @keyframes orb-c{0%,100%{transform:translate(0,0)}50%{transform:translate(-28px,24px)}}
      .gate-steam{position:absolute;top:6%;left:50%;transform:translateX(-50%);width:80px;height:120px;color:var(--teal);opacity:.10}
      .gate-steam path{animation:steam-sway 4.5s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
      .gate-steam path:nth-child(2){animation-delay:.7s}
      .gate-steam path:nth-child(3){animation-delay:1.4s}
      @keyframes steam-sway{0%,100%{opacity:.25;transform:translateY(6px)}50%{opacity:.9;transform:translateY(-6px)}}
      .gate-bean{position:absolute;color:var(--ink)}
      .bean-1{--rot:14deg;width:200px;top:12%;right:9%;opacity:.055;transform:rotate(var(--rot));animation:bean-float 22s ease-in-out infinite}
      .bean-2{--rot:-22deg;width:120px;bottom:14%;left:7%;opacity:.05;transform:rotate(var(--rot));animation:bean-float 27s ease-in-out infinite reverse}
      .bean-3{--rot:40deg;width:84px;top:62%;right:21%;opacity:.04;transform:rotate(var(--rot));animation:bean-float 19s ease-in-out infinite}
      .bean-4{--rot:-8deg;width:150px;top:16%;left:13%;opacity:.04;transform:rotate(var(--rot));animation:bean-float 30s ease-in-out infinite reverse}
      .bean-5{width:64px;bottom:22%;right:38%;transform:rotate(25deg);opacity:.045}
      .bean-6{--rot:-34deg;width:104px;bottom:8%;right:12%;opacity:.035;transform:rotate(var(--rot));animation:bean-float 24s ease-in-out infinite}
      @keyframes bean-float{0%,100%{transform:translateY(0) rotate(var(--rot,0deg))}50%{transform:translateY(-16px) rotate(var(--rot,0deg))}}
      .gate-grain{position:absolute;inset:0;opacity:.04;background-image:radial-gradient(rgba(236,231,218,.6) 1px,transparent 1px);background-size:4px 4px}
      .gate-vignette{position:absolute;inset:0;background:radial-gradient(125% 125% at 50% 48%,transparent 52%,rgba(5,9,7,.62) 100%)}
      .gate-card{position:relative;z-index:1;width:100%;max-width:430px;border-radius:24px;padding:34px 28px;text-align:center;
        background:linear-gradient(180deg,rgba(31,42,36,.92),rgba(20,28,24,.92));
        border:1px solid rgba(236,231,218,.10);box-shadow:var(--shadow-lg),inset 0 1px 0 rgba(236,231,218,.06);
        backdrop-filter:blur(18px) saturate(1.15);-webkit-backdrop-filter:blur(18px) saturate(1.15);animation:gate-in .5s var(--ease)}
      @keyframes gate-in{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      .gate-logo-ring{width:92px;height:92px;margin:0 auto;border-radius:24px;display:grid;place-items:center;
        background:linear-gradient(145deg,rgba(226,81,77,.25),rgba(111,174,146,.18));box-shadow:0 0 30px rgba(226,81,77,.22)}
      .gate-logo{width:78px;height:78px;border-radius:18px;object-fit:cover;box-shadow:0 6px 20px rgba(0,0,0,.5)}
      .gate-title{font-family:'Anton',sans-serif;font-size:32px;letter-spacing:.1em;margin-top:16px;line-height:1;
        background:linear-gradient(180deg,#FBF8F0,#CFC7B6);-webkit-background-clip:text;background-clip:text;color:transparent}
      .gate-sub{font-size:12px;color:var(--ink-faint);letter-spacing:.18em;text-transform:uppercase;margin-top:6px;margin-bottom:26px}
      .gate-roles{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .gate-role{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;
        background:rgba(36,48,42,.6);border:1px solid var(--line);border-radius:var(--r-sm);padding:22px 14px;cursor:pointer;transition:.18s var(--ease);font:inherit;color:var(--ink)}
      .gate-role:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 10px 26px rgba(0,0,0,.34)}
      .gate-role:active{transform:translateY(-1px) scale(.99)}
      .gate-role b{font-size:15px;font-weight:600}
      .gate-role span{font-size:11.5px;color:var(--ink-soft);line-height:1.35}
      .gate-ic{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;margin-bottom:4px}
      .gate-ic.cashier{background:var(--teal-soft);color:var(--teal)}
      .gate-ic.manager{background:var(--accent-soft);color:var(--accent)}
      .gate-lock{position:absolute;top:9px;right:9px;display:inline-flex;align-items:center;gap:3px;font-size:9.5px;font-weight:700;
        color:var(--accent);background:var(--accent-soft);padding:2px 6px;border-radius:6px}
      .gate-pin{display:flex;flex-direction:column;gap:12px;align-items:center}
      .gate-pin-label{display:flex;align-items:center;gap:7px;font-weight:600;font-size:14px;color:var(--ink)}
      .gate-pin .pin-input{width:100%}
      .gate-pin-actions{display:flex;gap:10px;width:100%}
      .gate-pin-actions .btn{flex:1}
      .gate-foot{margin-top:24px;font-size:11px;color:var(--ink-faint);font-style:italic;letter-spacing:.02em}

      /* role footer */
      .role-badge{display:flex;align-items:center;gap:7px;font-weight:600;font-size:13px;padding:8px 11px;border-radius:9px;margin-bottom:8px}
      .role-badge.manager{background:var(--accent-soft);color:var(--accent)}
      .role-badge.cashier{background:var(--teal-soft);color:var(--teal)}
      .logout-btn{display:flex;align-items:center;gap:8px;width:100%;border:1px solid var(--line);background:none;
        color:rgba(236,231,218,.75);padding:9px 11px;border-radius:9px;font:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:.15s}
      .logout-btn:hover{background:rgba(236,231,218,.07);color:var(--ink)}
      @media(max-width:420px){ .gate-roles{grid-template-columns:1fr} }

      /* ============================ RESPONSIVE ============================
         Model tampilan:
         • Perangkat sentuh (tablet/HP) ATAU jendela ≤1024px → sidebar menjadi
           laci geser (drawer) + tombol hamburger; sasaran ketuk diperbesar; dan
           font kolom isian dipaksa 16px agar Safari iOS TIDAK auto-zoom halaman
           saat kolom difokus (penyebab utama harus "zoom in/zoom out" di tablet).
         • Lebar ≤980px → POS & grid ringkasan turun ke 1 kolom (murni soal ruang).
         Desktop layar besar + mouse (>1024px) TIDAK berubah sama sekali. */
      .only-mobile{display:none}
      .drawer-scrim{display:none}

      /* -- Sidebar → laci geser + hamburger: semua perangkat sentuh & jendela sempit -- */
      @media (pointer:coarse),(max-width:1024px){
        .sidebar{position:fixed;left:0;top:0;z-index:60;transform:translateX(-100%);
          transition:transform .25s var(--ease);box-shadow:0 0 44px rgba(0,0,0,.4)}
        .sidebar.open{transform:translateX(0)}
        .drawer-scrim{display:block;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:55}
        .only-mobile{display:grid}
        .topbar{padding:0 16px}
        .content{padding:18px 16px}
      }

      /* -- Anti auto-zoom iOS + sasaran ketuk lebih besar (utamanya layar kasir) -- */
      @media (pointer:coarse),(max-width:1024px){
        /* Font ≥16px pada SEMUA kolom isian: Safari iOS berhenti memperbesar
           halaman tiap kali kolom difokus. !important dipakai agar menang atas
           aturan yang lebih spesifik seperti .search.sm input, .split-select, dll. */
        input,select,textarea{font-size:16px !important}
        .pos-card{padding:15px}
        .add-btn{min-height:48px;font-size:13.5px}
        .pay-method{padding:12px 5px}
        .cat-tab{padding:11px 17px;font-size:14px}
        .quick-pay button{padding:12px 6px;font-size:13.5px}
        .stepper.sm button{width:38px;height:38px}
        .stepper.sm span{min-width:34px;font-size:16px}
        .split-fill{padding:11px 10px}
        .btn{padding:12px 18px}
        .btn.sm{padding:10px 14px}
        .btn.pay{padding:15px;font-size:16px}
        .icon-btn{padding:9px}
        .cust-hit{padding:10px 11px}
        .cust-kind-btn{padding:11px 12px}
        .mini{padding:8px 12px}
        .chip,.set-tab,.ret-pill{padding:9px 15px}
      }

      /* -- Ruang: POS & grid ringkasan ke 1 kolom (murni soal lebar) -- */
      @media (max-width:980px){
        .grid-4{grid-template-columns:repeat(2,1fr)}
        .grid-2-1{grid-template-columns:1fr}
        .pos-screen{grid-template-columns:minmax(0,1fr);height:auto}
        .restock-card{grid-template-columns:1fr}
        .rop-meta{grid-template-columns:repeat(2,1fr)}
      }
      @media (max-width:760px){
        .grid-4{grid-template-columns:1fr}
        .alert-chip span{display:none}
        .ret-manual-row{flex-wrap:wrap}
        .ret-methods{grid-template-columns:repeat(2,1fr)}
      }
      /* -- HP kecil: cegah grid kartu (min 290–300px) meluber & memunculkan scroll -- */
      @media (max-width:600px){
        .order-grid,.slog-list{grid-template-columns:1fr}
      }

      /* ================= Keranjang: lembar bawah (bottom sheet) mobile =================
         Saat POS 1 kolom (≤980px), keranjang tidak lagi menumpuk di bawah daftar
         produk. Bilah ringkas berisi total SELALU menempel di dasar layar; ketuk untuk
         membuka lembar penuh. Di dalam lembar, kepala (grip + judul) dan kaki (Total +
         tombol Bayar) DIPATOK — hanya daftar barang yang menggulir — jadi tombol Bayar
         selalu terlihat tanpa perlu scroll. Desktop (>980px) tidak terpengaruh. */
      .cart-bar{display:none}
      .sheet-scrim{display:none}
      .sheet-close{display:none}
      @media (max-width:980px){
        /* ruang di dasar agar bilah tetap tidak menutupi baris produk terakhir */
        .pos-screen{padding-bottom:80px}

        /* bilah ringkas tetap di bawah — selalu tampak */
        .cart-bar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;
          align-items:center;gap:12px;width:100%;border:none;text-align:left;font:inherit;color:var(--ink);
          padding:11px 16px calc(11px + env(safe-area-inset-bottom,0px));cursor:pointer;
          background:linear-gradient(180deg,var(--surface-2),var(--surface));
          border-top:1px solid var(--line);box-shadow:0 -6px 22px rgba(0,0,0,.32)}
        .cart-bar:active:not(:disabled){background:var(--surface-3)}
        .cart-bar:disabled{cursor:default;opacity:.9}
        .cart-bar-ic{position:relative;display:grid;place-items:center;width:42px;height:42px;flex:0 0 42px;
          border-radius:var(--r-sm);background:var(--accent-soft);color:var(--accent)}
        .cart-bar-count{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 5px;
          border-radius:10px;background:var(--accent);color:#fff;font-size:11px;font-weight:700;
          display:grid;place-items:center;box-shadow:var(--shadow-accent)}
        .cart-bar-mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
        .cart-bar-total{font-family:'Space Grotesk';font-weight:700;font-size:19px;line-height:1.1}
        .cart-bar-label{font-size:12px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cart-bar-empty{font-size:14px;font-weight:600;color:var(--ink-soft)}
        .cart-bar-caret{color:var(--ink-faint);flex:0 0 auto}

        /* scrim gelap di belakang lembar */
        .sheet-scrim{display:block;position:fixed;inset:0;z-index:65;background:rgba(8,12,10,.55);
          backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:scrim-in .2s ease}

        /* keranjang → lembar yang naik dari bawah; kepala & kaki dipatok, isi menggulir */
        .cart{position:fixed;left:0;right:0;bottom:0;z-index:70;
          max-height:92vh;max-height:92dvh;overflow:hidden;
          border-radius:var(--r-lg) var(--r-lg) 0 0;transform:translateY(101%);
          transition:transform .28s var(--ease);box-shadow:0 -14px 48px rgba(0,0,0,.5)}
        .cart.sheet-open{transform:translateY(0)}
        .cart-head{flex:0 0 auto}
        .cart-lines{flex:1 1 auto;min-height:48px;overflow-y:auto;overscroll-behavior:contain}
        .cart-foot{flex:0 0 auto;padding-bottom:calc(16px + env(safe-area-inset-bottom,0px))}

        /* pegangan tarik (grip) + area ketuk untuk menutup di puncak lembar */
        .sheet-close{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:100%;
          border:none;background:none;padding:10px 0 3px;cursor:pointer}
        .sheet-grip{display:block;width:42px;height:5px;border-radius:3px;background:var(--line);transition:background .15s}
        .sheet-close:active .sheet-grip{background:var(--ink-faint)}
      }

      /* ===== Retur & Tukar ===== */
      .ret-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 8px;border-radius:999px;white-space:nowrap}
      .ret-badge.rf{background:var(--accent-soft);color:var(--accent)}
      .ret-badge.ex{background:var(--teal-soft);color:var(--teal)}
      .ret-reason-col{font-size:12.5px;color:var(--ink-soft);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ret-net{font-variant-numeric:tabular-nums;font-weight:700;font-size:14px}
      .ret-net.pos{color:var(--teal)}
      .ret-net.neg{color:var(--accent)}
      .ret-tag{display:inline-block;font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px;margin-left:4px;vertical-align:middle}
      .ret-tag.ok{background:var(--ok-bg);color:var(--ok)}
      .ret-tag.bad{background:var(--crit-bg);color:var(--crit)}
      .ret-tag.ex{background:var(--teal-soft);color:var(--teal)}
      .ret-ic-in{color:var(--accent);vertical-align:middle}
      .ret-ic-out{color:var(--teal);vertical-align:middle}
      .ret-foot-sep{border-top:1px dashed var(--line);margin-top:4px;padding-top:8px}

      .ret-flow{display:flex;flex-direction:column;gap:14px}
      .ret-seg{display:flex;background:var(--surface-2);border-radius:10px;padding:3px;gap:2px}
      .ret-seg-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;border:none;background:none;padding:10px 6px;
        border-radius:8px;font:inherit;font-weight:600;font-size:13px;color:var(--ink-soft);cursor:pointer;transition:background .15s,color .15s}
      .ret-seg-btn.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.1)}
      .ret-block{display:flex;flex-direction:column;gap:8px}
      .ret-label{font-size:12px;font-weight:700;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em}

      .ret-picker{display:flex;flex-direction:column;gap:6px;max-height:230px;overflow-y:auto}
      .ret-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;
        border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-sm);padding:10px 12px;font:inherit;color:var(--ink);cursor:pointer;transition:border-color .15s,background .15s}
      .ret-opt:hover{border-color:var(--accent);background:var(--surface-3)}
      .ret-opt-l{min-width:0}
      .ret-opt-no{font-weight:700;font-size:13px;font-variant-numeric:tabular-nums}
      .ret-opt-tot{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
      .ret-src-head{display:flex;align-items:center;justify-content:space-between;gap:8px}

      .ret-lines{display:flex;flex-direction:column;gap:6px}
      .ret-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r-sm);padding:9px 11px;transition:border-color .15s,background .15s}
      .ret-line.on{border-color:var(--accent);background:var(--accent-soft)}
      .ret-line.off{opacity:.5}
      .ret-line-main{flex:1;min-width:120px}
      .ret-line-name{font-weight:600;font-size:13.5px}
      .ret-line-tot{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
      .ret-cond{flex-basis:100%;border:1px solid var(--line);background:var(--surface);border-radius:var(--r-xs);
        padding:6px 8px;font:inherit;font-size:12px;color:var(--ink);cursor:pointer}
      .ret-manual-row{display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap}
      .ret-price-in{display:flex;align-items:center;gap:4px;border:1px solid var(--line);background:var(--surface);border-radius:var(--r-xs);padding:0 8px}
      .ret-price-in span{font-size:11px;color:var(--ink-faint)}
      .ret-price-in input{width:74px;border:none;background:none;padding:7px 0;font:inherit;font-size:12.5px;color:var(--ink);font-variant-numeric:tabular-nums}
      .ret-price-in input:focus{outline:none}
      .ret-cond{max-width:100%}
      .ret-manual-row .ret-cond{flex-basis:auto;flex:1;min-width:120px}

      .ret-cat-picker{display:flex;flex-direction:column;gap:4px;max-height:190px;overflow-y:auto;border:1px solid var(--line);border-radius:var(--r-sm);padding:5px;background:var(--surface)}
      .ret-cat-opt{display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;border:none;background:none;
        border-radius:var(--r-xs);padding:8px 10px;font:inherit;font-size:13px;color:var(--ink);cursor:pointer;transition:background .12s}
      .ret-cat-opt:hover:not(:disabled){background:var(--surface-2)}
      .ret-cat-opt:disabled{opacity:.4;cursor:not-allowed}

      .ret-pills{display:flex;flex-wrap:wrap;gap:6px}
      .ret-pill{border:1px solid var(--line);background:var(--surface-2);border-radius:999px;padding:7px 13px;font:inherit;
        font-size:12.5px;font-weight:600;color:var(--ink-soft);cursor:pointer;transition:all .15s}
      .ret-pill:hover{border-color:var(--accent);color:var(--accent)}
      .ret-pill.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}

      .ret-methods{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:2px}

      .ret-summary{display:flex;flex-direction:column;gap:8px;border:1px solid var(--line);background:var(--surface-2);border-radius:var(--r);padding:14px}
      .ret-sum-row{display:flex;align-items:center;justify-content:space-between;font-size:13px;color:var(--ink-soft)}
      .ret-sum-net{display:flex;align-items:center;justify-content:space-between;padding-top:8px;margin-top:2px;border-top:1px dashed var(--line);font-weight:700}
      .ret-sum-net .big{font-size:20px;font-variant-numeric:tabular-nums}
      .ret-sum-net.pos{color:var(--teal)}
      .ret-sum-net.neg{color:var(--accent)}
      .ret-note{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:var(--surface);border-radius:var(--r-sm);padding:0 10px;color:var(--ink-faint)}
      .ret-note input{flex:1;border:none;background:none;padding:9px 0;font:inherit;font-size:13px;color:var(--ink)}
      .ret-note input:focus{outline:none}

      /* ===================== PELANGGAN (CRM) ===================== */
      /* -- kotak pelanggan di layar kasir -- */
      .cust-box{display:flex;flex-direction:column;gap:8px;border:1px solid var(--line);background:var(--surface-3);
        border-radius:var(--r-sm);padding:11px 12px}
      .cust-box-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
      .cust-box-title{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--ink-soft);
        text-transform:uppercase;letter-spacing:.04em}
      .cust-req{font-size:11px;font-weight:700;color:var(--accent);background:var(--accent-soft);
        border-radius:999px;padding:3px 9px;letter-spacing:.02em}
      .search.sm{padding:7px 11px;border-radius:var(--r-xs)}
      .search.sm input{font-size:13px}
      .cust-search{background:var(--surface)}
      .cust-ava{width:34px;height:34px;flex:0 0 34px;border-radius:50%;display:grid;place-items:center;
        background:var(--accent-soft);color:var(--accent);font-weight:700;font-size:15px;
        font-family:'Space Grotesk',sans-serif}
      .cust-ava.sm{width:28px;height:28px;flex:0 0 28px;font-size:13px}
      .cust-ava.big{width:46px;height:46px;flex:0 0 46px;font-size:20px}
      .cust-chip{display:flex;align-items:center;gap:10px;border:1px solid var(--teal);background:var(--teal-soft);
        border-radius:var(--r-sm);padding:8px 10px}
      .cust-chip-info{flex:1;min-width:0}
      .cust-chip-name{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cust-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--teal);
        background:var(--teal-soft);border:1px solid var(--teal);border-radius:999px;padding:2px 8px;white-space:nowrap}
      .cust-hits{display:flex;flex-direction:column;gap:4px;max-height:230px;overflow-y:auto}
      .cust-hit{display:flex;align-items:center;gap:9px;width:100%;text-align:left;border:1px solid var(--line);
        background:var(--surface);border-radius:var(--r-xs);padding:7px 9px;cursor:pointer;font:inherit;color:var(--ink);
        transition:border-color .15s,background .15s}
      .cust-hit:hover{border-color:var(--accent);background:var(--surface-2)}
      .cust-hit:disabled{opacity:.5;cursor:default}
      .cust-hit-info{flex:1;min-width:0}
      .cust-hit-name{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cust-hint{font-size:11.5px;color:var(--ink-faint)}
      .cust-hint.ok{color:var(--teal)}
      .cust-new-btn{align-self:flex-start}
      .cust-new{display:flex;flex-direction:column;gap:7px;border-top:1px dashed var(--line);padding-top:9px}
      .cust-kind{display:flex;align-items:center;gap:6px}
      .cust-kind-btn{flex:1;border:1px solid var(--line);background:var(--surface);border-radius:var(--r-xs);
        padding:7px 10px;font:inherit;font-size:12.5px;font-weight:600;color:var(--ink-soft);cursor:pointer;transition:all .15s}
      .cust-kind-btn:hover{border-color:var(--accent);color:var(--accent)}
      .cust-kind-btn.on{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
      .cust-new-close{flex:0 0 auto}

      .cust-clash{display:flex;align-items:flex-start;gap:7px;width:100%;text-align:left;border:1px solid var(--warn);
        background:var(--warn-bg);border-radius:var(--r-xs);padding:8px 10px;font:inherit;font-size:11.5px;
        line-height:1.45;color:var(--warn);cursor:pointer}
      .cust-clash:hover{background:rgba(224,165,60,.26)}
      .cust-clash svg{flex:0 0 auto;margin-top:1px}
      .cust-picked{display:inline-flex;align-items:center;gap:4px;margin-top:3px;font-size:11px;font-weight:600;
        color:var(--teal)}
      /* -- tab Data Customer -- */
      .cust-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
      .cust-pending{font-size:11.5px;font-weight:600;color:var(--warn);background:var(--warn-bg);
        border-radius:999px;padding:4px 10px}
      .cust-toolbar{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
      .cust-sort{display:flex;align-items:center;gap:7px}
      .cust-sort .sim-select{min-width:180px}
      .cust-table-wrap{overflow-x:auto;margin:0 -18px;padding:0 18px}
      .cust-tbl{min-width:920px}
      .cust-tbl td{vertical-align:middle}
      .cust-name-btn{display:flex;align-items:center;gap:9px;border:none;background:none;padding:0;margin:0;
        font:inherit;color:var(--ink);text-align:left;cursor:pointer}
      .cust-name-btn:hover .cust-name{color:var(--accent)}
      .cust-name{font-weight:600;transition:color .15s}
      .cust-tag{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;border-radius:999px;
        padding:2px 8px;margin-right:4px;white-space:nowrap;border:1px solid var(--line);color:var(--ink-faint)}
      .cust-tag.biz{border-color:var(--gold);color:var(--gold);background:var(--warn-bg)}
      .cust-tag.ret{border-color:var(--teal);color:var(--teal);background:var(--teal-soft)}
      .cust-tag.pasif{border-color:var(--accent);color:var(--accent);background:var(--accent-soft)}
      .wa-link{display:inline-flex;align-items:center;gap:5px;color:var(--teal);text-decoration:none;font-size:12.5px;
        font-weight:600;font-variant-numeric:tabular-nums}
      .wa-link:hover{text-decoration:underline}
      .cust-debt{color:var(--accent);font-weight:700}
      .icon-btn.warn{color:var(--warn)}
      .icon-btn.warn:hover{background:var(--warn-bg);color:var(--warn)}
      .trend-legend i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:5px;vertical-align:middle}

      /* -- rincian pelanggan -- */
      .cust-detail-head{display:flex;align-items:center;gap:12px}
      .cust-detail-name{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:700}
      .cust-note{margin-top:3px;font-style:italic}
      .cust-detail-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line);
        border:1px solid var(--line);border-radius:var(--r-sm);overflow:hidden}
      .cust-detail-stats>div{display:flex;flex-direction:column;gap:3px;background:var(--surface-2);padding:10px 12px}
      .cust-detail-stats b{font-size:14px}
      .cust-wa-row{display:flex;flex-wrap:wrap;gap:6px}
      .cust-debt-box{border:1px solid var(--accent);background:var(--accent-soft);border-radius:var(--r-sm);padding:11px 12px}
      .cust-debt-head{display:flex;align-items:center;gap:7px;font-weight:700;font-size:13px;color:var(--accent);margin-bottom:6px}
      .cust-debt-row{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;color:var(--ink-soft);padding:3px 0}
      .cust-hist{display:flex;flex-direction:column;gap:6px}
      .cust-hist-head{display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:13px;
        color:var(--ink-soft);text-transform:uppercase;letter-spacing:.04em}
      .cust-hist-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line-soft);
        background:var(--surface-2);border-radius:var(--r-xs);padding:9px 11px;font-size:13px}

      @media(max-width:760px){
        .cust-detail-stats{grid-template-columns:repeat(2,1fr)}
        .cust-table-wrap{margin:0 -14px;padding:0 14px}
        .cust-actions{width:100%}
        .cust-actions .btn{flex:1}
      }
    `}</style>
  );
}

export {
  Style
};
