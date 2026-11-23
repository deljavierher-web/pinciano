/* Atribución de altas: reescribe los enlaces ?start=comunidad y ?start=web del bot a
   web_<página>_<origen>, y ?start=fundadores a web_<página>_fund_<origen> (solo [A-Za-z0-9_-], <= 64). El origen sale de utm_source o del
   referrer de la primera visita de la sesión (sessionStorage). Sin cookies ni red. */
(function () {
  'use strict';
  var BOT = 'https://t.me/surebets_pinciano_bot?start=';
  var KEY = 'pinciano_origin';

  function clean(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  }

  var NAMES = {
    instagram: 'ig', ig: 'ig',
    x: 'x', twitter: 'x', xcom: 'x', tco: 'x',
    youtube: 'yt', yt: 'yt', youtu: 'yt',
    tiktok: 'tiktok', tt: 'tiktok',
    google: 'google', bing: 'bing', duckduckgo: 'ddg',
    facebook: 'fb', fb: 'fb',
    telegram: 'tg', tg: 'tg',
    reddit: 'reddit'
  };

  function fromName(name) {
    var n = clean(name);
    return n ? (NAMES[n] || n) : '';
  }

  function fromReferrer(ref) {
    if (!ref) return '';
    var host = '';
    try { host = new URL(ref).hostname.toLowerCase(); } catch (e) { return ''; }
    if (!host) return '';
    if (host === location.hostname) return '';
    if (host.indexOf('google') !== -1) return 'google';
    var base = host.replace(/^(www|m|l|lm|web)\./, '');
    if (base === 't.co') return 'x';
    var label = base.split('.')[0];
    return fromName(label) || 'otro';
  }

  function detect() {
    var utm = '';
    try { utm = new URLSearchParams(location.search).get('utm_source') || ''; } catch (e) {}
    return fromName(utm) || fromReferrer(document.referrer);
  }

  var origin = '';
  try { origin = sessionStorage.getItem(KEY) || ''; } catch (e) {}
  if (!/^[a-z0-9]{1,12}$/.test(origin)) {
    origin = detect() || 'directo';
    try { sessionStorage.setItem(KEY, origin); } catch (e) {}
  }

  var page = /calculadora/.test(location.pathname) ? 'calc' : 'index';
  var start = 'web_' + page + '_' + origin;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(start)) return;

  // Botones ?start=comunidad y enlaces de texto ?start=web: ambos pasan a web_<página>_<origen>.
  // CTA «48h VIP gratis» (?start=fundadores): web_<página>_fund_<origen> (el bot sigue mostrando el texto Fundadores).
  var startFund = 'web_' + page + '_fund_' + origin;
  var map = [
    ['a[href="' + BOT + 'comunidad"]', start],
    ['a[href="' + BOT + 'web"]', start],
    ['a[href="' + BOT + 'fundadores"]', /^[A-Za-z0-9_-]{1,64}$/.test(startFund) ? startFund : null]
  ];
  for (var s = 0; s < map.length; s++) {
    if (!map[s][1]) continue;
    var links = document.querySelectorAll(map[s][0]);
    for (var i = 0; i < links.length; i++) links[i].setAttribute('href', BOT + map[s][1]);
  }
})();
