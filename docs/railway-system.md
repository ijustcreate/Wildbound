# Dev railway

The railway is a developer destination. It does not appear in the ordinary map chooser or change the current expedition. Join an explorer, open Pause / Camp Settings, open the developer cheat menu, and choose **Test train level**. Close the menus and resume. Choose **Return from train test** to restore the original explorers and expedition clock.

## Playing

- Keyboard: WASD / arrows move, **J** jumps, **E** interacts, **F** / attack sounds the moving whistle.
- Controller: normal game movement, jump, interact and attack actions. Prompts describe actions so existing controller mappings apply.
- Spawn is outside a coach. Jump beside a raised side door at either carriage end and interact while airborne. Walking into a carriage does not board it.
- Interact near a bench to sit. Interact or jump to stand. A seat belongs to one explorer at a time.
- Compartment doors open or close with interact; occupied doorways cannot close.
- Use the central end gangways to cross between carriages. Walk around the tender's coal pile to reach the locomotive cab.
- Interact at the brass cab console to start or stop the engine. Up/down adjusts throttle while operating it. Attack whistles once the train moves. Jump releases the controls while holding the steam setting. One explorer operates the controls at a time.
- To exit, approach a side footboard at a carriage end and interact. Players jump down from the train, including while it moves.
- The river supports swimming. Swim into a bridge from the river to pass below its deck, rails and moving train. Walking onto the bridge from its bank follows the deck. Swimmers stay at river height and cannot jump/board through the bridge floor.
- Each occupied carriage fades its roof independently. All riders retain their local position while their carriage follows the route.

## Editing

Open **Train / track workshop** from the dev menu, or choose **Railway · dev test** from the House / Location editor picker.

- **Track:** move snapped control points, insert points on a curve, remove points, edit X/Y/elevation, rename routes and add passing loops. Curves are generated automatically. River crossings gain decks, piers and approach ramps. Save rejects missing links, tight curves, excessive grades and routes too short for the complete train.
- **Scenery:** place, move, resize or erase native trees, bushes and rocks.
- **Interiors:** move, resize, duplicate, add or remove seats, walls, doors, tables, console, firebox and lamps. Seat direction and initial door state are editable. The same objects define rendering and collisions. Keep at least 16 pixels for aisles and leave gangways open.
- **Eight views:** inspect each of the four vehicles with its exterior roof or an interior cutaway.
- **Pixel parts:** edit chassis, wheels, body, furniture, machinery, trim and roof separately in all eight directions. Native geometry remains the baseline; custom pixels take precedence for the edited part/direction. Spokes and piston motion remain live over painted wheels. Restoring a part removes only that override. Editing a furniture silhouette does not change its collision; edit that object in Interiors too.
- **Train setup:** map bounds, river, maximum speed, acceleration, brakes, gauge, parked route distance, carriage sizes and palette.

Undo/redo spans design edits. Drafts recover automatically in this profile. Save & use validates and activates the visible railway, parks the train and places test explorers outside. Save as new preserves the existing saved version. Import/export includes tracks, scenery, interiors and compressed eight-view artwork. These local designs are not automatically shared by Git.

To use a passing loop during play, set **Next train route at shared junction** in the dev menu. The next shared junction changes the engine's itinerary; trailing carriages follow the recorded previous path until they cross it. This is one train on a closed itinerary, with selectable shared branches. It is not a railway dispatch/signalling simulation.

## Native artwork contract

The reference direction is a scarlet British steam train homage: black smokebox, warm brass bands/pipes, slate cab and coach roofs, cream lining, timber benches and red compartment upholstery. Engine length 250, separate coal tender 112, coaches 320; widths 96–100 game pixels, beside the regular 43-pixel actor and 52-pixel rail gauge. Each view reprojects the same articulated volumes with direction-dependent visible faces. Overall shapes and broad shade groups carry the material; details concentrate on boiler bands, windows, upholstery and mechanisms.

Compass views: South, Southwest, West, Northwest, North, Northeast, East, Southeast. The train can also turn continuously between these views. Pixel overrides select the nearest compass view. Parts share a 560 × 300 registration canvas with origin (280,210). Artwork is saved per vehicle kind, part and direction.

`train_sit` is a normal editable clip on the existing player skeleton. Its bent thighs/shins use existing limb lengths. Missing clips are added; existing custom train_sit clips are retained.

## Runtime and scope

- `train-design.mjs`: validated design, local library/drafts and compressed artwork.
- `train-track.mjs`: graph itineraries, spline samples, arc length, elevation, closest-point queries and train bogie alignment.
- `train-test.mjs`: isolated dev session, interactions, collision, motion, junction history and effects.
- `train-art.mjs` / `train-world-art.mjs`: articulated vehicle parts and world rendering.
- `train-editor.mjs`: editor authoring and previews.
- `train-clips.mjs`: editable seated pose keys.
- `train-audio.mjs`: locally synthesized chuff, clack, brake hiss, doors and moving whistle through the live game SFX mixer. No external sound recordings.

The default world is 6400 × 4400. Further map travel is an eventual integration point; this test destination does not transport an expedition between regular maps. Online replication, railway AI/signals, physical controller hardware and user playtesting are not verified by the local automated checks.
