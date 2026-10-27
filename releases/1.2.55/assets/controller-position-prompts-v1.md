# Universal controller position prompts

Generated using the built-in image-generation tool from the user's D-pad and face-button position concept. PNG: `controller-position-prompts-v1.png`.

Layout: four columns, two rows. Columns: up, down, left, right. Top row: D-pad. Bottom row: face buttons. The highlighted position communicates the physical button, not Xbox/Nintendo lettering. This atlas is not yet wired into the runtime.

Quality note: generated transparency retains some rough/fringed edges, particularly between face-button circles. Treat as a candidate rather than a pixel-perfect production atlas. No letter-to-position remapping has been changed.

## Final generation prompt

Create a professional clean game UI sprite atlas, eight universal controller prompts. Flat vector-like raster iconography, extremely crisp smooth edges and absolutely no grain or texture. 4 columns x 2 rows with identical evenly spaced square cells. Row one: D-pad cross icons, with UP then DOWN then LEFT then RIGHT highlighted. Row two: diamond clusters of four circular face buttons, with TOP then BOTTOM then LEFT then RIGHT highlighted. Each cluster has four separated buttons. Use opaque deep charcoal (#18252f) bodies with single smooth thick ivory outlines; inactive buttons have solid charcoal centers, active button has solid ivory center. Keep all dark button interiors OPAQUE, not transparent. Only the empty space outside the clusters is transparent. This is important: opaque dark interiors prevent transparency keying from damaging the shapes. No shadows, no distressed effect, no glow, no text, no letters, no branding, no decorative objects, no checkerboard. Every cluster is a simple geometric diagram, equal sized and precisely aligned. One highlighted button in each cluster, exactly eight total clusters. Intended for 32-pixel UI prompts, so sturdy simple strokes. Transparent PNG sprite sheet.
