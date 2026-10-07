export const houseKeepsWorld=g=>g.generatedEnvironment==='house'&&!!g.house&&!g.house.temple;
// Ambient wildlife, converted friends and personal pets belong to the world,
// not the hostile encounter being recalled into the board.
export const recalledEnemy=a=>!['ally','neutral'].includes(a.faction)&&!a.hunterPet&&!a.spiritGhost;
