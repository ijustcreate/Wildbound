export function drawFieldWorld(c, g) {
  const r = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), w, h);
  };
  for (const t of g.traps) {
    if (t.variant === "slow") {
      for (let n = 0; n < 5; n++) {
        r(t.x - 13 + n * 6, t.y - 5 - (n % 2) * 3, 2, 8, "#82b867");
      }
    } else if (t.variant === "lure") {
      r(t.x - 3, t.y - 10, 6, 7, "#e8b761");
      r(t.x, t.y - 13, 2, 3, "#8dc77e");
    } else if (t.variant === "interrupt") {
      r(t.x - 2, t.y - 11, 4, 10, "#d7c9ff");
      r(t.x - 5, t.y - 8, 10, 3, "#b8a8ed");
    }
  }
  const o = g.objective;
  if (o && !o.done && ["protect", "rescue", "ritual"].includes(o.kind)) {
    const x = o.x,
      y = o.y;
    if (o.kind === "rescue") {
      r(x - 4, y - 20, 8, 7, "#d9ab76");
      r(x - 5, y - 13, 10, 10, "#7799a6");
      r(x - 6, y - 3, 4, 5, "#584c43");
      r(x + 2, y - 3, 4, 5, "#584c43");
    } else {
      r(x - 12, y - 8, 24, 12, "#686d59");
      r(x - 8, y - 27, 16, 22, "#9e9e73");
      r(x - 4, y - 23, 8, 11, o.kind === "ritual" ? "#c78bea" : "#7ed8ae");
      r(x - 2, y - 22, 3, 7, "#e4ecc5");
    }
    c.strokeStyle = o.kind === "ritual" ? "#c78bea" : "#7ed8ae";
    c.beginPath();
    c.arc(x, y, 30 + Math.sin(g.time * 3) * 2, 0, Math.PI * 2);
    c.stroke();
    c.font = "7px monospace";
    c.textAlign = "center";
    c.fillStyle = "#eef0d7";
    c.fillText(
      o.kind === "protect"
        ? `RELIC ${Math.ceil(o.health)}%`
        : o.kind === "ritual"
          ? "HOLD INTERACT · DISRUPT"
          : "HOLD INTERACT · RESCUE",
      x,
      y + 17,
    );
  }
  for (const p of g.players) {
    if (p.room) continue;
    c.fillStyle = p.color;
    c.font = "bold 8px monospace";
    c.textAlign = "center";
    c.fillText(p.field?.symbol || "", p.x, p.y + 19);
  }
}
