import { paintForestCanopy } from './forest-canopy-art.mjs';

export const MAPLE_BARK = {
  shadow: '#3f352e', bark: '#6a4c36', highlight: '#bd8b59', rings: '#815c40', root: '#78553c',
};

const autumn = ['#57412e', '#744830', '#965433', '#b87039', '#d18b42', '#e6a74d', '#f6c36a'];
const summer = ['#344c37', '#405536', '#52633a', '#697e40', '#819448', '#a4ad55', '#c6c86d'];

export function paintMapleFoliageCluster(ctx, x, y, radiusX, radiusY, seed, shadeIndex, season = 'autumn') {
  paintForestCanopy(ctx, x, y, radiusX, radiusY, season === 'summer' ? summer : autumn, seed * 91 + shadeIndex * 7.3, {
    exposure: [-0.18, -0.23, 0.16, 0.27, 0.38, -0.03][shadeIndex],
  });
}
