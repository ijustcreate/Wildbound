export function dailyExpeditionSeed(date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  let hash = 2166136261;
  for (const character of `wildbound:${day}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return { day, seed: (hash >>> 0) % 1000000 };
}

const MODE_LABELS = [
  ['wild', 'Wildbound', 'Start at Home and open portals to linked worlds.'],
  ['classic', 'Classic', 'Start at the board in one destination.'],
  ['wilds', 'The Wilds', 'Start by the railway and explore on foot or by train.'],
];

function paintModeCrest(canvas, mode) {
  const context = canvas.getContext('2d');
  canvas.width = canvas.height = 32;
  const rectangle = (color, x, y, width, height) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };
  if (mode === 'wild') {
    rectangle('#93d3ac', 3, 6, 26, 20);
    rectangle('#224938', 6, 9, 20, 14);
    rectangle('#d5b56a', 10, 15, 12, 11);
    rectangle('#7c4531', 8, 14, 16, 3);
    rectangle('#b17852', 11, 11, 10, 3);
    rectangle('#402c25', 14, 19, 4, 7);
    rectangle('#efca7d', 4, 12, 3, 3);
    rectangle('#efca7d', 25, 12, 3, 3);
  } else if (mode === 'classic') {
    rectangle('#997044', 3, 20, 26, 6);
    rectangle('#e8bc76', 4, 20, 24, 2);
    rectangle('#f1d9a3', 9, 5, 14, 14);
    rectangle('#c49a5d', 9, 17, 14, 2);
    for (const [x, y] of [[11, 7], [18, 7], [14, 10], [11, 13], [18, 13]]) rectangle('#523721', x, y, 3, 3);
  } else {
    rectangle('#86755e', 4, 22, 24, 3);
    rectangle('#c6c2a2', 6, 26, 20, 2);
    rectangle('#577fa1', 7, 8, 10, 15);
    rectangle('#a1c7d4', 9, 10, 5, 5);
    rectangle('#376485', 17, 12, 8, 11);
    rectangle('#99b0ba', 22, 8, 3, 5);
    rectangle('#f5bf68', 25, 15, 3, 4);
    rectangle('#262e35', 9, 21, 6, 6);
    rectangle('#262e35', 20, 21, 6, 6);
  }
}

export function buildExpeditionMenu({panel, member, player, game, select, mode, drawIcon, accept, close, highlight, details}) {
  const options = [...select.options].filter(option => option.value !== 'house').sort((a,b) => a.value === 'random' ? 1 : b.value === 'random' ? -1 : 0);
  const committedMap = options.find(option => option.value === select.value)?.value || 'forest';
  const continuingDraft = !!member.expeditionDraft;
  const draft = member.expeditionDraft ||= {
    wild: !!game.houseWorldsEnabled,
    wilds: false,
    boundless: mode.value === 'boundless',
    map: committedMap,
    daily: !!game.dailyExpedition,
    dailyDay: game.dailyExpedition?.day,
    dailySeed: game.dailyExpedition?.seed,
  };
  panel.replaceChildren();
  panel.classList.add('expedition-menu');
  panel.setAttribute('aria-label', `Expedition choices for ${player.name}`);
  const node = (tag, cls, text, parent = panel) => {
    const element = document.createElement(tag);
    element.className = cls;
    if (text) element.textContent = text;
    parent.append(element);
    return element;
  };
  const button = (cls, label, action, parent) => {
    const control = node('button', cls, '', parent);
    control.type = 'button';
    control.setAttribute('aria-label', label);
    control.onclick = () => {
      member.focus = controls().indexOf(control);
      action();
    };
    return control;
  };
  const copy = (control, title, description) => {
    const wrapper = node('span', 'expedition-copy', '', control);
    node('strong', '', title, wrapper);
    if (description) node('small', '', description, wrapper);
  };
  const header = node('header', 'expedition-header');
  const heading = node('div', 'expedition-title', '', header);
  node('h2', 'expedition-heading', 'Choose Your Adventure', heading);
  node('p', 'expedition-owner', player.name, heading);
  const exit = button('expedition-close', 'Cancel expedition choices', close, header);
  exit.textContent = '×';

  const body = node('div', 'expedition-body');
  const modeGroup = node('div', 'expedition-modes', '', body);
  modeGroup.setAttribute('role', 'group');
  modeGroup.setAttribute('aria-label', 'Adventure mode');
  const modeOptions = MODE_LABELS.map(([kind, label, description]) => {
    const control = button(`expedition-mode expedition-${kind}${kind === 'wild' ? ' wildbound-mode-choice' : ''}`, `${label}. ${description}`, () => {
      draft.wild = kind === 'wild';
      draft.wilds = kind === 'wilds';
      update();
    }, modeGroup);
    const art = node('canvas', 'expedition-crest', '', control);
    art.setAttribute('aria-hidden', 'true');
    paintModeCrest(art, kind);
    copy(control, label, description);
    node('span', 'expedition-check', '✓', control).setAttribute('aria-hidden', 'true');
    return control;
  });
  const [wild, classic, wilds] = modeOptions;
  const toggle = button('expedition-boundless map-mode-toggle', 'Boundless World', () => { draft.boundless = !draft.boundless; update(); }, body);
  toggle.setAttribute('role', 'switch');
  copy(toggle, 'Boundless World', 'Explore without world boundaries.');
  const toggleState = node('span', 'expedition-switch-state', 'Off', toggle);
  const today = dailyExpeditionSeed();
  const daily = button('expedition-daily', 'Daily Seed', () => {
    draft.daily = !draft.daily;
    if (draft.daily) { draft.dailyDay = today.day; draft.dailySeed = today.seed; }
    update();
  }, body);
  daily.setAttribute('role', 'switch');
  copy(daily, 'Daily Seed', '');
  const dailyInfo = node('small', 'expedition-daily-info', '', daily.querySelector('.expedition-copy'));
  const dailyState = node('span', 'expedition-switch-state', '', daily);

  const starting = node('section', 'expedition-starting', '', body);
  node('h3', 'expedition-map-heading', 'Starting Map', starting);
  const list = node('div', 'expedition-map-list', '', starting);
  list.setAttribute('role', 'group');
  list.setAttribute('aria-label', 'Choose starting map');
  const preview = node('p', 'expedition-map-preview', '', starting);
  const optionName = option => option.value === 'random' ? 'Random' : option.text;
  const describe = option => details?.[option.value] || (option.value === 'random' ? 'Choose a surprise destination.' : `Explore ${optionName(option)}.`);
  const selectedOption = () => options.find(option => option.value === draft.map);
  const showPreview = option => {
    preview.textContent = option ? `${optionName(option)} · ${describe(option)}` : '';
  };
  for (const option of options) {
    const label = optionName(option);
    const control = button('expedition-map map-choice', `${label}. ${describe(option)}`, () => {
      draft.map = option.value;
      update();
    }, list);
    control.dataset.map = option.value;
    control.dataset.mapName = label;
    control.dataset.mapDetail = describe(option);
    const art = node('canvas', 'expedition-icon', '', control);
    art.width = art.height = 64;
    art.setAttribute('aria-hidden', 'true');
    drawIcon(art.getContext('2d'), option.value, 0, 0, 64);
    copy(control, label);
    node('span', 'expedition-map-selected', '✓', control).setAttribute('aria-hidden', 'true');
    control.addEventListener('pointerenter', () => showPreview(option));
    control.addEventListener('pointerleave', () => showPreview(selectedOption()));
    control.addEventListener('focus', () => {
      member.focus = controls().indexOf(control);
      highlight();
      showPreview(option);
    });
    control.addEventListener('blur', () => showPreview(selectedOption()));
  }

  const footer = node('footer', 'expedition-footer');
  const status = node('p', 'expedition-status', '', footer);
  status.setAttribute('role', 'status');
  const done = button('expedition-accept', 'Accept expedition choices', async () => {
    done.disabled = true;
    status.textContent = '';
    try {
      const result = await accept({...draft, boundless: !draft.wild && !draft.wilds && draft.boundless, daily: !draft.wilds && draft.daily});
      if (result?.ok === false) status.textContent = result.reason || 'Unable to begin this expedition.';
    } catch (error) {
      status.textContent = error.message;
    } finally {
      if (panel.isConnected) done.disabled = false;
    }
  }, footer);
  done.textContent = 'Accept';
  const controls = () => [...panel.querySelectorAll('button')];
  const focusable = () => controls().filter(control => !control.disabled && !control.closest('[hidden]'));
  const currentMode = () => draft.wild ? wild : draft.wilds ? wilds : classic;
  function update() {
    const chosen = currentMode();
    panel.classList.toggle('is-wildbound', draft.wild);
    panel.classList.toggle('is-wilds', draft.wilds);
    panel.classList.toggle('is-classic', chosen === classic);
    modeOptions.forEach(control => control.setAttribute('aria-pressed', String(control === chosen)));
    toggle.hidden = starting.hidden = chosen !== classic;
    toggle.setAttribute('aria-checked', String(draft.boundless));
    toggleState.textContent = draft.boundless ? 'On' : 'Off';
    daily.hidden = draft.wilds;
    daily.setAttribute('aria-checked', String(draft.daily));
    dailyState.textContent = draft.daily ? 'On' : 'Off';
    dailyInfo.textContent = draft.daily ? `${draft.dailyDay} · Seed ${draft.dailySeed}` : `${today.day} · Shared world seed`;
    panel.dataset.mapPreview = draft.wild ? 'house' : draft.wilds ? 'forest' : draft.map;
    list.querySelectorAll('button').forEach(control => control.setAttribute('aria-pressed', String(draft.map === control.dataset.map)));
    showPreview(selectedOption());
    if (!focusable().includes(controls()[member.focus])) member.focus = controls().indexOf(chosen);
    highlight();
  }
  panel.expeditionButtons = focusable;
  panel.expeditionNavigate = ({x = 0, y = 0, accept = false, back = false}) => {
    if (back) { close(); return; }
    const visible = focusable(), all = controls();
    let current = visible.includes(all[member.focus]) ? all[member.focus] : currentMode();
    if (x || y) {
      const next = x && list.contains(current) ? horizontalMapNeighbor(visible, current, x) : y ? verticalNeighbor(visible, current, y) : null;
      if (next) {
        current = next;
        member.focus = all.indexOf(current);
        current.scrollIntoView({block:'nearest', inline:'nearest', container:'nearest'});
        if (list.contains(current)) showPreview(options.find(option => option.value === current.dataset.map));
        else showPreview(selectedOption());
        highlight();
      }
    }
    if (accept) current.click();
  };
  if (!continuingDraft) member.focus = controls().indexOf(currentMode());
  update();
}

function horizontalMapNeighbor(controls, current, direction) {
  const box = current.getBoundingClientRect();
  return controls.find(control => {
    if (!control.dataset.map || control === current) return false;
    const candidate = control.getBoundingClientRect();
    return Math.abs(candidate.top - box.top) < 4 && direction * (candidate.left - box.left) > 0
      && Math.abs(candidate.left - box.left) <= box.width + 16;
  });
}

function verticalNeighbor(controls, current, direction) {
  const box = current.getBoundingClientRect();
  let next, best = Infinity;
  for (const control of controls) {
    const candidate = control.getBoundingClientRect();
    const progress = (candidate.top - box.top) * direction;
    if (control === current || progress < 4) continue;
    const distance = progress * 4 + Math.abs(candidate.left - box.left);
    if (distance < best) { next = control; best = distance; }
  }
  return next;
}
