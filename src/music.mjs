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
