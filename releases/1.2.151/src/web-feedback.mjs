import { openControllerKeyboard } from './controller-keyboard.mjs';

export function mountWebFeedback(getScreen) {
  const config = document.querySelector('meta[name="wildbound-playtest-feedback"]');
  if (!config?.content || window.desktop) return;

  const dialog = document.getElementById('web-feedback-dialog');
  const form = dialog.querySelector('form');
  const category = form.elements.category;
  const message = form.elements.message;
  const status = dialog.querySelector('[data-feedback-status]');
  const keyboard = dialog.querySelector('[data-feedback-keyboard]');
  const submit = form.querySelector('[type=submit]');
  let opener, screen, lastReport;

  for (const button of document.querySelectorAll('[data-web-feedback-open]')) {
    button.hidden = false;
    button.addEventListener('click', () => {
      opener = button;
      screen = getScreen();
      dialog.dataset.ownerDevice = button.closest('dialog')?.dataset.ownerDevice || '';
      keyboard.hidden = !dialog.dataset.ownerDevice.startsWith('pad:') &&
        !Array.from(navigator.getGamepads?.() || []).some(Boolean);
      dialog.showModal();
      if (keyboard.hidden) message.focus();
      else category.focus();
    });
  }
  dialog.querySelector('[data-feedback-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  keyboard.addEventListener('click', () => openControllerKeyboard(message, {
    title: 'Write feedback', returnFocus: keyboard,
  }));
  message.addEventListener('input', () => message.setCustomValidity(''));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const content = message.value.trim();
    if (!content) {
      message.setCustomValidity('Enter a short description before sending.');
      message.reportValidity();
      return;
    }
    if (!lastReport || lastReport.message !== content || lastReport.category !== category.value || lastReport.screen !== screen) {
      lastReport = {id: crypto.randomUUID(), message: content, category: category.value, screen, version: config.dataset.version};
    }
    submit.disabled = true;
    message.readOnly = true;
    category.disabled = true;
    keyboard.disabled = true;
    status.textContent = 'Sending…';
    try {
      const response = await fetch(config.content, {
        method: 'POST', credentials: 'omit', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(lastReport), signal: AbortSignal.timeout(15000),
      });
      if (response.status === 429) {
        status.textContent = 'The inbox is busy. Your message is still here. Try again later.';
        return;
      }
      if (!response.ok || (await response.json()).received !== true) throw Error('Feedback was not received');
      lastReport = null;
      message.value = '';
      status.textContent = 'Thanks. Your feedback was sent.';
    } catch {
      status.textContent = 'Could not send feedback. Your message is still here. Try again.';
    } finally {
      submit.disabled = false;
      message.readOnly = false;
      category.disabled = false;
      keyboard.disabled = false;
    }
  });
}
