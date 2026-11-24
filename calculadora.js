(function () {
  const codec = window.PincianoCalc;

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

  const oddAInput = document.getElementById('odd-a');
  const oddBInput = document.getElementById('odd-b');
  const stakeAInput = document.getElementById('stake-a');
  const stakeBInput = document.getElementById('stake-b');
  const bankrollInput = document.getElementById('bankroll');
  const roundToggle = document.getElementById('round-toggle');

  const cardLegA = document.getElementById('card-leg-a');
  const cardLegB = document.getElementById('card-leg-b');
  const bookieALbl = document.getElementById('bookie-a-lbl');
  const bookieBLbl = document.getElementById('bookie-b-lbl');
  const pickALbl = document.getElementById('pick-a-lbl');
  const pickBLbl = document.getElementById('pick-b-lbl');
  const badgeLegA = document.getElementById('badge-leg-a');
  const badgeLegB = document.getElementById('badge-leg-b');
  const hintLegA = document.getElementById('hint-leg-a');
  const hintLegB = document.getElementById('hint-leg-b');

  const modePill = document.getElementById('mode-pill');
  const resetLimitsBtn = document.getElementById('reset-limits-btn');
  const signalBanner = document.getElementById('signal-banner');
  const signalTitleEl = document.getElementById('signal-event-title');
  const signalMetaEl = document.getElementById('signal-event-meta');
  const signalErrorEl = document.getElementById('signal-error');
  const clearSignalBtn = document.getElementById('clear-signal-btn');

  const limitCalloutEl = document.getElementById('limit-callout');
  const limitCalloutTextEl = document.getElementById('limit-callout-text');
  const verdictEl = document.getElementById('calc-verdict');
  const verdictTextEl = document.getElementById('verdict-text');
  const mEl = document.getElementById('res-m');
  const roiEl = document.getElementById('res-roi');
  const minNetEl = document.getElementById('res-min-net');
  const totalStakeEl = document.getElementById('res-total-stake');
  const allocBarEl = document.getElementById('alloc-bar');
  const resLegsEl = document.getElementById('res-legs');
  const formulaTextEl = document.getElementById('live-formula-text');
  const copyEncLinkBtn = document.getElementById('copy-enc-link-btn');

  const miniBankBtns = document.querySelectorAll('.mini-chip[data-bank]');
  const presetBtns = document.querySelectorAll('.preset-btn[data-preset]');

  let activeMode = 'bankroll'; // 'bankroll' | 'lockA' | 'lockB'
  let signalMeta = {
    book1: 'Bet365',
    book2: 'Luckia',
    pick1: '1ª Mitad Córners Over 5.5',
    pick2: '1ª Mitad Córners Under 5.5',
    event: 'Países Bajos vs Grecia (Ejemplo +17.89%)',
    startTime: '',
  };

  function parseDecimal(raw) {
    if (raw === null || raw === undefined) return NaN;
    const cleaned = String(raw).trim().replace(',', '.');
    if (!cleaned) return NaN;
    const val = Number(cleaned);
    return Number.isFinite(val) ? val : NaN;
  }

  function formatInputMoney(n, forceExact) {
    if (!Number.isFinite(n)) return '';
    if (!forceExact && Math.abs(n - Math.round(n)) < 1e-6) {
      return String(Math.round(n));
    }
    return n.toFixed(2);
  }

  function fmtMoney(n, roundTo) {
    if (!Number.isFinite(n)) return '—';
    if (roundTo === 1 && Math.abs(n - Math.round(n)) < 1e-6) {
      return `${Math.round(n)} €`;
    }
    return `${n.toFixed(2)} €`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function syncLabels() {
    bookieALbl.textContent = signalMeta.book1 || 'Casa 1';
    bookieBLbl.textContent = signalMeta.book2 || 'Casa 2';
    pickALbl.textContent = signalMeta.pick1 || 'Selección 1';
    pickBLbl.textContent = signalMeta.pick2 || 'Selección 2';

    if (signalMeta.event) {
      signalTitleEl.textContent = signalMeta.event;
      const parts = [
        `${signalMeta.book1} vs ${signalMeta.book2}`,
        signalMeta.startTime ? `Inicio ${signalMeta.startTime}` : '',
      ].filter(Boolean);
      signalMetaEl.textContent = parts.join(' · ');
      signalBanner.hidden = false;
    } else {
      signalBanner.hidden = true;
    }
  }

  function syncBankChips(val) {
    miniBankBtns.forEach((b) => {
      b.classList.toggle(
        'active',
        activeMode === 'bankroll' && Number(b.dataset.bank) === Number(val)
      );
    });
  }

  function updateModeVisuals(res, roundTo) {
    cardLegA.classList.toggle('is-locked', activeMode === 'lockA');
    cardLegB.classList.toggle('is-locked', activeMode === 'lockB');
    cardLegA.classList.toggle('is-target', activeMode === 'lockB');
    cardLegB.classList.toggle('is-target', activeMode === 'lockA');

    resetLimitsBtn.hidden = activeMode === 'bankroll';

    if (activeMode === 'lockA') {
      modePill.textContent = `Límite fijado en ${signalMeta.book1}`;
      modePill.className = 'mode-pill is-locked';
      badgeLegA.textContent = 'Límite';
      badgeLegB.textContent = 'Cobertura';
      badgeLegA.className = 'leg-state-badge is-locked';
      badgeLegB.className = 'leg-state-badge is-target';
    } else if (activeMode === 'lockB') {
      modePill.textContent = `Límite fijado en ${signalMeta.book2}`;
      modePill.className = 'mode-pill is-locked';
      badgeLegA.textContent = 'Cobertura';
      badgeLegB.textContent = 'Límite';
      badgeLegA.className = 'leg-state-badge is-target';
      badgeLegB.className = 'leg-state-badge is-locked';
    } else {
      modePill.textContent = 'Modo: Capital total';
      modePill.className = 'mode-pill';
      badgeLegA.textContent = 'Auto';
      badgeLegB.textContent = 'Auto';
      badgeLegA.className = 'leg-state-badge';
      badgeLegB.className = 'leg-state-badge';
    }

    if (!res) {
      hintLegA.textContent = 'Escribe aquí si esta casa limita el importe máximo.';
      hintLegB.textContent = 'Escribe aquí si esta casa limita el importe máximo.';
      return;
    }

    const legA = res.legs[0];
    const legB = res.legs[1];

    if (activeMode === 'lockA') {
      hintLegA.textContent = `Máximo fijado: ${fmtMoney(legA.stake, 1)}`;
      hintLegB.textContent =
        roundTo && Math.abs(legB.stake - legB.exactStake) > 0.009
          ? `Exacto sin redondeo: ${legB.exactStake.toFixed(2)} €`
          : `Retorno igualado: ${legB.potentialReturn.toFixed(2)} €`;
    } else if (activeMode === 'lockB') {
      hintLegB.textContent = `Máximo fijado: ${fmtMoney(legB.stake, 1)}`;
      hintLegA.textContent =
        roundTo && Math.abs(legA.stake - legA.exactStake) > 0.009
          ? `Exacto sin redondeo: ${legA.exactStake.toFixed(2)} €`
          : `Retorno igualado: ${legA.potentialReturn.toFixed(2)} €`;
    } else {
      hintLegA.textContent =
        roundTo && Math.abs(legA.stake - legA.exactStake) > 0.009
          ? `Exacto: ${legA.exactStake.toFixed(2)} € · O escribe tu límite`
          : 'Escribe aquí si esta casa limita el importe máximo.';
      hintLegB.textContent =
        roundTo && Math.abs(legB.stake - legB.exactStake) > 0.009
          ? `Exacto: ${legB.exactStake.toFixed(2)} € · O escribe tu límite`
          : 'Escribe aquí si esta casa limita el importe máximo.';
    }
  }

  let calcUseTracked = false;

  // Tras el primer cálculo: caso real archivado del escaparate (data/showcase_12.json) + CTA al bot.
  // Solo muestra datos que ya publica el escaparate; si no cargan, enseña únicamente el CTA.
  function fmtEs(n, d) {
    return Number(n).toFixed(d).replace('.', ',');
  }

  function showAlertCta() {
    const box = document.getElementById('calc-alert-cta');
    if (!box) return;
    box.hidden = false;
    if (window.location.protocol === 'file:' || !window.fetch) return;
    fetch('data/showcase_12.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const cases = data && Array.isArray(data.featured_cases) ? data.featured_cases : [];
        const best = cases
          .filter((c) => c && c.match && Array.isArray(c.legs) && c.legs.length >= 2 && c.detected_at)
          .sort((a, b) => String(b.detected_at).localeCompare(String(a.detected_at)))[0];
        if (!best) return;
        const when = new Date(best.detected_at);
        const day = isNaN(when.getTime())
          ? ''
          : when.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' });
        const kicker = document.getElementById('calc-alert-kicker');
        const title = document.getElementById('calc-alert-title');
        const legs = document.getElementById('calc-alert-legs');
        const note = document.getElementById('calc-alert-note');
        if (kicker) kicker.textContent = day ? 'CASO REAL ARCHIVADO · DETECTADO EL ' + day : 'CASO REAL ARCHIVADO';
        if (title) title.textContent = best.match + ' · ROI +' + fmtEs(best.roi_percent, 2) + ' %';
        if (legs) {
          legs.textContent = '';
          best.legs.slice(0, 3).forEach((l) => {
            const li = document.createElement('li');
            li.textContent =
              l.pick + ' · ' + l.bookie + ' a ' + fmtEs(l.price, 2) + ' → ' + fmtEs(l.stake_100, 2) + ' € de cada 100 €';
            legs.appendChild(li);
          });
        }
        if (note) {
          note.textContent =
            'Caso archivado del escaparate, publicado con retraso. Las alertas en tiempo real salen en Telegram. Herramienta informativa +18: revisa siempre las cuotas antes de apostar.';
        }
      })
      .catch(() => {});
  }

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

  function renderResults(sourceField) {
    if (!calcUseTracked && sourceField && sourceField !== 'init') {
      calcUseTracked = true;
      sendFunnelBeacon('calc_use');
      showAlertCta();
    }
    const oa = parseDecimal(oddAInput.value);
    const ob = parseDecimal(oddBInput.value);
    const sa = parseDecimal(stakeAInput.value);
    const sb = parseDecimal(stakeBInput.value);
    const bank = parseDecimal(bankrollInput.value);
    const roundTo = roundToggle.checked ? 1 : 0;

    const res = codec.evaluateTwoWay({
      oddA: oa,
      oddB: ob,
      stakeA: sa,
      stakeB: sb,
      bankroll: bank,
      mode: activeMode,
      roundTo,
    });

    updateModeVisuals(res, roundTo);

    if (!res) {
      syncBankChips(NaN);
      mEl.textContent = '—';
      roiEl.textContent = '—';
      roiEl.className = 'mono';
      minNetEl.textContent = '—';
      minNetEl.className = 'mono';
      totalStakeEl.textContent = 'Total invertido: —';
      formulaTextEl.textContent = 'Introduce cuotas mayores que 1.00 y un importe positivo.';
      verdictEl.className = 'calc-verdict is-invalid';
      verdictTextEl.textContent =
        activeMode === 'bankroll'
          ? 'Introduce cuotas > 1.00 y un capital positivo'
          : 'Introduce el límite máximo (> 0 €) y ambas cuotas (> 1.00)';
      limitCalloutEl.hidden = true;
      allocBarEl.innerHTML = '';
      resLegsEl.innerHTML = '';
      return;
    }

    const [legA, legB] = res.legs;

    if (activeMode === 'lockA') {
      if (sourceField !== 'stakeB' && document.activeElement !== stakeBInput) {
        stakeBInput.value = formatInputMoney(legB.stake, roundTo === 0);
      }
      if (sourceField !== 'bankroll' && document.activeElement !== bankrollInput) {
        bankrollInput.value = formatInputMoney(res.totalStake, false);
      }
    } else if (activeMode === 'lockB') {
      if (sourceField !== 'stakeA' && document.activeElement !== stakeAInput) {
        stakeAInput.value = formatInputMoney(legA.stake, roundTo === 0);
      }
      if (sourceField !== 'bankroll' && document.activeElement !== bankrollInput) {
        bankrollInput.value = formatInputMoney(res.totalStake, false);
      }
    } else {
      if (sourceField !== 'stakeA' && document.activeElement !== stakeAInput) {
        stakeAInput.value = formatInputMoney(legA.stake, roundTo === 0);
      }
      if (sourceField !== 'stakeB' && document.activeElement !== stakeBInput) {
        stakeBInput.value = formatInputMoney(legB.stake, roundTo === 0);
      }
    }

    syncBankChips(activeMode === 'bankroll' ? bank : NaN);

    const cmp = res.impliedMargin < 1 ? '< 1.0000' : '≥ 1.0000';
    formulaTextEl.textContent = `M = 1/${oa.toFixed(2)} + 1/${ob.toFixed(2)} = ${res.impliedMargin.toFixed(4)} ${cmp}`;
    mEl.textContent = res.impliedMargin.toFixed(4);
    totalStakeEl.textContent = `Total invertido: ${fmtMoney(res.totalStake, roundTo)}`;

    limitCalloutEl.hidden = false;
    const b1 = escapeHtml(signalMeta.book1 || 'Casa 1');
    const b2 = escapeHtml(signalMeta.book2 || 'Casa 2');
    if (activeMode === 'lockB') {
      const exactNote =
        roundTo && Math.abs(legA.stake - legA.exactStake) > 0.009
          ? ` <span class="callout-sub">(exacto: ${legA.exactStake.toFixed(2)} €)</span>`
          : '';
      limitCalloutTextEl.innerHTML = `Máx. <b>${fmtMoney(legB.stake, 1)}</b> en ${b2} (@ ${ob.toFixed(2)}) → Apuesta <b>${fmtMoney(legA.stake, roundTo)}</b>${exactNote} en ${b1} (@ ${oa.toFixed(2)})`;
    } else if (activeMode === 'lockA') {
      const exactNote =
        roundTo && Math.abs(legB.stake - legB.exactStake) > 0.009
          ? ` <span class="callout-sub">(exacto: ${legB.exactStake.toFixed(2)} €)</span>`
          : '';
      limitCalloutTextEl.innerHTML = `Máx. <b>${fmtMoney(legA.stake, 1)}</b> en ${b1} (@ ${oa.toFixed(2)}) → Apuesta <b>${fmtMoney(legB.stake, roundTo)}</b>${exactNote} en ${b2} (@ ${ob.toFixed(2)})`;
    } else {
      limitCalloutTextEl.innerHTML = `Con <b>${fmtMoney(res.totalStake, roundTo)}</b> → <b>${fmtMoney(legA.stake, roundTo)}</b> en ${b1} y <b>${fmtMoney(legB.stake, roundTo)}</b> en ${b2}`;
    }

    if (res.impliedMargin >= 1) {
      roiEl.textContent = `${res.roiPercent.toFixed(2)}%`;
      roiEl.className = 'mono';
      minNetEl.textContent = `${res.minNetProfit >= 0 ? '+' : ''}${res.minNetProfit.toFixed(2)} €`;
      minNetEl.className = 'mono';
      verdictEl.className = 'calc-verdict is-invalid';
      verdictTextEl.textContent = 'Sin arbitraje (M ≥ 1.0000) · Margen negativo';
    } else if (res.minNetProfit <= 0) {
      roiEl.textContent = `+${res.roiPercent.toFixed(2)}%`;
      roiEl.className = 'mono accent';
      minNetEl.textContent = `${res.minNetProfit.toFixed(2)} €`;
      minNetEl.className = 'mono';
      verdictEl.className = 'calc-verdict is-warn';
      verdictTextEl.textContent =
        'Por redondeo una pata queda ≤ 0 € (desactiva redondeo a 1 € o sube el importe)';
    } else if (res.roiPercent < 3.0) {
      roiEl.textContent = `+${res.roiPercent.toFixed(2)}%`;
      roiEl.className = 'mono accent';
      minNetEl.textContent = `+${res.minNetProfit.toFixed(2)} €`;
      minNetEl.className = 'mono accent';
      verdictEl.className = 'calc-verdict is-warn';
      verdictTextEl.textContent = 'Surebet válida aunque por debajo del filtro mínimo (3.0% ROI)';
    } else if (res.roiPercent > 25.0) {
      roiEl.textContent = `+${res.roiPercent.toFixed(2)}%`;
      roiEl.className = 'mono accent';
      minNetEl.textContent = `+${res.minNetProfit.toFixed(2)} €`;
      minNetEl.className = 'mono accent';
      verdictEl.className = 'calc-verdict is-warn';
      verdictTextEl.textContent =
        'ROI > 25% · Comprueba si existe error palpable antes de confirmar';
    } else if (res.roiPercent >= 12.0) {
      roiEl.textContent = `+${res.roiPercent.toFixed(2)}%`;
      roiEl.className = 'mono accent';
      minNetEl.textContent = `+${res.minNetProfit.toFixed(2)} €`;
      minNetEl.className = 'mono accent';
      verdictEl.className = 'calc-verdict is-valid';
      verdictTextEl.textContent =
        'Surebet válida de margen alto (+12%+) · Verifica cuotas y límites en vivo';
    } else {
      roiEl.textContent = `+${res.roiPercent.toFixed(2)}%`;
      roiEl.className = 'mono accent';
      minNetEl.textContent = `+${res.minNetProfit.toFixed(2)} €`;
      minNetEl.className = 'mono accent';
      verdictEl.className = 'calc-verdict is-valid';
      verdictTextEl.textContent = 'Surebet válida · Dentro de la banda estable (3.0%–8.0%+ ROI)';
    }

    allocBarEl.innerHTML = res.legs
      .map(
        (leg, idx) =>
          `<div class="alloc-seg seg-${idx}" style="width: ${leg.sharePct.toFixed(2)}%"></div>`
      )
      .join('');

    const names = [signalMeta.book1 || 'Casa 1', signalMeta.book2 || 'Casa 2'];
    resLegsEl.innerHTML = res.legs
      .map((leg, idx) => {
        const sign = leg.netProfit >= 0 ? '+' : '';
        const cls = leg.netProfit > 0 ? 'is-pos' : 'is-neg';
        const tag = leg.isLocked ? ' · Límite' : '';
        const exactSub =
          !leg.isLocked && roundTo && Math.abs(leg.stake - leg.exactStake) > 0.009
            ? `<small class="mono">Exacto: ${leg.exactStake.toFixed(2)} €</small>`
            : '';
        return `
        <div class="res-leg ${leg.isLocked ? 'is-locked' : ''}">
          <div class="leg-top">
            <span class="leg-lbl">${escapeHtml(names[idx])} @ ${leg.price.toFixed(2)}${tag}</span>
            <span class="leg-pct">${leg.sharePct.toFixed(1)}%</span>
          </div>
          <strong class="mono">${fmtMoney(leg.stake, leg.isLocked ? 1 : roundTo)}</strong>
          ${exactSub}
          <small class="mono">Retorno si gana: ${leg.potentialReturn.toFixed(2)} €</small>
          <small class="mono leg-net ${cls}">Neto: ${sign}${leg.netProfit.toFixed(2)} €</small>
        </div>`;
      })
      .join('');
  }

  [oddAInput, oddBInput].forEach((el) => {
    el.addEventListener('input', () => renderResults('odds'));
  });

  stakeAInput.addEventListener('input', () => {
    activeMode = 'lockA';
    renderResults('stakeA');
  });

  stakeBInput.addEventListener('input', () => {
    activeMode = 'lockB';
    renderResults('stakeB');
  });

  bankrollInput.addEventListener('input', () => {
    activeMode = 'bankroll';
    renderResults('bankroll');
  });

  // Seleccionar el valor al entrar para poder escribir encima de forma síncrona (sin setTimeout).
  [stakeAInput, stakeBInput, bankrollInput, oddAInput, oddBInput].forEach((el) => {
    const clearPending = () => {
      el.dataset.selectOnClick = '';
    };
    el.addEventListener('focus', () => {
      el.dataset.selectOnClick = '1';
      el.select();
    });
    el.addEventListener('click', () => {
      if (el.dataset.selectOnClick === '1') {
        el.select();
        clearPending();
      }
    });
    el.addEventListener('keydown', clearPending);
    el.addEventListener('input', clearPending);
    el.addEventListener('blur', clearPending);
  });

  roundToggle.addEventListener('change', () => renderResults('round'));

  resetLimitsBtn.addEventListener('click', () => {
    activeMode = 'bankroll';
    if (!Number.isFinite(parseDecimal(bankrollInput.value)) || parseDecimal(bankrollInput.value) <= 0) {
      bankrollInput.value = '100';
    }
    renderResults('reset');
  });

  miniBankBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeMode = 'bankroll';
      bankrollInput.value = btn.dataset.bank;
      renderResults('bankroll');
    });
  });

  const PRESETS = {
    limit: {
      mode: 'lockB',
      oddA: '4.00',
      oddB: '1.57',
      stakeB: '30',
      book1: 'Bet365',
      book2: 'Winamax (ES)',
      pick1: 'Lado A',
      pick2: 'Lado B (Limitado 30 €)',
      event: 'Límite de casa (+12.75% ROI)',
    },
    football: {
      mode: 'bankroll',
      oddA: '3.25',
      oddB: '1.85',
      bank: '100',
      book1: 'Bet365',
      book2: 'Luckia',
      pick1: '1ª Mitad Córners Over 5.5',
      pick2: '1ª Mitad Córners Under 5.5',
      event: 'Países Bajos vs Grecia (+17.89%)',
    },
    nba: {
      mode: 'bankroll',
      oddA: '3.00',
      oddB: '1.93',
      bank: '100',
      book1: 'Betfair (ES)',
      book2: 'Marca Apuestas',
      pick1: 'Rebotes Dean Wade Over 5.5',
      pick2: 'Rebotes Dean Wade Under 5.5',
      event: 'Philadelphia 76ers vs Toronto Raptors (+17.44%)',
    },
    winamax: {
      mode: 'bankroll',
      oddA: '2.95',
      oddB: '1.85',
      bank: '100',
      book1: 'Winamax (ES)',
      book2: 'Luckia',
      pick1: '1ª Mitad Córners Over 5.5',
      pick2: '1ª Mitad Córners Under 5.5',
      event: 'Países Bajos vs Grecia (+13.70%)',
    },
    none: {
      mode: 'bankroll',
      oddA: '1.90',
      oddB: '1.95',
      bank: '100',
      book1: 'Casa 1',
      book2: 'Casa 2',
      pick1: 'Selección 1',
      pick2: 'Selección 2',
      event: '',
    },
  };

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = PRESETS[btn.dataset.preset];
      if (!p) return;
      signalMeta = {
        book1: p.book1,
        book2: p.book2,
        pick1: p.pick1,
        pick2: p.pick2,
        event: p.event || '',
        startTime: '',
      };
      oddAInput.value = p.oddA;
      oddBInput.value = p.oddB;
      activeMode = p.mode;
      if (p.mode === 'lockB') {
        stakeBInput.value = p.stakeB;
      } else {
        bankrollInput.value = p.bank;
      }
      syncLabels();
      renderResults('preset');
    });
  });

  if (clearSignalBtn) {
    clearSignalBtn.addEventListener('click', () => {
      signalMeta = {
        book1: 'Casa 1',
        book2: 'Casa 2',
        pick1: 'Selección 1',
        pick2: 'Selección 2',
        event: '',
        startTime: '',
      };
      activeMode = 'bankroll';
      [oddAInput, oddBInput, stakeAInput, stakeBInput, bankrollInput].forEach((el) => {
        el.value = '';
      });
      syncLabels();
      renderResults('init');
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    });
  }

  if (copyEncLinkBtn) {
    copyEncLinkBtn.addEventListener('click', async () => {
      const oa = parseDecimal(oddAInput.value);
      const ob = parseDecimal(oddBInput.value);
      if (!Number.isFinite(oa) || oa <= 1 || !Number.isFinite(ob) || ob <= 1) return;
      const payload = {
        o1: Math.round(oa * 10000) / 10000,
        o2: Math.round(ob * 10000) / 10000,
        b1: signalMeta.book1 || 'Casa 1',
        b2: signalMeta.book2 || 'Casa 2',
      };
      if (signalMeta.pick1 && signalMeta.pick1 !== 'Selección 1') payload.p1 = signalMeta.pick1;
      if (signalMeta.pick2 && signalMeta.pick2 !== 'Selección 2') payload.p2 = signalMeta.pick2;
      if (signalMeta.event) payload.ev = signalMeta.event;
      if (signalMeta.startTime) payload.tm = signalMeta.startTime;

      const token = codec.encryptCalcPayload(payload);
      const base =
        window.location.protocol === 'file:'
          ? 'https://pinciano.es/calculadora'
          : `${window.location.origin}${window.location.pathname}`;
      const shareUrl = `${base}?s=${encodeURIComponent(token)}`;
      try {
        await navigator.clipboard.writeText(shareUrl);
        copyEncLinkBtn.textContent = 'Enlace copiado';
      } catch {
        copyEncLinkBtn.textContent = 'Enlace generado';
      }
      setTimeout(() => {
        copyEncLinkBtn.textContent = 'Copiar enlace cifrado';
      }, 1800);
    });
  }

  // Hydrate from encrypted ?s=... query parameter if present
  const params = new URLSearchParams(window.location.search);
  const encToken = params.get('s');
  if (encToken) {
    try {
      const data = codec.decryptCalcPayload(encToken);
      const o1 = Number(data.o1);
      const o2 = Number(data.o2);
      if (Number.isFinite(o1) && o1 > 1 && Number.isFinite(o2) && o2 > 1) {
        oddAInput.value = o1.toFixed(2);
        oddBInput.value = o2.toFixed(2);
        signalMeta = {
          book1: String(data.b1 || 'Casa 1'),
          book2: String(data.b2 || 'Casa 2'),
          pick1: String(data.p1 || 'Selección 1'),
          pick2: String(data.p2 || 'Selección 2'),
          event: String(data.ev || ''),
          startTime: String(data.tm || ''),
        };
        activeMode = 'bankroll';
        bankrollInput.value = '100';
      } else {
        signalErrorEl.hidden = false;
      }
    } catch {
      signalErrorEl.hidden = false;
    }
  }

  syncLabels();
  renderResults('init');
})();
