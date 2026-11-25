export function drawMinimapPlayer(ctx, x, y, player, scale = 1) {
  const {faceX = 0, faceY = 0} = player;
  const angle = faceX || faceY ? Math.atan2(faceY, faceX) : Math.PI / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(4.6, 0);
  ctx.lineTo(.1, 2.8);
  ctx.bezierCurveTo(-4.4, 4.6, -4.4, -4.6, .1, -2.8);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#101e1d';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = player.color || '#75e6c6';
  ctx.fill();
  ctx.strokeStyle = '#fff9e9';
  ctx.lineWidth = .65;
  ctx.stroke();
  ctx.restore();
}
