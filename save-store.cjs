const fs = require("node:fs/promises");
const path = require("node:path");
const queues = new Map();
function validate(data, kind) {
  if (data?.version !== 1) throw Error("Unsupported save version");
  if (
    kind === "profiles" &&
    (!Array.isArray(data.heroes) ||
      data.heroes.some(
        (h) =>
          !h.id ||
          typeof h.name !== "string" ||
          !Array.isArray(h.inventory) ||
          !Array.isArray(h.chests),
      ))
  )
    throw Error("Invalid character save");
  if (
    kind === "session" &&
    (!Array.isArray(data.state?.players) ||
      data.state.players.length < 1 ||
      data.state.players.length > 6)
  )
    throw Error("Invalid expedition save");
  if(kind==="house"&&(!Array.isArray(data.library?.designs)||typeof data.library.active!=="string"))throw Error("Invalid house library");
  return data;
}
async function read(file, kind) {
  try {
    return validate(JSON.parse(await fs.readFile(file, "utf8")), kind);
  } catch (error) {
    try {
      return validate(
        JSON.parse(await fs.readFile(file + ".bak", "utf8")),
        kind,
      );
    } catch {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }
}
function write(file, data, kind) {
  validate(data, kind);
  const body = JSON.stringify(data);
  if (Buffer.byteLength(body) > 10_000_000)
    return Promise.reject(Error("Save exceeds 10 MB"));
  const task = (queues.get(file) || Promise.resolve())
    .catch(() => {})
    .then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file + ".tmp", body);
      try {
        const old = JSON.parse(await fs.readFile(file, "utf8"));
        validate(old, kind);
        await fs.copyFile(file, file + ".bak");
      } catch {}
      await fs.rename(file + ".tmp", file);
      return true;
    });
  queues.set(file, task);
  return task;
}
async function restore(file, kind) {
  await queues.get(file)?.catch(() => {});
  const data = validate(
    JSON.parse(await fs.readFile(file + ".bak", "utf8")),
    kind,
  );
  await fs.writeFile(file + ".tmp", JSON.stringify(data));
  await fs.rename(file + ".tmp", file);
  return true;
}
module.exports = { read, write, restore, validate };
