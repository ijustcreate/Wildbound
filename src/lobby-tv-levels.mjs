// Every section has safe, flat entrance/exit tiles. Distances are tile columns.
export const TV_SECTION_TILES=28;
// Short test course: one familiar starter section and four shuffled sections.
export const TV_SCENES_PER_LEVEL=5;
const scene=(name,gaps,bricks,pipes,enemies,mushroom)=>Object.freeze({name,gaps,bricks,pipes,enemies,mushroom});
export const TV_SCENES=Object.freeze([
 scene('Classic',[13,14,15],[[6,72],[7,72],[20,72],[21,72]],[[22,32],[23,48]],[10,25],8),
 scene('Coin meadow',[],[[7,80],[8,80],[9,80],[18,64],[19,64]],[[23,32]],[12,21],5),
 scene('Twin ravines',[8,9,18,19],[[6,72],[12,64],[13,64],[21,72]],[[24,32]],[15,25],4),
 scene('Stairway',[],[[6,88],[8,72],[10,56],[12,40],[17,56],[19,72]],[[23,48]],[15,25],5),
 scene('Pipe garden',[],[[9,64],[10,64],[18,56]],[[6,32],[13,48],[22,32]],[17,25],8),
 scene('High road',[12,13],[[6,72],[7,72],[10,48],[11,48],[16,48],[17,48],[20,72]],[[24,32]],[8,23],19),
 scene('Brick arcade',[],[[6,72],[7,72],[8,72],[9,72],[17,72],[18,72],[19,72],[20,72]],[[24,32]],[12,22],4),
 scene('Long leap',[11,12,13,14],[[7,72],[8,72],[17,64],[18,64]],[[23,32]],[6,21],5),
 scene('Mushroom grove',[],[[6,88],[7,88],[14,72],[15,72],[20,88]],[[24,48]],[10,18],12),
 scene('Stepping stones',[8,9,13,14,18,19],[[7,64],[11,64],[16,64],[21,64]],[[24,32]],[5,25],4),
 scene('Low ceiling',[],[[6,80],[7,80],[8,80],[9,80],[16,80],[17,80],[18,80]],[[23,32]],[12,21],4),
 scene('Lookout',[],[[7,88],[9,72],[11,56],[13,40],[15,56],[17,72]],[[22,48]],[6,25],19),
 scene('Broken bridge',[10,11,12,17,18],[[8,72],[13,72],[14,72],[15,72],[20,72]],[[24,32]],[6,22],4),
 scene('Treasure approach',[],[[7,64],[8,64],[9,64],[15,80],[16,80],[20,56]],[[23,48]],[12,25],5),
]);
// The second course uses the same safe section seams, but its own jumps,
// platforms, and enemy positions. The pipe rooms are separate bonus areas.
export const TV_CAVERN_SCENES=Object.freeze(TV_SCENES.map((s,i)=>scene(
 `Blue cavern ${i+1}`,
 s.gaps.map(c=>Math.max(6,Math.min(21,c+(i%2?1:-1)))),
 s.bricks.map(([c,y])=>[c,Math.max(40,Math.min(88,y+(i%3-1)*8))]),
 s.pipes.map(([c,h])=>[c,h]),
 s.enemies.map(c=>Math.max(6,Math.min(25,c+(i%2?-1:1)))),
 s.mushroom
)));
export function tvSceneIndex(section,seed){
 if(section===0)return 0;
 // Seeded bags include each variation once, instead of repeating a fixed scene.
 const bag=Math.floor((section-1)/TV_SCENES.length),order=TV_SCENES.map((_,i)=>i);
 let state=(seed+Math.imul(bag+1,2654435761))>>>0;
 for(let i=order.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[order[i],order[j]]=[order[j],order[i]];}
 return order[(section-1)%order.length];
}
