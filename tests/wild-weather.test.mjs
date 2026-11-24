import test from 'node:test';
import assert from 'node:assert/strict';
import {WILDS_OVERLOOK} from '../src/overlook-maze-layout.mjs';
import {wildLandsGround} from '../src/wild-lands-world.mjs';
import {DAY_LENGTH} from '../src/night-cycle.mjs';
import {wildRainWindow,wildRainIntensity,wildWeatherAt,easeWildWeather,WILD_RAIN_SECONDS} from '../src/wild-weather.mjs';

test('forest and Bayou each have a 20 percent chance in both periods and every storm spans two minutes',()=>{
 for(const biome of ['forest','swamp'])for(const phase of [0,1]){
  let storms=0;
  for(let day=0;day<2048;day++){
   const window=wildRainWindow(238917,day,biome,phase);
   if(!window)continue;
   storms++;
   const offset=day*DAY_LENGTH;
   assert.ok(window.start>=offset+(phase===0?0:300));
   assert.ok(window.end<=offset+(phase===0?240:450));
   assert.ok(Math.abs(window.end-window.start-WILD_RAIN_SECONDS)<1e-6);
   assert.deepEqual(window,wildRainWindow(238917,day,biome,phase));
  }
  assert.ok(storms/2048>.175&&storms/2048<.225);
 }
});

test('rain builds to a storm and eases out at the biome border, while the snowy maze has local flakes',()=>{
 const d={wildLands:true},seed=17423;
 const g={seed,trainTest:{design:d},sky:{elapsed:0}};
 const north={x:WILDS_OVERLOOK.x+WILDS_OVERLOOK.w/2,y:WILDS_OVERLOOK.y+180,hp:100};
 const south={...north,y:WILDS_OVERLOOK.y+WILDS_OVERLOOK.h-170};
 const bayou={x:13270,y:2020,hp:100};
 assert.equal(wildLandsGround(d,bayou.x,bayou.y),'swamp');
 assert.ok(wildWeatherAt(g,north).snow>0);
 assert.equal(wildWeatherAt(g,south).snow,0);
 let day=0,window;
 while(!window&&day<100)window=wildRainWindow(seed,day++,'swamp',1);
 assert.ok(window);
 const at=t=>{g.sky.elapsed=window.start+t;return wildRainIntensity(g,'swamp');};
 assert.equal(at(0),0);
 assert.ok(at(6)>0&&at(6)<at(17)&&at(17)<at(65));
 assert.equal(at(65),1);
 assert.ok(at(104)<1&&at(104)>at(112));
 assert.equal(at(120),0);
 at(64);
 assert.equal(wildWeatherAt(g,bayou).rain,1);
 assert.equal(wildWeatherAt(g,{x:13270,y:2146,hp:100}).rain,0,'the hut roof shelters players');
 assert.equal(wildWeatherAt(g,{...bayou,room:'indoors'}).rain,0);
 const fade=easeWildWeather({rain:1,snow:0},wildWeatherAt(g,south),.16);
 assert.ok(fade.rain>0&&fade.rain<1);
 let faded=fade;
 for(let i=0;i<14;i++)faded=easeWildWeather(faded,wildWeatherAt(g,south),.16);
 assert.equal(faded.rain,0);
});
