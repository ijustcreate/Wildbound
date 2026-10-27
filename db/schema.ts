import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const feedback = sqliteTable("feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  unitId: text("unit_id").notNull(),
  animationId: text("animation_id").notNull(),
  frameIndex: integer("frame_index").notNull(),
  facingIndex: integer("facing_index").notNull(),
  regionX: real("region_x"),
  regionY: real("region_y"),
  regionW: real("region_w"),
  regionH: real("region_h"),
  goodTags: text("good_tags").notNull(),
  badTags: text("bad_tags").notNull(),
  comment: text("comment").notNull(),
  rigRevision: text("rig_revision").notNull(),
  createdAt: text("created_at").notNull(),
}, table => [
  index("feedback_user_unit_clip_idx").on(table.userId, table.unitId, table.animationId, table.createdAt),
]);
