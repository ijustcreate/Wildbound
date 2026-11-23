// One discontinuity timestamp, scoped to the travelers. Observers never restart it.
export function spellTransition(g,travelers=null){
 const ids=travelers==null?null:(Array.isArray(travelers)?travelers:[travelers]).map(p=>typeof p==='object'?p.id:p),now=performance.now(),recent=g.portalTransition&&now-g.portalTransition.at<20;
 const combined=recent&&(g.portalTransition.ids==null||ids==null)?null:recent?[...new Set([...g.portalTransition.ids,...ids])]:ids;
 g.portalTransition={serial:(g.portalTransition?.serial||0)+1,at:now,ids:combined};g.onSound?.('portal',g.players?.find(p=>ids?.includes(p.id))||g.players?.[0]);
}
export function snapPortalCamera(renderer,g,target){
 const actors=new Map((g.players||[]).map(p=>[p.id,{x:p.x,y:p.y,room:p.room||null}])),changedIds=[];
 if(renderer.portalActors)for(const [id,p]of actors){const old=renderer.portalActors.get(id);if(old&&(p.room!==old.room||Math.hypot(p.x-old.x,p.y-old.y)>320))changedIds.push(id);}
 if(changedIds.length&&(g.portalTransition?.serial||0)===(renderer.portalEpoch||0))spellTransition(g,changedIds);
 renderer.portalActors=actors;const epoch=g.portalTransition?.serial||0,changed=epoch>0&&renderer.portalEpoch!==epoch;renderer.portalEpoch=epoch;
 const relevant=renderer.cameraOwnerIds==null||g.portalTransition?.ids==null||renderer.cameraOwnerIds.some(id=>g.portalTransition.ids.includes(id));
 if(changed&&relevant)Object.assign(renderer.camera,target);return changed&&relevant;
}
export function drawPortalFlash(c,g,w,h,owners=null){
 const transition=g.portalTransition;if(owners&&transition?.ids&&!owners.some(id=>transition.ids.includes(id)))return;
 const elapsed=(performance.now()-(transition?.at??-10000))/1000;if(elapsed<0||elapsed>.22)return;
 // A restrained local veil; no full-party flash or starburst on somebody else's portal.
 c.save();c.fillStyle=`rgba(20,30,36,${.16*(1-elapsed/.22)**2})`;c.fillRect(0,0,w,h);c.restore();
}

// Hold only the traveler while destination floor textures arrive; a failed
// worker or six-second timeout must never leave a pane permanently frozen.
export function portalCutOpacity(frame,now,ready=true,reducedMotion=false){
 if(frame.readyAt===undefined){if(!ready&&now-frame.at<6)return 1;frame.readyAt=now;}
 const t=Math.max(0,Math.min(1,(now-frame.readyAt)/(reducedMotion?.1:.22)));return 1-t*t*(3-2*t);
}
