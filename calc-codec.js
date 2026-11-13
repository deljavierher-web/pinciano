(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PincianoCalc = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEFAULT_SECRET = 'pinciano-radar-2026-es';
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function fnv1a32(bytes) {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i += 1) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  function concatBytes() {
    let total = 0;
    for (let i = 0; i < arguments.length; i += 1) {
      total += arguments[i].length;
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (let i = 0; i < arguments.length; i += 1) {
      out.set(arguments[i], offset);
      offset += arguments[i].length;
    }
    return out;
  }

  function keystreamByte(seed0, idx, keyBytes) {
    let state = (seed0 + Math.imul(idx + 1, 0x9e3779b9)) >>> 0;
    state = Math.imul(state ^ (state >>> 16), 0x85ebca6b) >>> 0;
    state = Math.imul(state ^ (state >>> 13), 0xc2b2ae35) >>> 0;
    state = (state ^ (state >>> 16)) >>> 0;
    return (state ^ keyBytes[idx % keyBytes.length]) & 0xff;
  }

  function b64uEncode(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64uDecode(str) {
    const clean = str.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (clean.length % 4)) % 4;
    const bin = atob(clean + '='.repeat(padLen));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }

  function randomNonce4() {
    const arr = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(arr);
    } else {
      for (let i = 0; i < 4; i += 1) {
        arr[i] = Math.floor(Math.random() * 256) & 0xff;
      }
    }
    return arr;
  }

  function encryptCalcPayload(payload, secret, iv) {
    const keyBytes = encoder.encode((secret || DEFAULT_SECRET).trim() || DEFAULT_SECRET);
    const nonce = iv || randomNonce4();
    if (nonce.length !== 4) {
      throw new Error('IV must be 4 bytes');
    }
    const plain = encoder.encode(JSON.stringify(payload));
    const seed0 = fnv1a32(concatBytes(keyBytes, nonce));
    const cipher = new Uint8Array(plain.length);
    for (let i = 0; i < plain.length; i += 1) {
      cipher[i] = plain[i] ^ keystreamByte(seed0, i, keyBytes);
    }
    const tagVal = fnv1a32(concatBytes(keyBytes, nonce, plain)) & 0xffff;
    const tag = new Uint8Array([(tagVal >>> 8) & 0xff, tagVal & 0xff]);
    return 'v1.' + b64uEncode(concatBytes(nonce, cipher, tag));
  }

  function decryptCalcPayload(token, secret) {
    if (!token || typeof token !== 'string' || !token.startsWith('v1.')) {
      throw new Error('Versión de enlace no válida.');
    }
    const raw = b64uDecode(token.slice(3));
    if (raw.length < 7) {
      throw new Error('Enlace cifrado incompleto.');
    }
    const keyBytes = encoder.encode((secret || DEFAULT_SECRET).trim() || DEFAULT_SECRET);
    const nonce = raw.slice(0, 4);
    const cipher = raw.slice(4, raw.length - 2);
    const tag = ((raw[raw.length - 2] << 8) | raw[raw.length - 1]) >>> 0;

    const seed0 = fnv1a32(concatBytes(keyBytes, nonce));
    const plain = new Uint8Array(cipher.length);
    for (let i = 0; i < cipher.length; i += 1) {
      plain[i] = cipher[i] ^ keystreamByte(seed0, i, keyBytes);
    }
    const expectedTag = fnv1a32(concatBytes(keyBytes, nonce, plain)) & 0xffff;
    if (tag !== expectedTag) {
      throw new Error('Enlace inválido o alterado.');
    }
    const parsed = JSON.parse(decoder.decode(plain));
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Datos de señal inválidos.');
    }
    return parsed;
  }

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function roundStake(value, roundTo) {
    if (roundTo <= 0) return round2(value);
    const rounded = Math.round(value / roundTo) * roundTo;
    return Math.max(roundTo, rounded);
  }

  function evaluateTwoWay(opts) {
    const o1 = Number(opts.oddA);
    const o2 = Number(opts.oddB);
    const mode = opts.mode || 'bankroll';
    const roundTo = opts.roundTo ? 1 : 0;

    if (!Number.isFinite(o1) || o1 <= 1.0 || !Number.isFinite(o2) || o2 <= 1.0) {
      return null;
    }

    const impliedMargin = 1.0 / o1 + 1.0 / o2;
    const roiPercent = (1.0 / impliedMargin - 1.0) * 100.0;

    let rawA = 0;
    let rawB = 0;
    let stakeA = 0;
    let stakeB = 0;

    if (mode === 'lockA') {
      const limitA = Number(opts.stakeA);
      if (!Number.isFinite(limitA) || limitA <= 0) return null;
      stakeA = round2(limitA);
      rawA = stakeA;
      rawB = (stakeA * o1) / o2;
      stakeB = roundStake(rawB, roundTo);
    } else if (mode === 'lockB') {
      const limitB = Number(opts.stakeB);
      if (!Number.isFinite(limitB) || limitB <= 0) return null;
      stakeB = round2(limitB);
      rawB = stakeB;
      rawA = (stakeB * o2) / o1;
      stakeA = roundStake(rawA, roundTo);
    } else {
      const bankroll = Number(opts.bankroll);
      if (!Number.isFinite(bankroll) || bankroll <= 0) return null;
      rawA = bankroll / (impliedMargin * o1);
      rawB = bankroll / (impliedMargin * o2);
      stakeA = roundStake(rawA, roundTo);
      stakeB = roundStake(rawB, roundTo);
    }

    const totalStake = round2(stakeA + stakeB);
    const retA = round2(stakeA * o1);
    const retB = round2(stakeB * o2);
    const netA = round2(retA - totalStake);
    const netB = round2(retB - totalStake);
    const minNetProfit = Math.min(netA, netB);

    return {
      mode,
      impliedMargin,
      roiPercent,
      totalStake,
      minNetProfit,
      legs: [
        {
          price: o1,
          stake: stakeA,
          exactStake: round2(rawA),
          potentialReturn: retA,
          netProfit: netA,
          sharePct: totalStake > 0 ? (stakeA / totalStake) * 100 : 0,
          isLocked: mode === 'lockA',
        },
        {
          price: o2,
          stake: stakeB,
          exactStake: round2(rawB),
          potentialReturn: retB,
          netProfit: netB,
          sharePct: totalStake > 0 ? (stakeB / totalStake) * 100 : 0,
          isLocked: mode === 'lockB',
        },
      ],
    };
  }

  return {
    encryptCalcPayload,
    decryptCalcPayload,
    evaluateTwoWay,
    round2,
    roundStake,
  };
});
