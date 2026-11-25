(() => {
  'use strict';

  const stripGeometry = (entry, image) => {
    const count = entry.sliceCount;
    const width = entry.cellWidth ?? image.naturalWidth / count;
    const depth = entry.cellDepth ?? image.naturalHeight;
    const step = entry.layerStep ?? 1;
    const pitch = entry.pitch ?? 0.55;
    if (!Number.isInteger(count) || count <= 0 || !Number.isInteger(width) || width <= 0 ||
        image.naturalWidth !== width * count || depth !== image.naturalHeight ||
        !Number.isFinite(step) || step <= 0 || !Number.isFinite(pitch) || pitch <= 0 || pitch > 1) {
      throw new Error('Invalid slice strip geometry');
    }
    return { count, width, depth, step, pitch };
  };

  const loadImage = async source => {
    if (!source) throw new Error('Missing image path');
    const image = new Image();
    image.src = source;
    await image.decode();
    return image;
  };

  const addSource = (parent, label, source, thumbnail, pixel) => {
    if (!source) return;
    const link = document.createElement('a');
    link.className = 'source';
    link.href = source;
    link.target = '_blank';
    link.rel = 'noopener';
    if (thumbnail) {
      const image = document.createElement('img');
      image.src = source;
      image.alt = '';
      link.append(image);
      if (pixel) link.dataset.pixel = '';
    }
    link.append(label);
    parent.append(link);
  };

  const canvasSurface = canvas => ({
    canvas,
    view: canvas.getContext('2d'),
    pixels: document.createElement('canvas'),
    image: null,
  });

  const buildCard = entry => {
    const card = document.querySelector('#prop-card').content.firstElementChild.cloneNode(true);
    const title = card.querySelector('h2');
    const original = canvasSurface(card.querySelector('[data-original]'));
    const stack = canvasSurface(card.querySelector('[data-stack]'));
    card.id = entry.id;
    title.id = `${entry.id}-title`;
    title.textContent = entry.name;
    card.setAttribute('aria-labelledby', title.id);
    card.querySelector('.location').textContent = entry.location;
    card.querySelector('.layer-count').textContent = `${entry.sliceCount} slices`;
    if (entry.description) {
      const description = card.querySelector('.description');
      description.textContent = entry.description;
      description.hidden = false;
    }
    for (const [surface, label] of [[original, 'Current prop'], [stack, 'Rotating sprite stack']]) {
      surface.canvas.setAttribute('role', 'img');
      surface.canvas.setAttribute('aria-label', `${label} for ${entry.name}`);
    }
    const sources = card.querySelector('.sources');
    addSource(sources, 'Concept', entry.concept, true, false);
    addSource(sources, 'Four views', entry.views, true, true);
    if (entry.rawViews !== entry.views) addSource(sources, 'Generated views', entry.rawViews, false, true);
    addSource(sources, 'Slice strip', entry.slices, false, true);
    document.querySelector('#demos').append(card);
    return { card, entry, original, stack, ground: 28 };
  };

  // The pixel buffer uses one texel per logical pixel. Only the final canvas is
  // enlarged to review scale, so slice rotation never gains subpixel detail.
  const startSurface = (surface, scale, ground) => {
    const { canvas, pixels } = surface;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    const backingWidth = Math.round(width * ratio);
    const backingHeight = Math.round(height * ratio);
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    const pixelWidth = Math.ceil(width / scale);
    const pixelHeight = Math.ceil(height / scale);
    if (pixels.width !== pixelWidth) pixels.width = pixelWidth;
    if (pixels.height !== pixelHeight) pixels.height = pixelHeight;
    const ctx = pixels.getContext('2d');
    ctx.clearRect(0, 0, pixelWidth, pixelHeight);
    ctx.imageSmoothingEnabled = false;
    return { ctx, x: Math.floor(pixelWidth / 2), y: Math.round((height - ground) / scale), ratio };
  };

  const displaySurface = (surface, scale, ratio) => {
    const { view, canvas, pixels } = surface;
    view.clearRect(0, 0, canvas.width, canvas.height);
    view.imageSmoothingEnabled = false;
    view.drawImage(pixels, 0, 0, pixels.width * scale * ratio, pixels.height * scale * ratio);
  };

  const drawOriginal = ({ original, entry, ground }, scale) => {
    if (!original.image) return;
    const { ctx, x, y, ratio } = startSurface(original, scale, ground);
    const image = original.image;
    const normalization = entry.originalScale ?? 1;
    const [anchorX, anchorY] = entry.originalAnchor ?? [image.naturalWidth / 2, image.naturalHeight];
    ctx.drawImage(image, Math.round(x - anchorX * normalization), Math.round(y - anchorY * normalization),
      Math.round(image.naturalWidth * normalization), Math.round(image.naturalHeight * normalization));
    displaySurface(original, scale, ratio);
  };

  const drawStack = ({ stack, entry, ground }, scale, angle) => {
    if (!stack.image) return;
    const { ctx, x, y, ratio } = startSurface(stack, scale, ground);
    const { count, width, depth, step, pitch } = stack.geometry;
    const [anchorX, anchorY] = entry.stackAnchor ?? [width / 2, depth / 2];
    const radians = (angle + (entry.defaultAngle ?? 0)) * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const shadowWidth = entry.shadowWidth ?? Math.hypot(width * cos, depth * sin) * 0.76;
    const shadowHalfWidth = Math.max(2, Math.round(shadowWidth / 2));
    ctx.fillStyle = '#0b100b8c';
    ctx.fillRect(x - shadowHalfWidth, y - 1, shadowHalfWidth * 2 + 1, 3);
    ctx.fillRect(x - shadowHalfWidth + 2, y - 2, shadowHalfWidth * 2 - 3, 5);
    for (let layer = 0; layer < count; layer += 1) {
      // Pitch projection and rotation happen before the height offset. The
      // ground pivot stays fixed even when a slice has transparent padding.
      ctx.setTransform(cos, sin * pitch, -sin, cos * pitch, x, y - Math.round(layer * step));
      ctx.drawImage(stack.image, layer * width, 0, width, depth, -anchorX, -anchorY, width, depth);
    }
    ctx.resetTransform();
    displaySurface(stack, scale, ratio);
  };

  const angleInput = document.querySelector('#angle');
  const degrees = document.querySelector('#degrees');
  const play = document.querySelector('#play');
  const status = document.querySelector('#status');
  const scaleInputs = [...document.querySelectorAll('[name="scale"]')];
  const cards = (window.WILDBOUND_STACK_DEMOS ?? []).map(buildCard);
  let angle = Number(angleInput.value);
  let scale = Number(scaleInputs.find(input => input.checked).value);
  let playing = false;
  let lastFrame;
  let frame;

  const render = () => {
    for (const card of cards) drawStack(card, scale, angle);
    angleInput.value = Math.floor(angle);
    degrees.value = `${angleInput.value}°`;
  };

  const renderAll = () => {
    for (const card of cards) drawOriginal(card, scale);
    render();
  };

  const layoutArt = () => {
    document.body.dataset.reviewScale = scale;
    for (const demo of cards) {
      const { card, original, stack, entry } = demo;
      const height = original.image?.naturalHeight ?? 0;
      const foot = entry.originalAnchor?.[1] ?? height;
      const normalization = entry.originalScale ?? 1;
      const geometry = stack.geometry;
      let projectedDepth = 0;
      if (geometry) {
        const { width, depth, pitch } = geometry;
        const [anchorX, anchorY] = entry.stackAnchor ?? [width / 2, depth / 2];
        projectedDepth = Math.hypot(Math.max(anchorX, width - anchorX), Math.max(anchorY, depth - anchorY)) * pitch;
      }
      const front = Math.max((height - foot) * normalization, projectedDepth);
      const back = Math.max(foot * normalization, geometry ? (geometry.count - 1) * geometry.step + projectedDepth : 0);
      demo.ground = Math.max(28, Math.ceil(front * scale) + 6);
      card.style.setProperty('--ground', `${demo.ground}px`);
      card.style.setProperty('--art-height', `${Math.ceil(back * scale) + demo.ground + 10}px`);
    }
    renderAll();
  };

  const animate = now => {
    if (lastFrame !== undefined) angle = (angle + Math.min(now - lastFrame, 50) * 0.035) % 360;
    lastFrame = now;
    render();
    frame = requestAnimationFrame(animate);
  };

  const setPlaying = enabled => {
    if (enabled === playing) return;
    playing = enabled;
    play.setAttribute('aria-pressed', String(playing));
    lastFrame = undefined;
    if (playing) frame = requestAnimationFrame(animate);
    else cancelAnimationFrame(frame);
  };

  play.addEventListener('click', () => setPlaying(!playing));
  angleInput.addEventListener('input', () => {
    setPlaying(false);
    angle = Number(angleInput.value);
    render();
  });
  for (const input of scaleInputs) input.addEventListener('change', () => {
    scale = Number(input.value);
    layoutArt();
  });

  const observer = new ResizeObserver(renderAll);
  for (const card of cards) {
    observer.observe(card.original.canvas.parentElement);
    observer.observe(card.stack.canvas.parentElement);
  }

  const readSurface = async (surface, label, source, geometry) => {
    try {
      const image = await loadImage(source);
      if (geometry) surface.geometry = geometry(image);
      surface.image = image;
      return true;
    } catch (error) {
      surface.canvas.parentElement.dataset.error = `${label} unavailable`;
      console.error(`${label}: ${source}`, error);
      return false;
    }
  };

  for (const input of [angleInput, play, ...scaleInputs]) input.disabled = true;
  window.wildboundGalleryReady = (async () => {
    const files = await Promise.all(cards.flatMap(({ entry, original, stack }) => [
      readSurface(original, `Current ${entry.name}`, entry.original),
      readSurface(stack, `${entry.name} stack`, entry.slices, image => stripGeometry(entry, image)),
    ]));
    const failed = files.filter(loaded => !loaded).length;
    if (!cards.length || failed) {
      status.textContent = cards.length ? `${failed} comparison images could not be loaded.` : 'No sprite stack demos found.';
      status.hidden = false;
    }
    for (const input of [angleInput, play, ...scaleInputs]) input.disabled = !cards.length;
    layoutArt();
    return { cards: cards.length, failed };
  })();
})();
