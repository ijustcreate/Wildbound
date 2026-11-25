// The same bank frog used by the living ecosystem, with a chocolate palette.
export function drawNativeFrog(c,a){
 const x=Math.round(a.x),y=Math.round(a.y-(a.hopHeight||0)),brown=a.chocolate;
 const dark=brown?'#653b29':'#3c7040',light=brown?'#ab744c':'#88aa54',feet=brown?'#825033':'#628348',eyes=brown?'#e0bc85':'#e6dc87';
 const r=(dx,dy,w,h,color)=>{c.fillStyle=color;c.fillRect(x+dx,y+dy,w,h);};
 if(a.sideView){
  c.save();c.translate(x,y);c.scale((a.faceX??a.face??1)<0?-1:1,1);c.translate(-x,-y);
  const low=a.anticipating?1:0,stretch=a.hop?2:0;
  r(-6,-3+low,10,5,dark);r(-5,-4+low,7,4,light);r(1,-6+low,5,5,dark);r(2,-7+low,3,4,light);r(3,-8+low,2,3,eyes);r(4,-7+low,1,2,'#253c2b');
  r(4,-3+low,3,2,feet);r(-7-stretch,1,5+stretch,2,feet);r(2+stretch,1,4,2,feet);r(-5,-1+low,4,3,feet);r(-4,-2+low,3,2,light);c.restore();return;
 }
 if(a.swimming&&!a.hop){c.strokeStyle='#a0cac088';c.lineWidth=1;c.beginPath();c.ellipse(x,y+1,8,3,0,0,7);c.stroke();r(-4,-2,8,3,dark);r(-4,-4,2,2,eyes);r(2,-4,2,2,eyes);r(-6,2,3,1,feet);r(4,2,3,1,feet);return;}
 r(-5,-2,10,4,dark);r(-3,-4,6,4,light);r(-4,-5,2,2,eyes);r(2,-5,2,2,eyes);r(-6,1,3,2,feet);r(3,1,3,2,feet);
 if(brown){r(-3,-5,1,1,'#33251f');r(2,-5,1,1,'#33251f');r(-1,-3,2,1,'#c99c6a');}
}
export function drawChocolateFrogIcon(c){
 const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);},ink='#35251f',shade='#633a27',base='#915a36',light='#bd8953';
 // Rounded haunches and raised eyes form one squat frog silhouette.
 for(const [x,y,w,h]of [[5,10,14,9],[3,13,5,7],[17,13,5,7],[6,6,5,6],[14,6,5,6],[6,19,4,2],[15,19,5,2]])r(x,y,w,h,ink);
 r(6,11,12,7,shade);r(7,9,10,6,base);r(8,8,2,3,base);r(15,8,2,3,base);r(4,14,4,4,base);r(17,14,4,4,shade);r(7,18,3,2,base);r(16,18,3,2,base);
 r(8,10,7,2,light);r(8,8,2,1,'#e4bc7d');r(15,8,2,1,'#e4bc7d');r(9,8,1,2,ink);r(15,8,1,2,ink);r(9,14,6,1,shade);r(5,14,2,1,light);
}
