import test from 'node:test';
import assert from 'node:assert/strict';
import {PitchCrowd} from '../src/quidditch-spectators.mjs';
import {QUIDDITCH_PITCH,QUIDDITCH_SCOREBOARD} from '../src/quidditch-layout.mjs';

const stand={team:'gold',index:0,width:242,x:7662,y:4402};

test('spectators sample only when drawn and watch the closest visible rider in each seating group',()=>{
 const crowd=new PitchCrowd(),match={events:[],nextEvent:1,time:0};
 const west={id:1,x:7607,y:4480},east={id:2,x:7732,y:4480};
 let loads=0;
 const visible=()=>{loads++;return [west,east];};
 crowd.begin(match,visible);
 assert.equal(loads,0,'offscreen frames never scan the rider roster');
 assert.equal(crowd.stats.groupsSampled,0);
 crowd.watch(stand,0,0);crowd.watch(stand,1,0);
 assert.equal(crowd.groups.get('gold:0:0').player,west.id);
 assert.equal(crowd.groups.get('gold:0:1').player,east.id);
 assert.equal(crowd.stats.comparisons,4);
 crowd.begin(match,visible);crowd.watch(stand,0,.04);crowd.watch(stand,1,.04);
 assert.equal(crowd.stats.groupsSampled,0,'drawing again inside the time bucket keeps the group headings');
 crowd.begin(match,()=>[east]);crowd.watch(stand,0,.05);
 assert.equal(crowd.groups.get('gold:0:0').player,east.id,'a rider who leaves view is no longer followed');
});

test('only nearby recent match action creates a spectator reaction and the scoreboard stands outside play',()=>{
 const crowd=new PitchCrowd(),match={events:[{id:1,type:'goal',x:8770,y:5270,at:9}],nextEvent:2,time:9.4};
 crowd.begin(match,()=>[]);
 assert.equal(crowd.reaction(stand),null);
 const goal={id:2,type:'goal',x:7290,y:4966,at:10};
 match.events.push(goal);match.nextEvent++;match.time=10.4;
 const closerStand={...stand,x:7356,index:1};
 assert.equal(crowd.reaction(closerStand),goal);
 match.time=11.6;
 assert.equal(crowd.reaction(closerStand),null);
 assert.ok(QUIDDITCH_SCOREBOARD.x-91>QUIDDITCH_PITCH.right);
});
