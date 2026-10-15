// Insert only the new subject. Existing authored rigs and edits are preserved.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
(async () => {
  const { default: model } = await import(
      pathToFileURL(path.join(root, "src/dreadmane-lion-data.mjs"))
    ),
    file = path.join(root, "authored/rigs.json"),
    raw = fs.readFileSync(file, "utf8"),
    before = JSON.parse(raw);
  if (before.dreadmane_lion) {
    console.log(
      "Dreadmane Lion already registered; preserved authored version.",
    );
    return;
  }
  const hash = (value) =>
      crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"),
    hashes = Object.fromEntries(
      Object.entries(before).map(([key, value]) => [key, hash(value)]),
    ),
    end = raw.lastIndexOf("}");
  const next =
      raw.slice(0, end).trimEnd() +
      ",\n  " +
      JSON.stringify("dreadmane_lion") +
      ": " +
      JSON.stringify(model) +
      "\n" +
      raw.slice(end),
    after = JSON.parse(next);
  for (const [key, sha] of Object.entries(hashes))
    if (hash(after[key]) !== sha)
      throw Error("Existing subject changed: " + key);
  fs.writeFileSync(file, next);
  const output = path.join(root, "test-output/dreadmane-lion");
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, "preserved-rigs.json"),
    JSON.stringify(
      { unchangedKeys: Object.keys(hashes), wolfSha256: hashes.wolf },
      null,
      2,
    ),
  );
  console.log("Added dreadmane_lion; all existing subjects unchanged.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
