import { getChatGPTUser } from "../../chatgpt-auth";
import { listFeedback, saveFeedback, type FeedbackRecord } from "../../../db/feedback";

const GOOD = new Set(["silhouette", "motion", "timing", "detail"]);
const BAD = new Set(["pose", "clipping", "jitter", "readability"]);
const slug = (value: unknown) => typeof value === "string" && /^[a-z0-9_-]{1,60}$/.test(value);
const integer = (value: unknown, max: number) => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= max;
const unit = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({error:"Sign in to view feedback."},{status:401});
  const query = new URL(request.url).searchParams;
  const unitId = query.get("unit"), animationId = query.get("animation");
  if (!slug(unitId) || !slug(animationId)) return Response.json({error:"Invalid unit or animation."},{status:400});
  try { return Response.json({feedback:await listFeedback(user.userId,unitId!,animationId!)}); }
  catch(error) { console.error("Feedback load failed",error); return Response.json({error:"Feedback is unavailable. Try again."},{status:503}); }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({error:"Sign in to save feedback."},{status:401});
  let value: Record<string,unknown>;
  try { value = await request.json(); } catch { return Response.json({error:"Invalid feedback."},{status:400}); }
  const good = value.goodTags, bad = value.badTags, region = value.region;
  const validTags = (tags: unknown, allowed: Set<string>) => Array.isArray(tags) && tags.length <= 4 &&
    tags.every(tag => typeof tag === "string" && allowed.has(tag)) && new Set(tags).size === tags.length;
  const validRegion = region === null || (typeof region === "object" && region !== null &&
    ["x","y","w","h"].every(key => unit((region as Record<string,unknown>)[key])) &&
    Number((region as Record<string,unknown>).w) > 0 && Number((region as Record<string,unknown>).h) > 0 &&
    Number((region as Record<string,unknown>).x) + Number((region as Record<string,unknown>).w) <= 1.00001 &&
    Number((region as Record<string,unknown>).y) + Number((region as Record<string,unknown>).h) <= 1.00001);
  if (!slug(value.unitId) || !slug(value.animationId) || !integer(value.frameIndex,1000) || !integer(value.facingIndex,7) ||
      !validTags(good,GOOD) || !validTags(bad,BAD) || !validRegion ||
      typeof value.comment !== "string" || value.comment.length > 2000 ||
      typeof value.rigRevision !== "string" || !/^[a-f0-9]{12,64}$/.test(value.rigRevision) ||
      (!(good as string[]).length && !(bad as string[]).length && !value.comment.trim())) {
    return Response.json({error:"Choose a tag or write a comment, then try again."},{status:400});
  }
  const rect = region as Record<string,number> | null;
  const record: FeedbackRecord = {
    id: crypto.randomUUID(), userId:user.userId, unitId:value.unitId as string,
    animationId:value.animationId as string, frameIndex:value.frameIndex as number,
    facingIndex:value.facingIndex as number, regionX:rect?.x ?? null,
    regionY:rect?.y ?? null, regionW:rect?.w ?? null, regionH:rect?.h ?? null,
    goodTags:JSON.stringify(good),badTags:JSON.stringify(bad),
    comment:value.comment.trim(),rigRevision:value.rigRevision,
    createdAt:new Date().toISOString(),
  };
  try { await saveFeedback(record); return Response.json({feedback:record},{status:201}); }
  catch(error) { console.error("Feedback save failed",error); return Response.json({error:"Could not save feedback. Your entry is still here; try again."},{status:503}); }
}
