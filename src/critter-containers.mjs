// Return the actual container used, including old saves without metadata.
export const CRITTER_CONTAINERS=Object.freeze(['empty_jar','critter_cage']);
export function critterContainer(type,item={}){
  if(CRITTER_CONTAINERS.includes(item.captureContainer))return item.captureContainer;
  return ['frog','dragonfly','fairy','fish'].includes(type?.replace(/^caught_/,''))?'empty_jar':'critter_cage';
}
