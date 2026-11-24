export function paintSkeletonItem(c,id){
 if(!['skeleton_skull','skeleton_ribcage','skeleton_arms','skeleton_legs','skeleton_feet'].includes(id))return false;
 const rect=(x,y,w,h,col='#e6dbc0')=>{c.fillStyle=col;c.fillRect(x,y,w,h);},ink='#3b3838',shade='#a29983';
 if(id==='skeleton_skull'){rect(6,3,12,12,ink);rect(5,5,14,7,ink);rect(7,4,10,11);rect(6,6,12,5);rect(8,15,8,5,ink);rect(9,15,6,4);rect(8,8,3,3,ink);rect(13,8,3,3,ink);rect(11,12,2,2,ink);for(let x=9;x<16;x+=2)rect(x,17,1,3,shade);}
 if(id==='skeleton_ribcage'){rect(11,2,2,19,ink);rect(11,3,1,17);for(let i=0;i<4;i++){const y=5+i*3;rect(5+i%2,y,14-i%2*2,2,shade);rect(6+i%2,y,12-i%2*2,1);rect(5+i%2,y+1,2,2);rect(17-i%2,y+1,2,2);}rect(8,19,8,2);}
 if(id==='skeleton_arms'){for(const x of[5,15]){rect(x,3,3,8,shade);rect(x,3,2,8);rect(x-1,10,5,3,ink);rect(x,11,3,2);rect(x,13,1,7);rect(x+2,13,1,7);rect(x-1,20,5,2);}}
 if(id==='skeleton_legs'){rect(6,3,12,3,shade);rect(8,4,8,3);for(const x of[7,15]){rect(x,7,3,7,shade);rect(x,7,2,7);rect(x-1,13,4,2);rect(x,15,1,6);rect(x+2,15,1,6);}}
 if(id==='skeleton_feet'){for(const x of[5,14]){rect(x+1,4,2,9,shade);rect(x+1,4,1,9);rect(x,12,4,6);for(let i=0;i<3;i++)rect(x-1+i*2,18,1,3-i%2,shade);rect(x-1,17,6,1);}}
 return true;
}
