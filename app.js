const SAMPLES = [
  {
    sport: 'Fútbol · UEFA Nations League',
    time: 'Muestra real · 12 nov',
    match: 'Países Bajos vs Grecia',
    market: '1ª Mitad Córners (Over/Under 5.5)',
    legs: [
      { pick: '1ª Mitad Córners Over 5.5', bookie: 'Bet365', price: 3.25 },
      { pick: '1ª Mitad Córners Under 5.5', bookie: 'Luckia', price: 1.85 },
    ],
  },
  {
    sport: 'Baloncesto · NBA Props',
    time: 'Muestra real · 12 nov',
    match: 'Philadelphia 76ers vs Toronto Raptors',
    market: 'Rebotes Dean Wade (Over/Under 5.5)',
    legs: [
      { pick: 'Rebotes Dean Wade Over 5.5', bookie: 'Betfair (ES)', price: 3.0 },
      { pick: 'Rebotes Dean Wade Under 5.5', bookie: 'Marca Apuestas', price: 1.93 },
    ],
  },
  {
    sport: 'Fútbol · UEFA Nations League',
    time: 'Muestra real · 12 nov',
    match: 'Países Bajos vs Grecia',
    market: '1ª Mitad Córners (Over/Under 5.5)',
    legs: [
      { pick: '1ª Mitad Córners Over 5.5', bookie: 'Winamax (ES)', price: 2.95 },
      { pick: '1ª Mitad Córners Under 5.5', bookie: 'Luckia', price: 1.85 },
    ],
  },
];

const BIG_BOOKIE_RE = /(bet365|winamax|sportium|betfair|codere|william\s*hill|bwin|888sport|marca\s*apuestas)/i;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripLeadingEmoji(str) {
  return String(str ?? '')
    .replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '')
    .trim();
}

// Mirrors src/engine/calculator.py (_round_stake & _evaluate_selection_group)
function roundStake(value, roundTo) {
  if (roundTo <= 0) return round2(value);
  const rounded = Math.round(value / roundTo) * roundTo;
  return Math.max(roundTo, rounded);
}

function evaluateArbitrage(prices, bankroll, roundTo = 1) {
  if (!prices.length || prices.some((p) => !Number.isFinite(p) || p <= 1.0)) {
    return null;
  }
  if (!Number.isFinite(bankroll) || bankroll <= 0) {
    return null;
  }

  const impliedMargin = prices.reduce((acc, p) => acc + 1.0 / p, 0);
  const roiPercent = (1.0 / impliedMargin - 1.0) * 100.0;

  const stakes = prices.map((p) => roundStake(bankroll / (impliedMargin * p), roundTo));
  const totalStake = round2(stakes.reduce((acc, s) => acc + s, 0));

  const legs = prices.map((price, idx) => {
    const stake = stakes[idx];
    const potentialReturn = round2(stake * price);
    const netProfit = round2(potentialReturn - totalStake);
    const sharePct = totalStake > 0 ? (stake / totalStake) * 100 : 0;
    return { price, stake, potentialReturn, netProfit, sharePct };
  });

  const minNetProfit = Math.min(...legs.map((l) => l.netProfit));
  return {
    impliedMargin,
    roiPercent,
    totalStake,
    minNetProfit,
    legs,
  };
}

function fmtMoney(n, roundTo = 1) {
  if (roundTo === 1 && Math.abs(n - Math.round(n)) < 1e-6) {
    return `${Math.round(n)} €`;
  }
  return `${n.toFixed(2)} €`;
}

function buildCalcHref(item) {
  if (!item || !Array.isArray(item.legs) || item.legs.length < 2) return 'calculadora.html';
  const [l1, l2] = item.legs;
  const codec = window.PincianoCalc;
  if (codec && typeof codec.encryptCalcPayload === 'function') {
    const token = codec.encryptCalcPayload({
      o1: l1.price,
      o2: l2.price,
      b1: l1.bookie,
      b2: l2.bookie,
      p1: l1.pick,
      p2: l2.pick,
      ev: item.match || '',
      tm: item.starts_at || '',
    });
    return `calculadora.html?s=${encodeURIComponent(token)}`;
  }
  return 'calculadora.html';
}

// Mobile navigation drawer
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

if (menuToggle && mobileMenu) {
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.hidden = true;
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.hidden = isOpen;
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

// Hero sample signal specimen
const previewEl = document.getElementById('signal-preview');
const tabBtns = document.querySelectorAll('.tab-btn');
const termBankBtns = document.querySelectorAll('.bank-chip');
const copySignalBtn = document.getElementById('copy-signal-btn');
const openSampleCalcLink = document.getElementById('open-sample-calc-link');

let activeSampleIdx = 0;
let activeTermBank = 100;
let lastRenderedSummary = '';

function renderSample() {
  if (!previewEl) return;
  const s = SAMPLES[activeSampleIdx];
  const calc = evaluateArbitrage(
    s.legs.map((l) => l.price),
    activeTermBank,
    1
  );

  const marginPct = Math.min(100, calc.impliedMargin * 100);
  const edgePct = Math.max(0, 100 - marginPct);

  previewEl.innerHTML = `
    <div class="sig-top">
      <div class="sig-roi-group">
        <span class="sig-roi">+${calc.roiPercent.toFixed(2)}% ROI</span>
        <span class="sig-margin-tag">M = ${calc.impliedMargin.toFixed(4)}</span>
      </div>
      <span class="sig-meta">${escapeHtml(s.sport)} · ${escapeHtml(s.time)}</span>
    </div>

    <div>
      <div class="sig-match">${escapeHtml(s.match)}</div>
      <div class="sig-sub">${escapeHtml(s.market)}</div>
    </div>

    <div class="sig-edge-bar">
      <div class="sig-edge-labels">
        <span>Suma implícita ${marginPct.toFixed(2)}%</span>
        <span class="accent">Margen libre +${edgePct.toFixed(2)}%</span>
      </div>
      <div class="sig-edge-track" aria-hidden="true">
        <div class="sig-edge-fill" style="width: ${marginPct.toFixed(2)}%"></div>
      </div>
    </div>

    <div class="sig-legs">
      ${s.legs
        .map((leg, i) => {
          const res = calc.legs[i];
          return `
        <div class="sig-leg">
          <div class="sig-leg-left">
            <span class="sig-pick">${escapeHtml(leg.pick)}</span>
            <span class="sig-bookie">${escapeHtml(leg.bookie)}</span>
          </div>
          <div class="sig-leg-right">
            <div class="sig-odd">${leg.price.toFixed(2)}</div>
            <div class="sig-stake">${fmtMoney(res.stake, 1)} → ${res.potentialReturn.toFixed(2)} €</div>
          </div>
        </div>`;
        })
        .join('')}
    </div>

    <div class="sig-foot">
      <span>Invertido: ${fmtMoney(calc.totalStake, 1)} (redondeo 1 €)</span>
      <span class="accent">Neto mín.: +${calc.minNetProfit.toFixed(2)} €</span>
    </div>
  `;

  if (openSampleCalcLink) {
    openSampleCalcLink.setAttribute('href', buildCalcHref(s));
  }

  lastRenderedSummary = [
    `Pinciano Radar · Muestra real +${calc.roiPercent.toFixed(2)}% ROI`,
    `${s.match} (${s.market})`,
    ...s.legs.map((leg, i) => {
      const res = calc.legs[i];
      return `- ${leg.pick} @ ${leg.price.toFixed(2)} (${leg.bookie}): ${fmtMoney(res.stake, 1)} -> ${res.potentialReturn.toFixed(2)} €`;
    }),
    `Total: ${fmtMoney(calc.totalStake, 1)} | Neto mínimo: +${calc.minNetProfit.toFixed(2)} €`,
  ].join('\n');
}

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabBtns.forEach((b) => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    activeSampleIdx = Number(btn.dataset.sample);
    renderSample();
  });
});

termBankBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    termBankBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeTermBank = Number(btn.dataset.termBank);
    renderSample();
  });
});

if (copySignalBtn) {
  copySignalBtn.addEventListener('click', async () => {
    if (!lastRenderedSummary) return;
    try {
      await navigator.clipboard.writeText(lastRenderedSummary);
      copySignalBtn.textContent = 'Copiado';
    } catch {
      copySignalBtn.textContent = 'Listo';
    }
    setTimeout(() => {
      copySignalBtn.textContent = 'Copiar';
    }, 1800);
  });
}

renderSample();

// Delayed +12% showcase loader (Casas grandes + ROI >= 12%)
function formatMadridTime(isoStr) {
  if (!isoStr) return 'Diferido';
  const dt = new Date(isoStr);
  if (Number.isNaN(dt.getTime())) return 'Diferido';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dt);
  } catch {
    return isoStr.slice(0, 16).replace('T', ' ');
  }
}

function renderDelayedShowcase(payload) {
  const kpiWrap = document.getElementById('showcase-kpis');
  const featuredWrap = document.getElementById('showcase-featured-grid');
  const feedBody = document.getElementById('showcase-delayed-body');
  if (!kpiWrap || !featuredWrap || !feedBody || !payload) return;

  const stats = payload.stats || {};
  const houseCounts = stats.big_bookies_12_plus || {};
  const topHouses = Object.entries(houseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => `${name} (${count})`)
    .join(' · ');

  kpiWrap.innerHTML = `
    <div class="showcase-kpi">
      <span class="kpi-lbl">Detecciones en histórico</span>
      <strong class="kpi-val">${Number(stats.total_detected || 0).toLocaleString('es-ES')}</strong>
      <span class="kpi-sub">Deduplicadas en SQLite</span>
    </div>
    <div class="showcase-kpi">
      <span class="kpi-lbl">Señales ≥ +12% ROI</span>
      <strong class="kpi-val accent">${Number(stats.total_12_plus || 0).toLocaleString('es-ES')}</strong>
      <span class="kpi-sub">Umbral del escaparate público</span>
    </div>
    <div class="showcase-kpi">
      <span class="kpi-lbl">Casas líderes (+12%)</span>
      <strong class="kpi-val kpi-val-sm">${escapeHtml(topHouses || 'Betfair · Bet365 · Winamax · William Hill')}</strong>
      <span class="kpi-sub">Siempre al menos 1 operador líder .es</span>
    </div>
  `;

  const featured = (payload.featured_cases || [])
    .filter((item) => Number(item.roi_percent) >= 12.0 && Array.isArray(item.legs) && item.legs.length >= 2)
    .filter((item) => item.legs.some((l) => BIG_BOOKIE_RE.test(l.bookie || '')))
    .slice(0, 3);

  featuredWrap.innerHTML = featured
    .map((item) => {
      const calcHref = buildCalcHref(item);
      const legsHtml = item.legs
        .map((leg) => {
          const isBig = BIG_BOOKIE_RE.test(leg.bookie || '');
          return `
            <div class="sc-leg">
              <div class="sc-leg-main">
                <span class="sc-leg-pick">${escapeHtml(leg.pick)}</span>
                <span class="sc-leg-bookie ${isBig ? 'is-big' : ''}">${escapeHtml(leg.bookie)}</span>
              </div>
              <div class="sc-leg-right">
                <span class="sc-leg-odd">@ ${Number(leg.price).toFixed(2)}</span>
                <span class="sc-leg-stake">${Number(leg.stake_100).toFixed(2)} €</span>
              </div>
            </div>`;
        })
        .join('');

      return `
        <article class="showcase-card">
          <div class="sc-head">
            <span class="sc-roi">+${Number(item.roi_percent).toFixed(2)}% ROI</span>
            <span class="sc-league">${escapeHtml(stripLeadingEmoji(item.sport_league))}</span>
          </div>
          <h3 class="sc-match">${escapeHtml(item.match)}</h3>
          <div class="sc-meta">Inicio ref. ${escapeHtml(item.starts_at || formatMadridTime(item.detected_at))}</div>
          <div class="sc-legs">${legsHtml}</div>
          <div class="sc-foot">
            <span class="sc-big-tag">${escapeHtml((item.big_bookies || []).join(' + '))}</span>
            <a href="${calcHref}" class="sc-calc-link">Probar en calculadora →</a>
          </div>
        </article>`;
    })
    .join('');

  const delayedRows = (payload.delayed_feed || [])
    .filter((r) => Number(r.roi_percent) >= 12.0 && Array.isArray(r.bookmakers) && r.bookmakers.length >= 2)
    .filter((r) => r.bookmakers.some((b) => BIG_BOOKIE_RE.test(b)))
    .slice(0, 8);

  feedBody.innerHTML = delayedRows
    .map((row) => {
      const bookieChips = row.bookmakers
        .map((b) => {
          const cls = BIG_BOOKIE_RE.test(b) ? 'feed-bookie is-big' : 'feed-bookie';
          return `<span class="${cls}">${escapeHtml(b)}</span>`;
        })
        .join('');
      return `
        <tr>
          <td class="mono">${escapeHtml(formatMadridTime(row.detected_at))}</td>
          <td>${escapeHtml(row.market)}</td>
          <td><div class="feed-bookies">${bookieChips}</div></td>
          <td class="mono accent td-roi">+${Number(row.roi_percent).toFixed(2)}%</td>
        </tr>`;
    })
    .join('');
}

async function initDelayedShowcase() {
  const kpiWrap = document.getElementById('showcase-kpis');
  if (!kpiWrap) return;
  try {
    const resp = await fetch('data/showcase_12.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const payload = await resp.json();
    renderDelayedShowcase(payload);
  } catch {
    renderDelayedShowcase({
      stats: {
        total_detected: 4742,
        total_12_plus: 388,
        big_bookies_12_plus: { Betfair: 87, Bet365: 68, Winamax: 52, 'William Hill': 23 },
      },
      featured_cases: SAMPLES.map((s) => {
        const calc = evaluateArbitrage(
          s.legs.map((l) => l.price),
          100,
          0
        );
        return {
          roi_percent: Number(calc.roiPercent.toFixed(2)),
          match: s.match,
          sport_league: s.sport,
          starts_at: s.time,
          big_bookies: s.legs.map((l) => l.bookie).filter((b) => BIG_BOOKIE_RE.test(b)),
          legs: s.legs.map((l, i) => ({ ...l, stake_100: calc.legs[i].stake })),
        };
      }),
      delayed_feed: [],
    });
  }
}

initDelayedShowcase();

// FAQ Accordion
document.querySelectorAll('.faq-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    const panel = trigger.nextElementSibling;
    trigger.setAttribute('aria-expanded', String(!expanded));
    if (panel) panel.hidden = expanded;
  });
});

// Funnel telemetry (privacy-first, no cookies or personal data)
function sendFunnelBeacon(eventName) {
  if (window.location.protocol === 'file:') return;
  const payload = JSON.stringify({ event: eventName });
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/cpm/t', payload);
  } else if (window.fetch) {
    fetch('/cpm/t', { method: 'POST', body: payload, keepalive: true }).catch(() => {});
  }
}

document.addEventListener('click', (ev) => {
  const link = ev.target && ev.target.closest ? ev.target.closest('a[href*="t.me/"]') : null;
  if (!link) return;
  const href = link.getAttribute('href') || '';
  if (href.includes('t.me/+') || href.includes('start=comunidad') || /start=web_(index|calc)_/.test(href)) {
    sendFunnelBeacon('click_free_community');
  } else if (href.includes('t.me/pincianoradar')) {
    sendFunnelBeacon('click_free_channel');
  } else if (href.includes('surebets_pinciano_bot')) {
    sendFunnelBeacon('click_vip_bot');
  }
});
