// Room painters already own their local camera transform and floor coordinates.
export function drawRoomVillagerFollowers(c, g, room, animator, size = 43) {
  if (!animator) return;
  for (const a of g.villageFollowers || [])
    if (
      a.room === room &&
      g.players.some(
        (p) =>
          String(p.profileId || p.id) === a.ownerKey &&
          p.aprilFriend?.active,
      )
    ) {
      animator.draw(c, { ...a, x: a.roomX, y: a.roomY }, g.time, size);
    }
}
