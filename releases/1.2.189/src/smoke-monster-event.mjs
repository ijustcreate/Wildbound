export const SMOKE_MONSTER_EVENT = Object.freeze({
  name:'When the Smoke Walks',
  kind:'smoke_monster',
  role:'boss',
  count:1,
  weight:0,
  verse:'The ash stirs where no wind blows.\nIn the dark, a single ember grows.',
  tip:'Keep clear of the smoke. Shatter the orange wisps to shrink the Cinder Wraith, then strike its core.',
});

const SMOKE_ROLL_CHANCE = .05;

export function canRollSmokeMonster(game,roll){
  return !game.trainTest&&roll.tossSeed<SMOKE_ROLL_CHANCE&&
    !game.enemies.some(enemy=>enemy.smokeMonsterRole==='core'&&enemy.hp>0);
}

export function smokeMonsterBoardSite(game){
  const party=game.players.filter(player=>player.hp>0&&!player.room&&!player.spectator&&!player.disconnected);
  const roller=party.find(player=>player.id===game.roll?.playerId)||party[0];
  if(!roller)return null;
  const heading=Math.atan2(roller.faceY||0,roller.faceX||0);
  for(const radius of [230,185,270])for(let i=0;i<12;i++){
    const offset=Math.ceil(i/2)*(i%2?1:-1)*Math.PI/6;
    const x=roller.x+Math.cos(heading+offset)*radius,y=roller.y+Math.sin(heading+offset)*radius;
    if(game.blocked(x,y,18,false,false,false,0)||game.projectileBlocked(x,y,18)||
      party.some(p=>Math.hypot(p.x-x,p.y-y)<145)||
      game.enemies.some(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<46))continue;
    return {x,y};
  }
  return null;
}
