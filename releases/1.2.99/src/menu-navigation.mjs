// Choose the next visible control by its screen position, so a grid follows
// the direction pressed instead of advancing through DOM reading order.
export function spatialMenuNeighbor(buttons, current, x, y) {
  if (!current || (!x && !y)) return current;
  const rect = current.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  let nearest = current, best = Infinity;
  for (const button of buttons) {
    if (button === current || button.disabled || !button.getClientRects().length) continue;
    const box = button.getBoundingClientRect();
    const dx = box.left + box.width / 2 - cx;
    const dy = box.top + box.height / 2 - cy;
    const forward = x ? dx * x : dy * y;
    if (forward <= 2) continue;
    // A full-width row overlaps both columns. Measuring only its center made
    // Down from Boundless skip the nearby maps in favour of the centered Close.
    const cross = x ? Math.abs(dy) : Math.max(0, box.left-(rect.left+rect.width), rect.left-(box.left+box.width)) + Math.abs(dx)*.01;
    const score = forward + cross * 3;
    if (score < best) {best = score; nearest = button;}
  }
  return nearest;
}
