"""Pack Greyhaven's drawbridge orthographics into a runtime sprite stack."""

import argparse
import importlib.util
from pathlib import Path

import numpy as np
from PIL import Image


WIDTH, DEPTH, LAYERS = 80, 81, 9


def normalized_views(source):
    image = Image.open(source).convert('RGBA')
    dimensions = ((WIDTH, DEPTH), (DEPTH, LAYERS), (WIDTH, LAYERS), (WIDTH, LAYERS))
    parts = []
    for index, size in enumerate(dimensions):
        left, right = (image.width * column // 4 for column in (index, index + 1))
        pixels = np.asarray(image.crop((left, 0, right, image.height))).copy()
        rgb = pixels[..., :3]
        background = (rgb.min(axis=2) > 217) & (np.ptp(rgb, axis=2) < 35)
        pixels[background] = 0
        part = Image.fromarray(pixels)
        frame = part.getchannel('A').getbbox()
        if not frame:
            raise ValueError(f'Missing orthographic view {index + 1}')
        parts.append(np.array(part.crop(frame).resize(size, Image.Resampling.NEAREST)))
    return parts


def build(source, slicer_file, out):
    spec = importlib.util.spec_from_file_location('views_to_slices', slicer_file)
    slicer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(slicer)

    # The thin orthographic edges are too small for the CLI's automatic
    # panel detection. Register each view explicitly before the same carve.
    top, left, front, back = slicer.one_palette(normalized_views(source), 26)
    stack = slicer.carve(top, left[:, ::-1], front, back[:, ::-1], shade=0.12)
    if not np.all(np.any(stack[..., 3], axis=(1, 2))):
        raise ValueError('The drawbridge carve contains an empty layer')

    # The bottom face is visible from the approach as the span rises.
    # Give it a darker plank ramp and two cross braces under the deck.
    base = stack[0]
    base[..., :3] = np.where(base[..., 3, None] > 0, top[..., :3] * 0.73, 0)
    for y in (17, 61):
        brace = base[y:y + 5, 7:-7]
        visible = brace[..., 3] > 0
        brace[..., :3][visible] = (68, 55, 44)
        brace[0, :, :3][visible[0]] = (91, 73, 57)

    pixels = stack.transpose(1, 0, 2, 3).reshape(DEPTH, WIDTH * LAYERS, 4)
    out.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(pixels).save(out, optimize=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sheet', type=Path)
    parser.add_argument('upstream_slicer', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    build(args.sheet, args.upstream_slicer, args.output)
