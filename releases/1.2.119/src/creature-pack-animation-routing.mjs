const gaitActions=Object.freeze({
  snail:{walk:'crawl',run:'crawl'},
  jumping_spider:{walk:'walk',run:'run'},
  llama:{idle:'idle',walk:'walk',run:'run'},
  penguin:{walk:'waddle',run:'slide',dive:'dive'},
  crab:{walk:'scuttle',run:'scuttle',attack:'pinch'},
  golden_retriever:{idle:'idle',walk:'walk',run:'run'},
  triceratops:{idle:'wowhead-idle',walk:'wowhead-walk',run:'wowhead-run',attack:'wowhead-attack'},
  sheep:{walk:'walk',run:'run',idle:'freeze'},
  skunk:{walk:'amble',run:'scurry',idle:'freeze',attack:'attack'},
  river_otter:{idle:'idle',walk:'walk',run:'run',swim:'swim'},
  squirrel:{walk:'walk',run:'scamper',idle:'freeze',leap:'leap'},
  baby_triceratops:{walk:'quick-walk',run:'short-charge'},
  turkey:{walk:'strut',run:'flap-run',idle:'idle',attack:'flap-attack'},
});

export function creaturePackVisualActor(actor){
  // Turkey follower combat briefly writes generic `attack` and `peck` actions.
  // Preserve its species silhouette by using the authored wing-flap combat gait
  // for the complete controlled attack state.
  if(actor?.kind==='turkey'&&actor.state==='attack'&&actor.hp>0&&!actor.dead&&(actor.hit||0)<=0&&(actor.flash||0)<=0&&(actor.frozen||0)<=0){
    return {...actor,animationAction:'flap-attack'};
  }
  if(actor?.kind==='triceratops'&&actor.state==='attack'&&actor.hp>0&&!actor.dead&&(actor.hit||0)<=0&&(actor.flash||0)<=0&&(actor.frozen||0)<=0){
    return {...actor,animationAction:'wowhead-attack'};
  }
  if(actor?.hp>0&&!actor.dead&&(actor.hit||0)<=0&&(actor.flash||0)<=0&&(actor.frozen||0)<=0){
    // The eldritch AI sets a clip when it winds up, then relies on actor.state
    // to return to locomotion. Keep those native actions aligned with valid
    // clips: Great Owl is authored as `glide` (not the generic `fly` name).
    if(actor.kind==='great_owl'){
      const action=actor.state==='windup'?'swoop':actor.state==='recover'?'recover':actor.state==='dead'?'death':actor.moving?'glide':'idle';
      return {...actor,animationAction:action};
    }
    if(actor.kind==='butterfly_dragon'){
      const action=actor.state==='windup'?'breath':actor.state==='recover'?'recover':actor.state==='dead'?'death':actor.moving?'fly':'idle';
      return {...actor,animationAction:action};
    }
  }
  const mappings=gaitActions[actor?.kind];if(!mappings||actor.hp<=0||actor.dead||actor.hit>0||actor.flash>0||actor.frozen>0||actor.state==='snared')return actor;
  if(actor.kind==='skunk'&&actor.state==='attack')return {...actor,animationAction:'attack'};
  if(actor.animationAction&& !['idle','walk','run','attack'].includes(actor.animationAction))return actor;
  let action=actor.animationAction;
  if(actor.swimming&&actor.kind==='penguin')action=actor.diveDepth>.12?'dive':'waddle';
  else if(actor.jumpHeight>0&&actor.kind==='squirrel')action='leap';
  else if(actor.moving)action=actor.walking?'walk':'run';
  else action='idle';
  const mapped=mappings[action];return mapped?{...actor,animationAction:mapped}:actor;
}
