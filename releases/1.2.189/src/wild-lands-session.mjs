import {createTrainRuntime} from './train-test.mjs';
import {packTrainDesign, unpackTrainDesign, validateTrainDesign} from './train-design.mjs';
import {railwayBridgeState} from './train-bridges.mjs';
import {EAST_WILDS_WIDTH} from './wild-mountain-layout.mjs';
import {snapshotWildHomestead,restoreWildHomestead} from './wild-homestead-layout.mjs';

const TRAIN_PROGRESS=[
 'distance','speed','throttle','engine','time','driver','doors','roof','derailed','emergencyBrake','homeStart',
 'autoStationStop','requestedStop','lastArrivalKey','lastStationStop','passengerRest','conductor','railwayTicket','conductorDestination','conductorWhistles',
 'conductorSpeech','studentConversations','studentSpeech','studentFrogs','alleyActors','alleyMerchants',
 'alleyOpened','alleyOpenedAt','alleyReturn','wildLandsReturn','hollowActors','hollowSurfaceActors','hollowEncounter','mountainEncounter','damagedBuildings','destructionRevision','overlookMaze','quidditch','quidditchReturn','alleyQuidditchResult','nocturneDarkWizards','nocturneDarkWizardDrops',
 'wildBiomeSpawns','wildBiomeRoomActors','diagonCritterState','nativeGravestoneDamage','nocturneCemetery','hogsmeade','wrongTurnDoors',
 'pirateCrew','pirateWreckCrew',
 'arena','arenaSerial','wildCoastalCaught','alleyGroundLoot','arenaGroundLoot','pitchGroundLoot','pitchEntranceLoot','nocturneBoss','homesteadBoard','tickTockDefeated','hollowStalactites',
 'borginMirrorFight','borginMirrorClaims','borginMirrorReturns','greyhavenBridgeRaised','wildSlimeHollow','moonveilSanctuary',
];

export function snapshotWildLands(train) {
 const bridge=railwayBridgeState(train.design);
 return {
  version:1,
  design:packTrainDesign(train.design),
  progress:Object.fromEntries(TRAIN_PROGRESS.filter(key=>train[key]!==undefined).map(key=>[key,train[key]])),
  cocoaTaken:[...train.cocoaTaken],
  openOwlCages:[...(train.openOwlCages||[])],
  sites:{opened:[...(train.wildExploration?.opened||[])],discovered:[...(train.wildExploration?.discovered||[])]},
  bridges:{broken:[...bridge.broken],damage:[...bridge.damage]},
  homestead:snapshotWildHomestead(train.design),
 };
}

export function restoreWildLands(record) {
 if(record?.version!==1||!record.design?.wildLands||!record.progress||
    !['distance','time','speed','throttle'].every(key=>Number.isFinite(record.progress[key])))
  throw Error('Invalid Wild Lands checkpoint');
 const restoredDesign=unpackTrainDesign(record.design);
 restoredDesign.width=Math.max(restoredDesign.width,EAST_WILDS_WIDTH);
 const design=validateTrainDesign(restoredDesign);
 // Wilds stations are derived from its route, including after a saved world is loaded.
 design.station=null;
 const train=createTrainRuntime(design);
 restoreWildHomestead(design,record.homestead);
 for(const key of TRAIN_PROGRESS)if(record.progress[key]!==undefined)train[key]=record.progress[key];
 const order=train.railwayTicket||train.conductorDestination;
 if(order?.routeId===train.route.id)train.routeSegments[0].offset=order.offset||0;
 train.persistent=true;
 train.preparing=typeof Worker!=='undefined';
 train.cocoaTaken=new Set(record.cocoaTaken||[]);
 train.openOwlCages=new Set(record.openOwlCages||[]);
 train.wildExploration={opened:new Set(record.sites?.opened||[]),discovered:new Set(record.sites?.discovered||[]),nextCheck:0};
 const bridge=railwayBridgeState(design);
 bridge.broken=new Set(record.bridges?.broken||[]);
 bridge.damage=new Map(record.bridges?.damage||[]);
 if(bridge.broken.size)bridge.revision++;
 return train;
}
