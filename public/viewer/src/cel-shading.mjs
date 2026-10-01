// One reusable GPU pass for both the expedition and the playable lobby.
const KEY = 'wildbound-cel-shading';
let enabled = false;
try { enabled = globalThis.localStorage?.getItem(KEY) === 'on'; } catch {}
let renderer = null;
let unavailable = false;
export const celShadingEnabled = () => enabled;
export function setCelShading(value) {
  enabled = !!value;
  try { globalThis.localStorage?.setItem(KEY, enabled ? 'on' : 'off'); } catch {}
  return enabled;
}

const vertex = `attribute vec2 position;
varying vec2 uv;
void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `precision mediump float;
uniform sampler2D scene;
uniform vec2 texel;
varying vec2 uv;
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
void main(){
  vec3 c=texture2D(scene,uv).rgb;
  vec3 nw=texture2D(scene,uv+vec2(-1.,-1.)*texel).rgb;
  vec3 ne=texture2D(scene,uv+vec2(1.,-1.)*texel).rgb;
  vec3 sw=texture2D(scene,uv+vec2(-1.,1.)*texel).rgb;
  vec3 se=texture2D(scene,uv+vec2(1.,1.)*texel).rgb;
  float m=luma(c),a=luma(nw),b=luma(ne),d=luma(sw),e=luma(se);
  float lo=min(m,min(min(a,b),min(d,e)));
  float hi=max(m,max(max(a,b),max(d,e)));
  // Estimate the edge tangent; integrate along it instead of blurring across it.
  vec2 direction=vec2(-((a+b)-(d+e)),(a+d)-(b+e));
  float reduction=max((a+b+d+e)*.03125,.0078125);
  direction=clamp(direction/(min(abs(direction.x),abs(direction.y))+reduction),-4.,4.)*texel;
  vec3 inner=.5*(texture2D(scene,uv-direction/6.).rgb+texture2D(scene,uv+direction/6.).rgb);
  vec3 outer=inner*.5+.25*(texture2D(scene,uv-direction*.5).rgb+texture2D(scene,uv+direction*.5).rgb);
  float ol=luma(outer);
  vec3 edge=(ol<lo||ol>hi)?inner:outer;
  c=mix(c,edge,smoothstep(.025,.10,hi-lo));
  // Eight luminance bands preserve hue. Soft band boundaries avoid flicker.
  float light=luma(c),scaled=light*8.;
  float band=(floor(scaled)+smoothstep(.30,.70,fract(scaled)))/8.;
  c*=mix(1.,band/max(light,.015),.55);
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
}`;

function createRenderer() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, depth:false, stencil:false});
  if (!gl) throw Error('WebGL unavailable');
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); unavailable = true;
  });
  canvas.addEventListener('webglcontextrestored', () => { renderer = null; unavailable = false; });
  const program = gl.createProgram();
  for (const [type, source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader); gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
  for (const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
  for (const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.uniform1i(gl.getUniformLocation(program,'scene'),0);
  return {canvas,gl,texel:gl.getUniformLocation(program,'texel'),width:0,height:0};
}

export function applyCelShading(ctx) {
  if (!enabled || unavailable) return false;
  try {
    renderer ||= createRenderer();
    const r=renderer, gl=r.gl, source=ctx.canvas;
    // Cap shader work at 1080p; the existing scene retains its normal resolution.
    const scale=Math.min(1,1920/source.width,1080/source.height);
    const width=Math.max(1,Math.round(source.width*scale)),height=Math.max(1,Math.round(source.height*scale));
    if (r.canvas.width!==width || r.canvas.height!==height) {r.canvas.width=width;r.canvas.height=height;}
    gl.viewport(0,0,width,height);
    if(r.width!==source.width || r.height!==source.height){
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      r.width=source.width;r.height=source.height;
    } else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);
    gl.uniform2f(r.texel,1.5/source.width,1.5/source.height);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    ctx.save();
    ctx.resetTransform(); ctx.globalAlpha=1; ctx.globalCompositeOperation='copy';
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(r.canvas,0,0,source.width,source.height);
    ctx.restore();
    return true;
  } catch (error) {
    unavailable=true;
    console.warn('Cel shading unavailable; keeping the original renderer.',error);
    return false;
  }
}
