// One drain promise covers every snapshot requested while a write is active.
// Keep runtime status outside game snapshots so saving cannot dirty itself.
export function createSaveCoordinator(write, { onChange = () => {}, now = Date.now } = {}) {
  const state = { saving: false, error: null, requested: 0, committed: 0, savedAt: null };
  let pending = null, task = null, committedBody = null, invalidRevision = 0;
  const publish = () => onChange({ ...state });
  function fail(error) {
    invalidRevision=++state.requested;
    state.error=error?.message||String(error);
    publish();return Promise.reject(error);
  }
  function save(data) {
    let body;
    try { body = JSON.stringify(data); }
    catch (error) { return fail(error); }
    if (!task && body === committedBody && !state.error) return Promise.resolve();
    pending = { body, data: JSON.parse(body), revision: ++state.requested };
    state.saving = true;
    publish();
    if (task) return task;
    task = Promise.resolve().then(async () => {
      let failure = null;
      while (pending) {
        const next = pending;
        pending = null;
        try {
          await write(next.data);
          committedBody = next.body;
          state.committed = next.revision;
          state.savedAt = now();
          if(next.revision>=invalidRevision){state.error = null;failure = null;}
        } catch (error) {
          state.error = error?.message || String(error);
          failure = error;
        }
        publish();
      }
      if (state.error) throw failure || Error(state.error);
    }).finally(() => { task = null; state.saving = false; publish(); });
    return task;
  }
  return { save, fail, state, flush: () => task || (state.error ? Promise.reject(Error(state.error)) : Promise.resolve()) };
}

export function saveStatusText(state, { profileError, profileSaving, now = Date.now() } = {}) {
  if (state?.error || profileError) return 'Save failed · ' + (state?.error || profileError) + ' · Retry saving';
  if (state?.saving || profileSaving) return 'Saving… Keep Wildbound open.';
  if (!state?.savedAt) return 'Progress saves automatically during play.';
  const seconds = Math.max(0, Math.floor((now - state.savedAt) / 1000));
  return seconds < 5 ? 'Saved just now' : seconds < 60 ? `Last saved ${seconds} seconds ago` : `Last saved ${Math.floor(seconds / 60)} minutes ago`;
}
