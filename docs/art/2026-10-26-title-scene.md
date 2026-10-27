# Wildbound title scene v1

Status: implemented for user review; no replacement of gameplay character rigs.

Asset: assets/wildbound-landing-v1.png (1672 × 941, approximately 2.5 MB).
Method: built-in image_gen tool, opaque background, new illustration. Original generation retained in the Codex generated_images directory. The selected project copy is self-contained.

Production prompt:
Create a polished landscape 16:9 pixel-art title scene for the original indie game WILDBOUND. Use coherent chunky pixel clusters and crisp edges, broad shadow/highlight masses, warm dark outlines and a restrained dark teal, moss green, warm gold and ivory palette. Two friendly fantasy explorers face each other around an open hinged wooden jungle board with ivory winding paths around a turquoise portal: an auburn-haired ranger in green on the left and a dark-haired explorer in an ochre coat on the right. Behind them, a golden lion with a broad dark mane on the left and expressive ivory skeleton warriors with rusty swords on the right emerge among jungle trees and moonlit ruins. Place a large readable gold/ivory WILDBOUND logo across the upper quarter. Keep the bottom 15% quiet and dark for separate interactive UI. Keep primary subjects in the central 70% width. Do not paint buttons, prompts or extra text; do not make a sprite sheet or UI mockup. Avoid painterly blur, photographic texture and noisy dithering.

The interactive prompt is real HTML over the artwork. Keyboard, mouse and gamepad input are handled by lobby-landing.mjs; no game logic is embedded in the bitmap. Tall windows use contain to retain the full logo and characters. Standard widescreen uses cover. Screenshots at 1920×1080, 1440×900, 800×600 and 640×420 are in test-output/lobby-entry/. This task does not change or approve a new gameplay art family.
