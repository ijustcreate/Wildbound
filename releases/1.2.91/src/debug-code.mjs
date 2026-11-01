export const DEBUG_CODE = [
  "up",
  "down",
  "left",
  "right",
  "a",
  "b",
  "select",
  "start",
];

export function createPauseCheatTracker() {
  let presses=0;
  return {
    reset(){presses=0;},
    press(active){
      if(!active){presses=0;return false;}
      if(++presses<10)return false;
      presses=0;return true;
    },
  };
}

export function createDebugCodeTracker({ now = () => performance.now(), timeout = 3500 } = {}) {
  const sequence = [];
  let sequenceAt = 0;
  return function feedDebugCode(token) {
    const time = now();
    if (time - sequenceAt > timeout) sequence.length = 0;
    sequenceAt = time;
    sequence.push(token);
    while (sequence.length > DEBUG_CODE.length) sequence.shift();
    if (
      sequence.length === DEBUG_CODE.length &&
      sequence.every((value, index) => value === DEBUG_CODE[index])
    ) {
      sequence.length = 0;
      return true;
    }
    return false;
  };
}
