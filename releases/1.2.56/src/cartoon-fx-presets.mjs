import {PIXEL_STYLES} from './pixel-fx-presets.mjs';
// Original effect recipes inspired by the reference, not imported pack artwork.
const recipe=(name,description,fx,color,count=20,life=.9,blend='lighter')=>({name,description,fx,count,life,speedX:0,speedY:-30,spread:70,gravity:65,size:8,orbit:24,shape:'sprite',blend,start:color,end:blend==='lighter'?'#ffffff':'#77868b'});
export const CARTOON_EFFECTS={
 'fx-gold-impact':recipe('Gold impact ring','A sharp gold flash, expanding circular rim and outward tapered sparks.','impact','#ffd65b',24,.65),
 'fx-rune-pillars':recipe('Rune pillar summon','A rotating ground sigil with rising light pillars and ascending stars.','runes','#ffe59b',20,1.6),
 'fx-leaf-burst':recipe('Verdant leaf burst','A lime starburst scatters curling leaves that tumble and settle.','leaves','#b6fa68',24,1.1,'source-over'),
 'fx-lightning':recipe('Forked lightning nova','Blue-white branching bolts radiate from a hot core and fade into sparks.','lightning','#70dfff',18,.5),
 'fx-comic-boom':recipe('Comic explosion','A squash-and-stretch orange blast silhouette, BOOM caption and flying sparks.','boom','#ff8338',20,.65,'source-over'),
 'fx-heart-pop':recipe('Heart pop','A red heart pulses, pops in a white sparkle and releases tiny hearts.','heart','#ff5269',12,.9,'source-over'),
 'fx-shockwave':recipe('White shockwave','A thin expanding white ring with a halo of fast radial speed lines.','shockwave','#e9fff9',28,.55),
 'fx-blue-burst':recipe('Arcane blue impact','A blue spiked core, two expanding rings and luminous needle shards.','energy','#77bdff',28,.7),
 'fx-fire-crescent':recipe('Flaming crescent slash','A rotating golden crescent followed by curling embers and tapered sparks.','crescent','#ffc552',24,.8),
 'fx-smoke-puff':recipe('Billowing smoke puff','Overlapping soft smoke lobes expand, rise, separate and dissolve.','smoke','#ced2ce',16,1.4,'source-over'),
 'fx-purple-vortex':recipe('Violet orbital vortex','A breathing violet ring surrounds orbiting motes and a spiral glow.','vortex','#c15bff',24,1.6),
 'fx-smoke-column':recipe('Fire and smoke column','A bright flame grows beneath a twisting stack of cooling smoke puffs.','column','#ffbc61',18,1.6,'source-over'),
 'fx-bounce-puff':recipe('Comic bounce puff','A springy BOING caption, expanding dust ring and scattered colored stars.','bounce','#ffda56',24,1,'source-over'),
 'fx-ghost-burst':recipe('Spectral ghost release','Pale ghosts lift out of a blue core, fan apart and drift upward.','ghosts','#c1f4ff',12,1.7),
 'fx-red-splatter':recipe('Cartoon red splatter','An abstract red ink splash throws droplets radially; no gore or anatomy.','splatter','#ff414d',20,.8,'source-over'),
 'fx-fireball':recipe('Fireball detonation','A hot orange flame core blooms into fire lobes, dark smoke and embers.','fireball','#ffae4b',26,1.1),
 'fx-water-fountain':recipe('Water fountain splash','Bright droplets arc outward while expanding ripples flatten across the ground.','water','#a4edff',28,1,'source-over'),
 'fx-shadow-bloom':recipe('Shadow rose bloom','Curling violet smoke petals unfold around a luminous spiral and violet needles.','bloom','#b068ed',18,1.2),
};
export const FX_STYLES=[...Object.values(CARTOON_EFFECTS).map(v=>v.fx),...PIXEL_STYLES];
export const PARTICLE_IDEAS=[
 ['Frost shatter','A frozen shell breaks into spinning ice chips and a cold mist ring.'],
 ['Sand portal','A sandy spiral opens with falling grains and heat-colored motes.'],
 ['Jungle spore lantern','Bioluminescent spores float up from leaves with a gentle pulsing glow.'],
 ['Necromancer soul tether','A narrow soul ribbon streams from a defeated enemy to its summoner.'],
 ['Ghost tiger paw strike','Three cyan claw crescents peel away into spectral paw-print sparks.'],
 ['Boomerang catch','A compact golden arc snaps around the hand with two clean catch sparks.'],
 ['Critical hit constellation','A sharp flash resolves into a brief star constellation above the target.'],
 ['Healing fireflies','Green-gold fireflies spiral upward and soften into a healing halo.'],
 ['Mystery clue reveal','A magnifying-glass glint reveals floating ink specks and a small rune ring.'],
 ['Night lamp ignition','A warm wick flash sends up embers and settles into a gentle light pulse.'],
 ['Poison bubble pop','Glossy green bubbles rupture into tiny droplets and wisps.'],
 ['Dice fate pulse','A restrained gold pulse travels between the dice and every player.'],
 ['Dark Essence harvest','Black-violet wisps condense into a purple crystal with no screen-filling flash.'],
];
