import { terrainHash } from "./world.mjs";
import {boardDicePose} from './board-sequence.mjs';
const inlay=typeof Image==='undefined'?null:new Image();
if(inlay)inlay.src=new URL('../assets/board-jungle-inlay.png',import.meta.url).href;
const knots = [
  [-72, -53],
  [-72, -22],
  [-64, 15],
  [-72, 48],
  [-47, 56],
  [-16, 48],
  [20, 55],
  [65, 51],
  [72, 30],
  [53, 15],
  [37, 29],
  [42, 43],
  [12, 35],
  [-14, 24],
  [-45, 33],
  [-56, 9],
  [-43, -14],
  [-23, -19],
  [-17, -43],
  [15, -52],
  [51, -46],
  [62, -25],
  [44, -15],
  [22, -28],
  [7, -17],
  [0, 0],
];
function makeTrail() {
  const dense = [];
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[Math.max(0, i - 1)],
      b = knots[i],
      c = knots[i + 1],
      d = knots[Math.min(knots.length - 1, i + 2)];
    for (let j = 0; j < 20; j++) {
      const t = j / 20;
      dense.push(
        [0, 1].map(
          (k) =>
            0.5 *
            (2 * b[k] +
              (-a[k] + c[k]) * t +
              (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t +
              (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t * t * t),
        ),
      );
    }
  }
  dense.push(knots.at(-1));
  const lengths = [0];
  for (let i = 1; i < dense.length; i++)
    lengths[i] =
      lengths[i - 1] +
      Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]);
  return Array.from({ length: 49 }, (_, i) => {
    const target = (i / 48) * lengths.at(-1);
    let j = 1;
    while (j < lengths.length - 1 && lengths[j] < target) j++;
    const t = (target - lengths[j - 1]) / (lengths[j] - lengths[j - 1] || 1);
    return {
      x: dense[j - 1][0] + (dense[j][0] - dense[j - 1][0]) * t,
      y: dense[j - 1][1] + (dense[j][1] - dense[j - 1][1]) * t,
    };
  });
}
export const TRAIL = makeTrail();
// Shared cross-sections join neighboring stones without overlapping corners.
export const TRAIL_EDGES=TRAIL.map((p,i)=>{
  const a=TRAIL[Math.max(0,i-1)],b=TRAIL[Math.min(48,i+1)];
  const length=Math.hypot(b.x-a.x,b.y-a.y)||1;
  return {left:{x:p.x-(b.y-a.y)/length*4.7,y:p.y+(b.x-a.x)/length*4.7},right:{x:p.x+(b.y-a.y)/length*4.7,y:p.y-(b.x-a.x)/length*4.7}};
});
export function boardPoint(progress) {
  const v = Math.max(0, Math.min(48, progress)),
    i = Math.floor(v),
    a = TRAIL[i],
    b = TRAIL[Math.min(48, i + 1)],
    t = v - i;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    hop: Math.sin(t * Math.PI) * 4,
  };
}
export function drawCarvedPawn(c, x, y, i, color, hop = 0) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.fillStyle = "#231c1599";
  c.beginPath();
  c.ellipse(1, 3, 5, 2, 0, 0, Math.PI * 2);
  c.fill();
  c.translate(0, -hop);
  c.fillStyle = "#3c3627";
  c.fillRect(-4, 1, 9, 3);
  c.fillStyle = color;
  c.fillRect(-4, 0, 8, 2);
  c.fillRect(-3, -5, 6, 5);
  c.fillRect(-2, -9, 5, 5);
  if (i % 3 === 0) {
    c.fillRect(-5, -9, 3, 4);
    c.fillRect(3, -9, 3, 4);
    c.fillRect(1, -4, 2, 4);
  } else if (i % 3 === 1) {
    c.fillRect(-4, -11, 2, 3);
    c.fillRect(3, -11, 2, 3);
    c.fillRect(3, -7, 3, 3);
  } else {
    c.fillRect(-5, -6, 3, 3);
    c.fillRect(3, -6, 4, 2);
    c.fillRect(5, -8, 2, 2);
  }
  c.fillStyle = "#fff0bd88";
  c.fillRect(-2, -8, 1, 6);
  c.fillRect(-3, 0, 6, 1);
  c.fillStyle = "#14352b";
  c.fillRect(1, -7, 1, 1);
  c.restore();
}
export function drawBoard(c, game, time = 0, { closeup = false,drawDie } = {}) {
  c.save();
  c.fillStyle = "#081c1699";
  c.fillRect(-140, -72, 282, 160);
  c.fillStyle = "#302318";
  c.fillRect(-135, -79, 270, 158);
  c.fillStyle = "#593a23";
  c.fillRect(-133, -77, 266, 150);
  // Hinged carved covers, parchment insets, and brass hinges.
  for (const sign of [-1, 1]) {
    const x = sign < 0 ? -130 : 93;
    c.fillStyle = "#281e17";
    c.fillRect(x, -73, 37, 142);
    c.strokeStyle = "#a87b45";
    c.lineWidth = 1;
    c.strokeRect(x + 2, -71, 33, 138);
    for (let y = -66; y < 65; y += 9) {
      c.strokeStyle = y % 2 ? "#775430" : "#4b3221";
      c.beginPath();
      c.moveTo(x + 4, y);
      c.lineTo(x + 10, y + 5);
      c.lineTo(x + 16, y);
      c.lineTo(x + 22, y + 5);
      c.lineTo(x + 32, y);
      c.stroke();
    }
    c.fillStyle = "#cbb787";
    c.fillRect(x + 7, -48, 23, 96);
    c.fillStyle = "#6b5135";
    c.font = "3px monospace";
    c.textAlign = "center";
    const lines =
      sign < 0
        ? ["THE", "WILD", "REMEMBERS", "", "EVERY", "STEP", "", "EVERY", "ROLL"]
        : [
            "GATHER",
            "YOUR",
            "COURAGE",
            "",
            "FIND",
            "THE",
            "CENTER",
            "",
            "RETURN",
          ];
    lines.forEach((s, i) => c.fillText(s, x + 18, -35 + i * 8));
    for (const y of [-51, 45]) {
      c.fillStyle = "#a48348";
      c.fillRect(sign < 0 ? -96 : 87, y, 9, 8);
      c.fillStyle = "#e0c381";
      c.fillRect(sign < 0 ? -95 : 88, y, 7, 2);
    }
  }
  c.fillStyle = "#251e17";
  c.fillRect(-91, -76, 182, 148);
  c.fillStyle = "#a67b3d";
  c.fillRect(-85, -69, 170, 134);
  c.strokeStyle = "#ddb779";
  c.strokeRect(-87, -71, 174, 138);
  c.strokeStyle = "#392b19";
  c.strokeRect(-83, -67, 166, 130);
  if(inlay?.complete&&inlay.naturalWidth){
    c.save();c.imageSmoothingEnabled=true;c.drawImage(inlay,-82,-66,164,130);c.restore();
  }
  for (let i = 0; i < (inlay?.naturalWidth?0:145); i++) {
    const x = terrainHash(i, 3) * 160 - 80,
      y = terrainHash(i, 7) * 124 - 62;
    c.save();
    c.translate(x, y);
    c.rotate(terrainHash(i, 9) * 6.28);
    c.fillStyle = ["#384c2c", "#647742", "#9a9a53", "#375b3a"][i % 4];
    c.beginPath();
    c.moveTo(-1, -6);
    c.lineTo(3, -1);
    c.lineTo(1, 7);
    c.lineTo(-3, 1);
    c.closePath();
    c.fill();
    c.strokeStyle = "#c2ad6c";
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(0, -5);
    c.lineTo(0, 6);
    c.stroke();
    c.restore();
  }
  for (let i = 0; i < 48; i++) {
    const a=TRAIL_EDGES[i],b=TRAIL_EDGES[i+1];
    c.fillStyle = ["#dbc990","#c7bd99","#ddd1aa","#c9bd88","#bdc5a5","#e4d7ac"][i%6];
    c.strokeStyle = "#69583a";
    c.lineWidth = 0.4;
    c.beginPath();
    c.moveTo(a.left.x,a.left.y);
    c.lineTo(b.left.x,b.left.y);
    c.lineTo(b.right.x,b.right.y);
    c.lineTo(a.right.x,a.right.y);
    c.closePath();
    c.fill();
    c.stroke();
    c.strokeStyle='#fff2c377';c.lineWidth=.22;c.beginPath();
    c.moveTo(a.left.x,a.left.y);c.lineTo(b.left.x,b.left.y);c.stroke();
  }
  c.fillStyle = "#674c27";
  c.beginPath();
  c.arc(0, 0, 22, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#e1c67b";
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, 21, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    c.strokeStyle = "#a9823f";
    c.beginPath();
    c.moveTo(Math.cos(a) * 19, Math.sin(a) * 19);
    c.lineTo(Math.cos(a + 0.09) * 21, Math.sin(a + 0.09) * 21);
    c.stroke();
  }
  const lens = c.createRadialGradient(-5, -7, 1, 0, 0, 19);
  lens.addColorStop(0, "#59be76");
  lens.addColorStop(0.35, "#24744a");
  lens.addColorStop(0.8, "#0a392b");
  lens.addColorStop(1, "#071e19");
  c.fillStyle = lens;
  c.beginPath();
  c.arc(0, 0, 19, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.beginPath();
  c.arc(0, 0, 18, 0, Math.PI * 2);
  c.clip();
  for(let i=0;i<9;i++){
    const phase=time*.65+i*2.1;
    for(let layer=0;layer<3;layer++){
      c.strokeStyle=['#74d4b010','#80e8c10e','#cbfbc916'][layer];
      c.filter=closeup?(layer===0?'blur(5px)':layer===1?'blur(2px)':'none'):'none';
      c.lineWidth=[3.7,1.6,.22][layer];c.beginPath();
      for(let j=0;j<=38;j++){
        const y=21-j*1.15,x=Math.sin(j*.13+phase)*(4+j*.17)+Math.cos(j*.27-phase)*2+Math.sin(j*.48+phase)*.6;
        if(j===0)c.moveTo(x,y);else c.lineTo(x,y);
      }c.stroke();
    }
  }
  c.filter='none';
  c.fillStyle = "#caffbc";
  c.textAlign = "center";
  c.font = "bold 3px monospace";
  const message =
    game.roll && !game.roll.resolved
      ? game.roll.elapsed < 1.6
        ? ["FATE IS", "TURNING"]
        : ["FOLLOW", "THE TRAIL"]
      : game.event && game.eventTime > 0
        ? game.event.name
            .toUpperCase()
            .split(" ")
            .reduce((a, w) => {
              if (a.at(-1) && a.at(-1).length + w.length < 12)
                a[a.length - 1] += " " + w;
              else a.push(w);
              return a;
            }, [])
        : ["WILDBOUND"];
  (closeup&&game.roll?.resolved?[]:message)
    .slice(0, 4)
    .forEach((s, i) =>
      c.fillText(s, 0, (i - (message.length - 1) / 2) * 4 + 1),
    );
  c.restore();
  c.fillStyle = "#d8ffd690";
  c.fillRect(-10, -11, 5, 2);
  c.fillRect(-12, -8, 2, 2);
  const pawns = game.players
    .map((p, i) => {
      const value = p.boardProgress ?? p.progress;
      const point =
        value === 0
          ? { x: -74 + i * 29, y: -58, hop: 0 }
          : value >= 48
            ? { x: (i - 2.5) * 7, y: 12, hop: 0 }
            : boardPoint(value);
      const overlap = game.players.filter(
        (q) => Math.floor(q.boardProgress ?? q.progress) === Math.floor(value),
      ).length;
      return {
        p,
        i,
        x:
          point.x +
          (overlap > 1 && value > 0 && value < 48 ? ((i % 3) - 1) * 3 : 0),
        y: point.y,
        hop: point.hop,
      };
    })
    .sort((a, b) => a.y - b.y);
  for (const a of pawns) {
    if (a.p.id === game.current?.id) {
      c.strokeStyle = a.p.color;
      c.lineWidth = 0.8;
      c.beginPath();
      c.ellipse(a.x, a.y + 2, 6, 3, 0, 0, Math.PI * 2);
      c.stroke();
    }
    drawCarvedPawn(c, a.x, a.y, a.i, a.p.color, a.hop);
  }
  if(game.roll&&drawDie)for(let i=0;i<game.roll.dice.length;i++){const d=boardDicePose(game.roll,i);drawDie(c,d.x,d.y,d.size,d.value,d.angle);}
  if(closeup&&game.roll?.resolved&&game.event){
    c.save();c.beginPath();c.arc(0,0,18,0,Math.PI*2);c.clip();
    const rise=Math.min(1,Math.max(0,(game.roll.elapsed-game.roll.landingAt)/.45));
    c.globalAlpha=rise;c.translate(0,(1-rise)*7);c.textAlign='center';
    c.shadowColor='#001710';c.shadowBlur=3;
    const wrap=(text,width)=>String(text||'').split(/\s+/).reduce((lines,word)=>{const last=lines.at(-1);if(last&&c.measureText(last+' '+word).width<=width)lines[lines.length-1]+=' '+word;else lines.push(word);return lines;},[]);
    const sections=[{text:game.event.name.toUpperCase(),font:'bold 2px system-ui',color:'#f2ffed',width:25,step:2.5},{text:game.event.verse,font:'1.7px system-ui',color:'#eefbe7',width:30,step:2.2},{text:game.event.tip,font:'bold 1.6px system-ui',color:'#ffe7a1',width:27,step:2.1}];
    for(const s of sections){c.font=s.font;s.lines=wrap(s.text,s.width);}
    const height=sections.reduce((n,s)=>n+s.lines.length*s.step,0)+2;
    const fit=Math.min(1,27/height);c.scale(fit,fit);let y=-height/2+1.8;
    for(const s of sections){c.font=s.font;c.fillStyle=s.color;for(const line of s.lines){c.fillText(line,0,y,s.width);y+=s.step;}y+=1;}
    c.restore();
  }
  c.fillStyle = "#d3b57b";
  c.textAlign = "center";
  c.font = "4px monospace";
  c.fillText("W I L D B O U N D", 0, -72);
  c.font = "3px monospace";
  c.fillText(
    game.roll ? "THE TRAIL MUST BE WALKED" : "HIT THE TABLE TO ROLL",
    0,
    71,
  );
  c.restore();
}
