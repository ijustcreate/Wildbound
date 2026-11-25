// Geometric navigation respects two-column options and full-width footer actions.
export function dialogNeighbour(controls, current, dx, dy) {
  if (!current || !controls.includes(current)) return controls[0];
  const r = current.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
  let best = current, score = Infinity;
  for (const el of controls) {
    if (el === current) continue;
    const b = el.getBoundingClientRect(), bx = b.left + b.width / 2, by = b.top + b.height / 2;
    const forward = dx ? (bx - x) * dx : (by - y) * dy;
    if (forward < 2) continue;
    // Full-width actions overlap both columns: prefer the nearest row,
    // rather than skipping its buttons to another centered action.
    const lateral = dx ? Math.abs(by - y)
      : Math.max(0,b.left-(r.left+r.width),r.left-(b.left+b.width))+Math.abs(bx-x)*.01;
    // Horizontal input cannot jump to a different row.
    if (dx && lateral > Math.max(r.height, b.height) * .6) continue;
    const nextScore = forward + lateral * 2;
    if (nextScore < score - .01) { best = el; score = nextScore; }
  }
  return best;
}

export function focusDialogControl(dialog,control){
 if(!control)return;
 control.focus();
 for(const el of dialog.querySelectorAll('.menu-focus'))if(el!==control)el.classList.remove('menu-focus');
 control.classList.add('menu-focus');
}
