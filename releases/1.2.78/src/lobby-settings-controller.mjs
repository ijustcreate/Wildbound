// Reserve Start/+ for settings on menu screens, including a delayed desktop claim.
// Opening/closing consumes the whole press until the controller returns to neutral.
export function createLobbySettingsControllerRouter() {
  const held = new Set();
  const closingPress = new Set();
  return {
    route({ pad, previous = [], screen, dialog, pendingOpen = false, explorerSelected = false }) {
      const key = `${pad.index}|${pad.id || 'unknown'}|${pad.mapping || ''}`;
      const device = `pad:${pad.index}`;
      const start = !!pad.buttons[9]?.pressed;
      const startEdge = start && !previous[9];
      const engaged = pad.buttons.some(button => button.pressed) ||
        pad.axes.slice(0,2).some(axis => Math.abs(axis) > .65);
      if(closingPress.has(key)){
        if(!engaged)closingPress.delete(key);
        else if(dialog?.id!=='settings-dialog')return 'consume';
      }
      if (held.has(key)) {
        if (engaged) return 'consume';
        held.delete(key);
      }
      if (dialog?.id === 'settings-dialog') {
        // A Done/back press or an ignored second controller must not reach the
        // lobby underneath after the owner closes the shared modal.
        if (dialog.dataset.ownerDevice !== device) {if(engaged)held.add(key);return 'consume';}
        if (startEdge) {
          held.add(key);
          return 'close';
        }
        // Only a press that can close this menu needs a release barrier.
        // Ordinary stick/D-pad navigation must not swallow confirm or tabs.
        if([0,1].some(i=>pad.buttons[i]?.pressed&&!previous[i]))closingPress.add(key);
        return start ? 'consume' : 'navigate';
      }
      if (dialog || !['home', 'lobby'].includes(screen)) return null;
      // Once playing in the lobby, the right menu button belongs to Pause.
      if(screen==='lobby'&&explorerSelected)return null;
      if (startEdge || pendingOpen) {
        held.add(key);
        return 'open';
      }
      return start ? 'consume' : null;
    },
    release(key) { held.delete(key);closingPress.delete(key); },
  };
}
