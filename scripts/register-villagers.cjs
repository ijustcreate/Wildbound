const fs = require("node:fs"),
  path = require("node:path"),
  { pathToFileURL } = require("node:url"),
  crypto = require("node:crypto");
(async () => {
  const root = path.resolve(__dirname, ".."),
    { defaultVillagerMotion } = await import(
      pathToFileURL(path.join(root, "src/villager-motion.mjs"))
    ),
    file = path.join(root, "authored/rigs.json"),
    raw = fs.readFileSync(file, "utf8"),
    before = JSON.parse(raw);
  if (before.villager) {
    console.log("Preserved existing authored villager.");
    return;
  }
  const end = raw.lastIndexOf("}"),
    next =
      raw.slice(0, end).trimEnd() +
      ',\n  "villager": ' +
      JSON.stringify(defaultVillagerMotion()) +
      "\n" +
      raw.slice(end),
    after = JSON.parse(next),
    hash = (v) =>
      crypto.createHash("sha256").update(JSON.stringify(v)).digest("hex");
  for (const [k, v] of Object.entries(before))
    if (hash(v) !== hash(after[k])) throw Error("Existing rig changed " + k);
  fs.writeFileSync(file, next);
  console.log("Added villager; all existing entries preserved.");
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
