// Oblique ground plane with upright height, shared by shell and cabin.
export function carProject(v,x,y,z=0){const a=v.heading||0,c=Math.cos(a),s=Math.sin(a);return {x:v.x+c*x-s*y,y:v.y+(s*x+c*y)*.72-z};}
