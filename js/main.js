/**
 * PINCIANO — MOTOR INTERACTIVO Y CINÉTICO (ESCRITORIO + MÓVIL TÁCTIL)
 * Valladolid · Raíz Castellana
 */

document.addEventListener('DOMContentLoaded', () => {
  /* ========================================================================
     1. PRELOADER CINÉTICO (CONTADOR 00 -> 100 + APERTURA DE TELÓN)
     ======================================================================== */
  const preloader = document.getElementById('preloader');
  const counterEl = document.getElementById('preloaderCounter');
  let progress = 0;

  const counterInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 11) + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(counterInterval);
      if (counterEl) counterEl.textContent = '100';

      setTimeout(() => {
        if (preloader) preloader.classList.add('is-done');
        document.body.classList.remove('loading');
      }, 240);
    } else {
      if (counterEl) counterEl.textContent = String(progress).padStart(2, '0');
    }
  }, 40);

  /* ========================================================================
     2. CURSOR TÁCTICO (ESCRITORIO) Y RETÍCULA TÁCTIL (MÓVIL)
     ======================================================================== */
  const cursor = document.getElementById('cursor');
  const cursorCoords = document.getElementById('cursorCoords');
  const touchReticleContainer = document.getElementById('touchReticleContainer');

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (cursorCoords) {
        const mmX = Math.round((e.clientX / window.innerWidth) * 300);
        const mmY = Math.round((e.clientY / window.innerHeight) * 400);
        cursorCoords.textContent = `X:${String(mmX).padStart(3, '0')}MM Y:${String(mmY).padStart(3, '0')}MM`;
      }
    });

    const interactiveTargets = document.querySelectorAll('a, button, input, select, .swatch-box');
    interactiveTargets.forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });
  }

  // En móvil: destello de cruceta técnica al tocar la pantalla
  if (touchReticleContainer) {
    window.addEventListener(
      'touchstart',
      (e) => {
        if (!e.touches || !e.touches[0]) return;
        const touch = e.touches[0];
        const reticle = document.createElement('div');
        reticle.className = 'touch-reticle';
        reticle.style.left = `${touch.clientX}px`;
        reticle.style.top = `${touch.clientY}px`;
        touchReticleContainer.appendChild(reticle);

        setTimeout(() => {
          reticle.remove();
        }, 560);
      },
      { passive: true }
    );
  }

  // Efecto magnético sutil en controles marcados con [data-magnetic] (solo ratón)
  if (window.matchMedia('(pointer: fine)').matches) {
    const magneticElements = document.querySelectorAll('[data-magnetic]');
    magneticElements.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate3d(${x * 0.14}px, ${y * 0.22}px, 0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  /* ========================================================================
     3. ESCENARIO HERO: PARALAJE 3D (RATÓN + TÁCTIL MÓVIL) Y MODO TRAZO
     ======================================================================== */
  const heroStage = document.getElementById('heroStage');
  const monogramParallax = document.getElementById('monogramParallax');
  const stageAngle = document.getElementById('stageAngle');
  const heroWireframeBtn = document.getElementById('heroWireframeBtn');

  function updateHeroTilt(clientX, clientY) {
    if (!heroStage || !monogramParallax) return;
    const rect = heroStage.getBoundingClientRect();
    const normX = Math.max(-0.5, Math.min(0.5, (clientX - rect.left) / rect.width - 0.5));
    const normY = Math.max(-0.5, Math.min(0.5, (clientY - rect.top) / rect.height - 0.5));

    const rotY = normX * 28;
    const rotX = -normY * 24;

    monogramParallax.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    if (stageAngle) {
      stageAngle.textContent = `ROT: ${rotY >= 0 ? '+' : ''}${rotY.toFixed(1)}°`;
    }
  }

  if (heroStage && monogramParallax) {
    // Ratón
    heroStage.addEventListener('mousemove', (e) => {
      updateHeroTilt(e.clientX, e.clientY);
    });

    heroStage.addEventListener('mouseleave', () => {
      monogramParallax.style.transform = 'rotateX(0deg) rotateY(0deg)';
      if (stageAngle) stageAngle.textContent = 'ROT: 0.0°';
    });

    // Táctil móvil
    heroStage.addEventListener(
      'touchstart',
      (e) => {
        monogramParallax.classList.add('is-touching');
        if (e.touches[0]) updateHeroTilt(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );

    heroStage.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches[0]) updateHeroTilt(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );

    heroStage.addEventListener(
      'touchend',
      () => {
        monogramParallax.classList.remove('is-touching');
        monogramParallax.style.transform = '';
        if (stageAngle) stageAngle.textContent = 'ROT: AUTO';
      },
      { passive: true }
    );
  }

  if (heroWireframeBtn && heroStage) {
    heroWireframeBtn.addEventListener('click', () => {
      const isWire = heroStage.classList.toggle('is-wireframe');
      heroWireframeBtn.textContent = isWire ? '[ MODO SÓLIDO ]' : '[ MODO TRAZO ]';
    });
  }

  const heroTraceBtn = document.getElementById('heroTraceBtn');
  if (heroTraceBtn && heroStage) {
    heroTraceBtn.addEventListener('click', () => {
      heroStage.classList.remove('is-tracing-p');
      void heroStage.offsetWidth;
      heroStage.classList.add('is-tracing-p');
      setTimeout(() => {
        heroStage.classList.remove('is-tracing-p');
      }, 1700);
    });
  }

  // Formulario de aviso de apertura (Pantalla Próximamente)
  const notifyForm = document.getElementById('notifyForm');
  const notifyConfirmation = document.getElementById('notifyConfirmation');
  if (notifyForm && notifyConfirmation) {
    notifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputEl = document.getElementById('notifyInput');
      const val = inputEl ? inputEl.value.trim() : '';
      const code = Math.floor(100 + Math.random() * 899);
      notifyConfirmation.innerHTML = `
        <strong>✓ CONTACTO ANOTADO // REF #PNC-AP-${code}</strong><br>
        REGISTRO: ${val.toUpperCase()}<br>
        RECIBIRÁS AVISO DIRECTO EN LA APERTURA DEL PRIMER LOTE.
      `;
      notifyConfirmation.classList.add('is-visible');
      notifyForm.reset();
    });
  }

  /* ========================================================================
     4. MESA DE CORTE INTERACTIVA (SINCRONIZADA ESCRITORIO + BARRA MÓVIL)
     ======================================================================== */
  const allViewButtons = document.querySelectorAll('[data-view]');
  const garmentViews = {
    back: document.getElementById('view-back'),
    front: document.getElementById('view-front'),
    cad: document.getElementById('view-cad'),
  };
  const frontOptionsBlock = document.getElementById('frontOptionsBlock');
  const mobileChestBar = document.getElementById('mobileChestBar');
  const viewportStatusText = document.getElementById('viewportStatusText');
  const garmentViewport = document.getElementById('garmentViewport');
  const garmentStage = document.getElementById('garmentStage');

  const statusLabels = {
    back: 'VISTA ACTIVA: 01 // ESPALDA SUDADERA CREWNECK («VALLADOLID NAZIONALISTA»)',
    front: 'VISTA ACTIVA: 02 // DELANTERA SUDADERA CREWNECK (CUELLO REDONDO)',
    cad: 'VISTA ACTIVA: 03 // PLANO VECTORIAL INKSCAPE (ESCALA 1:1 · 300×400MM)',
  };

  function setGarmentView(target) {
    allViewButtons.forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-view') === target);
    });

    Object.keys(garmentViews).forEach((key) => {
      if (garmentViews[key]) {
        garmentViews[key].classList.toggle('active', key === target);
      }
    });

    if (frontOptionsBlock) {
      frontOptionsBlock.style.display = target === 'front' ? 'block' : 'none';
    }
    if (mobileChestBar) {
      mobileChestBar.style.display = target === 'front' ? 'grid' : 'none';
    }
    if (viewportStatusText && statusLabels[target]) {
      viewportStatusText.textContent = statusLabels[target];
    }
  }

  allViewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-view');
      if (target) setGarmentView(target);
    });
  });

  // Conmutador en vivo del pecho (Con Monograma P vs Lisa Stealth) en escritorio y móvil
  const chestToggles = document.querySelectorAll('[data-chest]');
  const frontChestLogo = document.getElementById('frontChestLogo');
  const frontChestAnnotation = document.getElementById('frontChestAnnotation');

  chestToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-chest');
      chestToggles.forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-chest') === mode);
      });

      const showLogo = mode === 'monogram';
      if (frontChestLogo) frontChestLogo.style.display = showLogo ? 'block' : 'none';
      if (frontChestAnnotation) frontChestAnnotation.style.display = showLogo ? 'block' : 'none';
    });
  });

  // Función reutilizable para disparar el Trazado Vectorial en Vivo (Botón + Scroll Móvil)
  const btnAnimateTrace = document.getElementById('btnAnimateTrace');
  const btnAnimateTraceMobile = document.getElementById('btnAnimateTraceMobile');
  let traceTimeout = null;

  function triggerVectorTrace() {
    if (!garmentViewport) return;
    garmentViewport.classList.remove('is-tracing');
    void garmentViewport.offsetWidth;
    garmentViewport.classList.add('is-tracing');

    if (btnAnimateTrace) btnAnimateTrace.classList.add('is-active');
    if (btnAnimateTraceMobile) btnAnimateTraceMobile.classList.add('is-active');

    if (traceTimeout) clearTimeout(traceTimeout);
    traceTimeout = setTimeout(() => {
      garmentViewport.classList.remove('is-tracing');
      if (btnAnimateTrace) btnAnimateTrace.classList.remove('is-active');
      if (btnAnimateTraceMobile) btnAnimateTraceMobile.classList.remove('is-active');
    }, 1900);
  }

  if (btnAnimateTrace) {
    btnAnimateTrace.addEventListener('click', triggerVectorTrace);
  }
  if (btnAnimateTraceMobile) {
    btnAnimateTraceMobile.addEventListener('click', triggerVectorTrace);
  }

  // Botón de Rayos X (Nodos / Contorno) sincronizado escritorio + móvil
  const btnToggleXray = document.getElementById('btnToggleXray');
  const btnToggleXrayMobile = document.getElementById('btnToggleXrayMobile');

  function toggleXrayMode() {
    if (!garmentViewport) return;
    const active = garmentViewport.classList.toggle('is-xray');
    if (btnToggleXray) btnToggleXray.classList.toggle('is-active', active);
    if (btnToggleXrayMobile) btnToggleXrayMobile.classList.toggle('is-active', active);
  }

  if (btnToggleXray) {
    btnToggleXray.addEventListener('click', toggleXrayMode);
  }
  if (btnToggleXrayMobile) {
    btnToggleXrayMobile.addEventListener('click', toggleXrayMode);
  }

  // Inclinación 3D en el visor de la prenda (Ratón + Táctil Móvil)
  function updateGarmentTilt(clientX, clientY) {
    if (!garmentViewport || !garmentStage) return;
    const rect = garmentViewport.getBoundingClientRect();
    const nx = Math.max(-0.5, Math.min(0.5, (clientX - rect.left) / rect.width - 0.5));
    const ny = Math.max(-0.5, Math.min(0.5, (clientY - rect.top) / rect.height - 0.5));
    garmentStage.style.transform = `rotateY(${(nx * 12).toFixed(2)}deg) rotateX(${(-ny * 9).toFixed(2)}deg)`;
  }

  if (garmentViewport && garmentStage) {
    garmentViewport.addEventListener('mousemove', (e) => {
      updateGarmentTilt(e.clientX, e.clientY);
    });

    garmentViewport.addEventListener('mouseleave', () => {
      garmentStage.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });

    garmentViewport.addEventListener(
      'touchstart',
      (e) => {
        garmentStage.classList.add('is-touching');
        if (e.touches[0]) updateGarmentTilt(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );

    garmentViewport.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches[0]) updateGarmentTilt(e.touches[0].clientX, e.touches[0].clientY);
      },
      { passive: true }
    );

    garmentViewport.addEventListener(
      'touchend',
      () => {
        garmentStage.classList.remove('is-touching');
        garmentStage.style.transform = '';
      },
      { passive: true }
    );
  }

  /* ========================================================================
     5. ANIMACIONES DE SCROLL (INTERSECTION OBSERVER + AUTO-TRAZADO EN MÓVIL)
     ======================================================================== */
  const revealElements = document.querySelectorAll('.reveal-scroll');
  let hasAutoTracedOnScroll = false;

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.14 }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    // Cuando la sudadera entra en pantalla por primera vez, ejecuta el trazado vectorial en vivo
    if (garmentViewport) {
      const traceObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAutoTracedOnScroll) {
              hasAutoTracedOnScroll = true;
              setTimeout(() => {
                triggerVectorTrace();
              }, 250);
            }
          });
        },
        { threshold: 0.35 }
      );
      traceObserver.observe(garmentViewport);
    }
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  /* ========================================================================
     6. CALCULADORA DE TALLAS Y HOJA DE RESERVA (DROP 00)
     ======================================================================== */
  const sizeButtons = document.querySelectorAll('.size-btn');
  const valChest = document.getElementById('valChest');
  const valLength = document.getElementById('valLength');
  const valShoulder = document.getElementById('valShoulder');
  const selectedSizeBadge = document.getElementById('selectedSizeBadge');
  let currentSize = 'L';

  sizeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      sizeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      currentSize = btn.getAttribute('data-size') || 'L';
      const chest = btn.getAttribute('data-chest');
      const length = btn.getAttribute('data-length');
      const shoulder = btn.getAttribute('data-shoulder');

      if (valChest) valChest.textContent = `${chest} CM`;
      if (valLength) valLength.textContent = `${length} CM`;
      if (valShoulder) valShoulder.textContent = `${shoulder} CM`;
      if (selectedSizeBadge) selectedSizeBadge.textContent = `TALLA: ${currentSize}`;
    });
  });

  const dropForm = document.getElementById('dropForm');
  const stampConfirmation = document.getElementById('stampConfirmation');

  if (dropForm && stampConfirmation) {
    dropForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('memberName').value.trim();
      const contact = document.getElementById('memberContact').value.trim();
      const frontPref = document.getElementById('memberFrontPref').value;
      const refNum = Math.floor(100 + Math.random() * 899);

      stampConfirmation.innerHTML = `
        <strong>✓ RESERVA SELLADA // REF #PNC-00-${refNum}</strong><br>
        MIEMBRO: ${name.toUpperCase()} (${contact})<br>
        PRENDA: SUDADERA 01 «VALLADOLID NAZIONALISTA» · TALLA <strong>${currentSize}</strong><br>
        CONFIGURACIÓN: ${frontPref.toUpperCase()}
      `;
      stampConfirmation.classList.add('is-visible');
      dropForm.reset();
    });
  }
});
