// A keyboard key or controller button joins exactly one device; pointer motion,
// clicks, wheel input and analog drift never dismiss the title screen.
export function landingPadActive(pad) {
  return pad.buttons.some(button => button.pressed || button.value > .5);
}

export class LobbyLanding {
  constructor({area, available, join}) {
    Object.assign(this, {available, join});
    this.releasePads = new Set();
    this.node = document.createElement('section');
    this.node.className = 'lobby-landing';
    this.node.setAttribute('aria-label', 'Welcome to Wildbound');
    this.node.innerHTML = `<div class="landing-scene"><img src="assets/wildbound-landing-v1.png" alt="Wildbound: two explorers around an open magical board, with a lion and skeleton warriors in the jungle."><div class="landing-join" role="note" aria-label="Press a keyboard key or controller button to start Wildbound"><span>Press any key or controller button to start</span><small>Keyboard · Controller</small></div></div>`;
    area.append(this.node);
    this.lastResize=-Infinity;
    window.addEventListener('resize',()=>{this.lastResize=performance.now();});
    this.sync();
  }
  get active() { return this.available() && !document.querySelector('dialog[open]'); }
  sync() {
    const hidden = !this.available();
    this.node.hidden = hidden;
  }
  activate(device, pad) {
    if (!this.active) return false;
    const player = this.join(device, pad);
    if (!player) return false;
    if (pad) this.releasePads.add(pad.index);
    this.sync();return true;
  }
  handleKey(event) {
    if (!this.active || event.repeat || event.isComposing || (event.target.closest?.('#party-menu') && ['Enter','Space'].includes(event.code))) return false;
    if (!this.activate('keyboard')) return false;
    event.preventDefault();event.stopImmediatePropagation();return true;
  }
  waitingForRelease(pad) {
    if (!this.releasePads.has(pad.index)) return false;
    if (!landingPadActive(pad)) this.releasePads.delete(pad.index);
    return true;
  }
}
