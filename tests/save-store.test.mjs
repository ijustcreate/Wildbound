import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import store from "../save-store.cjs";
test("Queued saves retain newest data and recover valid backup from corruption", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "wildbound-save-"));
  const file = path.join(dir, "profile.json");
  try {
    const a = { version: 1, heroes: [], sharedStash: [] },
      b = { ...a, sharedStash: [{ type: "fruit", qty: 2 }] };
    await Promise.all([
      store.write(file, a, "profiles"),
      store.write(file, b, "profiles"),
    ]);
    assert.deepEqual(await store.read(file, "profiles"), b);
    await fs.writeFile(file, "invalid");
    assert.deepEqual(await store.read(file, "profiles"), a);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
