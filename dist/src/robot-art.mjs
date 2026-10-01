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
