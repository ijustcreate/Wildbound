export function drawPortal(ctx, d, time, label = "PRIVATE STORAGE") {
  ctx.save();
  ctx.translate(d.x, d.y);
  const color = /^#[0-9a-f]{6}$/i.test(d.color || "") ? d.color : "#aa65ff";
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, -14, 19 + Math.sin(time * 4) * 2, 31, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color + "66";
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = "6px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ead4ff";
  ctx.fillText(
    d.closing === null ? label : Math.ceil(d.closing) + "s TO COLLAPSE",
    0,
    -52,
  );
  ctx.restore();
}
