import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { validateSprite } from "../src/pixels.mjs";

const cli = fileURLToPath(new URL("../scripts/pixel-art.mjs", import.meta.url));

function fixture(t, spec) {
  const dir = mkdtempSync(join(tmpdir(), "wildbound-pixel-art-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const input = join(dir, "input spec.json");
  const out = join(dir, "review output");
  writeFileSync(input, JSON.stringify(spec));
  const run = (directory = out) =>
    spawnSync(process.execPath, [cli, input, "--out", directory], {
      cwd: tmpdir(),
      encoding: "utf8",
    });
  return { dir, out, run };
}

test("pixel-art writes a native sprite, pixel ruler, and crisp PNG", (t) => {
  const { out, run } = fixture(t, {
    width: 2,
    height: 2,
    palette: { r: "#8E4832", b: "#4b4760" },
    rows: ["r.", ".b"],
    patches: [{ x: 0, y: 1, rows: ["_"] }],
    x: -1.5,
    y: 2,
  });
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const sprite = JSON.parse(readFileSync(join(out, "sprite.json"), "utf8"));
  assert.ok(validateSprite(sprite));
  assert.deepEqual(sprite, {
    width: 2,
    height: 2,
    palette: ["transparent", "#8e4832", "#4b4760"],
    pixels: [1, 0, 0, 2],
    x: -1.5,
    y: 2,
  });
  assert.match(
    readFileSync(join(out, "pixels.txt"), "utf8"),
    / {4}01\n {2}0 r\.\n {2}1 \.b/,
  );
  const png = PNG.sync.read(readFileSync(join(out, "preview.png")));
  const colorAt = (x, y) => [
    ...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4),
  ];
  assert.deepEqual(colorAt(12, 12), [142, 72, 50, 255]);
  assert.deepEqual(colorAt(23, 23), colorAt(12, 12));
  assert.notDeepEqual(colorAt(24, 23), colorAt(12, 12));
  assert.equal(colorAt(24, 23)[3], 255);
});

test("pixel-art patches a native base without drifting offsets or accumulating between frames", (t) => {
  const { dir, out, run } = fixture(t, {
    base: "native.json",
    palette: { g: "#78934e" },
    patches: [{ x: 1, y: 1, rows: ["g"] }],
    frames: [
      { duration: 80 },
      { duration: 160, patches: [{ x: 0, y: 0, rows: ["_."] }] },
      { duration: 100, patches: [{ x: 0, y: 0, rows: [".g"] }] },
    ],
  });
  const base = {
    width: 2,
    height: 2,
    palette: ["transparent", "#9b733e"],
    pixels: [1, 1, 1, 0],
    x: -1,
    y: 4,
    footprint: [1, 1, 0, 0],
    occludes: true,
  };
  const source = join(dir, "native.json");
  writeFileSync(source, JSON.stringify(base));
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  const { frames } = JSON.parse(
    readFileSync(join(out, "animation.json"), "utf8"),
  );
  assert.deepEqual(
    frames.map((frame) => frame.duration),
    [80, 160, 100],
  );
  assert.deepEqual(
    frames.map((frame) => frame.sprite.pixels),
    [
      [1, 1, 1, 2],
      [0, 1, 1, 2],
      [1, 2, 1, 2],
    ],
  );
  for (const { sprite } of frames) {
    assert.ok(validateSprite(sprite));
    assert.deepEqual(
      [sprite.x, sprite.y, sprite.footprint, sprite.occludes],
      [-1, 4, [1, 1, 0, 0], true],
    );
  }
  const pixels = readFileSync(join(out, "pixels.txt"), "utf8");
  assert.match(pixels, /0 #9b733e/);
  assert.match(pixels, /Frame 2 \(160 ms\)\n {4}01\n {2}0 \.0/);
  assert.deepEqual(JSON.parse(readFileSync(source, "utf8")), base);
});

test("pixel-art reports invalid coordinates, timing, and colors without creating an output", (t) => {
  const base = { width: 2, height: 1, rows: [".."] };
  const cases = [
    [
      { ...base, patches: [{ x: 1, y: 0, rows: ["__"] }] },
      /patches\[0\] exceeds/,
    ],
    [{ ...base, frames: [{ duration: 0 }] }, /frames\[0\]\.duration/],
    [{ ...base, rows: ["g."] }, /rows\[0\]\[0\] has unknown palette key "g"/],
  ];
  for (const [spec, message] of cases) {
    const { out, run } = fixture(t, spec);
    const result = run();
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, message);
    assert.equal(existsSync(out), false);
  }
});

test("pixel-art protects a native input when the destination aliases its filename", (t) => {
  const { dir, run } = fixture(t, { base: "sprite.json" });
  const source = join(dir, "sprite.json");
  const base = '{"width":1,"height":1,"palette":["transparent"],"pixels":[0]}';
  writeFileSync(source, base);
  const result = run(dir);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /output would overwrite an input/);
  assert.equal(readFileSync(source, "utf8"), base);
  assert.equal(existsSync(join(dir, "preview.png")), false);
});
