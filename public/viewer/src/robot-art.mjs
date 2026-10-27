import { defaultPlayerMotion, drawPlayer } from "./player-motion.mjs";
export const robotRig = defaultPlayerMotion();
robotRig.robot = true;
Object.assign(robotRig.palette, {
  head: "#8ba5ac",
  headShade: "#516b76",
  body: "#7c969e",
  bodyShade: "#435d69",
  arms: "#8ba5ac",
  armShade: "#516b76",
  legs: "#607f88",
  legShade: "#354e5c",
  outline: "#b6fff1",
});

export function drawRobotPortrait(canvas, time = 0) {
  if (!canvas) return;
  const c = canvas.getContext("2d");
  c.imageSmoothingEnabled = false;
  c.fillStyle = "#142c30";
  c.fillRect(0, 0, 96, 80);
  c.fillStyle = "#274047";
  for (let y = 6; y < 80; y += 9) c.fillRect(4, y, 88, 1);
  c.save();
  c.translate(48, 76);
  c.scale(1.7, 1.7);
  drawPlayer(
    c,
    { faceX: 0.15, faceY: 1, equipment: {}, animationAction: "idle" },
    time,
    robotRig,
  );
  c.restore();
}
const brokenRobotRig=structuredClone(robotRig);
Object.assign(brokenRobotRig.palette,{head:'#65777a',headShade:'#384a4d',body:'#697a7b',bodyShade:'#354547',outline:'#263b3c'});
export function drawStorageRobot(c,station,p,time,online=true){
 c.save();c.translate(station.x,station.y);c.scale(1.15,1.15);
 drawPlayer(c,{faceX:online?p.roomX-station.x:0,faceY:online?p.roomY-station.y:1,equipment:{},hp:online?100:0,
  animationAction:online?'idle':'death',...(online?{}:{playerFrame:brokenRobotRig.clips.death.length-1})},time,online?robotRig:brokenRobotRig);
 if(!online){
  c.fillStyle='#303b3c';c.fillRect(-18,-1,7,2);c.fillRect(10,-3,9,2);c.fillStyle='#a98859';c.fillRect(12,-4,3,2);c.fillRect(-16,-3,2,2);
  c.fillStyle='#8a6456';c.fillRect(14,-7,1,4);c.fillRect(15,-8,4,1);c.fillStyle='#435858';c.fillRect(-4,-10,8,3);c.fillStyle='#a88b5b';c.fillRect(-2,-9,1,1);
 }
 c.restore();
}
