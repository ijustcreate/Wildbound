export function snapshot(g) {
  const omit = new Set([
    "random",
    "saving",
    "saveError",
    "controlLabels",
    "uiRevision",
    "fieldRevision",
    "onSound",
    "persist",
    "spriteLibrary",
    "explored",
    "forestLandscape",
    "boundlessLoadedChunks",
  ]);
  return {
    ...Object.fromEntries(
      Object.entries(g).filter(
        ([key, value]) => !omit.has(key) && typeof value !== "function",
      ),
    ),
    explored: [...g.explored],
  };
}
export function cleanInput(input) {
  const out = {};
  const aimX = Number.isFinite(input?.aimX) ? input.aimX : 0;
  const aimY = Number.isFinite(input?.aimY) ? input.aimY : 0;
  const aimLength = Math.max(1, Math.hypot(aimX, aimY));
  for (const [key, v] of Object.entries(input || {})) {
    if (key === 'aimX' || key === 'aimY') out[key] = (key === 'aimX' ? aimX : aimY) / aimLength;
    else if (["x", "y"].includes(key))
      out[key] = Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0;
    else if (
      [
        "attack",
        "summon",
        "dodge",
        "jump",
        "loot",
        "trap",
        "interact",
        "potion",
        "block",
        "inventory",
        "portal",
        "bait",
        "next",
        "prev",
        "up",
        "down",
        "panel",
        "use",
        "store",
        "offhand",
        "sockets",
        "salvage",
        "drop",
        "dropOne",
        "split",
        "pick",
        "close",
      ].includes(key)
    )
      out[key] = !!v;
  }
  return out;
}
export class Rooms {
  constructor(onEvent) {
    this.role = null;
    this.inputs = {};
    this.peer = null;
    this.age = 0;
    this.persistent = false;
    this.connection = 'offline';
    this.requests = new Map();this.nextRequest=1;
    this.localDevice='keyboard';
    window.desktop?.onRoom((data) => onEvent(data));
    window.desktop?.onServer?.(data => onEvent(data));
  }
  send(data) {
    if (this.persistent) window.desktop?.sendServer(data);
    else window.desktop?.sendRoom(data);
  }
  async host() {
    await this.stop();
    const result = await window.desktop.hostRoom();
    this.role = "host";
    return result.address;
  }
  async join(address, name) {
    await this.stop();
    this.role = "client";
    try {
      await window.desktop.joinRoom(address, name);
    } catch (e) {
      this.role = null;
      throw e;
    }
  }
  async joinServer(address,name,joinToken,resumeToken,candidates) {
    await this.stop();
    this.role='client';this.persistent=true;this.peer=null;
    try {return await window.desktop.connectServer(address,name,joinToken,resumeToken,candidates);}
    catch(error){this.role=null;this.persistent=false;this.connection='offline';throw error;}
  }
  async stop() {
    for(const request of this.requests.values()){clearTimeout(request.timer);request.reject(Error('Server disconnected.'));}
    this.requests.clear();
    this.role=null;this.persistent=false;this.peer=null;this.playerId=null;this.inputs={};this.age=0;this.connection='offline';
    await window.desktop?.stopRoom?.();
    await window.desktop?.disconnectServer?.();
  }
  requestAction(action,arg) {
    if(this.connection!=='connected')return Promise.reject(Error('Wait for the server to reconnect.'));
    const requestId=this.nextRequest++;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.requests.delete(requestId);reject(Error('The server did not confirm this action.'));},10000);
      this.requests.set(requestId,{resolve,reject,timer});
      this.send({type:'action',action,...(arg!==undefined?{arg}:{}),requestId});
    });
  }
  acknowledge(data) {
    const request=this.requests.get(data.requestId);
    if(request){clearTimeout(request.timer);this.requests.delete(data.requestId);request.resolve(data.message);}
  }
  tick(g, dt, inputs) {
    if (this.role === "host") {
      this.age += dt;
      if (this.age > 0.1) {
        this.send({ type: "state", state: snapshot(g) });
        this.age = 0;
      }
      return { ...inputs, ...this.inputs };
    }
    if (this.role === "client") {
      this.age += dt;
      if (this.persistent && (this.connection !== 'connected' || this.age < .05)) return {};
      const padInput =
        Object.entries(inputs).find(
          ([k, v]) =>
            k.startsWith("pad:") &&
            (v.x || v.y || v.attack || v.interact || v.inventory || v.portal),
        );
      const keyboardActive=Object.values(inputs.keyboard||{}).some(value=>value===true||(typeof value==='number'&&value!==0));
      if(padInput)this.localDevice=padInput[0];
      else if(keyboardActive)this.localDevice='keyboard';
      const local=inputs[this.localDevice]||inputs.keyboard;
      this.send({ type: "input", input: cleanInput(local || {}) });
      this.age = 0;
      return {};
    }
    return inputs;
  }
}
