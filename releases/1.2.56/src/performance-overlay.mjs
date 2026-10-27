// Diagnostic DOM updates are throttled; no profiling state enters saved games.
export function performanceLines(metrics,{game={},screen='',paused=false,canvas,memory,errors=[]}={}) {
  const frame=metrics.stats('frame'),fmt=n=>n.toFixed(1);
  const lines=['PERFORMANCE · '+screen+(paused?' · paused':'')];
  const fps=frame?1000/frame.mean:0;
  lines.push(frame?`${fps<10?fmt(fps):Math.round(fps)} FPS · ${fmt(frame.mean)} ms/frame`:'FPS · collecting samples…');
  if(frame)lines.push(`Frame p95 ${fmt(frame.p95)} · max ${fmt(frame.max)} ms · >33ms ${frame.over33}/${frame.count}`);
  for(const [key,label] of [['cpu','Frame CPU'],['simulation','Update'],['world','World draw'],['inventory','Inventory'],['animation','Animation/draw call'],['save','Save']]) {
    const s=metrics.stats(key);if(s)lines.push(`${label}: ${fmt(s.mean)} / ${fmt(s.p95)} ms`);
  }
  const counts=['players','enemies','arrows','spells','effects','loot','pickups','traps','scenery','environmentParticles'].filter(k=>Array.isArray(game[k])).map(k=>`${k} ${game[k].length}`);
  if(counts.length)lines.push(counts.join(' · '));
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
