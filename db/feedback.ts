import { env } from "cloudflare:workers";

export type FeedbackRecord = {
  id: string;
  userId: string;
  unitId: string;
  animationId: string;
  frameIndex: number;
  facingIndex: number;
  regionX: number | null;
  regionY: number | null;
  regionW: number | null;
  regionH: number | null;
  goodTags: string;
  badTags: string;
  comment: string;
  rigRevision: string;
  createdAt: string;
};

function database(): D1Database {
  if (!env.DB) throw new Error("Feedback database is unavailable");
  return env.DB;
}

export async function listFeedback(userId: string, unitId: string, animationId: string): Promise<FeedbackRecord[]> {
  const results = await database().prepare(
    `SELECT id, user_id AS userId, unit_id AS unitId, animation_id AS animationId,
      frame_index AS frameIndex, facing_index AS facingIndex, region_x AS regionX,
      region_y AS regionY, region_w AS regionW, region_h AS regionH,
      good_tags AS goodTags, bad_tags AS badTags, comment,
      rig_revision AS rigRevision, created_at AS createdAt
     FROM feedback WHERE user_id = ? AND unit_id = ? AND animation_id = ?
     ORDER BY created_at DESC LIMIT 200`
  ).bind(userId, unitId, animationId).all<FeedbackRecord>();
  return results.results;
}

export async function saveFeedback(record: FeedbackRecord): Promise<void> {
  await database().prepare(
    `INSERT INTO feedback (id, user_id, unit_id, animation_id, frame_index, facing_index,
      region_x, region_y, region_w, region_h, good_tags, bad_tags, comment,
      rig_revision, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(record.id, record.userId, record.unitId, record.animationId,
    record.frameIndex, record.facingIndex, record.regionX, record.regionY,
    record.regionW, record.regionH, record.goodTags, record.badTags,
    record.comment, record.rigRevision, record.createdAt).run();
}
