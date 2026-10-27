import test from 'node:test';
import assert from 'node:assert/strict';
import {landingPadActive, LobbyLanding} from '../src/lobby-landing.mjs';

const pad = () => ({index:0,buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0,0,0]});
test('title accepts every controller button, analog triggers and either stick, without waking on drift',()=>{
  const p=pad();assert.equal(landingPadActive(p),false);
  for(let i=0;i<p.buttons.length;i++){p.buttons[i].pressed=true;assert.equal(landingPadActive(p),true);p.buttons[i].pressed=false;}
  p.buttons[6].value=.7;assert.equal(landingPadActive(p),true);p.buttons[6].value=0;
  for(let i=0;i<4;i++){p.axes[i]=-.6;assert.equal(landingPadActive(p),true);p.axes[i]=.12;assert.equal(landingPadActive(p),false);p.axes[i]=0;}
});
test('joining controller must return to neutral before explorer UI receives its next gesture',()=>{
  const landing=Object.create(LobbyLanding.prototype),p=pad();landing.releasePads=new Set([0]);
  p.buttons[0].pressed=true;assert.equal(landing.waitingForRelease(p),true);assert.equal(landing.waitingForRelease(p),true);
  p.buttons[0].pressed=false;assert.equal(landing.waitingForRelease(p),true);
  p.buttons[0].pressed=true;assert.equal(landing.waitingForRelease(p),false);
});
