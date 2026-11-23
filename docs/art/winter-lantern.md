# Ice lodge lantern

The lantern on the northwest route from the opening clearing uses a six-pose amber flame. Its stepped snow cap, dark iron post and copper cage follow the nearby lodge and the existing winter lamps. The flame moves inside the glass while the snow, post and ground contact share one anchored silhouette. The sprite is 25 × 65 logical pixels with its origin at `(-11, -62)` relative to the old ground contact. The flame timing varies over the 710 ms loop.

To find it, open the lobby Map table and choose **Classic → Ice** with **Boundless World** off. Accept, then ready up at the Gameboard. Head northwest from the opening clearing toward the lodge. The animated lantern is `winter:lantern:0` at `(650, 700)` and the next lamp to the east provides a static comparison.

Edit [winter-lantern.pixel.json](winter-lantern.pixel.json) and run the following from the repo root to refresh the contact sheet, pixel text and runtime data. The game reads the resulting [frame module](../../src/winter-lantern-frames.mjs) directly.

```powershell
node scripts/pixel-art.mjs docs/art/winter-lantern.pixel.json --out test-output/winter-lantern
@'
import { readFileSync, writeFileSync } from "node:fs";
const { frames } = JSON.parse(readFileSync("test-output/winter-lantern/animation.json", "utf8"));
const rows = frames.map(frame => `  ${JSON.stringify(frame)},`).join("\n");
writeFileSync("src/winter-lantern-frames.mjs", `// Generated from docs/art/winter-lantern.pixel.json using scripts/pixel-art.mjs.\nexport default [\n${rows}\n];\n`);
'@ | node --input-type=module
```
