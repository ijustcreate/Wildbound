export const MUSIC_TRACKS = [
  { id: "curious-groove", name: "Curious Groove", file: "assets/music/curious-groove.mp3" },
  { id: "village-gate", name: "Beyond the Village Gate", file: "assets/music/beyond-the-village-gate.mp3" },
  { id: "worlds-edge", name: "Triumph at the World’s Edge", file: "assets/music/triumph-at-the-worlds-edge.mp3" },
  { id: "swinging-vines", name: "Beyond the Swinging Vines", file: "assets/music/beyond-the-swinging-vines.mp3" },
  { id: "ancient-gate", name: "Beyond the Ancient Gate", file: "assets/music/beyond-the-ancient-gate.mp3" },
];
export const musicTrack = id => MUSIC_TRACKS.find(track => track.id === id) || MUSIC_TRACKS[0];
