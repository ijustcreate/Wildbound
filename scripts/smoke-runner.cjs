const fs = require("node:fs"),
  path = require("node:path");
module.exports = async ({ window, testOutput, app }) => {
  try {
    await window.webContents.executeJavaScript("window.wildboundBoot.ready");
    const result = await window.webContents.executeJavaScript(
      "window.runSmokeTests().catch(e=>({failed:1,error:e.stack,results:[]}))",
    );
    const field = await window.webContents.executeJavaScript(
      "window.runFieldSmokeTests()",
    );
    result.results.push(...field.results);
    result.failed += field.failed;
    const fieldArt = await window.webContents.executeJavaScript(
      "window.fieldContactSheet()",
    );
    fs.mkdirSync(testOutput, { recursive: true });
    fs.writeFileSync(
      path.join(testOutput, "field-outfits.png"),
      Buffer.from(fieldArt.split(",")[1], "base64"),
    );
    fs.writeFileSync(
      path.join(testOutput, "results.json"),
      JSON.stringify(result, null, 2),
    );
    const creaturePreview = await window.webContents.executeJavaScript(
      "window.creatureRevisionPreview()",
    );
    fs.writeFileSync(
      path.join(testOutput, "dragon-fire-preview.png"),
      Buffer.from(creaturePreview.split(",")[1], "base64"),
    );
    const poses = await window.webContents.executeJavaScript(
      "window.animationContactSheet()",
    );
    const playerPoses = await window.webContents.executeJavaScript(
      "window.playerContactSheet()",
    );
    const charmPoses = await window.webContents.executeJavaScript(
      'window.playerContactSheet("player", {head:"charm"})',
    );
    fs.writeFileSync(
      path.join(testOutput, "amber-charm-eight-directions.png"),
      Buffer.from(charmPoses.split(",")[1], "base64"),
    );
    const lionPoses = await window.webContents.executeJavaScript(
      'window.playerContactSheet("lion")',
    );
    for (const kind of [
      "dragon",
      "fire_elemental",
      "bat",
      "snake",
      "monkey",
      "vine",
      "golem",
      "trap",
      "rhino",
      "panther",
      "boar",
      "beetle",
      "crocodile",
      "skeleton",
      "archer",
      "skeleton_unarmed",
      "skeleton_boss",
    ]) {
      const sheet = await window.webContents.executeJavaScript(
        "window.playerContactSheet(" + JSON.stringify(kind) + ")",
      );
      fs.writeFileSync(
        path.join(testOutput, kind + "-eight-directions.png"),
        Buffer.from(sheet.split(",")[1], "base64"),
      );
    }
    fs.writeFileSync(
      path.join(testOutput, "lion-eight-directions.png"),
      Buffer.from(lionPoses.split(",")[1], "base64"),
    );
    fs.writeFileSync(
      path.join(testOutput, "player-eight-directions.png"),
      Buffer.from(playerPoses.split(",")[1], "base64"),
    );
    fs.writeFileSync(
      path.join(testOutput, "animation-poses.png"),
      Buffer.from(poses.split(",")[1], "base64"),
    );
    for (const view of [
      "home",
      "lobby",
      "workshop",
      "crop",
      "footprint",
      "occlusion",
      "game",
      "event-text",
      "music-settings",
      "environment",
      "opening-board",
      "loot",
      "storage",
      "storage-chest",
      "magic-gear",
      "robot-shop",
      "vending-shop",
      "inventory",
      "bat-studio",
      "snake-studio",
      "monkey-studio",
      "vine-studio",
      "golem-studio",
      "trap-studio",
      "rhino-studio",
      "panther-studio",
      "boar-studio",
      "beetle-studio",
      "crocodile-studio",
      "skeleton-studio",
      "studio",
      "graph-editor",
      "lion-studio",
      "events",
      "sealing",
      "ending",
      "regrowth",
    ]) {
      await window.webContents.executeJavaScript(`window.showcase('${view}')`);
      const shot = await window.webContents.capturePage();
      fs.writeFileSync(path.join(testOutput, view + ".png"), shot.toPNG());
    }
    console.log(JSON.stringify(result));
    app.exit(result.failed ? 1 : 0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
};
