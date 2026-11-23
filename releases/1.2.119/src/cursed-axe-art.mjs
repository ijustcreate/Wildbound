import { pixelLine, pixelPolygon } from './pixel-shapes.mjs';

// A left-cutting field axe. The long ash haft and thin bright bevel follow
// the proportions and light of the native long axe, with an iron eye and
// one red inlay. Paint the same 17x32 silhouette at 24px and on the grip.
const IRON = '#22252d';
const FORGE = '#46505d';
const FACE = '#68767e';
const EDGE = '#aebbb6';
const GLINT = '#e0dec8';

function paintAxe(c, grip, head, width, length, rear) {
  const distance = Math.hypot(head.x - grip.x, head.y - grip.y) || 1;
  const forwardX = (head.x - grip.x) / distance;
  const forwardY = (head.y - grip.y) / distance;
  const point = ([x, y]) => ({
    x: grip.x - x * width * forwardY + (21 - y) * length * forwardX,
    y: grip.y + x * width * forwardX + (21 - y) * length * forwardY,
  });
  const area = (color, path) => pixelPolygon(c, path.map(point), color);
  const seam = (color, start, end) => pixelLine(c, point(start), point(end), color);

  // Slight flare at the bound heel and a warm leading plane on the ash.
  area('#302522', [[-2,1],[2,1],[2,18],[1,23],[2,28],[1,30],[-2,31],[-3,28],[-2,20]]);
  area('#765040', [[-1,2],[1,2],[1,17],[0,24],[1,28],[-1,29],[-2,27],[-1,21]]);
  seam('#ac7958', [-1,9], [-1,17]);
  area('#493437', [[-2,18],[1,18],[1,23],[-1,27],[-2,26]]);
  seam('#987360', [-1,19], [1,18]);
  seam('#987360', [-1,24], [1,23]);
  seam('#846456', [-2,28], [1,28]);

  // The straight poll and flared bite give the head its working silhouette.
  area(IRON, [[-12,0],[-9,0],[-5,2],[-2,3],[3,2],[5,4],[5,8],[3,9],[-2,8],[-5,9],[-9,12],[-12,12],[-13,10],[-14,7],[-14,4],[-13,2]]);
  area(FORGE, [[-12,1],[-9,1],[-4,4],[2,4],[4,5],[4,7],[2,8],[-3,7],[-6,9],[-10,11],[-12,10],[-13,7],[-13,4]]);
  area(rear ? FORGE : FACE, [[-11,2],[-8,2],[-4,4],[-1,5],[-3,7],[-6,8],[-10,10],[-12,8],[-12,4]]);
  area(rear ? FACE : EDGE, [[-12,2],[-11,2],[-11,5],[-12,7],[-10,10],[-10,11],[-12,10],[-13,7],[-13,4]]);
  seam(rear ? EDGE : GLINT, [-12,3], [-12,6]);
  seam(FACE, [2,4], [4,5]);
  area(IRON, [[-2,3],[1,3],[2,5],[1,8],[-2,8],[-3,6]]);
  area(FACE, [[-2,4],[1,4],[1,6],[-2,7]]);
  if (!rear) {
    area('#732941', [[-7,4],[-5,5],[-4,7],[-6,8],[-8,6]]);
    seam('#e96673', [-7,5], [-6,6]);
  }
}

export function paintCursedAxeIcon(c) {
  paintAxe(c, {x:16,y:16}, {x:10,y:4}, .73, .72, false);
}

export function drawCursedAxe(c, grip, head, direction) {
  // The poll keeps thickness in profile and the far iron face loses its rune.
  const width = [.95,.84,.58,.74,.88,.74,.58,.84][direction];
  paintAxe(c, grip, head, width, .83, direction >= 3 && direction <= 5);
}
