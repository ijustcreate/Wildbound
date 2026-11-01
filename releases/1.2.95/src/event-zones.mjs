// Relative encounter emphasis by destination. Events without a matching entry
// stay available as shared encounters at their authored base weight.
const preferences = {
  forest: {
    lion:1.65,panther:1.8,snake:1.45,boar:1.35,bee:1.3,vine:1.5,beetle:1.3,
    anaconda:2.3,wolf:1.25,tsetse:1.6,carnivorous_flower:1.5,poison_pod:1.4,
    mimic_vine:1.5,burrower:1.15,merchant:1.05,spider:1.15,
  },
  temple: {
    monkey:2,tiger:1.8,golem:1.35,gorilla:2,archer:1.2,skeleton:1.25,
    vine:1.25,night_stalker:1.15,carrion_pack:1.2,mimic_vine:1.3,
    carnivorous_flower:1.25,poison_pod:1.2,water_elemental:1.15,
  },
  desert: {
    tarantula:1.8,fire_elemental:1.45,burrower:1.8,sandstorm:1.6,wolf:1.2,
    rhino:1.25,water_elemental:1.15,merchant:1.4,crocodile:1.1,
  },
  ice: {
    snow_leopard:2,white_lion:1.9,krampus:1.8,skeleton_wizard:1.8,
    blizzard:1.6,wolf:1.15,dragon:1.15,bat:.8,
  },
  beach: {
    crocodile:1.6,water_elemental:1.55,pelican:1.4,rhino:1.15,merchant:1.3,
    monsoon:1.25,bee:.8,fire_elemental:.8,
  },
  house: {
    merchant:1.55,old_well:1.5,thunderstorm:1.4,panther:1.1,spider:1.1,
    skeleton:1.05,wayfarer_npc:1.25,
  },
  graveyard: {},
};

export const EVENT_ZONES=Object.freeze(Object.keys(preferences));

export function categorizeEvents(events){
  for(const event of events){
    const zones={};
    for(const zone of EVENT_ZONES){
      if(event.environment&&event.environment!==zone)continue;
      if(event.environments&&!event.environments.includes(zone))continue;
      const explicit=(event.environment===zone||event.environments?.includes(zone))?1.4:1;
      zones[zone]=explicit*(preferences[zone][event.kind]??preferences[zone][event.type]??1);
    }
    event.zoneWeights=zones;
  }
  return events;
}
