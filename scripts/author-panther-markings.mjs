// Rebuild only Panther's editable chest markings in the shared rig pack.
import fs from 'node:fs';

const path = new URL('../authored/rigs.json', import.meta.url);
const pack = JSON.parse(fs.readFileSync(path, 'utf8'));
const model = pack.beastMotions.panther;
const front = [
  '....+.....+....',
  '...+*+...+*+...',
  '..+o++...++o+..',
  '..+o+.....+o+..',
  '...++..*..++...',
  '....+.+*+.+....',
  '.....+o+o+.....',
  '......+*+......',
  '.......+.......',
];
const back = [
  '...+.......+...',
  '..+*+.....+*+..',
  '.+oo+.....+oo+.',
  '.+o+...*...+o+.',
  '..++..+*+..++..',
  '...+..+o+..+...',
  '....+..+..+....',
  '.....+.*.+.....',
  '......+++......',
];
const side = [
  '.......+.......',
  '.....+*++......',
  '...+oo+*+.....',
  '..+o++..+.....',
  '.+o+....+*+...',
  '..++...+oo+...',
  '...+....+o+...',
  '....+....++....',
  '.....+++.......',
];
const diagonal = [
  '.....+.........',
  '....+*+..+.....',
  '...+oo+.+*+....',
  '..+o+...+o+....',
  '...++..*..++...',
  '....+.+*+.+....',
  '.....+o+o+.....',
  '......+*+......',
  '.......+.......',
];
const symbols = {'.':0, o:1, '+':2, '*':3};
model.boneSprites ??= {};
model.boneSprites['Panther markings'] = Object.fromEntries(Array.from({length:8}, (_,direction) => {
  const original = direction===0?front:direction===4?back:direction===2||direction===6?side:diagonal;
  const rows = (direction>=5 ? original.map(row => [...row].reverse().join('')) : original).map(row=>row.padEnd(15,'.'));
  if(rows.some(row=>row.length!==15))throw Error('Panther markings must be 15 pixels wide');
  return [direction,{width:15,height:9,x:-7,y:-8,palette:['transparent','#17212b','#53636e','#89949a'],pixels:rows.join('').split('').map(symbol=>symbols[symbol])}];
}));
fs.writeFileSync(path, JSON.stringify(pack,null,2)+'\n');
