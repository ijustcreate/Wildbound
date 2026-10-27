// Saved room creatures use string IDs. Render-only phase seeds must be numeric;
// gameplay identity remains untouched on the original actor.
export function visualActorId(id){if(typeof id==='number')return Number.isFinite(id)?id:0;if(typeof id!=='string')return 0;let seed=2166136261;for(let i=0;i<id.length;i++)seed=Math.imul(seed^id.charCodeAt(i),16777619);return seed>>>0;}
