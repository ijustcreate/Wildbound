import {projectPoint} from './actor-projection.mjs';
import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';

const ivory={body:'#e8ebe2',shade:'#a0b1b6',light:'#fffdf0',outline:'#5a6a78'};
const pearl={body:'#f3f2e7',shade:'#becbd0',light:'#fffdf2',outline:ivory.outline};
export const runeboundCatCoat={fur:ivory,paws:pearl,bib:pearl,muzzle:pearl,ears:ivory,eye:'#62cbb9',nose:'#ae8895'};

// Each beam and its two tines rise from the same brow attachment in every facing.
const antlerBeam=[[1.7,1,3.2],[3.8,.1,6.5],[5.8,-1.8,10.5],[7.2,-3.8,14.3],[6.5,-5.7,17.6]];
const antlerTines=[
  [antlerBeam[1],[2.9,-2.2,9.8],[2.2,-3.5,13.1],[2.9,-4.7,14.9]],
  [antlerBeam[2],[8.2,-.7,12.8],[9.3,-1.5,15.7]],
];

export function drawRuneboundAntler(c,pose,d,side,near){
  const sign=side==='L'?-1:1;
  const center=pose.head,ear=pose['ear'+side],other=pose[side==='L'?'earR':'earL'];
  const lateral=ear.map((value,i)=>(value-other[i])*sign);
  const spread=Math.hypot(...lateral)||1;
  const right=lateral.map(value=>value/spread);
  const roll=Math.hypot(right[0],right[2]);
  const up=roll?[-right[2]/roll,0,right[0]/roll]:[0,0,1];
  const forward=[-right[1]*up[2],right[0]*up[2]-right[2]*up[0],right[1]*up[0]];
  const origin=center.map((value,i)=>value+(ear[i]-value)*.25);
  const points=path=>path.map(([x,y,z])=>projectPoint(origin.map((value,axis)=>
    value+sign*x*right[axis]+(y+sign*(z-3)*.13)*forward[axis]+z*up[axis]),d));
  const beam=points(antlerBeam),branches=antlerTines.map(points);
  const edge=near?'#786a78':'#5c626f',bone=near?'#c9b9a5':'#a79fa2',glint=near?'#f6e2bd':'#cabdb0';
  for(const path of [...branches,beam]){
    for(let i=1;i<path.length;i++)pixelLine(c,path[i-1],path[i],edge,path===beam&&i===1?3:2);
  }
  for(const path of [...branches,beam]){
    for(let i=1;i<path.length;i++)pixelLine(c,path[i-1],path[i],i===path.length-1?glint:bone,1);
  }
}

export function drawRuneboundRuff(c,pose,d){
  const [x,y,z]=pose.neck;
  const patch=(vertices,color)=>pixelPolygon(c,vertices.map(([dx,dy,dz])=>projectPoint([x+dx,y+dy,z+dz],d)),color);
  patch([[-3.5,1.3,1],[-3,3.8,-3],[-1.8,4.6,-3.5],[-.7,3.5,-7],
    [.7,4.4,-4],[2,3.5,-5],[3.4,1.3,-1],[2.7,.5,2],[-2.8,.5,3]],ivory.outline);
  patch([[-2.6,1.7,1],[-2.4,3.3,-2.4],[-1,3.9,-3],[-.6,3.2,-5.2],
    [.7,3.6,-3],[1.7,3,-3.5],[2.5,1.4,-1],[2.2,.8,1.7],[-2.3,.8,2]],pearl.shade);
  if(d<3||d>5)patch([[-2.5,2,1.7],[-2,3.3,-.7],[-.7,3.6,-3.7],[.8,3.7,-1.7],[2.2,2.2,.6]],pearl.light);
}

const cubic=(a,b,c,d,t)=>{
  const u=1-t;
  return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;
};
const tailWidth=[2.5,2.6,3,3.5,4.1,4.4,4.5,4.35,4,3.45,2.7,1.7,.8,.1];

export function drawRuneboundTail(c,pose,d,action,time){
  const [x,y,z]=pose.tailBase;
  const dead=action==='death',low=action==='sit'||action==='sleep'||dead,run=action==='run';
  const wind=time*(run?6:3),sway=dead?0:Math.sin(wind),sweepWave=dead?0:Math.sin(wind-.8);
  const midX=pose.tailMid[0]-x,tipX=pose.tailTip[0]-x;
  const start=[x,y+1.5,z+.3];
  const bend=[x+midX*.55,y-9,z+(low?-1:run?-1:-6)];
  const sweep=[x+13-sway*3,y-(low?18:24),Math.max(1,z-(low?2:run?8:11)+sweepWave*(low?.7:3.5))];
  const tip=[x+(low?13:18)+sway*(low?1:4)+tipX*.24,y-(low?19:32)+sweepWave*(low?0:2),
    low?Math.max(1,z)+2:Math.max(4,z+(run?5:10)+sway*3)];
  const points=tailWidth.map((_,i)=>{
    const t=i/(tailWidth.length-1);
    return projectPoint(start.map((value,axis)=>cubic(value,bend[axis],sweep[axis],tip[axis],t)),d);
  });
  const sign=points.at(-1).x<points[0].x?-1:1;
  const normals=points.map((_,i)=>{
    const a=points[Math.max(i-1,0)],b=points[Math.min(i+1,points.length-1)];
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;
    return {x:sign*dy/length,y:-sign*dx/length};
  });
  const edge=(i,offset)=>({x:points[i].x+normals[i].x*offset,y:points[i].y+normals[i].y*offset});
  const ribbon=(from,to,lower,upper,color)=>{
    const left=[],right=[];
    for(let i=from;i<=to;i++){
      left.push(edge(i,lower(tailWidth[i])));
      right.push(edge(i,upper(tailWidth[i])));
    }
    pixelPolygon(c,left.concat(right.reverse()),color);
  };
  const end=points.length-1;
  ribbon(0,end,w=>-w,w=>w,ivory.outline);
  ribbon(0,end,w=>-Math.max(0,w-.8),w=>Math.max(0,w-.8),ivory.shade);
  ribbon(0,end,w=>-w*.28,w=>Math.max(0,w-.9),ivory.body);
  ribbon(2,end-1,w=>w*.12,w=>w*.62,ivory.light);
  pixelLine(c,points[end-1],points[end],ivory.light,1);
}
