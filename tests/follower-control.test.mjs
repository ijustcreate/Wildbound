import test from "node:test";
import assert from "node:assert/strict";
import { controlledFollower, cycleFollowerControl } from "../src/follower-control.mjs";

test("control cycles through every owned follower and returns to the saved player position", () => {
  const player = { id: 1, profileId: "p1", name: "DAD", x: 10, y: 20 };
  const wolf = { id: 2, kind: "wolf", name: "Wolf", allyOwner: 1, x: 100, y: 110, hp: 20 };
  const april = { id: 3, name: "April", ownerKey: "p1", x: 200, y: 210, hp: 80 };
  const game = { players: [player], enemies: [wolf], villageFollowers: [april], ghosts: [], message() {} };
  assert.equal(cycleFollowerControl(game, player), wolf);
  assert.deepEqual([player.x, player.y], [100, 110]);
  assert.equal(cycleFollowerControl(game, player), april);
  assert.deepEqual([player.x, player.y], [200, 210]);
  assert.equal(cycleFollowerControl(game, player), null);
  assert.deepEqual([player.x, player.y], [10, 20]);
  assert.equal(player.controlledFollowerId, undefined);
});

test("death of the controlled follower restores the main character immediately", () => {
  const player = { id: 1, profileId: "p1", name: "DAD", x: 10, y: 20 };
  const wolf = { id: 2, kind: "wolf", allyOwner: 1, x: 100, y: 110, hp: 20 };
  const game = { players: [player], enemies: [wolf], villageFollowers: [], ghosts: [], message() {} };
  cycleFollowerControl(game, player);
  wolf.hp = 0;
  assert.equal(controlledFollower(game, player), null);
  assert.deepEqual([player.x, player.y], [10, 20]);
});
