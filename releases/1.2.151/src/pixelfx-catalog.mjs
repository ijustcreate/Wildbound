// Pinned PixelFX catalog. See vendor/pixelfx/UPSTREAM.md.
import * as fx0 from './vendor/pixelfx/src/fx/arcane/arcane-beam.js';
import * as fx1 from './vendor/pixelfx/src/fx/arcane/arcane-missiles.js';
import * as fx2 from './vendor/pixelfx/src/fx/arcane/arcane-orb.js';
import * as fx3 from './vendor/pixelfx/src/fx/arcane/blink-in.js';
import * as fx4 from './vendor/pixelfx/src/fx/arcane/blink-out.js';
import * as fx5 from './vendor/pixelfx/src/fx/arcane/magic-circle-cast.js';
import * as fx6 from './vendor/pixelfx/src/fx/arcane/mana-burst.js';
import * as fx7 from './vendor/pixelfx/src/fx/arcane/portal.js';
import * as fx8 from './vendor/pixelfx/src/fx/arcane/rune-circle.js';
import * as fx9 from './vendor/pixelfx/src/fx/arcane/spell-charge.js';
import * as fx10 from './vendor/pixelfx/src/fx/arcane/star-fall.js';
import * as fx11 from './vendor/pixelfx/src/fx/arcane/time-stop.js';
import * as fx12 from './vendor/pixelfx/src/fx/critters/bat.js';
import * as fx13 from './vendor/pixelfx/src/fx/critters/bird.js';
import * as fx14 from './vendor/pixelfx/src/fx/critters/butterfly.js';
import * as fx15 from './vendor/pixelfx/src/fx/critters/eyeball.js';
import * as fx16 from './vendor/pixelfx/src/fx/critters/fish-school.js';
import * as fx17 from './vendor/pixelfx/src/fx/critters/flying-skull.js';
import * as fx18 from './vendor/pixelfx/src/fx/critters/frog.js';
import * as fx19 from './vendor/pixelfx/src/fx/critters/ghost.js';
import * as fx20 from './vendor/pixelfx/src/fx/critters/jellyfish.js';
import * as fx21 from './vendor/pixelfx/src/fx/critters/slime.js';
import * as fx22 from './vendor/pixelfx/src/fx/critters/snake.js';
import * as fx23 from './vendor/pixelfx/src/fx/critters/wisp.js';
import * as fx24 from './vendor/pixelfx/src/fx/explosions/barrel-explosion.js';
import * as fx25 from './vendor/pixelfx/src/fx/explosions/big-explosion.js';
import * as fx26 from './vendor/pixelfx/src/fx/explosions/cartoon-pow.js';
import * as fx27 from './vendor/pixelfx/src/fx/explosions/dirt-explosion.js';
import * as fx28 from './vendor/pixelfx/src/fx/explosions/firework-burst.js';
import * as fx29 from './vendor/pixelfx/src/fx/explosions/firework-rocket.js';
import * as fx30 from './vendor/pixelfx/src/fx/explosions/grenade.js';
import * as fx31 from './vendor/pixelfx/src/fx/explosions/implosion.js';
import * as fx32 from './vendor/pixelfx/src/fx/explosions/nuke.js';
import * as fx33 from './vendor/pixelfx/src/fx/explosions/plasma-explosion.js';
import * as fx34 from './vendor/pixelfx/src/fx/explosions/small-explosion.js';
import * as fx35 from './vendor/pixelfx/src/fx/explosions/smoke-bomb.js';
import * as fx36 from './vendor/pixelfx/src/fx/fire/brazier.js';
import * as fx37 from './vendor/pixelfx/src/fx/fire/campfire.js';
import * as fx38 from './vendor/pixelfx/src/fx/fire/candle.js';
import * as fx39 from './vendor/pixelfx/src/fx/fire/fire-breath.js';
import * as fx40 from './vendor/pixelfx/src/fx/fire/fire-ring.js';
import * as fx41 from './vendor/pixelfx/src/fx/fire/fire-tornado.js';
import * as fx42 from './vendor/pixelfx/src/fx/fire/fireball.js';
import * as fx43 from './vendor/pixelfx/src/fx/fire/flame-pillar.js';
import * as fx44 from './vendor/pixelfx/src/fx/fire/flamethrower.js';
import * as fx45 from './vendor/pixelfx/src/fx/fire/meteor.js';
import * as fx46 from './vendor/pixelfx/src/fx/fire/spirit-flame.js';
import * as fx47 from './vendor/pixelfx/src/fx/fire/torch.js';
import * as fx48 from './vendor/pixelfx/src/fx/holy/blessing.js';
import * as fx49 from './vendor/pixelfx/src/fx/holy/divine-shield.js';
import * as fx50 from './vendor/pixelfx/src/fx/holy/feather-burst.js';
import * as fx51 from './vendor/pixelfx/src/fx/holy/halo.js';
import * as fx52 from './vendor/pixelfx/src/fx/holy/heal-aoe.js';
import * as fx53 from './vendor/pixelfx/src/fx/holy/heal.js';
import * as fx54 from './vendor/pixelfx/src/fx/holy/holy-pillar.js';
import * as fx55 from './vendor/pixelfx/src/fx/holy/resurrection.js';
import * as fx56 from './vendor/pixelfx/src/fx/holy/smite.js';
import * as fx57 from './vendor/pixelfx/src/fx/holy/sunburst.js';
import * as fx58 from './vendor/pixelfx/src/fx/ice/blizzard-vortex.js';
import * as fx59 from './vendor/pixelfx/src/fx/ice/freeze.js';
import * as fx60 from './vendor/pixelfx/src/fx/ice/frost-breath.js';
import * as fx61 from './vendor/pixelfx/src/fx/ice/frost-nova.js';
import * as fx62 from './vendor/pixelfx/src/fx/ice/ice-crystal.js';
import * as fx63 from './vendor/pixelfx/src/fx/ice/ice-lance.js';
import * as fx64 from './vendor/pixelfx/src/fx/ice/ice-shatter.js';
import * as fx65 from './vendor/pixelfx/src/fx/ice/ice-spikes.js';
import * as fx66 from './vendor/pixelfx/src/fx/ice/icicle-fall.js';
import * as fx67 from './vendor/pixelfx/src/fx/ice/snowflake-burst.js';
import * as fx68 from './vendor/pixelfx/src/fx/impacts/blunt-hit.js';
import * as fx69 from './vendor/pixelfx/src/fx/impacts/bullet-impact.js';
import * as fx70 from './vendor/pixelfx/src/fx/impacts/crit-hit.js';
import * as fx71 from './vendor/pixelfx/src/fx/impacts/ground-slam.js';
import * as fx72 from './vendor/pixelfx/src/fx/impacts/heavy-landing.js';
import * as fx73 from './vendor/pixelfx/src/fx/impacts/hit-flash.js';
import * as fx74 from './vendor/pixelfx/src/fx/impacts/hit-spark.js';
import * as fx75 from './vendor/pixelfx/src/fx/impacts/impact-frame.js';
import * as fx76 from './vendor/pixelfx/src/fx/impacts/parry.js';
import * as fx77 from './vendor/pixelfx/src/fx/impacts/ricochet.js';
import * as fx78 from './vendor/pixelfx/src/fx/impacts/shield-block.js';
import * as fx79 from './vendor/pixelfx/src/fx/lightning/ball-lightning.js';
import * as fx80 from './vendor/pixelfx/src/fx/lightning/chain-lightning.js';
import * as fx81 from './vendor/pixelfx/src/fx/lightning/charge-up.js';
import * as fx82 from './vendor/pixelfx/src/fx/lightning/electrified.js';
import * as fx83 from './vendor/pixelfx/src/fx/lightning/lightning-strike.js';
import * as fx84 from './vendor/pixelfx/src/fx/lightning/plasma-ball.js';
import * as fx85 from './vendor/pixelfx/src/fx/lightning/spark-arc.js';
import * as fx86 from './vendor/pixelfx/src/fx/lightning/storm-cloud.js';
import * as fx87 from './vendor/pixelfx/src/fx/lightning/tesla-coil.js';
import * as fx88 from './vendor/pixelfx/src/fx/lightning/thunderclap.js';
import * as fx89 from './vendor/pixelfx/src/fx/lightning/zap-hit.js';
import * as fx90 from './vendor/pixelfx/src/fx/melee/claw-swipe.js';
import * as fx91 from './vendor/pixelfx/src/fx/melee/dagger-flurry.js';
import * as fx92 from './vendor/pixelfx/src/fx/melee/double-slash.js';
import * as fx93 from './vendor/pixelfx/src/fx/melee/hammer-smash.js';
import * as fx94 from './vendor/pixelfx/src/fx/melee/heavy-cleave.js';
import * as fx95 from './vendor/pixelfx/src/fx/melee/scythe-reap.js';
import * as fx96 from './vendor/pixelfx/src/fx/melee/spear-sweep.js';
import * as fx97 from './vendor/pixelfx/src/fx/melee/spin-slash.js';
import * as fx98 from './vendor/pixelfx/src/fx/melee/sword-slash.js';
import * as fx99 from './vendor/pixelfx/src/fx/melee/thrust.js';
import * as fx100 from './vendor/pixelfx/src/fx/melee/uppercut.js';
import * as fx101 from './vendor/pixelfx/src/fx/melee/whip-crack.js';
import * as fx102 from './vendor/pixelfx/src/fx/moves/arrow-shot.js';
import * as fx103 from './vendor/pixelfx/src/fx/moves/dash-strike.js';
import * as fx104 from './vendor/pixelfx/src/fx/moves/earth-stomp.js';
import * as fx105 from './vendor/pixelfx/src/fx/moves/fireball-throw.js';
import * as fx106 from './vendor/pixelfx/src/fx/moves/ground-pound.js';
import * as fx107 from './vendor/pixelfx/src/fx/moves/holy-smite.js';
import * as fx108 from './vendor/pixelfx/src/fx/moves/ice-lance-throw.js';
import * as fx109 from './vendor/pixelfx/src/fx/moves/lightning-call.js';
import * as fx110 from './vendor/pixelfx/src/fx/moves/meteor-call.js';
import * as fx111 from './vendor/pixelfx/src/fx/moves/pistol-shots.js';
import * as fx112 from './vendor/pixelfx/src/fx/moves/rocket-launcher.js';
import * as fx113 from './vendor/pixelfx/src/fx/moves/sword-combo.js';
import * as fx114 from './vendor/pixelfx/src/fx/nature/acid-splash.js';
import * as fx115 from './vendor/pixelfx/src/fx/nature/boulder.js';
import * as fx116 from './vendor/pixelfx/src/fx/nature/earth-spike.js';
import * as fx117 from './vendor/pixelfx/src/fx/nature/healing-bloom.js';
import * as fx118 from './vendor/pixelfx/src/fx/nature/leaf-storm.js';
import * as fx119 from './vendor/pixelfx/src/fx/nature/poison-cloud.js';
import * as fx120 from './vendor/pixelfx/src/fx/nature/quake.js';
import * as fx121 from './vendor/pixelfx/src/fx/nature/root-snare.js';
import * as fx122 from './vendor/pixelfx/src/fx/nature/spore-burst.js';
import * as fx123 from './vendor/pixelfx/src/fx/nature/thorns.js';
import * as fx124 from './vendor/pixelfx/src/fx/nature/tornado.js';
import * as fx125 from './vendor/pixelfx/src/fx/nature/toxic-puddle.js';
import * as fx126 from './vendor/pixelfx/src/fx/nature/vine-whip.js';
import * as fx127 from './vendor/pixelfx/src/fx/pickups/chest-open.js';
import * as fx128 from './vendor/pixelfx/src/fx/pickups/coin-spin.js';
import * as fx129 from './vendor/pixelfx/src/fx/pickups/collect-burst.js';
import * as fx130 from './vendor/pixelfx/src/fx/pickups/crystal-shard.js';
import * as fx131 from './vendor/pixelfx/src/fx/pickups/gem-spin.js';
import * as fx132 from './vendor/pixelfx/src/fx/pickups/heart-pickup.js';
import * as fx133 from './vendor/pixelfx/src/fx/pickups/key-glint.js';
import * as fx134 from './vendor/pixelfx/src/fx/pickups/loot-beam.js';
import * as fx135 from './vendor/pixelfx/src/fx/pickups/potion.js';
import * as fx136 from './vendor/pixelfx/src/fx/pickups/power-star.js';
import * as fx137 from './vendor/pixelfx/src/fx/pickups/xp-orb.js';
import * as fx138 from './vendor/pixelfx/src/fx/projectiles/arrow.js';
import * as fx139 from './vendor/pixelfx/src/fx/projectiles/bullet-tracer.js';
import * as fx140 from './vendor/pixelfx/src/fx/projectiles/cannonball.js';
import * as fx141 from './vendor/pixelfx/src/fx/projectiles/energy-disc.js';
import * as fx142 from './vendor/pixelfx/src/fx/projectiles/flare.js';
import * as fx143 from './vendor/pixelfx/src/fx/projectiles/homing-missile.js';
import * as fx144 from './vendor/pixelfx/src/fx/projectiles/laser-bolt.js';
import * as fx145 from './vendor/pixelfx/src/fx/projectiles/magic-missile.js';
import * as fx146 from './vendor/pixelfx/src/fx/projectiles/muzzle-pistol.js';
import * as fx147 from './vendor/pixelfx/src/fx/projectiles/muzzle-shotgun.js';
import * as fx148 from './vendor/pixelfx/src/fx/projectiles/muzzle-smg.js';
import * as fx149 from './vendor/pixelfx/src/fx/projectiles/plasma-shot.js';
import * as fx150 from './vendor/pixelfx/src/fx/projectiles/rocket.js';
import * as fx151 from './vendor/pixelfx/src/fx/scifi/emp-blast.js';
import * as fx152 from './vendor/pixelfx/src/fx/scifi/energy-core.js';
import * as fx153 from './vendor/pixelfx/src/fx/scifi/force-field.js';
import * as fx154 from './vendor/pixelfx/src/fx/scifi/glitch.js';
import * as fx155 from './vendor/pixelfx/src/fx/scifi/hologram.js';
import * as fx156 from './vendor/pixelfx/src/fx/scifi/jetpack.js';
import * as fx157 from './vendor/pixelfx/src/fx/scifi/laser-grid.js';
import * as fx158 from './vendor/pixelfx/src/fx/scifi/scanner.js';
import * as fx159 from './vendor/pixelfx/src/fx/scifi/teleporter-pad.js';
import * as fx160 from './vendor/pixelfx/src/fx/scifi/tractor-beam.js';
import * as fx161 from './vendor/pixelfx/src/fx/scifi/warp-in.js';
import * as fx162 from './vendor/pixelfx/src/fx/scifi/warp-out.js';
import * as fx163 from './vendor/pixelfx/src/fx/shadow/black-hole.js';
import * as fx164 from './vendor/pixelfx/src/fx/shadow/curse.js';
import * as fx165 from './vendor/pixelfx/src/fx/shadow/dark-explosion.js';
import * as fx166 from './vendor/pixelfx/src/fx/shadow/eclipse.js';
import * as fx167 from './vendor/pixelfx/src/fx/shadow/grasping-hands.js';
import * as fx168 from './vendor/pixelfx/src/fx/shadow/hex-sigil.js';
import * as fx169 from './vendor/pixelfx/src/fx/shadow/life-steal.js';
import * as fx170 from './vendor/pixelfx/src/fx/shadow/necro-skulls.js';
import * as fx171 from './vendor/pixelfx/src/fx/shadow/shadow-flames.js';
import * as fx172 from './vendor/pixelfx/src/fx/shadow/shadow-tendrils.js';
import * as fx173 from './vendor/pixelfx/src/fx/shadow/soul-drain.js';
import * as fx174 from './vendor/pixelfx/src/fx/shadow/void-orb.js';
import * as fx175 from './vendor/pixelfx/src/fx/spawn/coin-drop.js';
import * as fx176 from './vendor/pixelfx/src/fx/spawn/disintegrate.js';
import * as fx177 from './vendor/pixelfx/src/fx/spawn/dissolve-burn.js';
import * as fx178 from './vendor/pixelfx/src/fx/spawn/egg-hatch.js';
import * as fx179 from './vendor/pixelfx/src/fx/spawn/poof.js';
import * as fx180 from './vendor/pixelfx/src/fx/spawn/respawn-beam.js';
import * as fx181 from './vendor/pixelfx/src/fx/spawn/shatter-death.js';
import * as fx182 from './vendor/pixelfx/src/fx/spawn/soul-rise.js';
import * as fx183 from './vendor/pixelfx/src/fx/spawn/spawn-portal.js';
import * as fx184 from './vendor/pixelfx/src/fx/spawn/summon-rise.js';
import * as fx185 from './vendor/pixelfx/src/fx/status/bleeding.js';
import * as fx186 from './vendor/pixelfx/src/fx/status/burning.js';
import * as fx187 from './vendor/pixelfx/src/fx/status/charmed.js';
import * as fx188 from './vendor/pixelfx/src/fx/status/confused.js';
import * as fx189 from './vendor/pixelfx/src/fx/status/cursed.js';
import * as fx190 from './vendor/pixelfx/src/fx/status/frozen.js';
import * as fx191 from './vendor/pixelfx/src/fx/status/haste.js';
import * as fx192 from './vendor/pixelfx/src/fx/status/petrified.js';
import * as fx193 from './vendor/pixelfx/src/fx/status/poisoned.js';
import * as fx194 from './vendor/pixelfx/src/fx/status/rage.js';
import * as fx195 from './vendor/pixelfx/src/fx/status/sleep.js';
import * as fx196 from './vendor/pixelfx/src/fx/status/slowed.js';
import * as fx197 from './vendor/pixelfx/src/fx/status/stunned.js';
import * as fx198 from './vendor/pixelfx/src/fx/transitions/blinds.js';
import * as fx199 from './vendor/pixelfx/src/fx/transitions/burn-away.js';
import * as fx200 from './vendor/pixelfx/src/fx/transitions/crt-off.js';
import * as fx201 from './vendor/pixelfx/src/fx/transitions/diamond-wipe.js';
import * as fx202 from './vendor/pixelfx/src/fx/transitions/glitch-wipe.js';
import * as fx203 from './vendor/pixelfx/src/fx/transitions/iris.js';
import * as fx204 from './vendor/pixelfx/src/fx/transitions/pixel-dissolve.js';
import * as fx205 from './vendor/pixelfx/src/fx/transitions/shatter-wipe.js';
import * as fx206 from './vendor/pixelfx/src/fx/transitions/slash-wipe.js';
import * as fx207 from './vendor/pixelfx/src/fx/transitions/star-iris.js';
import * as fx208 from './vendor/pixelfx/src/fx/ui/achievement.js';
import * as fx209 from './vendor/pixelfx/src/fx/ui/coin-collect.js';
import * as fx210 from './vendor/pixelfx/src/fx/ui/combo-counter.js';
import * as fx211 from './vendor/pixelfx/src/fx/ui/confetti.js';
import * as fx212 from './vendor/pixelfx/src/fx/ui/countdown.js';
import * as fx213 from './vendor/pixelfx/src/fx/ui/crit-number.js';
import * as fx214 from './vendor/pixelfx/src/fx/ui/damage-number.js';
import * as fx215 from './vendor/pixelfx/src/fx/ui/exclamation.js';
import * as fx216 from './vendor/pixelfx/src/fx/ui/health-bar-hit.js';
import * as fx217 from './vendor/pixelfx/src/fx/ui/heart-lost.js';
import * as fx218 from './vendor/pixelfx/src/fx/ui/level-up.js';
import * as fx219 from './vendor/pixelfx/src/fx/ui/quest-complete.js';
import * as fx220 from './vendor/pixelfx/src/fx/water/bubbles.js';
import * as fx221 from './vendor/pixelfx/src/fx/water/drip.js';
import * as fx222 from './vendor/pixelfx/src/fx/water/fountain.js';
import * as fx223 from './vendor/pixelfx/src/fx/water/geyser.js';
import * as fx224 from './vendor/pixelfx/src/fx/water/rain-splash.js';
import * as fx225 from './vendor/pixelfx/src/fx/water/ripples.js';
import * as fx226 from './vendor/pixelfx/src/fx/water/splash.js';
import * as fx227 from './vendor/pixelfx/src/fx/water/water-jet.js';
import * as fx228 from './vendor/pixelfx/src/fx/water/water-orb.js';
import * as fx229 from './vendor/pixelfx/src/fx/water/waterfall.js';
import * as fx230 from './vendor/pixelfx/src/fx/water/wave-crash.js';
import * as fx231 from './vendor/pixelfx/src/fx/water/whirlpool.js';
import * as fx232 from './vendor/pixelfx/src/fx/weather/aurora.js';
import * as fx233 from './vendor/pixelfx/src/fx/weather/blizzard.js';
import * as fx234 from './vendor/pixelfx/src/fx/weather/cherry-blossoms.js';
import * as fx235 from './vendor/pixelfx/src/fx/weather/clouds.js';
import * as fx236 from './vendor/pixelfx/src/fx/weather/falling-leaves.js';
import * as fx237 from './vendor/pixelfx/src/fx/weather/fireflies.js';
import * as fx238 from './vendor/pixelfx/src/fx/weather/fog.js';
import * as fx239 from './vendor/pixelfx/src/fx/weather/god-rays.js';
import * as fx240 from './vendor/pixelfx/src/fx/weather/rain.js';
import * as fx241 from './vendor/pixelfx/src/fx/weather/shooting-stars.js';
import * as fx242 from './vendor/pixelfx/src/fx/weather/snow.js';
import * as fx243 from './vendor/pixelfx/src/fx/weather/storm.js';
export const PIXELFX_MODULES = Object.freeze({
  'arcane/arcane-beam': fx0,
  'arcane/arcane-missiles': fx1,
  'arcane/arcane-orb': fx2,
  'arcane/blink-in': fx3,
  'arcane/blink-out': fx4,
  'arcane/magic-circle-cast': fx5,
  'arcane/mana-burst': fx6,
  'arcane/portal': fx7,
  'arcane/rune-circle': fx8,
  'arcane/spell-charge': fx9,
  'arcane/star-fall': fx10,
  'arcane/time-stop': fx11,
  'critters/bat': fx12,
  'critters/bird': fx13,
  'critters/butterfly': fx14,
  'critters/eyeball': fx15,
  'critters/fish-school': fx16,
  'critters/flying-skull': fx17,
  'critters/frog': fx18,
  'critters/ghost': fx19,
  'critters/jellyfish': fx20,
  'critters/slime': fx21,
  'critters/snake': fx22,
  'critters/wisp': fx23,
  'explosions/barrel-explosion': fx24,
  'explosions/big-explosion': fx25,
  'explosions/cartoon-pow': fx26,
  'explosions/dirt-explosion': fx27,
  'explosions/firework-burst': fx28,
  'explosions/firework-rocket': fx29,
  'explosions/grenade': fx30,
  'explosions/implosion': fx31,
  'explosions/nuke': fx32,
  'explosions/plasma-explosion': fx33,
  'explosions/small-explosion': fx34,
  'explosions/smoke-bomb': fx35,
  'fire/brazier': fx36,
  'fire/campfire': fx37,
  'fire/candle': fx38,
  'fire/fire-breath': fx39,
  'fire/fire-ring': fx40,
  'fire/fire-tornado': fx41,
  'fire/fireball': fx42,
  'fire/flame-pillar': fx43,
  'fire/flamethrower': fx44,
  'fire/meteor': fx45,
  'fire/spirit-flame': fx46,
  'fire/torch': fx47,
  'holy/blessing': fx48,
  'holy/divine-shield': fx49,
  'holy/feather-burst': fx50,
  'holy/halo': fx51,
  'holy/heal-aoe': fx52,
  'holy/heal': fx53,
  'holy/holy-pillar': fx54,
  'holy/resurrection': fx55,
  'holy/smite': fx56,
  'holy/sunburst': fx57,
  'ice/blizzard-vortex': fx58,
  'ice/freeze': fx59,
  'ice/frost-breath': fx60,
  'ice/frost-nova': fx61,
  'ice/ice-crystal': fx62,
  'ice/ice-lance': fx63,
  'ice/ice-shatter': fx64,
  'ice/ice-spikes': fx65,
  'ice/icicle-fall': fx66,
  'ice/snowflake-burst': fx67,
  'impacts/blunt-hit': fx68,
  'impacts/bullet-impact': fx69,
  'impacts/crit-hit': fx70,
  'impacts/ground-slam': fx71,
  'impacts/heavy-landing': fx72,
  'impacts/hit-flash': fx73,
  'impacts/hit-spark': fx74,
  'impacts/impact-frame': fx75,
  'impacts/parry': fx76,
  'impacts/ricochet': fx77,
  'impacts/shield-block': fx78,
  'lightning/ball-lightning': fx79,
  'lightning/chain-lightning': fx80,
  'lightning/charge-up': fx81,
  'lightning/electrified': fx82,
  'lightning/lightning-strike': fx83,
  'lightning/plasma-ball': fx84,
  'lightning/spark-arc': fx85,
  'lightning/storm-cloud': fx86,
  'lightning/tesla-coil': fx87,
  'lightning/thunderclap': fx88,
  'lightning/zap-hit': fx89,
  'melee/claw-swipe': fx90,
  'melee/dagger-flurry': fx91,
  'melee/double-slash': fx92,
  'melee/hammer-smash': fx93,
  'melee/heavy-cleave': fx94,
  'melee/scythe-reap': fx95,
  'melee/spear-sweep': fx96,
  'melee/spin-slash': fx97,
  'melee/sword-slash': fx98,
  'melee/thrust': fx99,
  'melee/uppercut': fx100,
  'melee/whip-crack': fx101,
  'moves/arrow-shot': fx102,
  'moves/dash-strike': fx103,
  'moves/earth-stomp': fx104,
  'moves/fireball-throw': fx105,
  'moves/ground-pound': fx106,
  'moves/holy-smite': fx107,
  'moves/ice-lance-throw': fx108,
  'moves/lightning-call': fx109,
  'moves/meteor-call': fx110,
  'moves/pistol-shots': fx111,
  'moves/rocket-launcher': fx112,
  'moves/sword-combo': fx113,
  'nature/acid-splash': fx114,
  'nature/boulder': fx115,
  'nature/earth-spike': fx116,
  'nature/healing-bloom': fx117,
  'nature/leaf-storm': fx118,
  'nature/poison-cloud': fx119,
  'nature/quake': fx120,
  'nature/root-snare': fx121,
  'nature/spore-burst': fx122,
  'nature/thorns': fx123,
  'nature/tornado': fx124,
  'nature/toxic-puddle': fx125,
  'nature/vine-whip': fx126,
  'pickups/chest-open': fx127,
  'pickups/coin-spin': fx128,
  'pickups/collect-burst': fx129,
  'pickups/crystal-shard': fx130,
  'pickups/gem-spin': fx131,
  'pickups/heart-pickup': fx132,
  'pickups/key-glint': fx133,
  'pickups/loot-beam': fx134,
  'pickups/potion': fx135,
  'pickups/power-star': fx136,
  'pickups/xp-orb': fx137,
  'projectiles/arrow': fx138,
  'projectiles/bullet-tracer': fx139,
  'projectiles/cannonball': fx140,
  'projectiles/energy-disc': fx141,
  'projectiles/flare': fx142,
  'projectiles/homing-missile': fx143,
  'projectiles/laser-bolt': fx144,
  'projectiles/magic-missile': fx145,
  'projectiles/muzzle-pistol': fx146,
  'projectiles/muzzle-shotgun': fx147,
  'projectiles/muzzle-smg': fx148,
  'projectiles/plasma-shot': fx149,
  'projectiles/rocket': fx150,
  'scifi/emp-blast': fx151,
  'scifi/energy-core': fx152,
  'scifi/force-field': fx153,
  'scifi/glitch': fx154,
  'scifi/hologram': fx155,
  'scifi/jetpack': fx156,
  'scifi/laser-grid': fx157,
  'scifi/scanner': fx158,
  'scifi/teleporter-pad': fx159,
  'scifi/tractor-beam': fx160,
  'scifi/warp-in': fx161,
  'scifi/warp-out': fx162,
  'shadow/black-hole': fx163,
  'shadow/curse': fx164,
  'shadow/dark-explosion': fx165,
  'shadow/eclipse': fx166,
  'shadow/grasping-hands': fx167,
  'shadow/hex-sigil': fx168,
  'shadow/life-steal': fx169,
  'shadow/necro-skulls': fx170,
  'shadow/shadow-flames': fx171,
  'shadow/shadow-tendrils': fx172,
  'shadow/soul-drain': fx173,
  'shadow/void-orb': fx174,
  'spawn/coin-drop': fx175,
  'spawn/disintegrate': fx176,
  'spawn/dissolve-burn': fx177,
  'spawn/egg-hatch': fx178,
  'spawn/poof': fx179,
  'spawn/respawn-beam': fx180,
  'spawn/shatter-death': fx181,
  'spawn/soul-rise': fx182,
  'spawn/spawn-portal': fx183,
  'spawn/summon-rise': fx184,
  'status/bleeding': fx185,
  'status/burning': fx186,
  'status/charmed': fx187,
  'status/confused': fx188,
  'status/cursed': fx189,
  'status/frozen': fx190,
  'status/haste': fx191,
  'status/petrified': fx192,
  'status/poisoned': fx193,
  'status/rage': fx194,
  'status/sleep': fx195,
  'status/slowed': fx196,
  'status/stunned': fx197,
  'transitions/blinds': fx198,
  'transitions/burn-away': fx199,
  'transitions/crt-off': fx200,
  'transitions/diamond-wipe': fx201,
  'transitions/glitch-wipe': fx202,
  'transitions/iris': fx203,
  'transitions/pixel-dissolve': fx204,
  'transitions/shatter-wipe': fx205,
  'transitions/slash-wipe': fx206,
  'transitions/star-iris': fx207,
  'ui/achievement': fx208,
  'ui/coin-collect': fx209,
  'ui/combo-counter': fx210,
  'ui/confetti': fx211,
  'ui/countdown': fx212,
  'ui/crit-number': fx213,
  'ui/damage-number': fx214,
  'ui/exclamation': fx215,
  'ui/health-bar-hit': fx216,
  'ui/heart-lost': fx217,
  'ui/level-up': fx218,
  'ui/quest-complete': fx219,
  'water/bubbles': fx220,
  'water/drip': fx221,
  'water/fountain': fx222,
  'water/geyser': fx223,
  'water/rain-splash': fx224,
  'water/ripples': fx225,
  'water/splash': fx226,
  'water/water-jet': fx227,
  'water/water-orb': fx228,
  'water/waterfall': fx229,
  'water/wave-crash': fx230,
  'water/whirlpool': fx231,
  'weather/aurora': fx232,
  'weather/blizzard': fx233,
  'weather/cherry-blossoms': fx234,
  'weather/clouds': fx235,
  'weather/falling-leaves': fx236,
  'weather/fireflies': fx237,
  'weather/fog': fx238,
  'weather/god-rays': fx239,
  'weather/rain': fx240,
  'weather/shooting-stars': fx241,
  'weather/snow': fx242,
  'weather/storm': fx243,
});
