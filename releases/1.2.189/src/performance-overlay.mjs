// Diagnostic DOM updates are throttled; no profiling state enters saved games.
const heaviest = costs => Object.entries(costs||{}).filter(([,time])=>Number.isFinite(time))
  .sort(([,a],[,b])=>b-a).slice(0,2).map(([name,time])=>`${name} ${time.toFixed(1)} ms`).join(' · ');

export function performanceLines(metrics,{game={},screen='',paused=false,canvas,memory,errors=[],views=1}={}) {
  const frame=metrics.stats('frame'),fmt=n=>n.toFixed(1);
  const lines=['PERFORMANCE · '+screen+(paused?' · paused':'')];
  const fps=frame?1000/frame.mean:0;
  lines.push(frame?`${fps<10?fmt(fps):Math.round(fps)} FPS · ${fmt(frame.mean)} ms/frame`:'FPS · collecting samples…');
  if(frame)lines.push(`Frame p95 ${fmt(frame.p95)} · max ${fmt(frame.max)} ms · >33ms ${frame.over33}/${frame.count}`);
  for(const [key,label] of [['cpu','Frame CPU'],['simulation','Update'],['world','World draw'],['liveEdit','Editor overlay'],['inventory','Inventory'],['animation','Animation/draw call'],['save','Save']]) {
    const s=metrics.stats(key);if(s)lines.push(`${label}: ${fmt(s.mean)} / ${fmt(s.p95)} ms`);
  }
  const counts=['players','enemies','arrows','spells','effects','loot','pickups','traps','scenery','environmentParticles'].filter(k=>Array.isArray(game[k])).map(k=>`${k} ${game[k].length}`);
  if(counts.length)lines.push(counts.join(' · '));
  const train=game.trainTest;
  if(train){
    lines.push(`Train ${Math.round(train.speed||0)} px/s · ${views} ${views===1?'view':'views'}`);
    const stream=train.streamCoverage;
    if(stream)lines.push(`Chunk work queued · ground ${stream.groundPending||0} · props ${stream.propPending||0} · grass ${stream.grassPending||0}`);
    const update=heaviest(train.updateCosts),draw=heaviest(train.drawCosts);
    if(update)lines.push(`Last train update · ${update}`);
    if(draw)lines.push(`Last train draw · ${draw}`);
  }
  if(canvas)lines.push(`Canvas ${canvas.width}×${canvas.height} · backing pixels`);
  if(memory?.usedJSHeapSize)lines.push(`JS heap ${fmt(memory.usedJSHeapSize/1048576)} / ${fmt(memory.jsHeapSizeLimit/1048576)} MiB`);
  lines.push(`Renderer errors: ${errors.length}${errors.length?' · '+String(errors.at(-1)).slice(0,100):''}`);
  lines.push('Timings mean / p95 · rolling 240 samples · CPU ≠ GPU');
  return lines;
}
export function createPerformanceOverlay(metrics) {
  const panel=document.createElement('pre');panel.id='performance-overlay';
  // A manual popover keeps diagnostics above modal menus, without focus capture.
  panel.setAttribute('popover','manual');
  panel.setAttribute('aria-label','Live performance diagnostics');panel.hidden=true;
  panel.style.cssText='position:fixed;inset:auto;left:8px;bottom:8px;z-index:1100;pointer-events:none;margin:0;padding:10px;max-width:calc(100vw - 36px);max-height:45vh;overflow:hidden;white-space:pre-wrap;font:11px/1.45 monospace;color:#d1f5dd;background:rgba(5,17,22,.94);border:1px solid #78ad98;border-radius:4px;';
  document.body.append(panel);let last=-Infinity,lastDialog=null;
  return {panel,tick(now,context){
    panel.hidden=!metrics.enabled;if(!metrics.enabled){if(panel.matches(':popover-open'))panel.hidePopover();return;}
    const dialog=document.querySelector('dialog[open]');
    if(panel.showPopover){
      if(dialog!==lastDialog&&panel.matches(':popover-open'))panel.hidePopover();
      if(!panel.matches(':popover-open'))panel.showPopover();
    }
    lastDialog=dialog;
    if(now-last<500)return;last=now;
    panel.textContent=performanceLines(metrics,context).join('\n');
  }};
}
