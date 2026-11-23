// Presence, not quantity or equipment, controls this passive bonus. Fractional
// XP is retained so repeated small awards still give exactly ten percent.
export function ticketExperience(p,amount){return amount*(p.inventory?.some(i=>i?.type==='golden_train_ticket'&&i.qty>0)?1.1:1);}
