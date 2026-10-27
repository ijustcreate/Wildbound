// A title-screen gesture joins exactly one device; it never also chooses a hero.
export function landingPadActive(pad) {
  return pad.buttons.some(button => button.pressed || button.value > .5) ||
    pad.axes.some(axis => Math.abs(axis) > .35);
}

export class LobbyLanding {
  constructor({area, available, join}) {
    Object.assign(this, {available, join});
    this.releasePads = new Set();
    this.node = document.createElement('section');
    this.node.className = 'lobby-landing';
    this.node.setAttribute('aria-label', 'Welcome to Wildbound');
    this.node.innerHTML = `<img src="assets/wildbound-landing-v1.png" alt="Wildbound: two explorers around an open magical board, with a lion and skeleton warriors in the jungle."><button class="landing-join" type="button"><span>Press anything to join</span><small>Keyboard · Mouse · Controller</small></button>`;
    area.append(this.node);
    const pointer = event => {
      if (!this.active || !this.node.contains(event.target)) return;
      if (event.type === 'pointermove' && !event.movementX && !event.movementY) return;
      if (!this.activate('keyboard')) return;
      this.swallowClickUntil = event.type === 'pointerdown' ? performance.now() + 1000 : 0;
      event.preventDefault();event.stopImmediatePropagation();
    };
    for (const type of ['pointerdown', 'pointermove', 'wheel']) area.addEventListener(type, pointer, {capture:true, passive:false});
    area.addEventListener('click', event => {
      if (performance.now() < this.swallowClickUntil) {
        this.swallowClickUntil = 0;event.preventDefault();event.stopImmediatePropagation();
      } else if (this.active && this.node.contains(event.target)) {
        this.activate('keyboard');event.preventDefault();event.stopImmediatePropagation();
      }
    }, true);
    this.sync();
  }
  get active() { return this.available() && !document.querySelector('dialog[open]'); }
  sync() {
    const hidden = !this.available(), entering = this.node.hidden && !hidden;
    this.node.hidden = hidden;
    if (entering) this.node.querySelector('button').focus({preventScroll:true});
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
