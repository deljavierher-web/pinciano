const SAMPLES = [
  {
    roi: '+4.75%',
    sport: 'Tenis · ATP',
    time: 'Inicio < 24h',
    match: 'Carlos Alcaraz vs Jannik Sinner',
    market: 'Ganador del partido (2 vías)',
    legs: [
      { pick: 'Carlos Alcaraz', bookie: 'Betfair (ES)', odd: '2.15', stake: '49 €', ret: '105.35 €' },
      { pick: 'Jannik Sinner', bookie: 'LeoVegas (ES)', odd: '2.05', stake: '51 €', ret: '104.55 €' },
    ],
    net: '+4.55 € mínimo',
  },
  {
    roi: '+7.17%',
    sport: 'Baloncesto · NBA',
    time: 'Inicio < 24h',
    match: 'Philadelphia 76ers vs Toronto Raptors',
    market: 'Rebotes Joel Embiid (10.5)',
    legs: [
      { pick: 'Over 10.5 Rebotes', bookie: 'LeoVegas (ES)', odd: '2.90', stake: '37 €', ret: '107.30 €' },
      { pick: 'Under 10.5 Rebotes', bookie: 'Marca Apuestas', odd: '1.70', stake: '63 €', ret: '107.10 €' },
    ],
    net: '+7.10 € mínimo',
  },
  {
    roi: '+4.35%',
    sport: 'Fútbol · Copa del Rey',
    time: 'Inicio < 24h',
    match: 'CD Tarancón vs Levante',
    market: 'Hándicap Europeo Cruzado (+2 / -1)',
    legs: [
      { pick: 'Local +2', bookie: 'Betfair (ES)', odd: '3.00', stake: '35 €', ret: '105.00 €' },
      { pick: 'Visitante -1', bookie: '888sport (ES)', odd: '1.60', stake: '65 €', ret: '104.00 €' },
    ],
    net: '+4.00 € mínimo',
  },
];

const previewEl = document.getElementById('signal-preview');
const tabBtns = document.querySelectorAll('.tab-btn');

function renderSample(idx) {
  const s = SAMPLES[idx];
  previewEl.innerHTML = `
    <div class="sig-top">
      <span class="sig-roi">${s.roi} ROI</span>
      <span class="sig-meta">${s.sport} · ${s.time}</span>
    </div>
    <div>
      <div class="sig-match">${s.match}</div>
      <div class="sig-sub">${s.market}</div>
    </div>
    ${s.legs
      .map(
        (leg) => `
      <div class="sig-leg">
        <div class="sig-leg-left">
          <span class="sig-pick">${leg.pick}</span>
          <span class="sig-bookie">🏠 ${leg.bookie}</span>
        </div>
        <div class="sig-leg-right">
          <div class="sig-odd">${leg.odd}</div>
          <div class="sig-stake">${leg.stake} → ${leg.ret}</div>
        </div>
      </div>`
      )
      .join('')}
    <div class="sig-foot">
      <span>Capital: 100 € (redondeo 1 €)</span>
      <span class="accent">Neto: ${s.net}</span>
    </div>
  `;
}

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderSample(Number(btn.dataset.sample));
  });
});

renderSample(0);

// Live Arbitrage Calculator (matches src/engine/calculator.py)
const oddAInput = document.getElementById('odd-a');
const oddBInput = document.getElementById('odd-b');
const bankrollInput = document.getElementById('bankroll');

function updateCalc() {
  const oa = parseFloat(oddAInput.value);
  const ob = parseFloat(oddBInput.value);
  const bank = parseFloat(bankrollInput.value);

  const mEl = document.getElementById('res-m');
  const roiEl = document.getElementById('res-roi');
  const saEl = document.getElementById('res-stake-a');
  const sbEl = document.getElementById('res-stake-b');
  const raEl = document.getElementById('res-ret-a');
  const rbEl = document.getElementById('res-ret-b');

  if (!oa || !ob || !bank || oa <= 1 || ob <= 1 || bank <= 0) {
    mEl.textContent = '—';
    roiEl.textContent = '—';
    return;
  }

  const m = 1 / oa + 1 / ob;
  const roi = (1 / m - 1) * 100;
  mEl.textContent = m.toFixed(4);

  if (m < 1) {
    roiEl.textContent = `+${roi.toFixed(2)}%`;
    roiEl.className = 'mono accent';
  } else {
    roiEl.textContent = `${roi.toFixed(2)}% (Sin surebet)`;
    roiEl.className = 'mono';
  }

  const rawA = (bank / oa) / m;
  const stakeA = Math.max(1, Math.round(rawA));
  const stakeB = Math.max(1, Math.round(bank - stakeA));
  const totalStake = stakeA + stakeB;

  const retA = stakeA * oa;
  const retB = stakeB * ob;
  const netA = retA - totalStake;
  const netB = retB - totalStake;

  saEl.textContent = `${stakeA} €`;
  sbEl.textContent = `${stakeB} €`;
  raEl.textContent = `Retorno: ${retA.toFixed(2)} € (${netA >= 0 ? '+' : ''}${netA.toFixed(2)} €)`;
  rbEl.textContent = `Retorno: ${retB.toFixed(2)} € (${netB >= 0 ? '+' : ''}${netB.toFixed(2)} €)`;
}

[oddAInput, oddBInput, bankrollInput].forEach((el) => {
  el.addEventListener('input', updateCalc);
});

updateCalc();
