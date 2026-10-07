// Names/indices are save keys. Polish copy without renaming encounters or
// replacing user-authored event packs after import.
const copy={
 'The golden hunter':['A golden mane parts fern and shade.\nOne patient hunter claims the glade.','Sidestep the lion’s crouched pounce, then strike during recovery. A snare holds it still.'],
 'Wings in the rafters':['Five small wings disturb the hush.\nDo not let the darkness rush.','Keep moving and sweep the fragile flock with broad attacks.'],
 'Thunder without rain':['Three heavy hooves disturb the ground.\nThe warning comes before the sound.','Sidestep the red charge lanes, then attack the recovering boars.'],
 'Emerald shells':['Six feet beneath each emerald shield.\nFive scarabs cross the waking field.','Keep the scarabs in front of you. Sweep the group and avoid being surrounded.'],
 'The sky breaks open':['The clouds unfasten, leaves bend low.\nThe trails remember where streams flow.','Rain shortens visibility. Stay together until the monsoon passes.'],
 'Heavy footsteps':['The earth keeps time beneath its feet.\nGive the great traveller room to meet.','Give the elephant room. It retaliates only if provoked.'],
 'Stripes in motion':['Three striped shadows cross the green.\nA fleeting herd, a passing scene.','Stand aside for the passing zebras. Do not strike unless you want them to retaliate.'],
 'A low sweep':['Two pale wings skim leaf and stone.\nThe wind does not belong to you alone.','Let the low-flying pelicans pass. Only provoked birds turn to fight.'],
 'The sleeping sickness':['Five dark needles ride the breeze.\nA drowsy hush steals through the trees.','Interrupt the flies’ charge-up before they strike. Rescue a sleeping ally.'],
 'The purple warlock':['A purple crown, a staff of bone.\nFour guards may answer for their own.','Interrupt healing and summons. The warlock can keep at most four summoned guards alive.'],
 'Stripes in the sanctum':['Two amber shadows cross the stair.\nThe ruined temple is their lair.','Keep both tigers in view. Dodge their crouched pounces and punish recovery.'],
 'Keeper of the jade stair':['A heavy hand, a jade-worn stair.\nThree restless thieves attend the heir.','Clear the three monkeys, dodge the gorilla’s marked slam, then strike between attacks.'],
};
export function polishDefaultEventCopy(events){for(const event of events)if(copy[event.name]){const [verse,tip]=copy[event.name];Object.assign(event,{verse,tip});}}
