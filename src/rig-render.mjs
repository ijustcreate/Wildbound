const oval = (c, x, y, w, h, color) => {
  c.fillStyle = color;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++)
      if (((i - w / 2) / (w / 2)) ** 2 + ((j - h / 2) / (h / 2)) ** 2 < 1)
        c.fillRect(Math.round(x + i), Math.round(y + j), 1, 1);
};
export function drawRig(c, assets, actor, time, rig) {
  if (["quadruped", "serpent"].includes(rig.type))
    c.rotate(Math.atan2(actor.faceY ?? 1, actor.faceX || 0) + Math.PI / 2);
  const phase =
      actor.step !== undefined ? actor.step * (rig.rate / 8) : time * rig.rate,
    move = actor.moving !== false,
    s = Math.sin(phase) * (move ? 1 : 0) * (rig.stride / 4),
    direction =
      Math.abs(actor.faceX || 0) > Math.abs(actor.faceY || 0)
        ? actor.faceX < 0
          ? "left"
          : "right"
        : actor.faceY < 0
          ? "up"
          : "down";
  const action =
      actor.animationAction ||
      (actor.attack > 0 ? "attack" : actor.moving ? "walk" : "idle"),
    clip = rig.clips?.[action],
    t = actor.poseTime ?? (clip ? (time % clip.duration) / clip.duration : 0);
  if (move) c.translate(0, Math.round(Math.sin(phase * 2) * rig.bob));
  const byName = new Map(
    rig.parts.map((p) => {
      const q = { ...p, ...p.views?.[direction] };
      const keys = clip?.keys?.filter((k) => k.parts[p.name]) || [];
      if (keys.length) {
        let a = keys.filter((k) => k.t <= t).at(-1) || keys[0],
          b = keys.find((k) => k.t >= t) || keys.at(-1),
          f = a === b ? 0 : (t - a.t) / (b.t - a.t);
        for (const key of ["x", "y", "angle"])
          q[key] +=
            (a.parts[p.name][key] || 0) * (1 - f) +
            (b.parts[p.name][key] || 0) * f;
      }
      if (direction === "up" && rig.type === "humanoid" && !p.views?.up) {
        if (p.name.endsWith("L") || p.name.endsWith("R")) q.x = -q.x;
      }
      return [p.name, q];
    }),
  );
  const pose = (p) =>
    p.motion === "legL"
      ? s * 0.3
      : p.motion === "legR"
        ? -s * 0.3
        : p.motion === "armL"
          ? -s * 0.4
          : p.motion === "armR"
            ? actor.state === "rocklift"
              ? 1.15
              : actor.state === "windup"
                ? -2.3
                : actor.attack
                  ? Math.sin((0.34 - actor.attack) * 9) * 1.8
                  : actor.charge
                    ? -1.2
                    : s * 0.4
            : p.motion === "wingL"
              ? Math.sin(time * 12) * 0.7
              : p.motion === "wingR"
                ? -Math.sin(time * 12) * 0.7
                : 0;
  const transform = (p, seen = new Set()) => {
    if (seen.has(p.name)) return;
    seen.add(p.name);
    const parent = byName.get(p.parent);
    if (parent) transform(parent, seen);
    c.translate(Math.round(p.x), Math.round(p.y));
    c.rotate(p.angle + pose(p));
  };
  if (["quadruped", "serpent"].includes(rig.type)) {
    const count = Math.max(2, Math.min(40, rig.tailSegments || 9));
    for (let n = count - 1; n >= 0; n--) {
      const t = n / (count - 1),
        radius = Math.max(
          1,
          (rig.tailThickness || 3) * (1 - t * (rig.tailTaper || 0)),
        );
      const x = Math.sin(time * 3 - t * 3) * t * (rig.tailSwing || 0),
        y = (rig.type === "serpent" ? -6 : 10) + t * (rig.tailLength || 20);
      const segment = byName.get("tailSegment"),
        texture = segment?.source && assets.canvas(segment.source);
      if (texture)
        c.drawImage(
          texture,
          0,
          0,
          texture.width,
          texture.height,
          Math.round(x - radius),
          Math.round(y - radius),
          Math.ceil(radius * 2),
          Math.ceil(radius * 2),
        );
      else
        oval(
          c,
          x - radius,
          y - radius,
          radius * 2,
          radius * 2,
          byName.get("body")?.color || "#6b8a4b",
        );
      if (n === count - 1) {
        const end = byName.get("tailEnd"),
          source = end?.source && assets.canvas(end.source);
        if (source)
          c.drawImage(source, x - end.w / 2, y - end.h / 2, end.w, end.h);
        else
          oval(
            c,
            x - (rig.tailTip || 1),
            y - (rig.tailTip || 1),
            (rig.tailTip || 1) * 2,
            (rig.tailTip || 1) * 2,
            end?.color || "#806239",
          );
      }
    }
  }
  if (rig.type === "plant") {
    const head = byName.get("head");
    if (head) {
      const reach =
        actor.state === "windup"
          ? -8
          : actor.attack > 0
            ? (actor.attack / 0.34) * 105
            : 3;
      head.x += (actor.faceX || 0) * reach;
      head.y += (actor.faceY || 0) * reach;
      for (let n = 0; n < 15; n++) {
        const t = n / 14;
        oval(
          c,
          head.x * t + Math.sin(t * Math.PI) * Math.sin(time * 2) * 4 - 3,
          18 + (head.y - 18) * t,
          6,
          6,
          "#78914f",
        );
      }
    }
  }
  const parts = [...byName.values()];
  if (rig.type === "humanoid" && direction === "up")
    parts.sort((a, b) => {
      const rank = (p) =>
        p.name.includes("arm") || p.name.includes("hand")
          ? 0
          : p.name === "body"
            ? 2
            : p.name === "head"
              ? 3
              : 1;
      return rank(a) - rank(b);
    });
  for (const p of parts) {
    if (["tailEnd", "tailSegment"].includes(p.name)) continue;
    c.save();
    transform(p);
    let color = p.color;
    const gear = actor.equipment || {};
    if (p.name === "body" && gear.chest) color = "#927a50";
    if (p.name.startsWith("leg") && gear.pants) color = "#809e94";
    if (p.name.startsWith("foot") && gear.feet) color = "#7fac69";
    if (p.name.startsWith("hand") && gear.gloves) color = "#9fc27b";
    const source = p.source && assets.canvas(p.source),
      x = -p.w * p.pivotX,
      y = -p.h * p.pivotY;
    if (source) {
      const [sx, sy, sw, sh] = p.rect;
      c.drawImage(
        source,
        sx,
        sy,
        sw,
        sh,
        Math.round(x),
        Math.round(y),
        p.w,
        p.h,
      );
    } else oval(c, x, y, p.w, p.h, color);
    if (
      source &&
      ((p.name === "body" && gear.chest) ||
        (p.name.startsWith("leg") && gear.pants) ||
        (p.name.startsWith("foot") && gear.feet) ||
        (p.name.startsWith("hand") && gear.gloves))
    ) {
      c.globalAlpha = 0.6;
      c.fillStyle = color;
      c.fillRect(x, y, p.w, p.h);
      c.globalAlpha = 1;
    }
    if (["skeleton", "archer", "skeleton_wizard"].includes(actor.kind)) {
      c.fillStyle = "#29382e";
      if (p.name === "body")
        for (let n = 2; n < 13; n += 4) c.fillRect(-6, n, 12, 2);
      if (p.name === "head") {
        c.fillRect(-4, 12, 8, 2);
        c.fillRect(-1, 7, 2, 3);
      }
      if (actor.kind === "skeleton_wizard" && p.name === "body") {
        c.fillStyle = "#344b7d";
        c.fillRect(-8, 1, 16, 14);
        c.fillStyle = "#8fb8ec";
        c.fillRect(-7, 2, 2, 10);
        c.fillRect(5, 2, 2, 10);
      }
    }
    if (p.name === "head" && actor.kind === "rhino") {
      c.fillStyle = "#e0dcc2";
      for (let j = 0; j < 7; j++) c.fillRect(-3 + j / 2, 5 - j, 6 - j, 1);
    }
    if (p.name === "head" && rig.type === "plant") {
      const gap =
        actor.state === "windup" ? 7 : actor.state === "recover" ? 1 : 3;
      c.fillStyle = "#241e25";
      c.fillRect(-10, 4, 20, gap);
      c.fillStyle = "#f3dfac";
      for (let n = -8; n < 9; n += 4) {
        c.fillRect(n, 3, 2, 3);
        c.fillRect(n + 1, 3 + gap, 2, 3);
      }
    }
    if (p.name === "head") {
      c.fillStyle = "#29281f";
      if (direction !== "up" && !source) {
        c.fillRect(-5, 5, 2, 2);
        c.fillRect(4, 5, 2, 2);
      }
      if (gear.head === "hat") {
        c.fillStyle = "#c6a261";
        c.fillRect(-7, -3, 14, 2);
        c.fillRect(-5, -7, 10, 5);
        if (actor.gearStyle === "hood") {
          c.fillRect(-6, -7, 2, 8);
          c.fillRect(4, -7, 2, 8);
        } else if (["helmet", "fullhelm"].includes(actor.gearStyle)) {
          c.fillStyle = "#d2d7cb";
          c.fillRect(-6, -6, 12, 7);
          c.fillStyle = "#48545a";
          c.fillRect(-4, -1, 8, 2);
        } else if (actor.gearStyle === "horned") {
          c.fillStyle = "#e5d6ad";
          c.fillRect(-7, -8, 2, 5);
          c.fillRect(5, -8, 2, 5);
        }
      }
      if (gear.head === "charm") {
        c.fillStyle = "#ffcc6c";
        c.fillRect(-2, 1, 4, 4);
      }
    }
    if (p.name === "handR" && ["sword", "dagger"].includes(gear.hand1)) {
      c.fillStyle = "#d4dfdb";
      c.fillRect(0, 2, 3, gear.hand1 === "sword" ? 22 : 12);
    }
    if (p.name === "handL" && gear.hand2 === "shield") {
      c.fillStyle = actor.blocking ? "#cadb97" : "#81945f";
      c.fillRect(-7, -2, 12, 18);
    }
    if (p.name === "handL" && gear.hand2 === "dagger") {
      c.fillStyle = "#d4dfdb";
      c.fillRect(0, 3, 3, 12);
    }
    if (p.name === "handR" && gear.hand1 === "bow") {
      c.strokeStyle = "#cba972";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 8, 13, -1.3, 1.3);
      c.stroke();
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(4, -4);
      c.lineTo(actor.charge ? -5 : 4, 8);
      c.lineTo(4, 20);
      c.stroke();
    }
    c.restore();
  }
}
