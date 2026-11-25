import {pixelLine, pixelPolygon} from './pixel-shapes.mjs';

const polygon = (c, points, color) => pixelPolygon(c, points.map(([x,y]) => ({x,y})), color);

export function merlinBeardFrame(actor, time) {
  if (actor.appearance?.facialHair !== 'wizardbeard') return;
  const sway = Math.sin(time * 3.1) * 1.15;
  const gait = actor.moving ? Math.sin(time * 8.4 - .8) * .85 : 0;
  return Math.round(sway + gait);
}

export function drawMerlinBeard(c, head, direction, sway = 0) {
  if (direction === 4) return;
  const rear = direction === 3 || direction === 5;
  const side = direction === 2 || direction === 6;
  const turn = direction < 4 ? -1 : 1;
  const shape = (points, color) => polygon(c, points.map(([x,y]) => [
    head.x + x + sway * Math.max(0, y - 4) / 15,
    head.y + y,
  ]), color);
  const ink = '#535969', shadow = '#9aa0a5', base = '#cdd0cb', light = '#eeece0';

  if (rear) {
    const edge = direction === 3 ? -1 : 1;
    shape([[edge*4,2],[edge*5,4],[edge*5,7],[edge*4,10],[edge*4,7],[edge*3,4]], ink);
    shape([[edge*4,4],[edge*5,5],[edge*4,8],[edge*4,6]], shadow);
    return;
  }

  if (side) {
    const fold = (points, color) => shape(points.map(([x,y]) => [x*turn,y]), color);
    fold([[-2,2],[1,3],[5,2],[5,5],[4,9],[2,13],[0,17],[-2,19],[-3,17],[-3,12],[-2,7]], ink);
    fold([[-1,3],[2,4],[4,3],[4,6],[3,10],[1,14],[-2,18],[-2,13],[-1,8]], base);
    fold([[3,4],[4,5],[3,10],[1,14],[-1,16],[1,10],[1,6]], shadow);
    fold([[-1,4],[1,4],[1,8],[-1,13],[-2,15],[-1,9]], light);
    fold([[2,1],[4,1],[6,2],[5,3],[2,3],[1,2]], light);
    return;
  }

  const diagonal = direction !== 0;
  const trim = (points, color) => shape(points.map(([x,y]) => [
    x * (diagonal ? .88 : 1) + (diagonal ? turn * .85 : 0), y,
  ]), color);
  trim([[-5,2],[-2,3],[2,3],[5,2],[5,6],[4,10],[2,14],[0,19],[-2,17],[-3,13],[-5,9],[-6,5]], ink);
  trim([[-4,3],[-2,4],[2,4],[4,3],[4,7],[3,10],[1,14],[0,18],[-2,15],[-3,10],[-5,5]], base);
  trim([[2,4],[4,3],[4,7],[3,10],[1,14],[0,17],[-1,13],[1,8]], shadow);
  trim([[-4,4],[-2,5],[0,5],[-1,8],[-2,12],[-1,15],[-3,12],[-4,8]], light);
  trim([[-4,2],[-2,1],[0,2],[2,1],[4,2],[3,3],[1,3],[0,2.6],[-2,3],[-4,3]], light);
}

export function drawMerlinRobe(c, pose, direction, cloth) {
  const {chest,pelvis,kneeL,kneeR,footL,footR} = pose;
  const side = direction === 2 || direction === 6;
  const back = direction >= 3 && direction <= 5;
  const top = Math.min(chest.y + 5, pelvis.y - 4);
  const bottom = Math.max(top + 5, footL.y - 1, footR.y - 1);
  const waist = pelvis.x, waistHalf = side ? 4 : 5;
  const left = Math.min(footL.x - 2.6, footR.x - 2.6, waist - waistHalf - 2);
  const right = Math.max(footL.x + 2.8, footR.x + 2.8, waist + waistHalf + 2);
  const knee = (kneeL.x + kneeR.x) / 2;
  const mid = (top + bottom) / 2;

  polygon(c, [[waist-waistHalf,top],[waist+waistHalf,top],[knee+waistHalf+1,mid],
    [right,bottom-1],[right-2,bottom+1],[left+2,bottom+1],[left,bottom-1],[knee-waistHalf-1,mid]], cloth.ink);
  polygon(c, [[waist-waistHalf+1,top],[waist+waistHalf-1,top],[knee+waistHalf,mid],
    [right-1,bottom-1],[right-2,bottom],[left+2,bottom],[left+1,bottom-1],[knee-waistHalf,mid]], cloth.base);
  polygon(c, [[waist+1,top],[waist+waistHalf-1,top],[knee+waistHalf,mid],[right-1,bottom-1],
    [right-2,bottom],[(left+right)/2+1,bottom],[knee+1,mid]], cloth.dark);
  polygon(c, [[waist-waistHalf+1,top+2],[waist-waistHalf+3,top+1],[knee-1,mid],
    [left+4,bottom-1],[left+2,bottom-1],[knee-waistHalf+1,mid]], cloth.light);
  if (!back) {
    c.fillStyle = cloth.trim;
    c.fillRect(Math.round(waist - 1), Math.round(top + 1), 2, 1);
  }
}

export function drawMerlinWand(c, hand, tip) {
  const root = {x: hand.x + (hand.x-tip.x)*.15, y: hand.y + (hand.y-tip.y)*.15};
  pixelLine(c, root, tip, '#382b32', 2);
  pixelLine(c, hand, tip, '#a57a54');
  c.fillStyle = '#d4ad66';
  c.fillRect(Math.round(hand.x + (tip.x-hand.x)*.26), Math.round(hand.y + (tip.y-hand.y)*.26), 1, 1);
  c.fillStyle = '#e0d4ad';
  c.fillRect(Math.round(tip.x), Math.round(tip.y), 1, 1);
}

export function drawMerlinRobeIcon(c) {
  polygon(c, [[9,2],[15,2],[20,5],[21,12],[17,13],[20,21],[16,23],[8,23],[4,21],[7,13],[3,12],[4,5]], '#28344d');
  polygon(c, [[9,3],[15,3],[19,6],[19,11],[15,10],[19,21],[5,21],[9,10],[5,11],[5,6]], '#416da2');
  polygon(c, [[12,4],[15,4],[18,6],[17,11],[18,20],[13,21],[13,11]], '#345583');
  polygon(c, [[8,9],[10,10],[8,17],[7,20],[6,20]], '#6f92ba');
  c.fillStyle = '#d5af6b';c.fillRect(10,4,4,1);c.fillRect(11,9,2,1);
}
