import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import loader from "../scripts/lib/wow-m2.cjs";
function fixture(t, external = false) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "wildbound-m2-"));
  const file = path.join(directory, "test.m2"),
    anim = path.join(directory, "99.anim");
  t.after(() => {
    for (const f of [file, anim]) if (fs.existsSync(f)) fs.unlinkSync(f);
    fs.rmdirSync(directory);
  });
  const b = Buffer.alloc(1536);
  b.write("MD20");
  b.writeUInt32LE(272, 4);
  const array = (at, count, offset) => {
    b.writeUInt32LE(count, at);
    b.writeUInt32LE(offset, at + 4);
  };
  array(28, 2, 600);
  array(44, 2, 128);
  for (let i = 0; i < 2; i++) {
    const o = 128 + i * 88;
    b.writeInt16LE(i - 1, o + 8);
    for (const at of [16, 36, 56]) b.writeInt16LE(-1, o + at + 2);
    b.writeFloatLE(i, o + 76);
  }
  // A translated, rotating root and a child one unit along X.
  b.writeUInt16LE(1, 144);
  array(148, 1, 1000);
  array(156, 1, 1016);
  array(1000, 2, 1100);
  array(1016, 2, 1120);
  b.writeUInt16LE(1, 164);
  array(168, 1, 1024);
  array(176, 1, 1040);
  array(1024, 2, 1100);
  array(1040, 2, 1160);
  b.writeUInt32LE(1000, 1104);
  b.writeFloatLE(2, 1132);
  for (let i = 0; i < 2; i++)
    for (let c = 0; c < 4; c++)
      b.writeUInt16LE(
        (i === 0 ? c === 3 : c === 2) ? 65534 : 32767,
        1160 + i * 8 + c * 2,
      );
  for (let i = 0; i < 2; i++) {
    b.writeUInt32LE(1000, 600 + i * 64 + 4);
    b.writeUInt32LE(i ? 96 : external ? 0 : 32, 600 + i * 64 + 12);
  }
  const chunk = (tag, data) => {
    const h = Buffer.alloc(8);
    h.write(tag);
    h.writeUInt32LE(data.length, 4);
    return Buffer.concat([h, data]);
  };
  const save = () => {
    const parts = [chunk("MD21", b)];
    if (external) {
      const a = Buffer.alloc(8);
      a.writeUInt32LE(99, 4);
      parts.push(chunk("AFID", a));
      fs.writeFileSync(anim, b);
    }
    fs.writeFileSync(file, Buffer.concat(parts));
  };
  save();
  return { b, file, anim, save };
}
const near = (actual, expected) =>
  actual.forEach((n, i) =>
    assert.ok(Math.abs(n - expected[i]) < 1e-5, actual + " != " + expected),
  );
test("M2 interpolation composes pivots and parents and resolves an alias", (t) => {
  const { file } = fixture(t),
    m = loader.loadM2(file);
  near(m.sample(null, 0).positions[1], [1, 0, 0]);
  near(m.sample(0, 500).positions[0], [1, 0, 0]);
  near(m.sample(0, 500).positions[1], [1, 1, 0]);
  assert.deepEqual(m.sample(1, 500), m.sample(0, 500));
  near(m.sample(0, 1000).positions[1], [1, 0, 0]);
});
test("external animation payload is loaded through AFID and is required", (t) => {
  const { file, anim } = fixture(t, true),
    b = fs.readFileSync(anim);
  b.writeFloatLE(6, 1132);
  fs.writeFileSync(anim, b);
  near(loader.loadM2(file).sample(0, 500).positions[0], [3, 0, 0]);
  fs.unlinkSync(anim);
  assert.throws(() => loader.loadM2(file).sample(0, 0), /ENOENT/);
});
test("corrupt chunks, unsupported interpolation and cyclic aliases fail explicitly", (t) => {
  const f = fixture(t);
  fs.writeFileSync(f.file, fs.readFileSync(f.file).subarray(0, 100));
  assert.throws(() => loader.loadM2(f.file), /chunk size/);
  f.b.writeUInt16LE(2, 144);
  f.save();
  assert.throws(
    () => loader.loadM2(f.file).sample(0, 0),
    /Unsupported M2 interpolation/,
  );
  f.b.writeUInt16LE(1, 144);
  f.b.writeUInt32LE(96, 612);
  f.b.writeUInt16LE(1, 662);
  f.save();
  assert.throws(() => loader.loadM2(f.file).sample(0, 0), /alias cycle/);
});
test("truncated nested arrays and out-of-order time keys are rejected", (t) => {
  const f = fixture(t);
  f.b.writeUInt32LE(99999, 152);
  f.save();
  assert.throws(() => loader.loadM2(f.file).sample(0, 0), /buffer bounds/);
  f.b.writeUInt32LE(1000, 152);
  f.b.writeUInt32LE(2000, 1100);
  f.save();
  assert.throws(() => loader.loadM2(f.file).sample(0, 0), /Out-of-order/);
});

test("HD SKID uses separate sequence/bone buffers and the AFSB external payload", (t) => {
  const f = fixture(t, true),
    directory = path.dirname(f.file),
    skel = path.join(directory, "77.skel");
  t.after(() => {
    if (fs.existsSync(skel)) fs.unlinkSync(skel);
  });
  const chunk = (tag, data) => {
    const h = Buffer.alloc(8);
    h.write(tag);
    h.writeUInt32LE(data.length, 4);
    return Buffer.concat([h, data]);
  };
  const seq = Buffer.from(f.b),
    bones = Buffer.from(f.b),
    header = Buffer.from(f.b),
    skid = Buffer.alloc(4),
    afid = Buffer.alloc(8);
  seq.writeUInt32LE(0, 0);
  seq.writeUInt32LE(0, 4);
  seq.writeUInt32LE(2, 8);
  seq.writeUInt32LE(600, 12);
  bones.writeUInt32LE(2, 0);
  bones.writeUInt32LE(128, 4);
  header.writeUInt32LE(274, 4);
  skid.writeUInt32LE(77);
  afid.writeUInt32LE(99, 4);
  fs.writeFileSync(
    skel,
    Buffer.concat([
      chunk("SKS1", seq),
      chunk("SKB1", bones),
      chunk("AFID", afid),
    ]),
  );
  fs.writeFileSync(
    f.file,
    Buffer.concat([chunk("MD21", header), chunk("SKID", skid)]),
  );
  const external = Buffer.from(f.b);
  external.writeFloatLE(8, 1132);
  fs.writeFileSync(
    f.anim,
    Buffer.concat([chunk("AFM2", Buffer.alloc(16)), chunk("AFSB", external)]),
  );
  near(loader.loadM2(f.file).sample(0, 500).positions[0], [4, 0, 0]);
  assert.deepEqual(
    loader.loadM2(f.file).sample(1, 500),
    loader.loadM2(f.file).sample(0, 500),
  );
  // A child skeleton needs explicit sequence overrides; do not silently ignore it.
  fs.appendFileSync(skel, chunk("SKPD", Buffer.alloc(16)));
  assert.throws(() => loader.loadM2(f.file), /Parent skeleton/);
  fs.unlinkSync(skel);
});
