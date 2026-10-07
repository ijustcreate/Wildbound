export const MUSIC_TRACKS = [
  { id: "curious-groove", name: "Curious Groove", file: "assets/music/curious-groove.mp3" },
  { id: "village-gate", name: "Beyond the Village Gate", file: "assets/music/beyond-the-village-gate.mp3" },
  { id: "worlds-edge", name: "Triumph at the World’s Edge", file: "assets/music/triumph-at-the-worlds-edge.mp3" },
  { id: "swinging-vines", name: "Beyond the Swinging Vines", file: "assets/music/beyond-the-swinging-vines.mp3" },
  { id: "ancient-gate", name: "Beyond the Ancient Gate", file: "assets/music/beyond-the-ancient-gate.mp3" },
  { id: "under-the-conductors-blade", name: "Under the Conductor's Blade", file: "assets/music/under-the-conductors-blade.mp3" },
  { id: "lanterns-in-the-glade", name: "Lanterns in the Glade", file: "assets/music/lanterns-in-the-glade.mp3" },
  { id: "the-forgotten-map", name: "The Forgotten Map", file: "assets/music/the-forgotten-map.mp3" },
  { id: "beneath-the-timber-rafters", name: "Beneath the Timber Rafters", file: "assets/music/beneath-the-timber-rafters.mp3" },
  { id: "tiptoe-through-the-canopy", name: "Tiptoe Through the Canopy", file: "assets/music/tiptoe-through-the-canopy.mp3" },
  { id: "the-altar-of-bone", name: "The Altar of Bone", file: "assets/music/the-altar-of-bone.mp3" },
];
export const musicTrack = id => MUSIC_TRACKS.find(track => track.id === id) || MUSIC_TRACKS[0];

// Provisional title-based companions, not stems or verified matched arrangements.
// Audit and replacement brief: docs/SUNO_TRACK_BRIEF.md.
export const LEVEL_MUSIC_PAIRS = Object.freeze({
  forest: {calm:'lanterns-in-the-glade',combat:'swinging-vines'},
  desert: {calm:'the-forgotten-map',combat:'under-the-conductors-blade'},
  ice: {calm:'tiptoe-through-the-canopy',combat:'worlds-edge'},
  temple: {calm:'ancient-gate',combat:'the-altar-of-bone'},
  house: {calm:'beneath-the-timber-rafters',combat:'village-gate'},
  tv: {calm:'village-gate',combat:'swinging-vines'},
  lobby: {calm:'curious-groove',combat:'under-the-conductors-blade'},
  beach: {calm:'village-gate',combat:'worlds-edge'},
  graveyard: {calm:'ancient-gate',combat:'the-altar-of-bone'},
});
export function levelMusicPair(level='lobby',choice='adaptive',random=Math.random){
  const assigned=LEVEL_MUSIC_PAIRS[level]||LEVEL_MUSIC_PAIRS.forest;
  const calm=choice==='random'?MUSIC_TRACKS[Math.floor(random()*MUSIC_TRACKS.length)%MUSIC_TRACKS.length]
    :choice==='adaptive'?musicTrack(assigned.calm):musicTrack(choice);
  const combat=musicTrack(assigned.combat===calm.id?'under-the-conductors-blade':assigned.combat);
  return {calm,combat,approximate:true};
}
