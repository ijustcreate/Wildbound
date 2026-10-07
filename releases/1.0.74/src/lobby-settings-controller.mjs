// Reserve Start/+ for settings on menu screens, including a delayed desktop claim.
// Opening/closing consumes the whole press until the controller returns to neutral.
export function createLobbySettingsControllerRouter() {
  const held = new Set();
  return {
    route({ pad, previous = [], screen, dialog, pendingOpen = false }) {
      const key = `${pad.index}|${pad.id || 'unknown'}|${pad.mapping || ''}`;
      const device = `pad:${pad.index}`;
      const start = !!pad.buttons[9]?.pressed;
      const startEdge = start && !previous[9];
      const engaged = pad.buttons.some(button => button.pressed) ||
        pad.axes.some(axis => Math.abs(axis) > .35);
      if (held.has(key)) {
        if (engaged) return 'consume';
        held.delete(key);
      }
      if (dialog?.id === 'settings-dialog') {
        // A Done/back press or an ignored second controller must not reach the
        // lobby underneath after the owner closes the shared modal.
        if (engaged) held.add(key);
        if (dialog.dataset.ownerDevice !== device) return 'consume';
        if (startEdge) {
          return 'close';
        }
        return start ? 'consume' : 'navigate';
      }
      if (dialog || !['home', 'lobby'].includes(screen)) return null;
      if (startEdge || pendingOpen) {
        held.add(key);
        return 'open';
      }
      return start ? 'consume' : null;
    },
    release(key) { held.delete(key); },
  };
}
