// Shared editable anatomy and motion keys for the two Mossroot creatures.
export function makeArenaRigV2(kind){
 const turtle=kind==='mossback';
 const palette=turtle?{outline:'#233b30',body:'#d19a4d',shade:'#976b38',light:'#edc475',cap:'#527b42',capShade:'#304e38',capLight:'#83a354',cream:'#f3dc9e',stem:'#d9a653',stemShade:'#a7753c',moss:'#b2c56b',eye:'#302a24'}:{outline:'#342b25',body:'#b77b42',shade:'#805333',light:'#dca35f',cap:'#9d5835',capShade:'#6e3c2d',capLight:'#c17b45',cream:'#f4dda4',stem:'#dec48b',stemShade:'#b29362',moss:'#7f9349',eye:'#342b24'};
 const points={pelvis:[0,0,turtle?8:9],chest:[0,0,turtle?10:11],head:[0,turtle?14:7,turtle?13:11],crown:[0,turtle?-2:0,turtle?16:24],eyeL:[-3,turtle?18:11,turtle?16:15],eyeR:[3,turtle?18:11,turtle?16:15],footL:[-8,5,2],footR:[8,5,2],rearFootL:[-8,-7,2],rearFootR:[8,-7,2],tail:[0,-13,5]};
 const model={version:1,artGeneration:2,type:kind,name:turtle?'Mossback / ruin shellkeeper':'Bramblecap / rootfoot',palette,shape:{width:turtle?38:40,height:turtle?34:38},joints:Object.fromEntries(Object.entries(points).map(([n,position])=>[n,{parent:n==='pelvis'?'':'pelvis',position}])),visibility:Object.fromEntries(Object.keys(points).map(n=>[n,Array.from({length:8},(_,d)=>!n.startsWith('eye')||![3,4,5].includes(d))])),clips:{}};
 for(const action of ['idle','walk','run','attack','hurt','death','jump','emerge','retract','shell','slide','wake']){
  const loop=['idle','walk','run','shell','slide'].includes(action);
  model.clips[action]={length:16,fps:action==='walk'?12:action==='run'?20:action==='idle'?5:16,loop,keys:Array.from({length:9},(_,i)=>{
   const t=i/8,phase=t*Math.PI*2,pulse=Math.sin(t*Math.PI),joints={};
   const body=(x,y,z)=>{for(const n of Object.keys(points))if(!n.includes('oot'))joints[n]=[x,y,z];};
   if(action==='idle'){body(0,0,Math.sin(phase)*.35);joints.head=[Math.sin(phase)*.25,Math.sin(phase)*.35,Math.sin(phase)*.6];}
   if(action==='walk'||action==='run'){
    const stride=action==='run'?5:3.5;body(0,0,Math.abs(Math.sin(phase))*(turtle?.6:1.1));
    for(const [name,offset]of [['footL',0],['footR',Math.PI],['rearFootL',Math.PI],['rearFootR',0]]){const s=Math.sin(phase+offset);joints[name]=[0,Math.cos(phase+offset)*stride,Math.max(0,s)*(turtle?2:3)];}
    joints.crown=[Math.sin(phase)*.65,-Math.sin(phase)*.55,Math.abs(Math.sin(phase-.25))*(turtle?.5:1.5)];joints.head=[0,Math.sin(phase)*.6,Math.abs(Math.sin(phase))*.7];
   }
   if(action==='attack'){const anticipate=t<.25?-Math.sin(t/.25*Math.PI/2)*2:0,lunge=t>=.25?Math.max(0,Math.sin((t-.25)/.75*Math.PI))*7:0;body(0,anticipate+lunge*.35,-pulse);joints.head=[0,anticipate+lunge,-pulse];joints.crown=[0,anticipate*.5+lunge*.3,-pulse*1.5];}
   if(action==='hurt'){body(Math.sin(phase)*2*(1-t),-pulse*2,-pulse*2);joints.crown=[Math.sin(phase)*3,0,-pulse*3];}
   if(action==='death'){body(t*2,0,-t*9);joints.crown=[t*2,0,-t*(turtle?12:23)];joints.head=[t*2,-t*3,-t*13];}
   if(action==='jump'){body(0,pulse,2*pulse);for(const n of ['footL','footR','rearFootL','rearFootR'])joints[n]=[0,-pulse*2,pulse*5];}
   if(action==='emerge')for(const n of Object.keys(points))joints[n]=[0,0,-(1-t)*31];
   if(['retract','shell','slide','wake'].includes(action)){
    const f=action==='retract'?t:action==='wake'?1-t:1;body(0,0,-f*2);
    for(const n of ['head','eyeL','eyeR'])joints[n]=[0,-f*13,-f*6];
    for(const n of ['footL','footR','rearFootL','rearFootR'])joints[n]=[-points[n][0]*f*.7,-points[n][1]*f*.65,f*4];
    joints.crown=[action==='slide'?Math.sin(phase)*.6:0,0,-f*8+(action==='slide'?Math.abs(Math.sin(phase))*.8:0)];
   }
   return {frame:i*2,joints,interpolation:Object.fromEntries(Object.keys(joints).map(n=>[n,'smooth']))};
  })};
 }
 return model;
}
