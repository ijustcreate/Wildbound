// Authored centers of the visible stone surfaces, in the original board's
// 1516 x 1038 image space. The entry stone bridges the final tile to the seal.
// Progress/event indices and the terminal seal (48) remain unchanged.
export const BOARD_LAYOUT_WIDTH=1516,BOARD_LAYOUT_HEIGHT=1038;
export const BOARD_TILE_PIXELS=Object.freeze([
 [189,203],[188,300],[202,396],[232,487],[248,578],[230,673],
 [194,765],[234,841],[344,872],[460,861],[573,832],[692,830],
 [808,853],[928,876],[1049,876],[1168,872],[1282,842],[1356,775],
 [1343,685],[1255,618],[1147,614],[1116,690],[1084,762],[1005,775],
 [892,742],[787,699],[680,668],[564,682],[454,711],[368,673],
 [333,581],[357,491],[434,426],[539,391],[602,336],[638,259],
 [722,200],[834,174],[954,170],[1071,183],[1176,217],[1253,285],
 [1243,365],[1152,402],[1050,371],[951,333],[865,362],[850,416],
].map(Object.freeze));
export const BOARD_ENTRY_TILE_PIXELS=Object.freeze([[837,388],[881,405],[866,444],[822,426]].map(Object.freeze));
export const boardImagePoint=([x,y])=>({x:x/BOARD_LAYOUT_WIDTH*280-140,y:y/BOARD_LAYOUT_HEIGHT*192-96});
