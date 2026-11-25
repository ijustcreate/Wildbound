import {contains, furnitureHeight} from './house-design.mjs';
import {sectionBlocked} from './structure-destruction.mjs';

export const LOBBY_HOP_FURNITURE = [
  {id: 'hop-stool', kind: 'chair', x: 211, y: 515, w: 38, h: 30, surfaceHeight: 16},
  {id: 'hop-ottoman', kind: 'sofa', x: 281, y: 515, w: 38, h: 30, surfaceHeight: 22},
  {id: 'hop-bench', kind: 'bench', x: 351, y: 515, w: 38, h: 30, surfaceHeight: 18},
].map(furniture => ({...furniture, lobbySurface: true, jumpable: true}));

function landedFurniture(furniture, height, {x, y}) {
  // Jump physics resolves support before horizontal movement in the same frame.
  return furniture.find(piece => furnitureHeight(piece) === height
    && contains(piece, x, y) && sectionBlocked(piece, x, y, .1));
}

export class LobbyFurnitureStreaks {
  constructor() {
    this.players = new Map();
  }

  update(actors, furniture) {
    const events = [];
    for (const id of this.players.keys()) {
      if (!actors.some(actor => actor.id === id)) this.players.delete(id);
    }
    for (const actor of actors) {
      let streak = this.players.get(actor.id);
      if (!streak) {
        streak = {count: 0, best: 0, visited: new Set(), jumped: false};
        this.players.set(actor.id, streak);
      }

      const airborne = actor.jumpHeight > 0;
      const tookOff = actor.jumpAge === 0 && actor.jumpVelocity > 0;
      if (!airborne || tookOff) {
        // A well-timed follow-up jump can leave its landing surface in the same tick.
        const groundHeight = tookOff ? actor.jumpSupportHeight : actor.groundHeight;
        const support = groundHeight > 0 && streak.jumped && landedFurniture(furniture, groundHeight, streak);
        if (support && !streak.visited.has(support.id)) {
          streak.visited.add(support.id);
          streak.count = streak.visited.size;
          streak.best = Math.max(streak.best, streak.count);
          events.push({playerId: actor.id, count: streak.count, best: streak.best, kind: 'land'});
        } else if (!groundHeight && streak.count) {
          const finished = streak.count;
          streak.visited.clear();
          streak.count = 0;
          events.push({playerId: actor.id, count: 0, best: streak.best, finished, kind: 'end'});
        }
        streak.jumped = false;
      }
      if (airborne && actor.jumpVelocity > 0) streak.jumped = true;

      streak.x = actor.x;
      streak.y = actor.y;
    }
    return events;
  }
}
