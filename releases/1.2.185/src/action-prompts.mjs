import {DEFAULT_MAPPING,controllerButtonNames} from './controls.mjs';
export function actionInputLabel(g,p,action){
  if(p.device==='keyboard')return {interact:'E',loot:'E',attack:'F / click',jump:'J',dodge:'Space',potion:'H',inventory:'I',portal:'P'}[action]||action;
  const index=g.mapping?.[action]??DEFAULT_MAPPING[action];
  return controllerButtonNames(p.controllerFamily||'generic')[index]||'Button '+index;
}
