// Small bounded diagnostics: measurements are opt-in and never saved with a game.
export class FrameMetrics {
  constructor() {
    this.enabled = false;
    this.samples = {};
    this.last = 0;
  }
  record(name, ms) {
    if (!this.enabled) return;
    const list = (this.samples[name] ||= []);
    list.push(ms);
    if (list.length > 240) list.shift();
  }
  measure(name, fn) {
    if (!this.enabled) return fn();
    const t = performance.now();
    try {
      return fn();
    } finally {
      this.record(name, performance.now() - t);
    }
  }
  summary() {
    return Object.entries(this.samples)
      .map(([name, list]) => {
        const s = [...list].sort((a, b) => a - b);
        return `${name}: ${(s.reduce((a, b) => a + b, 0) / s.length).toFixed(1)} / ${s[Math.floor((s.length - 1) * 0.95)].toFixed(1)} ms`;
      })
      .join(" · ");
  }
}
export class FixedClock {
  constructor(step = 1 / 60) {
    this.step = step;
    this.remainder = 0;
  }
  advance(elapsed, update) {
    this.remainder += Math.min(0.25, Math.max(0, elapsed));
    let steps = 0;
    while (this.remainder + 1e-9 >= this.step && steps < 15) {
      update(this.step);
      this.remainder -= this.step;
      steps++;
    }
    return steps;
  }
  reset() {
    this.remainder = 0;
  }
}
const indices = new WeakMap();
export function nearbyScenery(list, x, y, radius = 0) {
  let index = indices.get(list);
  if (!index || index.length !== list.length) {
    index = { length: list.length, cells: new Map(), margin: 0 };
    for (const p of list) {
      const key = `${Math.floor(p.x / 128)},${Math.floor(p.y / 128)}`;
      if (!index.cells.has(key)) index.cells.set(key, []);
      index.cells.get(key).push(p);
      index.margin = Math.max(index.margin, p.size || 128);
    }
    indices.set(list, index);
  }
  const range = radius + index.margin,
    result = [];
  for (
    let cy = Math.floor((y - range) / 128);
    cy <= Math.floor((y + range) / 128);
    cy++
  )
    for (
      let cx = Math.floor((x - range) / 128);
      cx <= Math.floor((x + range) / 128);
      cx++
    )
      for (const p of index.cells.get(`${cx},${cy}`) || []) result.push(p);
  return result;
}
