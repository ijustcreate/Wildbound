export const SKILLS = [
  { id: 'second_wind', name: 'Second Wind', cost: 20, max: 1, detail: 'Once per expedition, recover from a knockdown at 35 HP.' },
  { id: 'long_jump', name: 'Trail Legs', cost: 15, max: 2, detail: 'Jump farther and higher. Each rank adds 15% reach.' },
  { id: 'quick_revive', name: 'Quick Rescue', cost: 25, max: 1, detail: 'Hold Interact near a downed friend for an instant revive.' },
  { id: 'pack_mule', name: 'Pack Mule', cost: 20, max: 1, detail: 'Carry four additional backpack stacks.' },
  { id: 'scavenger', name: 'Scavenger', cost: 15, max: 1, detail: 'Enemy material drops are more likely to appear.' },
  { id: 'steady_hand', name: 'Steady Hand', cost: 15, max: 1, detail: 'Bow charge builds more quickly and holds its depth longer.' },
];
export const skillScrollId = id => 'skill_scroll_' + id;
export const skillAvailable = (p,id) => !!p.field?.skillScrolls?.[id] || (p.field?.skills?.[id] || 0) > 0;
export function trainSkill(p,id) {
  const skill=SKILLS.find(s=>s.id===id);
  if(!skill || !skillAvailable(p,id))return 'Find this skill scroll on a defeated boss first.';
  const rank=p.field.skills?.[id]||0;
  if(rank>=skill.max)return 'This skill is mastered.';
  if((p.xp||0)<skill.cost)return `Need ${skill.cost} XP.`;
  p.xp-=skill.cost;(p.field.skills??={})[id]=rank+1;
  return `${skill.name} upgraded.`;
}
export const SCROLL_BOSSES = new Set(['skeleton_boss','necromancer','dragon','gorilla','golem','krampus','frost_skeleton_mage']);
