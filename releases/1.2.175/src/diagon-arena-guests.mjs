import {DEFAULT_APPEARANCE} from './appearance.mjs';

const guests = [
 {
  id:'night-clerk',name:'The Narrator',title:'Night-shift clerk',x:8002,y:4738,face:[1,1],
  look:{skin:'#c19c7d',pants:'#536473',hair:'sidepart',hairColor:'#3e302c',face:'stubble'},chest:'arena_clerk_tie',
  dialogue:['Upstairs I file incident reports. Down here I finally get to see how they happen.',
   'The lamps mark the edge of the ring. Stepping across them is the only invitation you need.'],
 },
 {
  id:'red-jacket',name:'Tyler Durden',title:'Ring regular',x:8017,y:4802,face:[-1,-1],
  look:{skin:'#d49d72',hair:'spikes',hairColor:'#734b32',pants:'#5e5254',face:'stubble'},chest:'arena_red_jacket',
  dialogue:['People polish their boots upstairs. Down here we find out what the soles are made of.',
   'The bell buys both fighters a breath. Rudest thing in the room is a fighter who takes it from them.'],
 },
 {
  id:'robert',name:'Robert Paulson',title:'Corner coach',x:8110,y:4879,face:[0,-1],
  look:{skin:'#d2a78d',hair:'ponytail',hairColor:'#746355',pants:'#4b6765',face:'classic'},chest:'arena_corner_tracksuit',
  dialogue:['Robert Paulson. I keep a stool and a clean towel in both corners.',
   'Shoulders loose. Breathe out when you step. Come back here if the lights are starting to double.'],
 },
 {
  id:'marla',name:'Marla Singer',title:'Late-night spectator',x:8298,y:4865,face:[-1,-1],
  look:{skin:'#d4b1a6',hair:'shag',hairColor:'#302931',pants:'#3c333f',shoes:'#3a2b34'},chest:'arena_lace_mourning',
  dialogue:['Best seat in the house. You can see the two people in the ring and everyone pretending they aren’t watching.',
   'I gave the bartender my winnings for a chair with its legs the same length. I’m still waiting.'],
 },
 {
  id:'angel-face',name:'Angel Face',title:'Satin-corner fighter',x:8154,y:4815,face:[-1,1],
  look:{skin:'#ebc198',hair:'undercut',hairColor:'#e7c486',pants:'#555e64',face:'scar'},chest:'arena_satin_corner',
  dialogue:['The seamstress put wings across the back. Figured I could use a little extra lift.',
   'I do my best work when people expect the jacket to come out of the ring clean.'],
 },
 {
  id:'lou',name:'Lou',title:'House regular',x:8333,y:4710,face:[-1,0],
  look:{skin:'#bc865e',hair:'crop',hairColor:'#523830',pants:'#4c403a',face:'goatee'},chest:'arena_house_waistcoat',
  dialogue:['Every board in this bar has a receipt. Mine is the one that says you pay for a broken stool.',
   'Give the house a little credit. We’ve kept the ring and the bar on opposite sides of the room for a reason.'],
 },
 {
  id:'mr-t',name:'Mr. T',title:'Heavyweight challenger',x:8129,y:4714,face:[1,0],
  look:{skin:'#8b5739',hair:'mohawk',hairColor:'#2f2727',pants:'#6d5d49',face:'beard'},chest:'arena_heavy_chains',
  dialogue:['The best fighter is the one who can make it through all the rounds. Let’s see how far Hercules gets without a snack.',
   'Bruce can have the first move. I’m putting my gold on who’s still standing when we need a second one.'],
 },
 {
  id:'bruce',name:'Bruce Lee',title:'Footwork specialist',x:8164,y:4731,face:[1,0],
  look:{skin:'#bc875d',hair:'shag',hairColor:'#25272c',pants:'#b48c34',shoes:'#383235'},chest:'arena_yellow_tracksuit',
  dialogue:['Hercules can lift the bar. Look at Leeloo’s feet. She’d be out of the way before he noticed.',
   'Speed is what the room sees. Timing is why a move lands. Those are two different bets.'],
 },
 {
  id:'hercules',name:'Hercules',title:'Mythic contender',x:8222,y:4731,face:[-1,0],
  look:{skin:'#ca925f',hair:'waves',hairColor:'#8b6034',pants:'#81623d',face:'stubble'},chest:'arena_lion_harness',
  dialogue:['Mr. T says strength only lasts three rounds. I brought enough olives for six.',
   'Best fighter? I’d say the one who can win twice. Once when the plan works, and once when it goes sideways.'],
 },
 {
  id:'leeloo',name:'Leeloo Dallas',title:'Quickstep contender',x:8255,y:4714,face:[-1,0],
  look:{skin:'#efc0a0',hair:'bob',hairColor:'#da652f',pants:'#c87948',shoes:'#653b34',face:'freckles'},chest:'arena_orange_harness',
  dialogue:['Bruce watches the feet. Hercules watches the shoulders. I watch the snack bowl while they argue.',
   'Same ring, same bell. No one gets to write their name on the trophy before we start.'],
 },
];

export function arenaGuestActors(){
 return guests.map(({id,name,title,x,y,face,look,chest,dialogue})=>({
  id:'arena-guest:'+id,name,title,x,y,faceX:face[0],faceY:face[1],dialogue,
  sprite:'player',kind:'player',hp:1,moving:false,movementGait:'idle',
  appearance:{...DEFAULT_APPEARANCE,...look},equipment:{chest},
 }));
}
