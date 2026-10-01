import {drawBoardScene} from './board-art.mjs';
export const TRAIL=[[190,200],[190,300],[200,400],[220,500],[235,590],[213,680],[180,770],[300,866],[414,859],[524,840],[646,848],[760,874],[880,876],[1000,875],[1125,876],[1250,854],[1330,816],[1370,742],[1350,670],[1300,630],[1230,620],[1160,660],[1120,740],[1030,770],[936,735],[842,700],[738,670],[640,668],[540,706],[442,739],[377,691],[347,588],[375,484],[475,416],[589,389],[621,299],[695,226],[803,183],[919,177],[1027,191],[1140,215],[1228,276],[1270,360],[1200,411],[1080,409],[970,361],[910,345],[848,358],[758,519]].map(([x,y])=>({x:x/1516*280-140,y:y/1038*192-96}));
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
export function drawBoard(c,game,time=0,options={}){drawBoardScene(c,game,time,options,TRAIL,boardPoint);}
