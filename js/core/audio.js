const AudioSystem = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;
  let volume = 0.7;

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    return ctx;
  }

  function unlock() {
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  function setEnabled(v) { enabled = v; }
  function setVolume(v) { volume = v; if (master) master.gain.value = v; }

  function tone({ freq = 440, dur = 0.12, type = 'sine', gain = 0.18, freqEnd = null, delay = 0 }) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // pitch varies gently by shape size so taps feel musically alive
  const SIZE_PITCH = { small: 780, medium: 520, large: 340 };

  return {
    unlock, setEnabled, setVolume,
    tapSmall() { tone({ freq: SIZE_PITCH.small, dur: 0.09, type: 'sine', gain: 0.16, freqEnd: SIZE_PITCH.small * 1.4 }); },
    split(size) {
      tone({ freq: SIZE_PITCH[size] || 500, dur: 0.11, type: 'triangle', gain: 0.14, freqEnd: (SIZE_PITCH[size] || 500) * 0.7 });
    },
    corruptPop() {
      tone({ freq: 220, dur: 0.22, type: 'sawtooth', gain: 0.1, freqEnd: 90 });
      tone({ freq: 660, dur: 0.18, type: 'sine', gain: 0.08, delay: 0.03 });
    },
    unlockChime() {
      tone({ freq: 523, dur: 0.14, type: 'sine', gain: 0.15 });
      tone({ freq: 659, dur: 0.16, type: 'sine', gain: 0.13, delay: 0.07 });
      tone({ freq: 784, dur: 0.22, type: 'sine', gain: 0.12, delay: 0.14 });
    },
    powerFire() {
      tone({ freq: 180, dur: 0.28, type: 'sine', gain: 0.14, freqEnd: 420 });
    },
    uiTap() {
      tone({ freq: 700, dur: 0.05, type: 'square', gain: 0.05 });
    },
    error() {
      tone({ freq: 160, dur: 0.12, type: 'square', gain: 0.08 });
    },
  };
})();
