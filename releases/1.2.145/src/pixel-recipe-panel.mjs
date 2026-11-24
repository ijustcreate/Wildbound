import { compilePixelRecipe, pixelRecipeFrameAt } from './pixel-recipe.mjs';
import { spriteToRgba } from './pixels.mjs';

export function mountPixelRecipePanel(host, { getDraft, applyFrame }) {
  const opener = document.createElement('button');
  opener.type = 'button';
  opener.className = 'small-button pixel-recipe-open';
  opener.textContent = 'Pixel recipe';
  opener.setAttribute('aria-haspopup', 'dialog');

  const dialog = document.createElement('dialog');
  dialog.className = 'pixel-recipe-dialog';
  dialog.setAttribute('aria-label', 'Pixel recipe');
  dialog.innerHTML = `
    <header><h2>Pixel recipe</h2><button type="button" class="small-button" data-recipe="close">Close</button></header>
    <p>Paste a Wildbound pixel recipe. When it includes <code>base</code>, this editor uses its current draft as that base.</p>
    <div class="pixel-recipe-content">
      <label>Recipe JSON
        <textarea rows="9" spellcheck="false" autofocus></textarea>
      </label>
      <div class="pixel-recipe-preview">
        <canvas width="1" height="1" aria-label="Pixel recipe preview"></canvas>
        <div class="pixel-recipe-transport" hidden>
          <label>Frame <select data-recipe="frame"></select></label>
          <button type="button" class="small-button" data-recipe="play">Play</button>
        </div>
      </div>
    </div>
    <p class="pixel-recipe-status" role="status"></p>
    <footer>
      <button type="button" class="small-button" data-recipe="preview">Preview recipe</button>
      <button type="button" class="primary compact" data-recipe="apply" disabled>Apply frame to draft</button>
    </footer>`;
  host.append(opener, dialog);

  const button = name => dialog.querySelector(`[data-recipe="${name}"]`);
  const input = dialog.querySelector('textarea');
  const canvas = dialog.querySelector('canvas');
  const context = canvas.getContext('2d');
  const transport = dialog.querySelector('.pixel-recipe-transport');
  const status = dialog.querySelector('.pixel-recipe-status');
  const selection = button('frame');
  const apply = button('apply');
  const play = button('play');
  let recipe, selectedSprite, playbackRequest;

  function pause() {
    if (playbackRequest !== undefined) cancelAnimationFrame(playbackRequest);
    playbackRequest = undefined;
    play.textContent = 'Play';
  }

  function showSprite(sprite) {
    if (selectedSprite === sprite) return;
    selectedSprite = sprite;
    canvas.width = sprite.width;
    canvas.height = sprite.height;
    context.putImageData(new ImageData(spriteToRgba(sprite), sprite.width, sprite.height), 0, 0);
  }

  function clearPreview() {
    pause();
    recipe = selectedSprite = undefined;
    transport.hidden = true;
    apply.disabled = true;
    canvas.width = canvas.height = 1;
    status.textContent = '';
  }

  opener.onclick = () => {
    clearPreview();
    dialog.showModal();
  };
  button('close').onclick = () => dialog.close();
  dialog.addEventListener('close', pause);
  dialog.addEventListener('keydown', event => event.stopPropagation());
  input.addEventListener('input', clearPreview);

  button('preview').onclick = () => {
    clearPreview();
    try {
      const source = JSON.parse(input.value.replace(/^\uFEFF/, ''));
      const usesDraft = source?.base !== undefined;
      recipe = compilePixelRecipe(source, usesDraft ? {base: structuredClone(getDraft())} : {});
      showSprite(pixelRecipeFrameAt(recipe, 0));
      transport.hidden = !recipe.frames || recipe.frames.length < 2;
      selection.replaceChildren(...(recipe.frames || []).map(({duration}, index) =>
        new Option(`${index + 1} · ${duration} ms`, String(index))));
      const dimensions = `${recipe.sprite.width} × ${recipe.sprite.height} pixels`;
      const timing = recipe.frames ? ` · ${recipe.frames.length} frames · ${recipe.duration} ms` : '';
      const base = usesDraft ? ' · Uses current draft as base' : '';
      status.textContent = dimensions + timing + base;
      apply.disabled = false;
    } catch (error) {
      clearPreview();
      status.textContent = error.message;
    }
  };

  selection.onchange = () => {
    pause();
    showSprite(recipe.frames[Number(selection.value)].sprite);
  };
  play.onclick = () => {
    if (playbackRequest !== undefined) {
      pause();
      return;
    }
    play.textContent = 'Pause';
    const offset = recipe.frames.slice(0, Number(selection.value))
      .reduce((sum, frame) => sum + frame.duration, 0);
    const start = performance.now() - offset;
    const tick = time => {
      if (!dialog.isConnected || !dialog.open) {
        pause();
        return;
      }
      const sprite = pixelRecipeFrameAt(recipe, time - start);
      showSprite(sprite);
      selection.value = String(recipe.frames.findIndex(frame => frame.sprite === sprite));
      playbackRequest = requestAnimationFrame(tick);
    };
    playbackRequest = requestAnimationFrame(tick);
  };

  apply.onclick = () => {
    pause();
    try {
      applyFrame(structuredClone(selectedSprite));
      dialog.close();
    } catch (error) {
      status.textContent = error.message;
    }
  };
}
