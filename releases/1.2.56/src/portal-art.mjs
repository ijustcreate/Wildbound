// Analytic pixel particles: bounded work, no growing particle list or blur pass.
export const PORTAL_PARTICLE_COUNT = 28;
export function portalVisualSample(d, time) {
  const t = Number.isFinite(time) ? time : 0;
  const closing = Number.isFinite(d.closing) ? d.closing : null;
  const scale = closing === null ? 1 : Math.max(.35, Math.min(1, closing / 1.5));
  const pulse = 1 + Math.sin(t * 3) * .035;
  const rim = Array.from({length: 64}, (_, i) => {
    const a = i * Math.PI * 2 / 64;
    return {x: Math.round(Math.cos(a) * 19 * scale * pulse), y: Math.round(-18 + Math.sin(a) * 29 * pulse), shade: Math.sin(a - .8)};
  });
  const spiral = Array.from({length: 108}, (_, i) => {
    const u = (i % 54) / 53, a = t * 1.8 + u * Math.PI * 4 + (i >= 54 ? Math.PI : 0);
    return {x: Math.round(Math.cos(a) * (1 + u * 16) * scale), y: Math.round(-18 + Math.sin(a) * (1 + u * 25)), u};
  });
  const particles = Array.from({length: PORTAL_PARTICLE_COUNT}, (_, i) => {
    const u = ((t * (.16 + (i % 3) * .025) + i * .618034) % 1 + 1) % 1;
    const a = i * 2.399963 + t * 1.6 + u * 3;
    return {x: Math.round(Math.cos(a) * (3 + (1 - u) * 25) * scale), y: Math.round(-18 + Math.sin(a) * (4 + (1 - u) * 36)), alpha: Math.sin(u * Math.PI) * .8, size: i % 4 === 0 ? 2 : 1};
  });
  return {rim, spiral, particles, scale};
}
function tint(hex, target, amount) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return '#' + rgb.map((v, i) => Math.round(v + (target[i] - v) * amount).toString(16).padStart(2, '0')).join('');
}
export function drawPortal(ctx, d, time, label = 'PRIVATE STORAGE') {
  const color = /^#[0-9a-f]{6}$/i.test(d.color || '') ? d.color : '#aa65ff';
  const {rim, spiral, particles, scale} = portalVisualSample(d, time);
  const light = tint(color, [236, 246, 255], .68), dark = tint(color, [12, 20, 32], .72);
  ctx.save();ctx.translate(Math.round(d.x), Math.round(d.y));
  ctx.shadowColor = color;ctx.shadowBlur = 0;ctx.strokeStyle = color;
  ctx.fillStyle = '#08131b80';
  ctx.beginPath();ctx.ellipse(0, 10, 27, 8, 0, 0, Math.PI * 2);ctx.fill();
  // Each depth band follows an oval. Never change an entire rectangular row's
  // color at a cutoff: that leaves a conspicuous square edge inside the rim.
  for (const [rx, ry, shade] of [[19,29,dark],[16,25,tint(color,[8,15,27],.86)],[12,19,'#0d1424']]) {
    ctx.fillStyle = shade;
    for (let y = -ry; y <= ry; y += 2) {
      const width = Math.round(Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)) * rx * scale);
      ctx.fillRect(-width, y - 18, width * 2, 2);
    }
  }
  for (const point of spiral) {
    ctx.fillStyle = point.u < .28 ? light : point.u < .72 ? color : dark;
    ctx.globalAlpha = .45 + point.u * .3;ctx.fillRect(point.x - 1, point.y - 1, 2, 2);
  }
  ctx.globalAlpha = 1;
  for (const point of rim) {
    ctx.fillStyle = point.shade < -.3 ? light : point.shade > .65 ? dark : color;
    ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
    if (point.shade < -.5) {ctx.fillStyle = '#edf4ff';ctx.fillRect(point.x, point.y - 1, 1, 1);}
  }
  for (const point of particles) {
    ctx.globalAlpha = point.alpha;ctx.fillStyle = light;ctx.fillRect(point.x, point.y, point.size, point.size);
  }
  ctx.globalAlpha = 1;ctx.font = '6px monospace';ctx.textAlign = 'center';
  const closing = Number.isFinite(d.closing);
  ctx.fillStyle = closing ? '#ffe2a1' : '#ead4ff';
  ctx.fillText(closing ? Math.ceil(Math.max(0, d.closing)) + 's TO COLLAPSE' : label, 0, -61);
  ctx.restore();
}
