export const BOARD_PIECES=['lion','wolf','crocodile','rhino','spider','skeleton'];
export const BOARD_LIMITS={particles:[80,1200,20],swirlSpeed:[.1,3,.1],particleSize:[.12,.8,.02],glow:[0,2,.1],gatherTime:[.3,3,.1],textSize:[.7,1.3,.05],pieceSize:[9,23,1],boardLight:[.5,1.3,.05]};
export const DEFAULT_BOARD_SETTINGS={particles:680,swirlSpeed:.65,particleSize:.28,glow:.8,gatherTime:1.4,textSize:1,pieceSize:17,boardLight:1,energy:'#45e8bc',letters:'#e4fff2',reducedMotion:false,showPath:false,pieces:[...BOARD_PIECES]};
export function validBoardSettings(v){return !!v&&Object.entries(BOARD_LIMITS).every(([k,[min,max]])=>Number.isFinite(v[k])&&v[k]>=min&&v[k]<=max)&&v.particles%1===0&&['energy','letters'].every(k=>/^#[0-9a-f]{6}$/i.test(v[k]))&&typeof v.reducedMotion==='boolean'&&typeof v.showPath==='boolean'&&Array.isArray(v.pieces)&&v.pieces.length===6&&v.pieces.every(p=>BOARD_PIECES.includes(p));}
export const boardSettings=structuredClone(DEFAULT_BOARD_SETTINGS);
try{const saved=JSON.parse(globalThis.localStorage?.getItem('wildbound-board-art-v1')||'null');if(validBoardSettings(saved))Object.assign(boardSettings,saved);}catch{}
export function saveBoardSettings(v){if(!validBoardSettings(v))throw Error('Invalid board settings');globalThis.localStorage?.setItem('wildbound-board-art-v1',JSON.stringify(v));Object.assign(boardSettings,structuredClone(v));}
