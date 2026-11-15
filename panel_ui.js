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

    <!-- 2. AGENDA -->
    <section class="view" id="view-agenda" aria-label="Agenda editorial">
      <div class="card">
        <div class="chips" id="flt-status">
          <button type="button" class="chip on" data-status="all">Todos</button>
          <button type="button" class="chip" data-status="scheduled">Programado</button>
          <button type="button" class="chip" data-status="draft">Borrador</button>
          <button type="button" class="chip" data-status="pending_upload">Por subir</button>
          <button type="button" class="chip" data-status="published">Publicado</button>
        </div>
        <div class="chips" id="flt-net">
          <button type="button" class="chip on" data-net="all">Todas</button>
          <button type="button" class="chip" data-net="x">X</button>
          <button type="button" class="chip" data-net="instagram">IG</button>
          <button type="button" class="chip" data-net="tiktok">TikTok</button>
          <button type="button" class="chip" data-net="youtube">YT</button>
          <button type="button" class="chip" data-net="threads">Threads</button>
        </div>
      </div>
      <div class="list" id="agenda-list"></div>
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
    <button type="button" class="tab" data-tab="agenda"><span>Agenda</span></button>
    <button type="button" class="tab" data-tab="ranking"><span>Ranking</span></button>
    <button type="button" class="tab" data-tab="embudo"><span>Embudo</span></button>
  </nav>

  <script>
    (function () {
      var state = { data: null, status: 'all', net: 'all', timer: null };

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

      function renderAgenda(d) {
        var items = (d.calendar || []).filter(function (it) {
          var okSt = state.status === 'all' || it.status === state.status;
          var okNet = state.net === 'all' || String(it.network || '').toLowerCase() === state.net;
          return okSt && okNet;
        });
        var el = document.getElementById('agenda-list');
        if (!items.length) {
          el.innerHTML = '<div class="card"><p class="empty">Nada coincide con estos filtros.</p></div>';
          return;
        }
        el.innerHTML = items.map(function (it) {
          var when = it.published_at || it.scheduled_at || it.created_at;
          var whenLabel = when ? fmtCet(when) : (it.recommended_slot_label || 'Sin fecha');
          var score = it.score != null ? ' · Score ' + Number(it.score).toFixed(1) : '';
          var m = it.metrics || {};
          var mLine = (m.views != null || m.likes != null)
            ? '\\nMétricas: ' + (m.views || 0) + ' vistas · ' + (m.likes || 0) + ' likes · ' + (m.replies || 0) + ' resp · ' + (m.reposts || 0) + ' RT'
            : '';
          var extraNotes = it.notes && it.notes !== it.text ? '\\nNotas: ' + it.notes : '';
          return '<details class="row-card">' +
            '<summary>' +
              '<div class="row-top"><span class="badge">' + esc(netLabel(it.network)) + ' · ' + esc(it.format || 'post') + '</span>' + statusBadge(it.status) + '</div>' +
              '<div class="row-title">' + esc(it.title || (it.text || '').slice(0, 72) || 'Sin título') + '</div>' +
              '<div class="row-meta" style="margin-top:4px"><span>' + esc(whenLabel) + '</span><span>' + esc(it.source || '') + esc(score) + '</span></div>' +
            '</summary>' +
            '<div class="detail-body">' + esc((it.text || 'Sin texto.') + mLine + extraNotes + (it.url ? '\\n' + it.url : '') + (it.asset_url ? '\\nVídeo: ' + it.asset_url : '')) + '</div>' +
          '</details>';
        }).join('');
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
