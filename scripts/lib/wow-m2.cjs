// Read the MD21/MD20 bone tracks used by the selected Wowhead lion.
// Meshes, materials and textures are deliberately not loaded.
const fs = require("node:fs"),
  path = require("node:path");
const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const multiply = (a, b) =>
  Array.from({ length: 16 }, (_, i) => {
    const r = i % 4,
      c = Math.floor(i / 4);
    return (
      a[r] * b[c * 4] +
      a[r + 4] * b[c * 4 + 1] +
      a[r + 8] * b[c * 4 + 2] +
      a[r + 12] * b[c * 4 + 3]
    );
  });
const point = (m, p) =>
  [0, 1, 2].map(
    (i) => m[i] * p[0] + m[i + 4] * p[1] + m[i + 8] * p[2] + m[i + 12],
  );
function trs(t, q, s) {
  const norm = Math.hypot(...q);
  if (!norm) throw Error("Zero quaternion");
  const [x, y, z, w] = q.map((v) => v / norm);
  return [
    (1 - 2 * (y * y + z * z)) * s[0],
    2 * (x * y + z * w) * s[0],
    2 * (x * z - y * w) * s[0],
    0,
    2 * (x * y - z * w) * s[1],
    (1 - 2 * (x * x + z * z)) * s[1],
    2 * (y * z + x * w) * s[1],
    0,
    2 * (x * z + y * w) * s[2],
    2 * (y * z - x * w) * s[2],
    (1 - 2 * (x * x + y * y)) * s[2],
    0,
    ...t,
    1,
  ];
}
function slerp(a, b, t) {
  let dot = a.reduce((n, v, i) => n + v * b[i], 0);
  if (dot < 0) {
    b = b.map((v) => -v);
    dot = -dot;
  }
  if (dot > 0.9995) {
    const q = a.map((v, i) => v + (b[i] - v) * t),
      n = Math.hypot(...q);
    return q.map((v) => v / n);
  }
  const angle = Math.acos(Math.min(1, dot)),
    sin = Math.sin(angle);
  return a.map(
    (v, i) =>
      (v * Math.sin((1 - t) * angle) + b[i] * Math.sin(t * angle)) / sin,
  );
}
function chunks(buffer) {
  const out = new Map();
  for (let p = 0; p < buffer.length;) {
    if (p + 8 > buffer.length) throw Error("Truncated M2 chunk");
    const tag = buffer.toString("ascii", p, p + 4),
      length = buffer.readUInt32LE(p + 4);
    if (p + 8 + length > buffer.length)
      throw Error("Invalid " + tag + " chunk size");
    out.set(tag, buffer.subarray(p + 8, p + 8 + length));
    p += 8 + length;
  }
  return out;
}
function loadM2(filename) {
  const file = fs.readFileSync(filename),
    parts = chunks(file),
    data = parts.get("MD21");
  if (
    !data ||
    data.length < 8 ||
    data.toString("ascii", 0, 4) !== "MD20" ||
    !(
      data.readUInt32LE(4) === 272 ||
      data.readUInt32LE(4) === 274
    )
  )
    throw Error("Expected MD21 containing MD20 v272 or v274");
  // v274 creatures may embed bones; HD characters use a separate SKID skeleton.
  let skeleton = null;
  if (parts.has("SKID")) {
    if (parts.get("SKID").length !== 4) throw Error("Invalid SKID");
    const id = parts.get("SKID").readUInt32LE(0);
    skeleton = chunks(
      fs.readFileSync(path.join(path.dirname(filename), id + ".skel")),
    );
    if (skeleton.has("SKPD"))
      throw Error("Parent skeleton overrides are not supported");
    if (!skeleton.has("SKS1") || !skeleton.has("SKB1"))
      throw Error("Incomplete skeleton chunks");
  }
  const sequenceData = skeleton?.get("SKS1") || data;
  const boneData = skeleton?.get("SKB1") || data;
  const bounds = (b, o, n) => {
    if (!Number.isSafeInteger(o) || o < 0 || n < 0 || o + n > b.length)
      throw Error("M2 track exceeds buffer bounds");
  };
  const array = (o, b = boneData) => {
    bounds(b, o, 8);
    return { count: b.readUInt32LE(o), offset: b.readUInt32LE(o + 4) };
  };
  const vec = (b, o) => {
    bounds(b, o, 12);
    return [0, 1, 2].map((i) => b.readFloatLE(o + i * 4));
  };
  const seqArray = array(skeleton ? 8 : 28, sequenceData),
    boneArray = array(skeleton ? 0 : 44),
    loopArray = array(skeleton ? 0 : 20, sequenceData);
  bounds(sequenceData, seqArray.offset, seqArray.count * 64);
  bounds(boneData, boneArray.offset, boneArray.count * 88);
  bounds(sequenceData, loopArray.offset, loopArray.count * 4);
  const loops = Array.from({ length: loopArray.count }, (_, i) =>
    sequenceData.readUInt32LE(loopArray.offset + i * 4),
  );
  const sequences = Array.from({ length: seqArray.count }, (_, index) => {
    const o = seqArray.offset + index * 64;
    const data = sequenceData;
    return {
      index,
      id: data.readUInt16LE(o),
      variant: data.readUInt16LE(o + 2),
      duration: data.readUInt32LE(o + 4),
      flags: data.readUInt32LE(o + 12),
      alias: data.readUInt16LE(o + 62),
    };
  });
  const afid = skeleton?.get("AFID") || parts.get("AFID"),
    files = new Map();
  if (afid?.length % 8) throw Error("Invalid AFID record length");
  if (afid)
    for (let o = 0; o < afid.length; o += 8)
      files.set(
        afid.readUInt16LE(o) + ":" + afid.readUInt16LE(o + 2),
        afid.readUInt32LE(o + 4),
      );
  const track = (o) => ({
    interpolation: boneData.readUInt16LE(o),
    global: boneData.readInt16LE(o + 2),
    times: array(o + 4),
    values: array(o + 12),
  });
  const bones = Array.from({ length: boneArray.count }, (_, index) => {
    const o = boneArray.offset + index * 88;
    const data = boneData;
    return {
      index,
      key: data.readInt32LE(o),
      flags: data.readUInt32LE(o + 4),
      parent: data.readInt16LE(o + 8),
      translation: track(o + 16),
      rotation: track(o + 36),
      scale: track(o + 56),
      pivot: vec(data, o + 76),
    };
  });
  const external = new Map(),
    cache = new Map();
  function resolve(index) {
    const seen = new Set();
    while (sequences[index]?.flags & 64) {
      if (seen.has(index)) throw Error("Animation alias cycle");
      seen.add(index);
      index = sequences[index].alias;
    }
    if (!sequences[index]) throw Error("Invalid sequence index");
    return index;
  }
  function source(index) {
    const s = sequences[index];
    if (s.flags & 32) return boneData;
    const id = files.get(s.id + ":" + s.variant);
    if (!id)
      throw Error("Missing external animation for " + s.id + ":" + s.variant);
    if (!external.has(id)) {
      let b = fs.readFileSync(path.join(path.dirname(filename), id + ".anim"));
      if (["AFM2", "AFSB"].includes(b.toString("ascii", 0, 4))) {
        const payloads = chunks(b);
        b = payloads.get(skeleton ? "AFSB" : "AFM2");
        if (!b) throw Error("Missing animation payload for skeleton type");
      }
      external.set(id, b);
    }
    return external.get(id);
  }
  function values(bone, key, index) {
    const data = boneData;
    const tr = bone[key],
      sequence = tr.global >= 0 ? 0 : index,
      cacheKey = bone.index + ":" + key + ":" + sequence;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    const empty = {
      times: [],
      values: [],
      interpolation: tr.interpolation,
      global: tr.global,
    };
    if (!tr.times.count || !tr.values.count) {
      cache.set(cacheKey, empty);
      return empty;
    }
    bounds(data, tr.times.offset, tr.times.count * 8);
    bounds(data, tr.values.offset, tr.values.count * 8);
    if (tr.global >= loops.length) throw Error("Invalid global sequence");
    if (sequence >= tr.times.count || sequence >= tr.values.count)
      throw Error("Missing sequence track " + cacheKey);
    const tc = data.readUInt32LE(tr.times.offset + sequence * 8),
      to = data.readUInt32LE(tr.times.offset + sequence * 8 + 4),
      vc = data.readUInt32LE(tr.values.offset + sequence * 8),
      vo = data.readUInt32LE(tr.values.offset + sequence * 8 + 4);
    if (!tc && !vc) {
      cache.set(cacheKey, empty);
      return empty;
    }
    if (tc !== vc) throw Error("Mismatched M2 keys " + cacheKey);
    if (![0, 1].includes(tr.interpolation))
      throw Error("Unsupported M2 interpolation " + tr.interpolation);
    const b = tr.global >= 0 ? data : source(index),
      stride = key === "rotation" ? 8 : 12;
    bounds(b, to, tc * 4);
    bounds(b, vo, vc * stride);
    const times = Array.from({ length: tc }, (_, i) =>
      b.readUInt32LE(to + i * 4),
    );
    if (times.some((t, i) => i && t < times[i - 1]))
      throw Error("Out-of-order M2 keys");
    const decoded = Array.from({ length: vc }, (_, i) => {
      let v =
        key === "rotation"
          ? [0, 1, 2, 3].map(
              (c) => (b.readUInt16LE(vo + i * 8 + c * 2) - 32767) / 32767,
            )
          : vec(b, vo + i * 12);
      if (key === "rotation") {
        const n = Math.hypot(...v);
        if (!n) throw Error("Invalid M2 quaternion");
        v = v.map((x) => x / n);
      }
      if (!v.every(Number.isFinite)) throw Error("Nonfinite M2 track");
      return v;
    });
    const result = { ...empty, times, values: decoded };
    cache.set(cacheKey, result);
    return result;
  }
  function sampleTrack(bone, key, index, time) {
    const tr = values(bone, key, index),
      fallback =
        key === "rotation"
          ? [0, 0, 0, 1]
          : key === "scale"
            ? [1, 1, 1]
            : [0, 0, 0];
    if (!tr.times.length) return fallback;
    if (tr.global >= 0) {
      const len = loops[tr.global];
      time = len ? time % len : 0;
    }
    let hi = tr.times.findIndex((t) => t > time);
    if (hi < 0) return tr.values.at(-1);
    if (hi === 0) return tr.values[0];
    const lo = hi - 1;
    if (!tr.interpolation) return tr.values[lo];
    const t = (time - tr.times[lo]) / (tr.times[hi] - tr.times[lo]);
    return key === "rotation"
      ? slerp(tr.values[lo], tr.values[hi], t)
      : tr.values[lo].map((v, i) => v + (tr.values[hi][i] - v) * t);
  }
  function sample(index, time) {
    index = index == null ? null : resolve(index);
    const matrices = [],
      active = new Set();
    function visit(i) {
      if (matrices[i]) return matrices[i];
      if (active.has(i) || !bones[i]) throw Error("Invalid bone hierarchy");
      active.add(i);
      const bone = bones[i],
        p = bone.pivot;
      let m = identity();
      if (index !== null) {
        const t = sampleTrack(bone, "translation", index, time),
          r = sampleTrack(bone, "rotation", index, time),
          s = sampleTrack(bone, "scale", index, time);
        m = trs(
          p.map((v, k) => v + t[k]),
          r,
          s,
        );
        m = multiply(
          m,
          trs(
            p.map((v) => -v),
            [0, 0, 0, 1],
            [1, 1, 1],
          ),
        );
      }
      if (bone.parent >= 0) m = multiply(visit(bone.parent), m);
      matrices[i] = m;
      active.delete(i);
      return m;
    }
    bones.forEach((_, i) => visit(i));
    return {
      matrices,
      positions: bones.map((b, i) => point(matrices[i], b.pivot)),
    };
  }
  return {
    bones,
    sequences,
    resolve,
    sample,
    files: Object.fromEntries(files),
    point,
  };
}
module.exports = { loadM2, point, multiply, trs, slerp };
