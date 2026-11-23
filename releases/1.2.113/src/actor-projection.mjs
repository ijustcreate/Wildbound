// Low-level art math must not initialize the complete player/creature rig graph.
// Keep these calculations identical to the public player-motion helpers.
export function facingIndex(x=0,y=1){return ((Math.round(Math.atan2(-x,y)/(Math.PI/4))%8)+8)%8;}
export function projectPoint(p,direction){const a=direction*Math.PI/4,c=Math.cos(a),s=Math.sin(a);return {x:p[0]*c-p[1]*s,y:(p[0]*s+p[1]*c)*.5-p[2],depth:p[0]*s+p[1]*c};}
