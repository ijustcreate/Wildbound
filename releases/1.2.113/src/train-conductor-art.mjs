// Native-rig overlays, resolved per facing, using the same logical pixel grid
// and chest/head anchors as the existing face and fitted clothing.
const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function drawConductorCap(c,h,d){
 const profile=d===2||d===6,back=d>=3&&d<=5,w=profile?10:14,x=Math.round(h.x-w/2),y=Math.round(h.y-10),ink='#202832',navy='#293d58',light='#435874',gold='#c5a263';
 r(c,x+2,y,w-4,1,ink);r(c,x,y+1,w,6,ink);r(c,x+1,y+1,w-2,4,navy);r(c,x+2,y+1,w-4,1,light);r(c,x+1,y+5,w-2,2,gold);
 if(!back){const brim=profile?(d===2?-3:3):0;r(c,x+brim,y+7,w,2,ink);r(c,x+1+brim,y+7,w-2,1,'#37404d');r(c,h.x-(profile?1:2),y+3,profile?2:4,2,'#dfc186');}
 else r(c,x+2,y+7,w-4,1,navy);
}
export function drawConductorDetails(c,p,d){
 if(d>=3&&d<=5)return;const profile=d===2||d===6,x=p.chest.x,y=p.chest.y,w=profile?5:9;
 r(c,x-w/2,y-5,w,2,'#bfb9a6');r(c,x-1,y-4,2,4,'#202733');
 for(const side of profile?[d===2?-1:1]:[-1,1]){r(c,x+side*3-1,y-4,2,3,'#52617a');r(c,x+side*2-1,y-1,2,2,'#394e69');}
 if(!profile){for(const dy of [2,5])r(c,x-1,y+dy,2,1,'#d1ad64');r(c,x+3,y+2,2,1,'#c4a366');r(c,x+4,y+3,1,2,'#a98a53');r(c,x+2,y+5,2,1,'#c4a366');}
}
export function drawConductorMoustache(c,p,d){if(d>=3&&d<=5)return;const q=p.mouth;if(!q)return;const side=d===2?-1:d===6?1:0;r(c,q.x-3+side,q.y-1,6,1,'#654732');r(c,q.x-4+side,q.y,3,1,'#4b382d');r(c,q.x+1+side,q.y,3,1,'#4b382d');}
export function drawGoldenTicketIcon(c){const p=(x,y,w,h,color)=>r(c,x,y,w,h,color);p(2,6,20,12,'#573d29');p(3,5,18,14,'#573d29');p(3,7,18,10,'#c18a35');p(4,6,16,12,'#dfb653');p(5,7,14,1,'#fff0b3');p(5,16,14,1,'#ad7530');for(const y of [8,11,14])p(17,y,1,2,'#9e692b');p(7,10,6,4,'#96622d');p(8,9,4,1,'#96622d');p(8,11,4,1,'#f5d784');p(8,14,1,1,'#684a30');p(11,14,1,1,'#684a30');}
