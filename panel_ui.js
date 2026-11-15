/**
 * UI privada mobile-first (390px+) para https://pinciano.es/cpm
 * Embebida como módulo JS dentro del Cloudflare Worker (no servida en ASSETS).
 */

const BASE_CSS = `
:root {
  --bg: #060A09;
  --surface: #0C1411;
  --surface-2: #121D19;
  --border: rgba(255, 255, 255, 0.09);
  --border-accent: rgba(0, 255, 135, 0.35);
  --fg: #F2F7F4;
  --muted: #8FA399;
  --accent: #00FF87;
  --accent-soft: rgba(0, 255, 135, 0.12);
  --warn: #FFB547;
  --warn-soft: rgba(255, 181, 71, 0.14);
  --danger: #FF5C6C;
  --danger-soft: rgba(255, 92, 108, 0.14);
  --radius: 14px;
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html, body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.45;
  min-height: 100%;
  overflow-x: hidden;
}
.mono { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
.accent { color: var(--accent); }
.muted { color: var(--muted); }
button, input { font: inherit; color: inherit; }
button { cursor: pointer; background: none; border: 0; }
`;

function escHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function renderLoginHtml({ errorMessage = '' } = {}) {
  const errBlock = errorMessage
    ? `<div class="err-box" role="alert">${escHtml(errorMessage)}</div>`
    : '';
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="theme-color" content="#060A09" />
  <title>Pinciano CPM · Acceso privado</title>
  <style>
    ${BASE_CSS}
    body {
      display: grid;
      place-items: center;
      padding: 20px;
      background-image: radial-gradient(500px 320px at 50% -10%, rgba(0, 255, 135, 0.12), transparent 70%);
    }
    .card {
      width: 100%;
      max-width: 390px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 24px 20px;
      box-shadow: 0 24px 50px -24px rgba(0,0,0,0.85);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 12px var(--accent);
    }
    .brand h1 { font-size: 1.05rem; letter-spacing: 0.04em; }
    .sub { color: var(--muted); font-size: 0.88rem; margin-bottom: 18px; }
    .err-box {
      margin-bottom: 14px;
      padding: 10px 12px;
      border-radius: 10px;
      background: var(--danger-soft);
      border: 1px solid rgba(255,92,108,0.35);
      color: var(--danger);
      font-size: 0.86rem;
    }
    .field { display: grid; gap: 6px; margin-bottom: 14px; }
    .field label { font-size: 0.8rem; color: var(--muted); }
    .pw-wrap {
      display: flex;
      align-items: center;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding-right: 6px;
    }
    .pw-wrap:focus-within { border-color: var(--accent); }
    .pw-wrap input {
      width: 100%;
      min-height: 48px;
      padding: 0 12px;
      background: transparent;
      border: 0;
      outline: 0;
      font-size: 16px; /* evita zoom automático en iOS */
    }
    .toggle-pw {
      min-height: 36px;
      padding: 0 10px;
      border-radius: 8px;
      font-size: 0.78rem;
      color: var(--muted);
      background: var(--surface-2);
    }
    .remember {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 40px;
      margin-bottom: 18px;
      font-size: 0.88rem;
      color: var(--fg);
    }
    .remember input { width: 18px; height: 18px; accent-color: var(--accent); }
    .submit-btn {
      width: 100%;
      min-height: 48px;
      border-radius: 12px;
      background: var(--accent);
      color: #03150C;
      font-weight: 700;
      font-size: 0.98rem;
    }
    .submit-btn:active { transform: scale(0.99); }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">
      <span class="dot" aria-hidden="true"></span>
      <h1>PINCIANO · CPM PRIVADO</h1>
    </div>
    <p class="sub">Centro de mando móvil: agenda, visitas web, ranking y embudo Telegram.</p>
    ${errBlock}
    <form method="POST" action="/cpm/login" id="login-form">
      <div class="field">
        <label for="pw">Contraseña</label>
        <div class="pw-wrap">
          <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus />
          <button type="button" class="toggle-pw" id="toggle-pw">Ver</button>
        </div>
      </div>
      <label class="remember">
        <input type="checkbox" name="remember" value="1" checked />
        <span>Recordar 30 días en este móvil</span>
      </label>
      <button type="submit" class="submit-btn">Entrar al panel</button>
    </form>
  </main>
  <script>
    (function () {
      var pw = document.getElementById('pw');
      var btn = document.getElementById('toggle-pw');
      btn.addEventListener('click', function () {
        var show = pw.type === 'password';
        pw.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Ocultar' : 'Ver';
      });
    })();
  </script>
</body>
</html>`;
}

export function renderPanelHtml() {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="theme-color" content="#060A09" />
  <title>Pinciano CPM · Panel</title>
  <style>
    ${BASE_CSS}
    body { padding-bottom: calc(82px + env(safe-area-inset-bottom)); }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(6, 10, 9, 0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .topbar-left { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex: none; }
    .title { font-weight: 700; font-size: 0.96rem; white-space: nowrap; }
    .sync-ts { font-size: 0.72rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .top-actions { display: flex; gap: 8px; flex: none; }
    .btn-sm {
      min-height: 36px;
      padding: 0 12px;
      border-radius: 9px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      font-size: 0.8rem;
      font-weight: 600;
    }
    .btn-accent { border-color: var(--border-accent); color: var(--accent); background: var(--accent-soft); }
    main { max-width: 760px; margin: 0 auto; padding: 14px 14px 20px; }
    .view { display: none; gap: 12px; }
    .view.active { display: grid; }
    .kpi-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
    }
    .kpi-label { font-size: 0.74rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .kpi-val { font-size: 1.55rem; font-weight: 700; margin-top: 4px; }
    .kpi-sub { font-size: 0.76rem; color: var(--muted); margin-top: 3px; }
    .card-title { font-size: 0.88rem; font-weight: 700; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .badge {
      display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px;
      font-size: 0.7rem; font-weight: 600; font-family: var(--font-mono);
      border: 1px solid var(--border); background: var(--surface-2); color: var(--muted);
    }
    .b-sched { color: var(--accent); background: var(--accent-soft); border-color: var(--border-accent); }
    .b-draft { color: var(--warn); background: var(--warn-soft); border-color: rgba(255,181,71,0.3); }
    .b-pub { color: #7DD3FC; background: rgba(125,211,252,0.12); border-color: rgba(125,211,252,0.3); }
    .b-pend { color: #D8B4FE; background: rgba(192,132,252,0.14); border-color: rgba(192,132,252,0.3); }
    .b-err { color: var(--danger); background: var(--danger-soft); border-color: rgba(255,92,108,0.35); }
    .list { display: grid; gap: 8px; }
    .row-card {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 11px;
      padding: 11px 12px;
    }
    .row-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 5px; }
    .row-title { font-weight: 600; font-size: 0.92rem; }
    .row-meta { font-size: 0.76rem; color: var(--muted); display: flex; flex-wrap: wrap; gap: 8px; }
    details summary { cursor: pointer; list-style: none; }
    details summary::-webkit-details-marker { display: none; }
    .detail-body { margin-top: 9px; padding-top: 9px; border-top: 1px dashed var(--border); font-size: 0.82rem; color: #C5D3CC; white-space: pre-wrap; word-break: break-word; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
    .chip {
      min-height: 34px; padding: 0 11px; border-radius: 999px;
      border: 1px solid var(--border); background: var(--surface);
      font-size: 0.78rem; color: var(--muted);
    }
    .chip.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); font-weight: 600; }
    .cal-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 10px; }
    .cal-title { font-weight: 700; font-size: 0.96rem; text-transform: capitalize; }
    .cal-nav { display: flex; gap: 6px; align-items: center; }
    .cal-btn {
      min-height: 30px; min-width: 30px; padding: 0 9px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface-2); color: inherit; font-size: 0.78rem;
    }
    .cal-weekdays, .cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
    .cal-weekdays { margin-bottom: 4px; }
    .cal-wd { text-align: center; font-size: 0.68rem; color: var(--muted); font-weight: 600; padding: 2px 0; }
    .cal-day {
      min-height: 48px; padding: 5px 3px; border-radius: 9px;
      border: 1px solid var(--border); background: var(--surface-2);
      display: flex; flex-direction: column; align-items: center; justify-content: space-between;
      color: inherit; font-size: 0.78rem; position: relative;
    }
    .cal-day.out { opacity: 0.32; }
    .cal-day.today { border-color: var(--accent); box-shadow: inset 0 0 0 1px rgba(0,255,135,0.28); }
    .cal-day.sel { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
    .cal-day.gap-warn { border-style: dashed; border-color: rgba(251,191,36,0.45); }
    .cal-day-num { font-weight: 600; line-height: 1; }
    .cal-dots { display: flex; align-items: center; justify-content: center; gap: 2px; flex-wrap: wrap; min-height: 12px; }
    .cal-dot { width: 6px; height: 6px; border-radius: 999px; display: inline-block; }
    .cal-dot.sched { background: var(--accent); }
    .cal-dot.pub { background: #60A5FA; }
    .cal-dot.draft { background: #FBBF24; }
    .cal-count { font-size: 0.62rem; font-weight: 700; color: var(--accent); }
    .cal-legend { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 9px; font-size: 0.72rem; color: var(--muted); }
    .cal-legend span { display: inline-flex; align-items: center; gap: 4px; }
    .cal-cov { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; margin-top: 10px; }
    .cal-cov-day {
      flex: 0 0 auto; min-width: 72px; padding: 7px 8px; border-radius: 9px;
      border: 1px solid var(--border); background: var(--surface-2); text-align: left; color: inherit;
    }
    .cal-cov-day.sel { border-color: var(--accent); background: var(--accent-soft); }
    .cal-cov-lbl { font-size: 0.7rem; font-weight: 700; margin-bottom: 4px; color: var(--muted); text-transform: capitalize; }
    .cal-cov-day.today .cal-cov-lbl { color: var(--accent); }
    .cal-cov-slots { display: flex; flex-direction: column; gap: 2px; font-size: 0.69rem; }
    .slot-ok { color: var(--accent); font-weight: 600; }
    .slot-empty { color: #FBBF24; opacity: 0.85; }
    .cal-day-hdr {
      display: flex; justify-content: space-between; align-items: center; gap: 8px;
      margin: 12px 2px 6px; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.03em; color: var(--muted);
      text-transform: uppercase;
    }
    .cal-day-hdr.today { color: var(--accent); }
    .slot-card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .slot-time {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 700; font-size: 0.84rem;
      padding: 2px 8px; border-radius: 7px; background: var(--accent-soft); color: var(--accent);
    }
    .net-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .net-pill {
      font-size: 0.7rem; font-weight: 600; padding: 2px 7px; border-radius: 6px;
      border: 1px solid var(--border); background: var(--surface); color: #DCE6E1;
    }
    .slot-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }
    .cal-ext {
      display: inline-flex; align-items: center; gap: 4px; font-size: 0.76rem; font-weight: 600;
      padding: 4px 10px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border);
      color: var(--accent); text-decoration: none;
    }
    .cal-sub-toggle { font-size: 0.76rem; color: var(--muted); cursor: pointer; }
    .ch-copy { padding: 8px 0; border-top: 1px dashed var(--border); }
    .ch-copy:first-child { border-top: 0; padding-top: 2px; }
    .ch-copy-head { font-weight: 700; font-size: 0.76rem; color: var(--accent); margin-bottom: 3px; }
    .bar-row { display: grid; gap: 5px; }
    .bar-head { display: flex; justify-content: space-between; font-size: 0.82rem; }
    .bar-track { height: 7px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 999px; background: var(--accent); }
    .alert-item {
      padding: 10px 12px; border-radius: 10px; font-size: 0.84rem;
      border: 1px solid rgba(255,181,71,0.3); background: var(--warn-soft); color: #FFE1B0;
    }
    .tabbar {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      z-index: 30;
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
      padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
      background: rgba(12, 20, 17, 0.96);
      backdrop-filter: blur(12px);
      border-top: 1px solid var(--border);
    }
    .tab {
      min-height: 48px;
      display: grid;
      place-items: center;
      gap: 2px;
      border-radius: 10px;
      font-size: 0.75rem;
      color: var(--muted);
      font-weight: 600;
    }
    .tab.active { color: var(--accent); background: var(--accent-soft); }
    .empty { color: var(--muted); font-size: 0.85rem; padding: 6px 0; }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-left">
      <span class="dot" aria-hidden="true"></span>
      <div>
        <div class="title">Pinciano CPM</div>
        <div class="sync-ts mono" id="sync-ts">Cargando...</div>
      </div>
    </div>
    <div class="top-actions">
      <button type="button" class="btn-sm btn-accent" id="btn-refresh">Actualizar</button>
      <button type="button" class="btn-sm" id="btn-logout">Salir</button>
    </div>
  </header>

  <main>
    <!-- 1. HOY -->
    <section class="view active" id="view-hoy" aria-label="Resumen de hoy">
      <div class="kpi-grid" id="hoy-kpis"></div>
      <div class="card" id="hoy-next"></div>
      <div class="card" id="hoy-alerts"></div>
      <div class="card" id="hoy-gaps"></div>
    </section>

    <!-- 2. CALENDARIO -->
    <section class="view" id="view-agenda" aria-label="Calendario editorial">
      <div class="card" id="cal-board"></div>
      <div class="card">
        <div class="chips" id="flt-status">
          <button type="button" class="chip on" data-status="upcoming">Por publicar</button>
          <button type="button" class="chip" data-status="all">Todos</button>
          <button type="button" class="chip" data-status="scheduled">Programado</button>
          <button type="button" class="chip" data-status="draft">Borrador</button>
          <button type="button" class="chip" data-status="pending_upload">Por subir</button>
          <button type="button" class="chip" data-status="published">Publicado</button>
        </div>
        <div class="chips" id="flt-net">
          <button type="button" class="chip on" data-net="all">Todas</button>
          <button type="button" class="chip" data-net="instagram">IG</button>
          <button type="button" class="chip" data-net="tiktok">TikTok</button>
          <button type="button" class="chip" data-net="youtube">YT</button>
          <button type="button" class="chip" data-net="x">X</button>
          <button type="button" class="chip" data-net="threads">Threads</button>
        </div>
        <div class="chips" style="margin-bottom:0">
          <button type="button" class="chip on" id="cal-group-btn" data-cal-action="toggle-group">Agrupar redes (1 tarjeta por Reel)</button>
        </div>
      </div>
      <div id="cal-active-day"></div>
      <div class="list" id="agenda-list"></div>
      <div id="cal-gaps" style="margin-top:12px"></div>
    </section>

    <!-- 3. RANKING -->
    <section class="view" id="view-ranking" aria-label="Ranking de rendimiento">
      <div class="card" id="rank-winners"></div>
      <div class="card" id="rank-losers"></div>
      <div class="card" id="rank-channels"></div>
      <div class="card" id="rank-formats"></div>
      <div class="card" id="rank-insights"></div>
    </section>

    <!-- 4. EMBUDO -->
    <section class="view" id="view-embudo" aria-label="Embudo web y Telegram">
      <div class="card" id="emb-web"></div>
      <div class="card" id="emb-clicks"></div>
      <div class="card" id="emb-tg"></div>
      <div class="card">
        <button type="button" class="btn-sm btn-accent" style="width:100%;min-height:44px" id="btn-refresh-2">Actualizar datos ahora</button>
      </div>
    </section>
  </main>

  <nav class="tabbar" aria-label="Navegación principal">
    <button type="button" class="tab active" data-tab="hoy"><span>Hoy</span></button>
    <button type="button" class="tab" data-tab="agenda"><span>Calendario</span></button>
    <button type="button" class="tab" data-tab="ranking"><span>Ranking</span></button>
    <button type="button" class="tab" data-tab="embudo"><span>Embudo</span></button>
  </nav>

  <script>
    (function () {
      var state = { data: null, status: 'upcoming', net: 'all', timer: null, calDay: null, calYm: null, calGroup: true };

      function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }

      function fmtCet(iso) {
        if (!iso) return 'Sin fecha';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return String(iso);
        return d.toLocaleString('es-ES', {
          timeZone: 'Europe/Madrid',
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        }) + ' CET';
      }

      function statusBadge(st) {
        if (st === 'scheduled') return '<span class="badge b-sched">Programado</span>';
        if (st === 'published') return '<span class="badge b-pub">Publicado</span>';
        if (st === 'pending_upload') return '<span class="badge b-pend">Por subir</span>';
        if (st === 'error' || st === 'failed') return '<span class="badge b-err">Error</span>';
        return '<span class="badge b-draft">Borrador</span>';
      }

      function netLabel(n) {
        var map = { x: 'X', instagram: 'IG', tiktok: 'TikTok', youtube: 'YT', threads: 'Threads', telegram: 'TG' };
        return map[String(n || '').toLowerCase()] || String(n || '—').toUpperCase();
      }

      function countdownText(iso) {
        if (!iso) return 'Sin programación';
        var diff = new Date(iso).getTime() - Date.now();
        if (isNaN(diff)) return '—';
        if (diff <= 0) return 'Saliendo ahora';
        var mins = Math.floor(diff / 60000);
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        var d = Math.floor(h / 24);
        if (d > 0) return 'En ' + d + 'd ' + (h % 24) + 'h';
        if (h > 0) return 'En ' + h + 'h ' + m + 'm';
        return 'En ' + m + 'm';
      }

      function renderHoy(d) {
        var v = d.visits || {};
        var tg = d.telegram || {};
        var items = d.calendar || [];
        var now = Date.now();
        var upcoming = items
          .filter(function (it) { return it.status === 'scheduled' && it.scheduled_at && new Date(it.scheduled_at).getTime() >= now; })
          .sort(function (a, b) { return new Date(a.scheduled_at) - new Date(b.scheduled_at); });
        var nextItem = upcoming[0] || items.find(function (it) { return it.status === 'scheduled'; }) || null;

        document.getElementById('hoy-kpis').innerHTML =
          '<div class="card"><div class="kpi-label">Visitas hoy</div><div class="kpi-val mono accent">' + (v.today || 0) + '</div><div class="kpi-sub">7d: ' + (v.last_7d || 0) + ' · Total: ' + (v.total || 0) + '</div></div>' +
          '<div class="card"><div class="kpi-label">Telegram / Bot</div><div class="kpi-val mono">' + (tg.total_members || 0) + '</div><div class="kpi-sub">Fundadores: ' + (tg.founders_taken || 0) + '/100</div></div>';

        var nextHtml = '<div class="card-title"><span>Próxima publicación</span>';
        if (nextItem) {
          nextHtml += '<span class="badge b-sched" id="next-cd">' + esc(countdownText(nextItem.scheduled_at)) + '</span></div>' +
            '<div class="row-title">' + esc(nextItem.title || nextItem.text || 'Publicación programada') + '</div>' +
            '<div class="row-meta" style="margin-top:6px"><span>' + esc(netLabel(nextItem.network)) + '</span><span>' + esc(fmtCet(nextItem.scheduled_at)) + '</span></div>';
        } else {
          nextHtml += '<span class="badge">Sin cola</span></div><p class="empty">No hay publicaciones programadas en cola ahora mismo.</p>';
        }
        document.getElementById('hoy-next').innerHTML = nextHtml;

        var alerts = d.alerts || [];
        document.getElementById('hoy-alerts').innerHTML =
          '<div class="card-title"><span>Alertas de rendimiento</span><span class="badge">' + alerts.length + '</span></div>' +
          (alerts.length
            ? '<div class="list">' + alerts.map(function (a) { return '<div class="alert-item">' + esc(a) + '</div>'; }).join('') + '</div>'
            : '<p class="empty">Sin alertas activas.</p>');

        var gaps = d.gaps || [];
        document.getElementById('hoy-gaps').innerHTML =
          '<div class="card-title"><span>Huecos por cubrir</span><span class="badge">' + gaps.length + '</span></div>' +
          (gaps.length
            ? '<div class="list">' + gaps.map(function (g) {
                return '<details class="row-card"><summary><div class="row-top"><span class="badge">' + esc((g.networks || []).map(netLabel).join(' · ') || 'Campaña') + '</span>' + statusBadge(g.status) + '</div><div class="row-title">' + esc(g.title || '') + '</div><div class="row-meta" style="margin-top:4px"><span>' + esc(g.target_window || '') + '</span></div></summary><div class="detail-body">' + esc(g.action_needed || '') + '</div></details>';
              }).join('') + '</div>'
            : '<p class="empty">Agenda semanal cubierta.</p>');

        clearInterval(state.timer);
        if (nextItem && nextItem.scheduled_at) {
          state.timer = setInterval(function () {
            var el = document.getElementById('next-cd');
            if (el) el.textContent = countdownText(nextItem.scheduled_at);
          }, 30000);
        }
      }

      var MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      var MON_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      var WD_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

      function pad2(n) { return n < 10 ? '0' + n : String(n); }

      function madridParts(isoOrMs) {
        if (!isoOrMs) return null;
        var dt = new Date(isoOrMs);
        if (isNaN(dt.getTime())) return null;
        var parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/Madrid',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).formatToParts(dt);
        var mp = {};
        for (var i = 0; i < parts.length; i += 1) {
          mp[parts[i].type] = parts[i].value;
        }
        var hh = mp.hour === '24' ? '00' : mp.hour;
        return {
          y: Number(mp.year),
          m: Number(mp.month),
          d: Number(mp.day),
          h: Number(hh),
          hhmm: hh + ':' + mp.minute,
          ymd: mp.year + '-' + mp.month + '-' + mp.day,
          ym: mp.year + '-' + mp.month,
          ms: dt.getTime()
        };
      }

      function mondayIdx(y, m, d) {
        return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
      }

      function addDaysYmd(baseYmd, delta) {
        var p = baseYmd.split('-');
        var dt = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]) + delta));
        return dt.getUTCFullYear() + '-' + pad2(dt.getUTCMonth() + 1) + '-' + pad2(dt.getUTCDate());
      }

      function ymShift(ymStr, delta) {
        var p = ymStr.split('-');
        var dt = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1 + delta, 1));
        return dt.getUTCFullYear() + '-' + pad2(dt.getUTCMonth() + 1);
      }

      function formatDayHeading(ymd, todayYmd, tomorrowYmd) {
        var p = ymd.split('-');
        var y = Number(p[0]);
        var m = Number(p[1]);
        var d = Number(p[2]);
        var wd = WD_SHORT[mondayIdx(y, m, d)];
        var base = wd + ' ' + d + ' ' + MON_SHORT[m - 1];
        if (ymd === todayYmd) return 'Hoy · ' + base;
        if (ymd === tomorrowYmd) return 'Mañana · ' + base;
        return base;
      }

      function cleanTitle(raw, text) {
        var t = String(raw || '').trim();
        if (!t && text) t = String(text).split('\\n')[0].slice(0, 72);
        t = t.replace(/\\s*\\((?:Shorts|TIKTOK|INSTAGRAM|IG|YT|Reels?)\\)\\s*$/i, '').trim();
        return t || 'Sin título';
      }

      function safeHref(u) {
        var s = String(u || '').trim();
        return (s.indexOf('https://') === 0 || s.indexOf('http://') === 0) ? s : '';
      }

      function relTime(targetMs, nowMs) {
        var diff = targetMs - nowMs;
        var abs = Math.abs(diff);
        if (abs < 60000) return diff >= 0 ? 'Ahora' : 'Hace <1 min';
        if (abs < 3600000) {
          var mins = Math.round(abs / 60000);
          return diff >= 0 ? 'En ' + mins + ' min' : 'Hace ' + mins + ' min';
        }
        if (abs < 86400000) {
          var hrs = Math.round(abs / 3600000);
          return diff >= 0 ? 'En ' + hrs + ' h' : 'Hace ' + hrs + ' h';
        }
        var days = Math.round(abs / 86400000);
        return diff >= 0 ? 'En ' + days + ' d' : 'Hace ' + days + ' d';
      }

      function bindCalendarEvents() {
        var viewEl = document.getElementById('view-agenda');
        if (!viewEl || viewEl.dataset.calBound === '1') return;
        viewEl.dataset.calBound = '1';
        viewEl.addEventListener('click', function (ev) {
          var navBtn = ev.target.closest('[data-cal-nav]');
          if (navBtn) {
            var dir = navBtn.getAttribute('data-cal-nav');
            var todayInfo = madridParts(Date.now());
            var curYm = state.calYm || (todayInfo ? todayInfo.ym : '2026-11');
            if (dir === 'prev') state.calYm = ymShift(curYm, -1);
            else if (dir === 'next') state.calYm = ymShift(curYm, 1);
            else if (dir === 'today' && todayInfo) {
              state.calYm = todayInfo.ym;
              state.calDay = null;
            }
            renderAgenda(state.data || {});
            return;
          }
          var dayBtn = ev.target.closest('[data-cal-day]');
          if (dayBtn) {
            var clicked = dayBtn.getAttribute('data-cal-day');
            state.calDay = state.calDay === clicked ? null : clicked;
            state.calYm = clicked.slice(0, 7);
            renderAgenda(state.data || {});
            return;
          }
          var actBtn = ev.target.closest('[data-cal-action]');
          if (actBtn) {
            var act = actBtn.getAttribute('data-cal-action');
            if (act === 'clear-day') {
              state.calDay = null;
            } else if (act === 'toggle-group') {
              state.calGroup = !state.calGroup;
            } else if (act === 'show-all-status') {
              state.status = 'all';
              var chips = document.querySelectorAll('#flt-status .chip');
              for (var c = 0; c < chips.length; c += 1) {
                chips[c].classList.toggle('on', chips[c].getAttribute('data-status') === 'all');
              }
            }
            renderAgenda(state.data || {});
          }
        });
      }

      function renderCalendarBoard(allNetItems, todayInfo, tomorrowYmd) {
        var boardEl = document.getElementById('cal-board');
        if (!boardEl) return;
        var todayYmd = todayInfo ? todayInfo.ymd : '2026-11-15';
        var activeYm = state.calYm || (todayInfo ? todayInfo.ym : '2026-11');
        var parts = activeYm.split('-');
        var y = Number(parts[0]);
        var m = Number(parts[1]);

        var byDay = {};
        for (var i = 0; i < allNetItems.length; i += 1) {
          var it = allNetItems[i];
          var ts = it.status === 'published' ? (it.published_at || it.scheduled_at) : (it.scheduled_at || it.published_at);
          if (!ts) continue;
          var mp = madridParts(ts);
          if (!mp) continue;
          if (!byDay[mp.ymd]) {
            byDay[mp.ymd] = { schedSlots: {}, pubCount: 0, schedCount: 0, draftCount: 0, items: [] };
          }
          var bucket = byDay[mp.ymd];
          bucket.items.push({ item: it, mp: mp });
          if (it.status === 'published') {
            bucket.pubCount += 1;
          } else if (it.status === 'scheduled' || it.status === 'pending_upload') {
            bucket.schedCount += 1;
            var slotKey = mp.hhmm + '|' + (safeHref(it.asset_url) || cleanTitle(it.title, it.text).toLowerCase());
            bucket.schedSlots[slotKey] = true;
          } else {
            bucket.draftCount += 1;
          }
        }

        // Cobertura próximos 7 días (franjas 13:00 y 20:00 + total)
        var covDays = [];
        var coveredReels = 0;
        for (var offset = 0; offset < 7; offset += 1) {
          var dYmd = addDaysYmd(todayYmd, offset);
          var info = byDay[dYmd] || { items: [] };
          var has13 = false;
          var has20 = false;
          var extra = 0;
          for (var j = 0; j < info.items.length; j += 1) {
            var entry = info.items[j];
            var st = entry.item.status;
            if (st !== 'scheduled' && st !== 'published') continue;
            var net = String(entry.item.network || '').toLowerCase();
            var isVideo = net === 'instagram' || net === 'tiktok' || net === 'youtube';
            if (isVideo && entry.mp.h >= 11 && entry.mp.h < 16) has13 = true;
            else if (isVideo && entry.mp.h >= 17 && entry.mp.h <= 22) has20 = true;
            else if (!isVideo) extra += 1;
          }
          if (has13) coveredReels += 1;
          if (has20) coveredReels += 1;
          var dParts = dYmd.split('-');
          var lbl = offset === 0 ? 'Hoy ' + Number(dParts[2]) : (offset === 1 ? 'Mañ ' + Number(dParts[2]) : WD_SHORT[mondayIdx(Number(dParts[0]), Number(dParts[1]), Number(dParts[2]))] + ' ' + Number(dParts[2]));
          var cls = 'cal-cov-day' + (offset === 0 ? ' today' : '') + (state.calDay === dYmd ? ' sel' : '');
          covDays.push(
            '<button type="button" class="' + cls + '" data-cal-day="' + dYmd + '">' +
              '<div class="cal-cov-lbl">' + esc(lbl) + '</div>' +
              '<div class="cal-cov-slots">' +
                '<span class="' + (has13 ? 'slot-ok' : 'slot-empty') + '">13h ' + (has13 ? '✓' : '·') + '</span>' +
                '<span class="' + (has20 ? 'slot-ok' : 'slot-empty') + '">20h ' + (has20 ? '✓' : '·') + '</span>' +
                (extra > 0 ? '<span style="color:#93C5FD">+' + extra + ' X</span>' : '') +
              '</div>' +
            '</button>'
          );
        }

        // Rejilla mensual (lunes a domingo)
        var firstWd = mondayIdx(y, m, 1);
        var totalDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
        var prevMonthDays = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
        var totalCells = Math.ceil((firstWd + totalDays) / 7) * 7;
        var next7End = addDaysYmd(todayYmd, 6);
        var cells = [];
        for (var idx = 0; idx < totalCells; idx += 1) {
          var dayNum;
          var cellYm = activeYm;
          var out = false;
          if (idx < firstWd) {
            dayNum = prevMonthDays - firstWd + idx + 1;
            cellYm = ymShift(activeYm, -1);
            out = true;
          } else if (idx >= firstWd + totalDays) {
            dayNum = idx - firstWd - totalDays + 1;
            cellYm = ymShift(activeYm, 1);
            out = true;
          } else {
            dayNum = idx - firstWd + 1;
          }
          var cellYmd = cellYm + '-' + pad2(dayNum);
          var cellBucket = byDay[cellYmd];
          var slotCount = cellBucket ? Object.keys(cellBucket.schedSlots).length : 0;
          var pubCount = cellBucket ? cellBucket.pubCount : 0;
          var draftCount = cellBucket ? cellBucket.draftCount : 0;
          var inWindowNoSched = !out && cellYmd >= todayYmd && cellYmd <= next7End && slotCount === 0;
          var cCls = 'cal-day' +
            (out ? ' out' : '') +
            (cellYmd === todayYmd ? ' today' : '') +
            (state.calDay === cellYmd ? ' sel' : '') +
            (inWindowNoSched ? ' gap-warn' : '');

          var dotsHtml = '';
          if (slotCount > 0) dotsHtml += '<span class="cal-count">' + slotCount + '✓</span>';
          if (pubCount > 0) dotsHtml += '<span class="cal-dot pub" title="' + pubCount + ' publicado(s)"></span>';
          if (draftCount > 0) dotsHtml += '<span class="cal-dot draft" title="' + draftCount + ' borrador(es)"></span>';

          cells.push(
            '<button type="button" class="' + cCls + '" data-cal-day="' + cellYmd + '">' +
              '<span class="cal-day-num">' + dayNum + '</span>' +
              '<span class="cal-dots">' + dotsHtml + '</span>' +
            '</button>'
          );
        }

        var titleText = MONTHS_ES[m - 1] + ' ' + y;
        var weekdaysHtml = WD_SHORT.map(function (w) { return '<div class="cal-wd">' + w.toUpperCase() + '</div>'; }).join('');
        boardEl.innerHTML =
          '<div class="cal-head">' +
            '<div>' +
              '<div class="cal-title">' + esc(titleText) + '</div>' +
              '<div class="muted" style="font-size:0.74rem">Reels 7 días: ' + coveredReels + '/14 franjas (13:00 y 20:00 CET)</div>' +
            '</div>' +
            '<div class="cal-nav">' +
              '<button type="button" class="cal-btn" data-cal-nav="prev" aria-label="Mes anterior">‹</button>' +
              '<button type="button" class="cal-btn" data-cal-nav="today">Hoy</button>' +
              '<button type="button" class="cal-btn" data-cal-nav="next" aria-label="Mes siguiente">›</button>' +
            '</div>' +
          '</div>' +
          '<div class="cal-weekdays">' + weekdaysHtml + '</div>' +
          '<div class="cal-grid">' + cells.join('') + '</div>' +
          '<div class="cal-legend">' +
            '<span><i class="cal-dot sched"></i> Programado</span>' +
            '<span><i class="cal-dot pub"></i> Publicado</span>' +
            '<span><i class="cal-dot draft"></i> Borrador</span>' +
            '<span style="color:#FBBF24">◌ Día próximo sin franja</span>' +
          '</div>' +
          '<div class="cal-cov" aria-label="Cobertura próximos 7 días">' + covDays.join('') + '</div>';
      }

      function renderSlotCard(grp, nowMs) {
        var first = grp.items[0];
        var timeHtml = grp.mp ? '<span class="slot-time">' + esc(grp.mp.hhmm) + ' CET</span>' : '<span class="badge">Sin fecha</span>';
        var relHtml = (grp.mp && grp.status === 'scheduled')
          ? '<span class="badge">' + esc(relTime(grp.mp.ms, nowMs)) + '</span>'
          : '';
        var NET_ORDER = { instagram: 0, tiktok: 1, youtube: 2, x: 3, threads: 4 };
        var sortedItems = grp.items.slice().sort(function (a, b) {
          var na = String(a.network || '').toLowerCase();
          var nb = String(b.network || '').toLowerCase();
          var oa = NET_ORDER[na] != null ? NET_ORDER[na] : 99;
          var ob = NET_ORDER[nb] != null ? NET_ORDER[nb] : 99;
          return oa - ob;
        });
        var netsSeen = {};
        var netPills = [];
        for (var i = 0; i < sortedItems.length; i += 1) {
          var n = String(sortedItems[i].network || '').toLowerCase();
          if (n && !netsSeen[n]) {
            netsSeen[n] = true;
            netPills.push('<span class="net-pill">' + esc(netLabel(n)) + '</span>');
          }
        }
        var mpHref = safeHref(grp.asset_url);
        var postHref = sortedItems.length === 1 ? safeHref(first.url) : '';
        var actions = [];
        if (mpHref) {
          actions.push('<a class="cal-ext" href="' + esc(mpHref) + '" target="_blank" rel="noopener noreferrer">▶ Ver vídeo</a>');
        }
        if (postHref) {
          actions.push('<a class="cal-ext" href="' + esc(postHref) + '" target="_blank" rel="noopener noreferrer">Abrir post</a>');
        }

        var detailBlocks = sortedItems.map(function (it) {
          var m = it.metrics || {};
          var mLine = (m.views != null || m.likes != null)
            ? '\\nMétricas: ' + (m.views || 0) + ' vistas · ' + (m.likes || 0) + ' likes · ' + (m.replies || 0) + ' resp · ' + (m.reposts || 0) + ' RT'
            : '';
          var extraNotes = it.notes && it.notes !== it.text ? '\\nNotas: ' + it.notes : '';
          var uLine = it.url ? '\\nPost: ' + it.url : '';
          var aLine = it.asset_url ? '\\nVídeo: ' + it.asset_url : '';
          var head = sortedItems.length > 1
            ? '<div class="ch-copy-head">' + esc(netLabel(it.network)) + ' · ' + esc(it.format || 'post') + '</div>'
            : '';
          return '<div class="ch-copy">' + head + esc((it.text || 'Sin texto.') + mLine + extraNotes + uLine + aLine) + '</div>';
        }).join('');

        var metaBits = [];
        if (first.recommended_slot_label) metaBits.push(first.recommended_slot_label);
        if (first.format) metaBits.push(first.format);
        if (first.source) metaBits.push(first.source);

        return '<article class="row-card">' +
          '<div class="slot-card-top">' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' + timeHtml + relHtml + '</div>' +
            statusBadge(grp.status) +
          '</div>' +
          '<div class="row-title">' + esc(grp.title) + '</div>' +
          '<div class="net-pills">' + netPills.join('') + '</div>' +
          (metaBits.length ? '<div class="row-meta" style="margin-top:6px"><span>' + esc(metaBits.join(' · ')) + '</span></div>' : '') +
          (actions.length ? '<div class="slot-actions">' + actions.join('') + '</div>' : '') +
          '<details style="margin-top:8px">' +
            '<summary class="cal-sub-toggle">Ver copy y detalles (' + grp.items.length + (grp.items.length === 1 ? ' canal' : ' canales') + ') ▾</summary>' +
            '<div class="detail-body">' + detailBlocks + '</div>' +
          '</details>' +
        '</article>';
      }

      function renderAgenda(d) {
        bindCalendarEvents();
        var groupBtn = document.getElementById('cal-group-btn');
        if (groupBtn) groupBtn.classList.toggle('on', Boolean(state.calGroup));

        var nowMs = Date.now();
        var todayInfo = madridParts(nowMs);
        var todayYmd = todayInfo ? todayInfo.ymd : '2026-11-15';
        var tomorrowYmd = addDaysYmd(todayYmd, 1);

        var allNetItems = (d.calendar || []).filter(function (it) {
          return state.net === 'all' || String(it.network || '').toLowerCase() === state.net;
        });

        renderCalendarBoard(allNetItems, todayInfo, tomorrowYmd);

        var activeDayEl = document.getElementById('cal-active-day');
        if (activeDayEl) {
          activeDayEl.innerHTML = state.calDay
            ? '<div class="chips" style="margin-bottom:8px"><button type="button" class="chip on" data-cal-action="clear-day">Día: ' + esc(formatDayHeading(state.calDay, todayYmd, tomorrowYmd)) + ' × Ver todo</button></div>'
            : '';
        }

        var items = allNetItems.filter(function (it) {
          if (state.status === 'upcoming') {
            return it.status === 'scheduled' || it.status === 'pending_upload' || it.status === 'failed' || it.status === 'draft';
          }
          return state.status === 'all' || it.status === state.status;
        });

        // Separa piezas con fecha vs borradores sin fecha
        var dated = [];
        var undated = [];
        for (var i = 0; i < items.length; i += 1) {
          var it = items[i];
          var ts = it.status === 'published' ? (it.published_at || it.scheduled_at) : (it.scheduled_at || it.published_at);
          var mp = ts ? madridParts(ts) : null;
          if (mp) {
            if (!state.calDay || mp.ymd === state.calDay) {
              dated.push({ item: it, mp: mp });
            }
          } else if (!state.calDay) {
            undated.push(it);
          }
        }

        // Ordenar: futuros/todos ascendente para próximos, publicados descendente
        dated.sort(function (a, b) {
          if (state.status === 'published') return b.mp.ms - a.mp.ms;
          var aPub = a.item.status === 'published';
          var bPub = b.item.status === 'published';
          if (state.status === 'all' && aPub !== bPub) return aPub ? 1 : -1;
          if (aPub && bPub) return b.mp.ms - a.mp.ms;
          return a.mp.ms - b.mp.ms;
        });

        // Agrupar o listar por pieza
        function makeGroups(rows) {
          if (!state.calGroup) {
            return rows.map(function (r) {
              return {
                mp: r.mp,
                status: r.item.status,
                title: r.item.title || cleanTitle('', r.item.text),
                asset_url: r.item.asset_url || null,
                items: [r.item]
              };
            });
          }
          var map = {};
          var order = [];
          for (var k = 0; k < rows.length; k += 1) {
            var r = rows[k];
            var it = r.item;
            var baseT = cleanTitle(it.title, it.text);
            var gKey = r.mp.ymd + '|' + r.mp.hhmm + '|' + String(it.status || '') + '|' + (safeHref(it.asset_url) || baseT.toLowerCase());
            if (!map[gKey]) {
              map[gKey] = {
                mp: r.mp,
                status: it.status,
                title: baseT,
                asset_url: it.asset_url || null,
                items: []
              };
              order.push(map[gKey]);
            }
            map[gKey].items.push(it);
            if (!map[gKey].asset_url && it.asset_url) map[gKey].asset_url = it.asset_url;
          }
          return order;
        }

        var groups = makeGroups(dated);
        var el = document.getElementById('agenda-list');
        var htmlParts = [];

        if (groups.length) {
          var currentDay = null;
          for (var gIdx = 0; gIdx < groups.length; gIdx += 1) {
            var g = groups[gIdx];
            if (g.mp.ymd !== currentDay) {
              currentDay = g.mp.ymd;
              var dayHdrCls = 'cal-day-hdr' + (currentDay === todayYmd ? ' today' : '');
              htmlParts.push('<div class="' + dayHdrCls + '"><span>' + esc(formatDayHeading(currentDay, todayYmd, tomorrowYmd)) + '</span><span>' + esc(currentDay) + '</span></div>');
            }
            htmlParts.push(renderSlotCard(g, nowMs));
          }
        }

        if (undated.length) {
          htmlParts.push('<div class="cal-day-hdr"><span>Borradores sin fecha (pendientes de programar)</span><span>' + undated.length + '</span></div>');
          for (var u = 0; u < undated.length; u += 1) {
            var uIt = undated[u];
            htmlParts.push(renderSlotCard({
              mp: null,
              status: uIt.status,
              title: uIt.title || cleanTitle('', uIt.text),
              asset_url: uIt.asset_url || null,
              items: [uIt]
            }, nowMs));
          }
        }

        if (!htmlParts.length) {
          var hasDayOtherStatus = state.calDay && allNetItems.some(function (it) {
            var ts = it.status === 'published' ? (it.published_at || it.scheduled_at) : (it.scheduled_at || it.published_at);
            var mp = ts ? madridParts(ts) : null;
            return mp && mp.ymd === state.calDay;
          });
          if (hasDayOtherStatus) {
            el.innerHTML = '<div class="card"><p class="empty">Ese día no tiene piezas en este filtro, pero sí en otro estado.</p><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="chip on" data-cal-action="show-all-status">Ver todo ese día</button><button type="button" class="chip" data-cal-action="clear-day">Quitar filtro de día</button></div></div>';
          } else {
            el.innerHTML = '<div class="card"><p class="empty">Nada coincide con estos filtros.</p></div>';
          }
        } else {
          el.innerHTML = htmlParts.join('');
        }

        var gapsEl = document.getElementById('cal-gaps');
        if (gapsEl) {
          var gaps = d.gaps || [];
          if (gaps.length && !state.calDay && (state.status === 'upcoming' || state.status === 'all' || state.status === 'draft' || state.status === 'pending_upload')) {
            gapsEl.innerHTML =
              '<div class="card">' +
                '<div class="card-title"><span>Huecos y tareas pendientes</span><span class="badge warn">' + gaps.length + '</span></div>' +
                '<div class="list">' +
                  gaps.map(function (gp) {
                    var nets = Array.isArray(gp.networks) ? gp.networks.map(netLabel).join(', ') : '';
                    return '<div class="row-card">' +
                      '<div class="row-top"><span class="badge">' + esc(nets || 'editorial') + '</span><span class="badge">' + esc(gp.target_window || 'Próximo') + '</span></div>' +
                      '<div class="row-title">' + esc(gp.title || 'Pendiente') + '</div>' +
                      (gp.action_needed ? '<div class="row-meta" style="margin-top:4px">' + esc(gp.action_needed) + '</div>' : '') +
                    '</div>';
                  }).join('') +
                '</div>' +
              '</div>';
          } else {
            gapsEl.innerHTML = '';
          }
        }
      }

      function renderBars(elId, title, rows) {
        var max = Math.max(1, Math.max.apply(null, rows.map(function (r) { return Number(r.score || r.value || 0); }).concat([1])));
        document.getElementById(elId).innerHTML =
          '<div class="card-title"><span>' + esc(title) + '</span></div>' +
          (rows.length
            ? '<div class="list">' + rows.map(function (r) {
                var val = Number(r.score != null ? r.score : (r.value || 0));
                var pct = Math.max(4, Math.min(100, (val / max) * 100));
                return '<div class="bar-row"><div class="bar-head"><span>' + esc(r.label) + '</span><span class="mono accent">' + esc(r.display || val.toFixed(1)) + '</span></div><div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>';
              }).join('') + '</div>'
            : '<p class="empty">Sin datos suficientes todavía.</p>');
      }

      function renderRanking(d) {
        var rk = d.ranking || {};
        function renderList(elId, title, arr, emptyTxt) {
          document.getElementById(elId).innerHTML =
            '<div class="card-title"><span>' + esc(title) + '</span><span class="badge">' + arr.length + '</span></div>' +
            (arr.length
              ? '<div class="list">' + arr.map(function (x, i) {
                  return '<div class="row-card"><div class="row-top"><span class="badge">#' + (i + 1) + ' · ' + esc(netLabel(x.network)) + '</span><span class="mono accent">' + esc(x.score != null ? Number(x.score).toFixed(1) + ' pts' : '') + '</span></div><div class="row-title">' + esc(x.title || '') + '</div><div class="row-meta" style="margin-top:4px"><span>' + esc(x.summary || '') + '</span></div></div>';
                }).join('') + '</div>'
              : '<p class="empty">' + esc(emptyTxt) + '</p>');
        }
        var notEnoughMsg = rk.has_enough_data === false
          ? 'Muestra aún reducida (< 100 vistas): espera a los primeros Reels para declarar ganadores reales.'
          : 'Aún no hay piezas publicadas con métricas.';
        renderList('rank-winners', 'Qué funciona más', rk.winners || [], notEnoughMsg);
        renderList('rank-losers', 'Qué funciona menos', rk.losers || [], rk.has_enough_data === false ? 'Sin perdedores con muestra tan pequeña.' : 'Sin piezas con bajo rendimiento registradas.');
        renderBars('rank-channels', 'Comparativa por canal', rk.by_channel || []);
        renderBars('rank-formats', 'Comparativa por formato', rk.by_format || []);
        var ins = rk.insights || [];
        document.getElementById('rank-insights').innerHTML =
          '<div class="card-title"><span>Insights</span></div>' +
          (ins.length
            ? '<div class="list">' + ins.map(function (x) { return '<div class="row-card">' + esc(x) + '</div>'; }).join('') + '</div>'
            : '<p class="empty">Sin insights generados.</p>');
      }

      function renderEmbudo(d) {
        var v = d.visits || {};
        var byPath = v.by_path || {};
        var clicks = v.clicks || {};
        var tg = d.telegram || {};
        var sources = tg.by_source || {};

        document.getElementById('emb-web').innerHTML =
          '<div class="card-title"><span>Visitas web (pinciano.es)</span><span class="badge mono">' + (v.total || 0) + '</span></div>' +
          '<div class="list">' +
            '<div class="row-card"><div class="row-top"><span>Portada (/)</span><strong class="mono">' + (byPath['/'] || 0) + '</strong></div></div>' +
            '<div class="row-card"><div class="row-top"><span>Calculadora (/calculadora)</span><strong class="mono">' + (byPath['/calculadora'] || 0) + '</strong></div></div>' +
            '<div class="row-card"><div class="row-top"><span>Hoy / Últimos 7 días</span><strong class="mono accent">' + (v.today || 0) + ' / ' + (v.last_7d || 0) + '</strong></div></div>' +
          '</div>';

        var clickRows = [
          ['Comunidad Free', clicks.click_free_community || 0],
          ['Canal Free (@pincianoradar)', clicks.click_free_channel || 0],
          ['Bot VIP (@surebets_pinciano_bot)', clicks.click_vip_bot || 0],
          ['Usos calculadora', clicks.calc_use || 0]
        ];
        document.getElementById('emb-clicks').innerHTML =
          '<div class="card-title"><span>Clics hacia Telegram y Calculadora</span></div>' +
          '<div class="list">' + clickRows.map(function (r) {
            return '<div class="row-card"><div class="row-top"><span>' + esc(r[0]) + '</span><strong class="mono accent">' + r[1] + '</strong></div></div>';
          }).join('') + '</div>';

        var srcEntries = Object.keys(sources);
        document.getElementById('emb-tg').innerHTML =
          '<div class="card-title"><span>Altas Telegram (surebets.db)</span><span class="badge mono">' + (tg.total_members || 0) + '</span></div>' +
          (srcEntries.length
            ? '<div class="list">' + srcEntries.map(function (k) {
                return '<div class="row-card"><div class="row-top"><span>source: ' + esc(k) + '</span><strong class="mono">' + sources[k] + '</strong></div></div>';
              }).join('') + '</div>'
            : '<p class="empty">Sin altas registradas por source todavía.</p>');
      }

      function renderAll(d) {
        state.data = d;
        document.getElementById('sync-ts').textContent = 'Sync: ' + fmtCet(d.generated_at);
        renderHoy(d);
        renderAgenda(d);
        renderRanking(d);
        renderEmbudo(d);
      }

      function loadData() {
        document.getElementById('sync-ts').textContent = 'Actualizando...';
        return fetch('/cpm/api/data', { credentials: 'same-origin' })
          .then(function (r) {
            if (r.status === 401) { location.reload(); return null; }
            return r.json();
          })
          .then(function (d) { if (d) renderAll(d); })
          .catch(function () { document.getElementById('sync-ts').textContent = 'Error de red'; });
      }

      document.querySelectorAll('.tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var t = btn.getAttribute('data-tab');
          document.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('active', b === btn); });
          document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('active', v.id === 'view-' + t); });
        });
      });

      document.getElementById('flt-status').addEventListener('click', function (e) {
        var b = e.target.closest('[data-status]');
        if (!b) return;
        state.status = b.getAttribute('data-status');
        document.querySelectorAll('#flt-status .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
        if (state.data) renderAgenda(state.data);
      });

      document.getElementById('flt-net').addEventListener('click', function (e) {
        var b = e.target.closest('[data-net]');
        if (!b) return;
        state.net = b.getAttribute('data-net');
        document.querySelectorAll('#flt-net .chip').forEach(function (c) { c.classList.toggle('on', c === b); });
        if (state.data) renderAgenda(state.data);
      });

      document.getElementById('btn-refresh').addEventListener('click', loadData);
      document.getElementById('btn-refresh-2').addEventListener('click', loadData);
      document.getElementById('btn-logout').addEventListener('click', function () {
        fetch('/cpm/logout', { method: 'POST', credentials: 'same-origin' }).then(function () { location.reload(); });
      });

      loadData();
    })();
  </script>
</body>
</html>`;
}
