const PerfSystem = (() => {
  const SAMPLE_WINDOW = 40;
  let samples = [];
  let mode = 'auto'; // auto | high | low
  let maxShapes = 90;
  let particlesEnabled = true;
  const HARD_MIN = 35;
  const HARD_MAX = 220;

  function reset() { samples = []; }
  function setMode(m) {
    mode = m;
    if (m === 'high') { maxShapes = HARD_MAX; particlesEnabled = true; }
    if (m === 'low') { maxShapes = HARD_MIN; particlesEnabled = false; }
  }

  function recordFrame(dtMs) {
    samples.push(dtMs);
    if (samples.length > SAMPLE_WINDOW) samples.shift();
    if (mode !== 'auto') return;
    if (samples.length < SAMPLE_WINDOW) return;
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const fps = 1000 / avg;
    if (fps < 48 && maxShapes > HARD_MIN) {
      maxShapes = Math.max(HARD_MIN, maxShapes - 10);
      particlesEnabled = maxShapes > 60;
      samples = [];
    } else if (fps > 57 && maxShapes < HARD_MAX) {
      maxShapes = Math.min(HARD_MAX, maxShapes + 6);
      particlesEnabled = maxShapes > 60 || mode === 'high';
      samples = [];
    }
  }

  function getMaxShapes() { return maxShapes; }
  function getParticlesEnabled() { return particlesEnabled; }
  function getMode() { return mode; }
  function currentFps() {
    if (!samples.length) return 60;
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    return Math.round(1000 / avg);
  }

  return { reset, setMode, recordFrame, getMaxShapes, getParticlesEnabled, getMode, currentFps };
})();
