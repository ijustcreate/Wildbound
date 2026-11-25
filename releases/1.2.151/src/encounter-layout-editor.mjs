import {drawCampfire} from './campfire-art.mjs';
import {drawForestRuin} from './forest-art.mjs';
import {ENCOUNTER_LAYOUTS} from './encounter-layout-data.mjs';

const element = (tag, text) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
};

function dot(context, [x, y], color, label) {
  context.fillStyle = '#172e27';
  context.beginPath();
  context.arc(x, y, 9, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = color;
  context.stroke();
  context.fillStyle = color;
  context.fillText(label, x, y + 4);
}

function drawLayout(canvas, layout) {
  const context = canvas.getContext('2d');
  context.resetTransform();
  context.fillStyle = '#253b31';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, 176);
  context.fillStyle = '#30463a';
  for (let x = -144; x <= 144; x += 16) for (let y = -160; y <= 112; y += 16) context.fillRect(x, y, 1, 1);
  context.strokeStyle = '#aac39a';
  context.lineWidth = 2;
  context.setLineDash([4, 5]);
  for (const route of layout.routes) {
    context.beginPath();
    context.moveTo(...route[0]);
    for (const point of route.slice(1)) context.lineTo(...point);
    context.stroke();
  }
  context.setLineDash([]);
  for (const [index, wall] of layout.walls.entries()) {
    const [x, y] = wall.point;
    drawForestRuin(context, {...wall, x, y, seed: index + 18});
    context.strokeStyle = '#adbaa4';
    context.strokeRect(x - wall.width / 2, y - wall.depth, wall.width, wall.depth);
  }
  if (layout.fire) {
    context.save();
    context.translate(...layout.fire);
    context.scale(.6, .6);
    drawCampfire(context, 0, 0, 1.5, 19);
    context.restore();
  }
  context.font = 'bold 10px sans-serif';
  context.textAlign = 'center';
  dot(context, layout.entry, '#b7ddac', 'E');
  layout.spawns.forEach((point, index) => dot(context, point, '#efbd9d', String(index + 1)));
  for (const [,, x, y] of layout.supplies) dot(context, [x, y], '#eddaa1', '+');
  if (layout.trap) dot(context, layout.trap, '#b9d6e7', 'T');
}

export function drawEncounterLayoutInspector(parent, event, rerender) {
  if (event.type && !['encounter', 'enemy'].includes(event.type)) return;
  const section = element('section');
  section.className = 'event-builder-section';
  const label = element('label', 'Encounter layout');
  const picker = element('select');
  picker.setAttribute('aria-label', 'Encounter layout');
  picker.append(new Option('Use generated terrain', ''));
  for (const [id, layout] of Object.entries(ENCOUNTER_LAYOUTS)) picker.append(new Option(layout.name, id));
  picker.value = event.comboLayout || '';
  label.append(picker);
  const description = element('p');
  const canvas = element('canvas');
  canvas.width = 336;
  canvas.height = 301;
  canvas.style.maxWidth = '100%';
  const legend = element('p', 'E marks the approach, numbers mark enemy spawn order, + marks supplies, and T marks a suggested place for a player’s trap.');
  const refresh = () => {
    const layout = ENCOUNTER_LAYOUTS[picker.value];
    canvas.hidden = legend.hidden = !layout;
    description.textContent = layout
      ? `${layout.description} The game places this layout on clear forest ground. Extra enemies use ordinary spawn points.`
      : 'Choose a forest layout to place walls, supplies, and enemy starting positions.';
    if (!layout) return;
    canvas.setAttribute('aria-label', `${layout.name} placement preview. ${layout.description}`);
    drawLayout(canvas, layout);
  };
  picker.onchange = () => {
    if (picker.value) {
      event.comboLayout = picker.value;
      event.environment = 'forest';
    } else delete event.comboLayout;
    rerender();
  };
  section.append(label, description, canvas, legend);
  parent.append(section);
  refresh();
}
