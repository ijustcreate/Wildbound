import {pixelLine,pixelPolygon} from './pixel-shapes.mjs';

const palette={
  ink:'#30212a',wine:'#622438',red:'#a43745',light:'#ca5955',shade:'#803044',
  brassDark:'#79513d',brass:'#b98a54',gold:'#e4b878',cream:'#f2dfb5',
  steelDark:'#657683',steel:'#9db5b9',glint:'#e5f1e6'
};

export const PIRATE_CAPTAIN_GEAR={
  pirate_captain_coat:{
    name:'Captain Hook’s Coat',base:'armor',slot:'chest',style:'coat',armor:6,
    stack:1,supplyOnly:true,rarity:'rare',color:palette.light,artColor:palette.red,trimColor:palette.gold,
    description:'A scarlet sea coat with turned cuffs, brass braid and split tails. Armor +6.'
  },
  pirate_captain_hat:{
    name:'Captain Hook’s Hat',base:'hat',slot:'head',style:'pirate_bicorne',armor:3,
    stack:1,supplyOnly:true,rarity:'rare',color:palette.gold,artColor:palette.wine,trimColor:palette.gold,
    description:'An oxblood sea captain’s bicorne with a salt-white plume. Armor +3.'
  },
  pirate_hand_hook:{
    name:'Captain Hook’s Hand Hook',slot:'hand2',stack:1,supplyOnly:true,rarity:'rare',
    color:palette.glint,artColor:palette.steel,
    description:'A polished steel hook with a riveted brass socket. Worn on the left hand.'
  },
  fancy_rapier:{
    name:'Fancy Rapier',base:'sword',slot:'hand1',damage:26,reach:82,
    stack:1,supplyOnly:true,rarity:'rare',color:palette.gold,artColor:palette.steel,trimColor:palette.gold,
    description:'A keen dueling sword with a swept brass guard. Charge to interrupt and shove.'
  },
  one_eyed_willy_eyepatch:{
    name:'One-Eyed Willy’s Eyepatch',base:'hat',slot:'head',style:'eyepatch',coversHair:false,
    stack:1,supplyOnly:true,rarity:'rare',color:'#aa8965',artColor:'#463535',
    description:'A salt-dark leather patch worn smooth around the brass rivet.'
  }
};

function stamp(c,anchor){
  const x=Math.round(anchor.x),y=Math.round(anchor.y);
  return (dx,dy,w,h,color)=>{
    c.fillStyle=color;
    c.fillRect(x+dx,y+dy,w,h);
  };
}

// Crown and brim are shaped separately so the brim stays one pixel thick
// over the native brow in front and at the nape when viewed from behind.
const crown=[
  [[-4,4],[-5,5],[-6,6],[-9,9],[-10,10],[-9,9]],
  [[-3,4],[-4,5],[-6,6],[-8,9],[-9,9],[-8,8]],
  [[-3,2],[-4,3],[-5,4],[-7,6],[-8,6],[-7,5]],
  [[-3,4],[-4,4],[-6,5],[-8,7],[-9,8],[-8,7]],
  [[-4,4],[-5,5],[-6,6],[-8,8],[-9,9],[-8,8]]
];

export function drawPirateCaptainHat(c,head,d){
  const p=palette,r=stamp(c,head),back=d>=3&&d<=5;
  const rows=crown[d>4?8-d:d],mirror=d>4?-1:1;
  const plume=d>=3&&d<=5?(d===5?5:4):d===0?-5:d===1?-6:d===2?-5:6;
  const featherSide=plume<0?-1:1;
  for(const [dx,y,w] of [[0,-11,3],[1,-12,4],[3,-13,4],[5,-14,4],[6,-13,3],[7,-12,2]]){
    const x=plume+(featherSide<0?-dx-w+1:dx);
    r(x,y,w,2,p.brassDark);
    r(x,y,w-1,1,p.cream);
    if(w>2)r(x+1,y,1,1,p.glint);
  }
  for(let i=0;i<rows.length;i++){
    const [a,b]=rows[i],left=mirror===1?a:-b,right=mirror===1?b:-a,y=i-10;
    r(left,y,right-left+1,1,p.ink);
    if(i&&i<rows.length-1){
      r(left+1,y,right-left-1,1,back?p.wine:p.red);
      if(i<3)r(left+2,y,Math.min(3,right-left-3),1,back?p.shade:p.light);
    }
  }
  const [a,b]=rows[4],l=mirror===1?a:-b,right=mirror===1?b:-a;
  r(l+1,-6,right-l-1,1,p.wine);
  r(l+1,-6,back?3:5,1,p.gold);
  r(right-3,-6,3,1,p.brass);
  if(!back){
    const buckle=d===0?-1:d<4?-3:2;
    r(buckle,-8,3,2,p.brassDark);r(buckle,-8,2,1,p.gold);r(buckle+1,-7,1,1,p.cream);
  }else r(-1,-7,2,1,p.shade);
  return true;
}

export function drawPirateCoatTrim(c,pose,d,material){
  const {chest,pelvis}=pose,back=d>=3&&d<=5,profile=d===2||d===6;
  const r=stamp(c,chest),p=palette;
  const near=d===2?-1:d===6?1:0;
  if(back){
    r(-3,-1,7,2,material.dark);r(-2,-1,5,1,p.brass);
    r(0,1,1,Math.max(2,Math.round(pelvis.y-chest.y)-1),material.dark);
  }else if(profile){
    r(near*2-1,-1,3,2,material.dark);r(near*2,0,1,4,p.gold);
    r(near,2,1,2,p.cream);
  }else{
    r(-4,-1,3,2,material.dark);r(2,-1,3,2,material.dark);
    r(-3,0,1,4,p.gold);r(3,0,1,4,p.brass);
    r(-1,0,3,2,p.cream);r(0,2,1,3,p.brassDark);
    r(2,2,1,1,p.cream);r(2,4,1,1,p.gold);
  }
  const tails=['L','R'].sort((a,b)=>pose['hip'+a].depth-pose['hip'+b].depth);
  for(const leg of tails){
    const hip=pose['hip'+leg],knee=pose['knee'+leg];
    const x=(hip.x+pelvis.x)*.5+(profile?0:Math.sign(hip.x-pelvis.x));
    const y=pelvis.y-.5,fall=Math.max(8,(knee.y-y)*.95+4);
    const tip=x+(knee.x-hip.x)*.48+(profile?-near*2:Math.sign(x-pelvis.x));
    const w=profile?2.2:2.7,left=leg==='L';
    const polygon=(vertices,color)=>pixelPolygon(c,vertices.map(([x,y])=>({x,y})),color);
    polygon([[x-w,y],[x+w,y],[tip+w-1,y+fall-1],[tip+w-2,y+fall+1],[tip-w,y+fall]],p.ink);
    polygon([[x-w+1,y],[x+w-1,y],[tip+w-2,y+fall-1],[tip-w+1,y+fall-1]],left?material.base:material.dark);
    pixelLine(c,{x:x-w+1.5,y:y+1},{x:tip-w+1.5,y:y+fall},left?p.gold:p.brass);
  }
}

export function drawPirateHook(c,hand,elbow,d){
  const p=palette,dx=hand.x-elbow.x,dy=hand.y-elbow.y,len=Math.hypot(dx,dy);
  const ux=len>.5?dx/len:0,uy=len>.5?dy/len:1,side=d>=3&&d<=5?-1:1;
  const point=(ahead,along)=>({x:Math.round(hand.x+ux*ahead-uy*along*side),y:Math.round(hand.y+uy*ahead+ux*along*side)});
  const outline=[point(1,0),point(4,0),point(6,1),point(7,3),point(6,5),point(4,5),point(3,4)];
  for(let i=1;i<outline.length;i++)pixelLine(c,outline[i-1],outline[i],p.ink,3);
  for(let i=1;i<outline.length;i++)pixelLine(c,outline[i-1],outline[i],i<4?p.steel:p.glint);
  const socket=stamp(c,hand);
  socket(-2,-3,5,1,p.ink);socket(-3,-2,7,4,p.ink);socket(-2,2,5,1,p.ink);
  socket(-2,-2,5,4,p.brassDark);socket(-2,-2,4,1,p.gold);socket(-2,-1,2,2,p.brass);
  socket(1,1,1,1,p.cream);
}

export function drawFancyRapier(c,hand,tip){
  const p=palette,dx=tip.x-hand.x,dy=tip.y-hand.y,len=Math.hypot(dx,dy);
  const ux=len>.6?dx/len:0,uy=len>.6?dy/len:-1;
  const point=(length,width=0)=>({x:hand.x+ux*length-uy*width,y:hand.y+uy*length+ux*width});
  const line=(a,b,color,width)=>pixelLine(c,a,b,color,width);
  const guard=point(2),end=point(Math.max(6,len)+3);
  line(guard,end,p.ink,2);line(guard,end,p.steel);
  line(point(4),end,p.glint);
  const cage=[point(2,-3),point(-1,-4),point(-5,-2),point(-5,1),point(-3,3),point(2,3)];
  for(let i=1;i<cage.length;i++)line(cage[i-1],cage[i],p.ink,2);
  for(let i=1;i<cage.length;i++)line(cage[i-1],cage[i],i<4?p.gold:p.brass);
  line(point(2,-4),point(2,4),p.brassDark,2);
  line(point(2,-3),point(2,3),p.cream);
  line(point(-6),point(-3),p.ink,3);line(point(-6),point(-5),p.light);
}

const eyepatchOffsets=[[-2,0],[-4,-1],[-3,-2],null,null,null,null,[1,0]];
export function drawWillyEyepatch(c,head,d,eye){
  if(eye===undefined){
    const offset=eyepatchOffsets[d];
    eye=offset?{x:head.x+offset[0],y:head.y+offset[1]}:null;
  }
  const p=palette,r=stamp(c,head),back=d>=3&&d<=5;
  if(back){
    r(-4,-2,2,1,p.ink);r(-2,-3,5,1,p.ink);r(3,-4,2,1,p.brassDark);
    r(-1,-3,2,1,p.brassDark);
  }else if(eye){
    const diagonal=d===7;
    pixelLine(c,{x:head.x+(diagonal?4:5),y:head.y-3},{x:eye.x,y:eye.y},p.ink);
    const patch=stamp(c,eye);
    patch(-1,-1,3,1,p.ink);patch(-2,0,5,2,p.ink);patch(-1,2,3,1,p.ink);
    patch(-1,0,3,2,'#554347');patch(-1,0,2,1,'#735d51');patch(1,1,1,1,p.brass);
  }else{
    r(-4,-3,5,1,p.ink);r(1,-4,3,1,p.ink);r(-3,-3,2,1,p.brassDark);
  }
  return true;
}

export function paintPirateCaptainItem(c,id){
  switch(id){
    case 'pirate_captain_hat':
      return drawPirateCaptainHat(c,{x:13,y:20},0);
    case 'pirate_hand_hook':
      drawPirateHook(c,{x:9,y:17},{x:6,y:21},5);
      return true;
    case 'fancy_rapier':
      drawFancyRapier(c,{x:8,y:15},{x:19,y:4});
      return true;
    case 'one_eyed_willy_eyepatch': {
      const p=palette,r=stamp(c,{x:14,y:13});
      pixelLine(c,{x:3,y:8},{x:17,y:13},p.ink,2);
      pixelLine(c,{x:16,y:12},{x:21,y:6},p.ink,2);
      pixelLine(c,{x:4,y:8},{x:15,y:12},'#735b4d');
      pixelLine(c,{x:18,y:10},{x:21,y:6},p.brassDark);
      r(-4,-3,8,1,p.ink);r(-5,-2,10,5,p.ink);r(-4,3,8,1,p.ink);r(-2,4,4,1,p.ink);
      r(-4,-1,8,3,'#554347');r(-3,-2,6,2,'#735d51');r(-2,2,4,1,'#463535');
      r(2,0,1,1,p.gold);r(-3,0,1,1,p.brass);
      return true;
    }
    case 'pirate_captain_coat': {
      const r=stamp(c,{x:12,y:10}),p=palette;
      r(-5,-6,10,2,p.ink);r(-7,-4,14,2,p.ink);r(-8,-2,16,5,p.ink);
      r(-7,3,14,2,p.ink);r(-6,4,12,5,p.ink);r(-7,9,6,3,p.ink);r(1,9,6,3,p.ink);
      r(-6,-3,12,7,p.red);r(-7,-2,2,5,p.light);r(5,-2,2,5,p.wine);
      r(-6,2,2,2,p.gold);r(4,2,2,2,p.brass);
      r(-5,4,5,5,p.red);r(0,4,5,5,p.shade);r(-6,9,4,2,p.red);r(2,9,4,2,p.wine);
      r(-5,5,1,5,p.light);r(4,5,1,5,p.red);
      r(-4,-5,3,2,p.wine);r(1,-5,3,2,p.wine);
      r(-3,-3,1,7,p.gold);r(2,-3,1,7,p.brass);
      r(-1,-4,2,4,p.cream);r(-1,0,2,7,p.wine);
      r(1,1,1,1,p.gold);r(1,3,1,1,p.gold);r(1,5,1,1,p.gold);
      return true;
    }
    default:return false;
  }
}
