"""Open the well's shaft and trim the rope after the four-view carve."""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def refine(source: Path, output: Path) -> None:
    width, depth, height = 62, 52, 54
    strip = Image.open(source).convert('RGBA')
    if strip.size != (width * height, depth):
        raise ValueError('Expected 54 tiles of 62 × 52 pixels')

    slices = np.array(strip).reshape(depth, height, width, 4).transpose(1, 0, 2, 3)
    y, x = np.mgrid[:depth, :width]
    dx = x - (width - 1) / 2
    dy = y - (depth - 1) / 2

    # A top-view dark patch cannot describe depth. Open the shaft above
    # its dark floor and give the inside faces a subdued stone ramp.
    for z in range(25):
        layer = slices[z]
        rx, ry = 19 + z / 13, 16 + z / 15
        inside = (dx / rx)**2 + (dy / ry)**2 < 1
        interior_face = (dx / (rx + 2.0))**2 + (dy / (ry + 2.0))**2 < 1
        if z == 0:
            layer[inside, :3] = (26, 27, 23)
        else:
            layer[inside] = 0
        inner_stone = interior_face & ~inside & (layer[..., 3] != 0)
        # Reuse three quiet stone courses inside, where projections from the
        # outer elevations otherwise create vertical streaks across the shaft.
        course = min(z // 8, 2)
        values = np.array(((44, 46, 39), (54, 55, 47), (72, 71, 60)))
        light = 4 * (dx < 0) + 4 * (dy < 0) - 8 * (z in (7, 15))
        layer[inner_stone, :3] = values[course] + light[inner_stone, None]

    # The end-on elevation hides the rope behind a post. Localize that
    # narrow freestanding detail in depth without altering the crossbeam.
    for layer in slices[27:44]:
        outside_rope = (abs(dx) < 7) & (abs(dy) > 1.5)
        layer[outside_rope] = 0

    result = slices.transpose(1, 0, 2, 3).reshape(depth, width * height, 4)
    Image.fromarray(result).save(output, optimize=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    refine(args.source, args.output)
