const SAMPLES = [
  {
    sport: 'Tenis · ATP Masters 1000',
    time: 'Inicio < 24h',
    match: 'Carlos Alcaraz vs Jannik Sinner',
    market: 'Ganador del partido (2 vías · H2H)',
    legs: [
      { pick: 'Carlos Alcaraz', bookie: 'Bet365 (ES)', price: 2.1 },
      { pick: 'Jannik Sinner', bookie: 'Winamax (ES)', price: 2.09 },
    ],
  },
  {
    sport: 'Baloncesto · NBA Props',
    time: 'Inicio < 24h',
    match: 'Philadelphia 76ers vs Toronto Raptors',
    market: 'Rebotes Joel Embiid (10.5)',
    legs: [
      { pick: 'Over 10.5 Rebotes', bookie: 'LeoVegas (ES)', price: 2.9 },
      { pick: 'Under 10.5 Rebotes', bookie: 'Marca Apuestas (ES)', price: 1.7 },
    ],
  },
  {
    sport: 'Fútbol · Copa del Rey',
    time: 'Inicio < 24h',
    match: 'CD Tarancón vs Levante',
    market: 'Hándicap Europeo Cruzado (+2 / -1)',
    legs: [
      { pick: 'Local +2', bookie: 'Betfair (ES)', price: 3.0 },
      { pick: 'Visitante -1', bookie: '888sport (ES)', price: 1.6 },
    ],
  },
];

function round2(n) {
  return Math.round(n * 100) / 100;
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

// Hero sample signal terminal
const previewEl = document.getElementById('signal-preview');
const tabBtns = document.querySelectorAll('.tab-btn');
const termBankBtns = document.querySelectorAll('.bank-chip');
const copySignalBtn = document.getElementById('copy-signal-btn');

let activeSampleIdx = 0;
let activeTermBank = 100;
let lastRenderedSummary = '';

function renderSample() {
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
      <span class="sig-meta">${s.sport} · ${s.time}</span>
    </div>

    <div>
      <div class="sig-match">${s.match}</div>
      <div class="sig-sub">${s.market}</div>
    </div>

    <div class="sig-edge-bar">
      <div class="sig-edge-labels">
        <span>Suma implícita: ${marginPct.toFixed(2)}%</span>
        <span class="accent">Margen libre: +${edgePct.toFixed(2)}%</span>
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
            <span class="sig-pick">${leg.pick}</span>
            <span class="sig-bookie">🏠 ${leg.bookie}</span>
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
      <span>Capital invertido: ${fmtMoney(calc.totalStake, 1)} (redondeo 1 €)</span>
      <span class="accent">Neto mín: +${calc.minNetProfit.toFixed(2)} €</span>
    </div>
  `;

  lastRenderedSummary = [
    `Pinciano Radar · Ejemplo +${calc.roiPercent.toFixed(2)}% ROI`,
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
      copySignalBtn.textContent = 'Copiado ✓';
    } catch {
      copySignalBtn.textContent = 'Resumen listo';
    }
    setTimeout(() => {
      copySignalBtn.textContent = 'Copiar resumen';
    }, 1800);
  });
}

renderSample();

// FAQ Accordion
document.querySelectorAll('.faq-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    const panel = trigger.nextElementSibling;
    trigger.setAttribute('aria-expanded', String(!expanded));
    if (panel) panel.hidden = expanded;
  });
});
