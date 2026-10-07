// Append-only cemetery roster: old event indices and edited encounters remain stable.
export const GRAVEYARD_EVENTS = [
 {name:'The graves answer',kind:'zombie',count:3,hp:90,speed:40,damage:13,weight:12,graveyard:true,environment:'graveyard',graveRise:true,verse:'The headstones lean. The soil gives way.\nThe restless dead have more to say.',tip:'Watch the disturbed graves. Dodge the zombies as they crawl out.'},
 {name:'Bones on the midnight path',kind:'skeleton',count:3,hp:65,speed:57,damage:12,weight:12,graveyard:true,environment:'graveyard',graveRise:true,verse:'A lantern swings where none should tread.\nThe path is walked by restless dead.',tip:'Separate the skeletons and strike between their sword swings.'},
 {name:'Hands beneath the headstones',kind:'skeleton_unarmed',count:4,hp:45,speed:65,damage:8,weight:10,graveyard:true,environment:'graveyard',graveRise:true,verse:'No swords, no shields, no final rest.\nFour empty hands rise from the earth.',tip:'Keep moving while the unarmed skeletons climb out of the graves.'},
 {name:'The bell tower stirs',kind:'bat',count:5,hp:28,speed:80,damage:6,weight:10,graveyard:true,environment:'graveyard',verse:'The sleeping bell has lost its chime.\nFive velvet wings announce the time.',tip:'Bats swoop around the graves. Face the approaching swarm.'},
 {name:'Silk beneath the stones',kind:'spider',count:3,hp:60,speed:68,damage:9,weight:10,graveyard:true,environment:'graveyard',spiderNest:true,verse:'The marble cracks. The silk is spun.\nEight-footed shadows shun the sun.',tip:'Black spiders gather around the stones. Destroy their eggs before they hatch.'},
 {name:'Three black watchers',type:'raven_flock',kind:'raven',count:3,hp:45,speed:90,damage:9,weight:8,graveyard:true,environment:'graveyard',verse:'Three black watchers on a branch.\nDisturb their rest and wings advance.',tip:'Ravens defend their perches. Finish the flock before resting birds call replacements.'},
 {name:'A murder of crows',type:'murder_of_crows',kind:'crow',count:6,hp:38,speed:98,damage:8,weight:7,graveyard:true,environment:'graveyard',verse:'Six ink-black wings blot out the moon.\nThe murder circles; shelter soon.',tip:'Six crows hunt the party. Thirty seconds without a reachable target settles them into ordinary bird behavior.'},
 {name:'The mourning keeper',kind:'banshee_queen',count:1,hp:310,speed:54,damage:18,weight:3,graveyard:true,environment:'graveyard',verse:'A mourning voice beneath the yew.\nThe cemetery calls for you.',tip:'Avoid the banshee’s scream and keep the party spread out.'},
 {name:'A door beneath the ivy',type:'mausoleum',kind:'mausoleum',count:0,weight:10,graveyard:true,environment:'graveyard',verse:'The ivy parts. The hinges cry.\nBelow the stone, old secrets lie.',tip:'Investigate the opened mausoleum. Bring light; the crypt stairs return to the surface.'},
];
export const cemeteryEvent = event => event?.graveyard===true||event?.environment==='graveyard';
export function appendGraveyardEvents(events){
 for(const event of GRAVEYARD_EVENTS)if(!events.some(e=>e.name===event.name&&e.environment==='graveyard'))events.push(structuredClone(event));
}
