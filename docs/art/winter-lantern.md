# Ice lodge lantern

The lantern on the northwest route from the opening clearing uses a six-pose amber flame. Its stepped snow cap, dark iron post and copper cage follow the nearby lodge and the existing winter lamps. The flame moves inside the glass while the snow, post and ground contact share one anchored silhouette. The sprite is 25 × 65 logical pixels with its origin at `(-11, -62)` relative to the old ground contact. The flame timing varies over the 710 ms loop.

To find it, open the lobby Map table and choose **Classic → Ice** with **Boundless World** off. Accept, then ready up at the Gameboard. Head northwest from the opening clearing toward the lodge. The animated lantern is `winter:lantern:0` at `(650, 700)` and the next lamp to the east provides a static comparison.

Edit [the lantern recipe](../../assets/pixel-recipes/winter-lantern.pixel.json) to change the art or its timing. The [winter renderer](../../src/winter-night.mjs) compiles that same JSON when the game loads. Run this from the repository root to generate a contact sheet and inspect pixel coordinates before launching.

```powershell
node scripts/pixel-art.mjs assets/pixel-recipes/winter-lantern.pixel.json --out test-output/winter-lantern
```
