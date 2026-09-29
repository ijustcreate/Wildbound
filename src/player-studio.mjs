import {drawItem} from './item-art.mjs';
import { ikChain, solveTwoBone } from './ik.mjs';
import {
  playerMotion,
  defaultPlayerMotion,
  replacePlayerMotion,
  DIRECTIONS,
  directionVector,
  projectPoint,
  screenDelta,
  poseAt,
  drawPlayer,
  descendants,
  setJointKey,
} from "./player-motion.mjs";
import {
  lionMotion,
  defaultLionMotion,
  replaceLionMotion,
  drawLion,
} from "./lion-motion.mjs";
import { RIG_SUBJECTS as SUBJECTS } from "./rig-subjects.mjs";
import { invalidateRhinoFrames } from "./rhino-motion.mjs";
import { ITEMS, SLOTS, fitsSlot } from "./items.mjs";
import { DEFAULT_APPEARANCE, appearanceControls, HAIR_STYLES } from "./appearance.mjs";
import { AnimationGraph } from "./animation-graph.mjs";
import { renderLayers, captureLayers, releaseLayers, boneSprites } from "./render-order.mjs";
import { saveRigSpriteOverride, removeRigSpriteOverride } from "./rig-sprite-storage.mjs";
import { ANGLE_JOINTS, jointAngle, wrapAngle } from "./joint-angles.mjs";
import { BoneTools, transformBones } from './bone-tools.mjs';
const copy = (v) => structuredClone(v);
export class RigStudio {
  constructor(save) {
    this.save = save;
    this.subject = "player";
    this.states = new Map();
    this.clip = "run";
    this.frame = 0;
    this.direction = 0;
    this.selected = "handR";
    this.playing = false;
    this.mode = "animate";
    this.tool = "move";
    this.bones = true;
    this.onion = false;
    this.history = [];
    this.future = [];
    this.gear = "none";
    this.previewEquipment = {};
    this.previewAppearance = null;
    this.gearSlot = "head";
    this.clipboard = null;
    this.scale = 7;
    this.panX = 0;
    this.panY = -24;
  }
  get definition() {
    return SUBJECTS[this.subject];
  }
  get model() {
    return this.definition.data;
  }
  replace(model) {
    if (!model.ik) delete this.model.ik;
    if (!model.renderOrder) delete this.model.renderOrder;
    if (!model.boneSprites) delete this.model.boneSprites;
    if (!model.jointAngles) delete this.model.jointAngles;
    this.definition.replace(model);
  }
  setSubject(subject) {
    if (!SUBJECTS[subject] || subject === this.subject) return;
    const fields = [
      "clip",
      "frame",
      "direction",
      "selected",
      "playing",
      "mode",
      "tool",
      "history",
      "future",
      "gear",
      "clipboard",
      "scale",
      "panX",
      "panY",
    ];
    this.states.set(
      this.subject,
      Object.fromEntries(fields.map((k) => [k, this[k]])),
    );
    this.subject = subject;
    this.scale = this.definition.scale || 7;
    Object.assign(
      this,
      this.states.get(subject) || {
        clip: this.definition.clip,
        frame: 0,
        direction: 0,
        selected: this.definition.selected,
        playing: false,
        mode: "animate",
        tool: "move",
        history: [],
        future: [],
        gear: "none",
        clipboard: null,
        panX: 0,
        panY: 0,
      },
    );
    this.dragging = null;
    this.timelineDrag = null;
  }
  mount(root) {
    this.resizeObserver?.disconnect();
    this.root = root;
    root.tabIndex = 0;
    root.onkeydown = (e) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
      let command;
      if (e.code === "Space") command = "play";
      else if (e.code === "ArrowRight") command = "next";
      else if (e.code === "ArrowLeft") command = "prev";
      else if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ")
        command = e.shiftKey ? "redo" : "undo";
      else if ((e.ctrlKey || e.metaKey) && e.code === "KeyS") command = "save";
      if (command) {
        e.preventDefault();
        e.stopPropagation();
        this.command(command);
      }
    };
    root.classList.add("player-studio");
    root.classList.toggle("editing-player", this.subject === "player");
    root.innerHTML = `<div class="ps-heading"><div><span class="ps-eyebrow">CHARACTER ANIMATION</span><h2>One rig. Eight directions.</h2><p>The same player, poses and equipment anchors used in the game.</p></div><span class="ps-badge">PLAYER / 01</span></div>
    <div class="ps-toolbar"><button data-do="setup">Setup joints</button><button data-do="animate">Animate</button><span class="ps-divider"></span><button data-do="move">Move</button><button data-do="rotate">Rotate</button><label><input type="checkbox" data-option="bones" checked> Bones</label><label><input type="checkbox" data-option="onion"> Onion skin</label><button data-do="undo">Undo</button><button data-do="redo">Redo</button></div>
    <div class="ps-layout"><aside class="ps-hierarchy"><h3>JOINTS</h3><div class="ps-joints"></div><p>Drag a handle to move a joint and its children. Rotate turns the selected bone around its parent.</p><h3>APPEARANCE</h3><div class="ps-palette"></div></aside>
    <section class="ps-stage"><div class="ps-view-controls"><button data-do="zoom-out" aria-label="Zoom out">−</button><output class="ps-zoom" aria-label="Canvas zoom">100%</output><button data-do="zoom-in" aria-label="Zoom in">+</button><button data-do="pan">Pan</button><button data-do="reset-view">Reset view</button><span>Wheel: zoom · Middle-drag: pan</span></div><canvas class="ps-canvas" width="560" height="380" aria-label="Player rig canvas: drag joints to pose"></canvas><div class="ps-directions"></div><p class="ps-hint"></p></section>
    <aside class="ps-inspector"><h3 class="ps-selected"></h3><p class="ps-parent"></p><div class="ps-coordinates"></div><button data-do="key">Set joint key</button><h3>GAME PREVIEW</h3><canvas class="ps-preview" width="160" height="120"></canvas><div class="ps-wardrobe"></div><p>Ground anchor stays fixed. Preview uses the game's renderer.</p></aside></div>
    <section class="ps-timeline"><div class="ps-transport"><select class="ps-clip" aria-label="Animation clip"></select><button data-do="first" title="First frame">|◀</button><button data-do="prev" title="Previous frame">◀</button><button data-do="play">Pause</button><button data-do="next" title="Next frame">▶</button><span class="ps-time"></span><label>FPS <input class="ps-fps" type="number" min="1" max="30"></label><label><input class="ps-loop" type="checkbox"> Loop</label><button data-do="copy">Copy frame</button><button data-do="paste">Paste frame</button><button data-do="delete">Delete joint key</button></div><input class="ps-scrub" type="range" min="0" step="any" aria-label="Scrub animation"><canvas class="ps-tracks" width="960" height="190" aria-label="Keyframe tracks: drag diamonds to retime; Shift drag to copy"></canvas><p>Drag the playhead to scrub. Drag a diamond to retime that joint; Shift-drag to copy. Posing creates a key at the current frame.</p></section>
    <footer><button data-do="save">Save rig to game</button><button data-do="export">Export rig</button><label class="ps-import">Import rig <input class="ps-file" type="file" accept=".json"></label><button data-do="reset">Reset to reference style</button><span class="ps-status" role="status">Ready · eight-direction pixel rig</span></footer>`;
    const $ = (s) => root.querySelector(s);
    this.$ = $;
    const picker = document.createElement("select");
    picker.className = "ps-subject";
    picker.setAttribute("aria-label", "Rig subject");
    for (const [key, subject] of Object.entries(SUBJECTS))
      picker.append(new Option(subject.name, key));
    picker.value = this.subject;
    picker.onchange = () => {
      this.setSubject(picker.value);
      this.mount(root);
    };
    $(".ps-toolbar").prepend(picker);
    for(const tool of ['ik','shear','scale']) {
      const button=document.createElement('button');button.dataset.do=tool;button.textContent=tool==='ik'?'IK pose':tool==='scale'?'Scale':'Shear';
      $('[data-do="rotate"]').after(button);
    }
    $('[data-do="move"]').textContent='Translate';
    this.mountWardrobe();
    const shape = document.createElement("div");
    shape.className = "ps-shape";
    $(".ps-inspector").append(shape);
    for (const key of this.definition.shapeKeys ||
      Object.keys(this.model.shape || {})) {
      const label = document.createElement("label");
      label.textContent = key.replace(/([A-Z])/g, " $1");
      const input = document.createElement("input");
      input.type = "number";
      input.min = 0.5;
      input.max = 20;
      input.step = 0.5;
      input.value = this.model.shape[key];
      input.dataset.shape = key;
      input.onchange = () => {
        this.remember();
        this.model.shape[key] = Math.max(
          0.5,
          Math.min(20, Number(input.value) || 1),
        );
        this.changed();
      };
      label.append(input);
      shape.append(label);
    }
    $(".ps-status").textContent = this.definition.name + " · shared rig editor";
    const visibility = document.createElement("div");
    visibility.className = "ps-visibility";
    visibility.innerHTML =
      "<h3>PART VISIBILITY</h3><p>Per facing · hidden parts keep their editable handles.</p>";
    for (let d = 0; d < 8; d++) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.visibleFacing = d;
      input.onchange = () => {
        if (!this.model.visibility?.[this.selected]) return;
        this.remember();
        this.model.visibility[this.selected][d] = input.checked;
        this.changed();
      };
      label.append(input, document.createTextNode(DIRECTIONS[d]));
      visibility.append(label);
    }
    for (const [title, value] of [
      ["Show all", true],
      ["Hide all", false],
    ]) {
      const button = document.createElement("button");
      button.textContent = title;
      button.onclick = () => {
        this.remember();
        this.model.visibility[this.selected].fill(value);
        this.changed();
      };
      visibility.append(button);
    }
    $(".ps-coordinates").after(visibility);
    for (const name of Object.keys(this.model.joints)) {
      const b = document.createElement("button");
      b.textContent = name;
      b.dataset.joint = name;
      let depth = 0,
        p = this.model.joints[name].parent;
      while (p) {
        depth++;
        p = this.model.joints[p].parent;
      }
      b.style.paddingLeft = "6px";
      b.onclick = () => {
        this.selected = name;
        this.playing = false;
        this.refresh();
      };
      $(".ps-joints").append(b);
    }
    DIRECTIONS.forEach((name, i) => {
      const b = document.createElement("button");
      b.textContent = name;
      b.dataset.direction = i;
      b.onclick = () => {
        this.direction = i;
        this.mountWardrobe();
        this.refresh();
      };
      $(".ps-directions").append(b);
    });
    for (const k of this.definition.palette) {
      const label = document.createElement("label");
      label.textContent = k;
      const input = document.createElement("input");
      input.type = "color";
      input.value = this.model.palette[k];
      input.dataset.palette = k;
      input.onchange = () => {
        this.remember();
        this.model.palette[k] = input.value;
        this.changed();
      };
      label.append(input);
      $(".ps-palette").append(label);
    }
    for (const [i, name] of [
      "Across (X)",
      "Depth (Y)",
      "Height (Z)",
    ].entries()) {
      const label = document.createElement("label");
      label.textContent = name;
      const input = document.createElement("input");
      input.type = "number";
      input.min = -60;
      input.max = 60;
      input.step = 0.5;
      input.dataset.axis = i;
      input.onchange = () => {
        this.remember();
        this.playing = false;
        const positions = this.pose();
        const delta = [0, 0, 0];
        delta[i] =
          Math.max(-60, Math.min(60, Number(input.value) || 0)) -
          positions[this.selected][i];
        this.editPositions(positions, delta);
        this.changed();
      };
      label.append(input);
      $(".ps-coordinates").append(label);
    }
    Object.keys(this.model.clips).forEach((n) =>
      $(".ps-clip").append(new Option(n, n)),
    );
    $(".ps-clip").onchange = (e) => {
      this.clip = e.target.value;
      this.frame = 0;
      this.refresh();
    };
    $(".ps-fps").onchange = (e) => {
      this.remember();
      this.model.clips[this.clip].fps = Math.max(
        1,
        Math.min(30, Number(e.target.value) || 12),
      );
      this.changed();
    };
    $(".ps-loop").onchange = (e) => {
      this.remember();
      this.model.clips[this.clip].loop = e.target.checked;
      this.changed();
    };

    $(".ps-scrub").oninput = (e) => {
      this.playing = false;
      this.frame = Number(e.target.value);
      this.refresh();
    };
    root.querySelectorAll("[data-option]").forEach((el) => {
      el.checked = this[el.dataset.option];
      el.onchange = () => (this[el.dataset.option] = el.checked);
    });
    root
      .querySelectorAll("[data-do]")
      .forEach((b) => (b.onclick = () => this.command(b.dataset.do)));
    $(".ps-file").onchange = async (e) => {
      try {
        const m = JSON.parse(await e.target.files[0].text());
        this.remember();
        this.replace(m);
        this.frame = 0;
        this.changed("Imported rig. Save to keep it.");
      } catch (error) {
        this.message(error.message);
      }
    };
    const canvas = $(".ps-canvas");
    canvas.onpointerdown = (e) => this.startDrag(e);
    canvas.onpointermove = (e) => this.drag(e);
    canvas.onpointerup = canvas.onpointercancel = () => {
      if(this.boneTools)this.boneTools.gesture=null;
      this.dragging = null;
      this.panning = null;
      canvas.classList.remove("panning");
    };
    canvas.onlostpointercapture = canvas.onpointercancel;
    canvas.onwheel = (e) => {
      e.preventDefault();
      if (!this.dragging && !this.panning)
        this.zoomAt(
          Math.exp(
            -Math.max(
              -120,
              Math.min(120, e.deltaY * (e.deltaMode === 1 ? 16 : 1)),
            ) * 0.002,
          ),
          this.canvasPoint(e, canvas),
        );
    };
    const tracks = $(".ps-tracks");
    tracks.onpointerdown = (e) => this.startTimeline(e);
    tracks.onpointermove = (e) => this.moveTimeline(e);
    tracks.onpointerup = (e) => this.endTimeline(e);
    tracks.onpointercancel = () => (this.timelineDrag = null);
    this.graph = new AnimationGraph(this);
    this.graph.mount();
    const order = document.createElement('details'); order.className='ps-render-order'; order.open=false;
    order.innerHTML='<summary>Render order · per facing</summary><p>Back to front. Select a layer and move it forward or backward. Edits apply only to the current facing.</p><select size="7" aria-label="Sprite render order"></select><button type="button" data-layer="-1">Move backward</button><button type="button" data-layer="1">Move forward</button><button type="button" data-layer="reset">Automatic order</button>';
    this.$('.ps-hierarchy').append(order);
    const spriteSection=document.createElement('section');spriteSection.className='ps-bone-sprites';
    this.$('[data-do="key"]').after(spriteSection);this.boneSpriteKey=null;
    const angles=document.createElement('section');angles.className='ps-angle-controls';
    angles.innerHTML='<h3>HAND & FOOT ANGLES</h3><select aria-label="Angle joint"></select><label>Angle in this view (degrees)<input type="number" min="-180" max="180" step="5" value="0"></label><input type="range" min="-180" max="180" step="1" value="0" aria-label="Joint angle"><p class="ps-angle-value"></p><button type="button">Reset angle</button><p>Animate: keys this frame. Setup: rest angle. Right hand carries hand1; left hand carries hand2 or the bow.</p>';
    const selector=angles.querySelector('select');for(const n of ANGLE_JOINTS)selector.append(new Option(n,n));
    selector.onchange=()=>{this.selected=selector.value;this.refresh();this.animate(0);};
    angles.querySelectorAll('input').forEach(input=>input.onchange=()=>{this.remember();this.setAngle(Number(input.value));});
    angles.querySelector('button').onclick=()=>{this.remember();this.setAngle(0);};
    this.$('.ps-inspector').append(angles);
    this.boneTools=new BoneTools(this);this.boneTools.mount();
    this.mountInspectorSections();
    this.mountRigWorkflow();
    const search=document.createElement('input');search.type='search';search.placeholder='Find a bone…';search.setAttribute('aria-label','Find a bone');
    search.oninput=()=>this.root.querySelectorAll('[data-joint]').forEach(b=>b.hidden=!b.dataset.joint.toLowerCase().includes(search.value.toLowerCase()));
    this.$('.ps-joints').before(search);
    this.layerSelect=order.querySelector('select');
    this.layerNames = null;
    order.querySelectorAll('button').forEach(b=>b.onclick=()=>{
      const names=[...renderLayers(this.model,this.direction)],id=this.layerSelect.value;
      this.remember();this.model.renderOrder ||= {};
      if(b.dataset.layer==='reset')delete this.model.renderOrder[this.direction];
      else {const index=names.indexOf(id),target=Math.max(0,Math.min(names.length-1,index+Number(b.dataset.layer)));if(index>=0){names.splice(index,1);names.splice(target,0,id);this.model.renderOrder[this.direction]=names;}}
      this.changed('Render order updated for '+DIRECTIONS[this.direction]);
    });
    this.refresh();
    this.animate(0);
    const stage=this.$('.ps-stage'),fitCanvas=()=>{
      if(!stage.clientHeight)return;
      this.$('.ps-canvas').width=Math.max(120,Math.round(380*stage.clientWidth/stage.clientHeight));
      this.animate(0);
    };
    this.resizeObserver=new ResizeObserver(fitCanvas);this.resizeObserver.observe(stage);fitCanvas();
  }
  message(s) {
    this.$(".ps-status").textContent = s;
  }
  mountRigWorkflow(){
    const tree=this.$('.ps-hierarchy');
    tree.querySelector('h3').textContent='RIG TREE';
    tree.querySelectorAll('h3').forEach(h=>{if(h.textContent==='APPEARANCE')h.remove();});
    const joints=this.$('.ps-joints'),buttons=new Map([...joints.children].map(b=>[b.dataset.joint,b]));joints.replaceChildren();
    const append=(parent,container)=>{
      for(const [name,joint] of Object.entries(this.model.joints).filter(([,j])=>(j.parent||'')===parent)){
        const button=buttons.get(name);if(!button)continue;
        const hasChildren=Object.values(this.model.joints).some(j=>j.parent===name);
        if(hasChildren){const branch=document.createElement('details');branch.open=true;branch.className='ps-tree-branch';const summary=document.createElement('summary');summary.append(button);branch.append(summary);container.append(branch);append(name,branch);}
        else container.append(button);
      }
    };append('',joints);
    for(const selector of ['.ps-palette','.ps-render-order']){
      const element=this.$(selector),group=document.createElement('details');
      if(selector==='.ps-render-order')continue;
      group.innerHTML='<summary>Appearance</summary>';element.before(group);group.append(element);
    }
    const box=document.createElement('details');box.className='ps-constraints';box.open=true;
    box.innerHTML='<summary>IK constraints</summary><p>Animate: choose a hand, foot or paw, enable its two-bone chain, then use IK pose to drag the endpoint. Keys become IK targets.</p><button data-ik="add">Enable selected chain</button><button data-ik="remove">Remove selected chain</button><div class="ps-ik-list"></div>';
    tree.append(box);
    box.querySelector('[data-ik="add"]').onclick=()=>{
      const chain=ikChain(this.model,this.selected);if(!chain){this.message('Select an endpoint with a parent and grandparent.');return;}
      this.remember();this.model.ik||={};this.model.ik[this.selected]=chain;this.tool='ik';this.mode='animate';this.playing=false;this.changed('IK enabled: '+chain.root+' → '+chain.mid+' → '+chain.end);
    };
    box.querySelector('[data-ik="remove"]').onclick=()=>{this.remember();delete this.model.ik?.[this.selected];this.changed('IK constraint removed; pose keys retained.');};
    const clips=document.createElement('details');clips.open=true;clips.className='ps-animation-list';clips.innerHTML='<summary>Animations</summary><div class="ps-animation-buttons"></div>';
    for(const name of Object.keys(this.model.clips)){
      const b=document.createElement('button');b.textContent=name;b.dataset.animation=name;b.onclick=()=>{this.clip=name;this.frame=0;this.playing=false;this.mode='animate';this.refresh();this.animate(0);};clips.querySelector('div').append(b);
    }
    tree.prepend(clips);
    const tabs=document.createElement('div');tabs.className='ps-browser-tabs';
    const rig=document.createElement('div');rig.dataset.browser='rig';
    for(const child of [...tree.children])if(child!==clips&&child!==box&&!child.matches('.ps-render-order'))rig.append(child);
    const sections={rig,clips,constraints:box,order:this.$('.ps-render-order')};
    for(const [id,label] of [['rig','Rig'],['clips','Clips'],['constraints','IK'],['order','Order']]){
      const button=document.createElement('button');button.textContent=label;button.dataset.browserTab=id;
      button.onclick=()=>{for(const [key,panel] of Object.entries(sections))panel.hidden=key!==id;for(const b of tabs.children)b.classList.toggle('active',b===button);};tabs.append(button);
    }
    tree.replaceChildren(tabs,...Object.values(sections));tabs.firstChild.click();
    this.$('[data-do="ik"]').onclick=()=>{this.command('ik');tabs.querySelector('[data-browser-tab="constraints"]').click();};
    const badge=document.createElement('div');badge.className='ps-mode-label';this.$('.ps-stage').append(badge);
  }
  mountInspectorSections() {
    const inspector=this.$('.ps-inspector');
    const tabs=document.createElement('div');tabs.className='ps-inspector-tabs';
    tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Inspector sections');
    const body=document.createElement('div');body.className='ps-inspector-body';
    const sections=[['joint','Joint',['.ps-bone-tools','.ps-coordinates','[data-do="key"]','.ps-angle-controls']],
      ['art','Sprites',['.ps-bone-sprites']],
      ['details','Properties',['.ps-visibility','.ps-shape']]];
    if(this.subject==='player')sections.push(['equipment','Equipment',['.ps-preview','.ps-wardrobe']]);
    else this.$('.ps-preview').hidden=true;
    const select=id=>{
      this.inspectorSection=id;
      for(const button of tabs.children){const active=button.dataset.section===id;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;}
      for(const panel of body.children)panel.hidden=panel.dataset.section!==id;
      body.scrollTop=0;
    };
    for(const [id,label,selectors] of sections){
      const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.section=id;
      button.id='rig-inspector-tab-'+id;button.setAttribute('role','tab');button.setAttribute('aria-controls','rig-inspector-'+id);
      button.onclick=()=>select(id);tabs.append(button);
      const panel=document.createElement('div');panel.className='ps-inspector-panel';panel.dataset.section=id;
      panel.id='rig-inspector-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);
      for(const selector of selectors)panel.append(this.$(selector));
      body.append(panel);
    }
    // Keep the selected bone visible above every section; all editing controls
    // have one home. The main canvas already supplies the live joint preview.
    for(const node of [...inspector.children])if(!node.matches('.ps-selected,.ps-parent,.ps-preview,.ps-wardrobe'))node.remove();
    inspector.prepend(tabs);inspector.append(body);
    const properties=this.boneTools.box.querySelector('details');
    body.querySelector('[data-section="details"]').prepend(properties);properties.open=true;
    const coordinates=this.$('.ps-coordinates'),position=document.createElement('details');
    position.innerHTML='<summary>Absolute joint position</summary>';
    coordinates.before(position);position.append(coordinates);
    const help=this.boneTools.box.querySelector('p');
    help.textContent='Drag the handles or apply values to this pose.';
    tabs.onkeydown=e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const buttons=[...tabs.children],index=buttons.indexOf(document.activeElement);
      const next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowRight'?1:buttons.length-1))%buttons.length;
      select(buttons[next].dataset.section);buttons[next].focus();
    };
    select(sections.some(([id])=>id===this.inspectorSection)?this.inspectorSection:'joint');
  }
  mountWardrobe() {
    const root = this.$(".ps-wardrobe");
    root.hidden = this.subject !== "player";
    if (root.hidden) return;
    root.innerHTML = '<h3>PAPER DOLL</h3><div class="ps-doll"></div><div class="ps-fit"></div><details><summary>Preview character colors and hair</summary><div class="ps-look"></div></details><p>Click a slot to choose its gear. None clears the slot. Fit and pixel art affect this item in the selected facing. Save rig to game to keep edits.</p>';
    for (const slot of ["hair", ...SLOTS]) {
      if (this.gearSlot === slot) {
        const label = document.createElement('label');
        label.dataset.slot = slot;
        label.className = 'ps-slot-picker active';
        label.textContent = slot;
        const picker = document.createElement('select');
        picker.className = 'ps-items';
        picker.setAttribute('aria-label', slot + ' options');
        label.append(picker);
        root.querySelector('.ps-doll').append(label);
        continue;
      }
      const b = document.createElement("button");
      b.dataset.slot = slot;
      b.textContent = slot + " · " + (slot === "hair" ? HAIR_STYLES[this.previewAppearance?.hair || "none"] : ITEMS[this.previewEquipment[slot]]?.name || "None");
      b.classList.toggle("active", this.gearSlot === slot);
      b.onclick = () => {
        this.gearSlot = slot;
        this.mountWardrobe();
        const picker = root.querySelector('.ps-items');
        picker.focus({preventScroll:true});
        // Native picker opens within the original click/keyboard gesture.
        try { picker.showPicker?.(); } catch { /* Keyboard arrows still work. */ }
      };
      root.querySelector('.ps-doll').append(b);
    }
    for(const slotNode of root.querySelectorAll('.ps-doll [data-slot]')) {
      const id=this.previewEquipment[slotNode.dataset.slot];if(!id||!ITEMS[id])continue;
      const icon=document.createElement('canvas');icon.width=icon.height=32;icon.className='ps-gear-icon';icon.setAttribute('aria-label',ITEMS[id].name+' texture');
      const c=icon.getContext('2d'), pixels=this.model.wearables?.[id]?.[this.direction]?.pixels;
      if(pixels?.some(Boolean))pixels.forEach((color,i)=>{if(color){c.fillStyle=color;c.fillRect(i%16*2,Math.floor(i/16)*2,2,2);}});
      else drawItem(c,id,16,16,30);
      slotNode.prepend(icon);
    }
    const select = root.querySelector('.ps-items');
    select.append(new Option('None', this.gearSlot === 'hair' ? 'none' : ''));
    const choices = this.gearSlot === "hair" ? Object.entries(HAIR_STYLES).filter(([id])=>id !== 'none').map(([id,name])=>[id,{name}]) : Object.entries(ITEMS).filter(([id])=>fitsSlot(id,this.gearSlot));
    for (const [id,item] of choices) select.append(new Option(item.name,id));
    select.value = this.gearSlot === "hair" ? this.previewAppearance?.hair || "none" : this.previewEquipment[this.gearSlot] || "";
    select.onchange = () => {
      this.playing = false;
      if (this.gearSlot === "hair") { this.previewAppearance ||= structuredClone(DEFAULT_APPEARANCE); this.previewAppearance.hair = select.value || "none"; }
      else this.previewEquipment[this.gearSlot] = select.value || null;
      this.gear = "none"; this.mountWardrobe(); this.refresh(); this.animate(0);
      root.querySelector('.ps-items')?.focus({preventScroll:true});
    };
    const id = this.gearSlot === "hair" ? "hair:" + (this.previewAppearance?.hair || "none") : this.previewEquipment[this.gearSlot];
    if (id) {
      const fit = root.querySelector('.ps-fit');
      const current = () => this.model.wearables?.[id]?.[this.direction] || {};
      const update = (key,value) => {
        this.remember();
        this.model.wearables ||= {}; this.model.wearables[id] ||= {};
        this.model.wearables[id][this.direction] = {...current(), [key]:value};
        this.changed();
      };
      const title = document.createElement('h4'); title.textContent = DIRECTIONS[this.direction] + ' · item fit'; fit.append(title);
      for (const [key,label,min,max,step,def] of [["x","Across",-30,30,0.5,0],["y","Vertical",-30,30,0.5,0],["scale","Scale",0.25,3,0.05,1],["rotation","Rotation",-180,180,5,0]]) {
        const l=document.createElement('label'); l.textContent=label;
        const input=document.createElement('input'); Object.assign(input,{type:'number',min,max,step,value:current()[key] ?? def});
        input.onchange=()=>update(key,Math.max(min,Math.min(max,Number(input.value)||def))); l.append(input); fit.append(l);
      }
      const paint = document.createElement('details');
      paint.innerHTML='<summary>Edit pixel art for this facing</summary><p>Painting replaces the item art for this angle. Right-click erases.</p><input type="color" value="#cfb574" aria-label="Pixel color"><canvas width="160" height="160" class="ps-item-pixels"></canvas><button type="button">Restore original art</button>';
      fit.append(paint);
      const canvas=paint.querySelector('canvas'), c=canvas.getContext('2d');
      const redraw=()=>{c.clearRect(0,0,160,160);for(let i=0;i<256;i++){c.fillStyle=current().pixels?.[i] || ((i%16+Math.floor(i/16))%2?'#314b46':'#233b36');c.fillRect(i%16*10,Math.floor(i/16)*10,9,9);}};
      canvas.oncontextmenu=e=>e.preventDefault();
      canvas.onpointerdown=e=>{e.preventDefault(); const r=canvas.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/r.width*16),y=Math.floor((e.clientY-r.top)/r.height*16); const pixels=[...(current().pixels || Array(256).fill(null))]; pixels[y*16+x]=e.button===2?null:paint.querySelector('input').value;update('pixels',pixels);redraw();};
      paint.querySelector('button').onclick=()=>{update('pixels',null);redraw();}; redraw();
    }
    const look = structuredClone(this.previewAppearance || DEFAULT_APPEARANCE);
    appearanceControls(root.querySelector('.ps-look'),look,()=>{this.previewAppearance=look;this.animate(0);});
  }
  remember() {
    this.history.push(copy(this.model));
    if (this.history.length > 60) this.history.shift();
    this.future = [];
  }
  setAngle(value) {
    if(!Number.isFinite(value)||this.subject!=='player'||!ANGLE_JOINTS.includes(this.selected))return;
    this.playing=false;const angle=wrapAngle(value);
    if(this.mode==='setup') {this.model.jointAngles||={};(this.model.jointAngles[this.direction]||={})[this.selected]=angle;}
    else {setJointKey(this.model,this.clip,this.frame,this.selected,this.pose()[this.selected]);const key=this.model.clips[this.clip].keys.find(k=>k.frame===Math.round(this.frame));key.angles||={};(key.angles[this.direction]||={})[this.selected]=angle;}
    this.changed('Angle updated · '+DIRECTIONS[this.direction]+' · save rig to keep');
  }
  refreshBoneSprites() {
    const root=this.$('.ps-bone-sprites');if(!root)return;
    const sprites=boneSprites(this.model,this.direction,this.selected);
    const key=JSON.stringify([this.subject,this.selected,this.direction,sprites.map(p=>p.id),this.model.boneSprites]);
    if(key===this.boneSpriteKey)return;this.boneSpriteKey=key;
    root.replaceChildren();
    const title=document.createElement('h3');title.textContent='SPRITES ON '+this.selected;root.append(title);
    if(!sprites.length){const note=document.createElement('p');note.textContent='No separate editable sprite is registered on this bone.';root.append(note);return;}
    for(const part of sprites){
      const card=document.createElement('div'), canvas=document.createElement('canvas');canvas.width=part.sprite.width;canvas.height=part.sprite.height;canvas.className='bone-sprite-preview';
      const c=canvas.getContext('2d');part.sprite.pixels.forEach((n,i)=>{if(n){c.fillStyle=part.sprite.palette[n];c.fillRect(i%canvas.width,Math.floor(i/canvas.width),1,1);}});
      const label=document.createElement('p');label.textContent=part.id+' · '+DIRECTIONS[this.direction];card.append(label,canvas);
      const edit=document.createElement('button');edit.textContent='Edit in sprite editor';edit.onclick=()=>{
        this.playing=false;const model=this.model,direction=this.direction,id=part.id;
        const current=boneSprites(model,direction,this.selected).find(p=>p.id===id)||part;
        window.dispatchEvent(new CustomEvent('rig-sprite-edit',{detail:{name:this.subject+' · '+id+' · '+DIRECTIONS[direction],sprite:copy(current.sprite),apply:async(sprite)=>{
          this.remember();model.boneSprites||={};model.boneSprites[id]||={};
          const savedSprite={...sprite,x:current.sprite.x,y:current.sprite.y};
          model.boneSprites[id][direction]=savedSprite;
          this.definition.replace(model);saveRigSpriteOverride(this.subject,id,direction,savedSprite);this.boneSpriteKey=null;const message=await this.save();this.changed(message || 'Sprite saved to this bone and facing.');
        }}}));
      };card.append(edit);
      const reset=document.createElement('button');reset.textContent='Restore original';reset.onclick=async()=>{try{this.remember();if(this.model.boneSprites?.[part.id])delete this.model.boneSprites[part.id][this.direction];removeRigSpriteOverride(this.subject,part.id,this.direction);this.definition.replace(this.model);const message=await this.save();this.boneSpriteKey=null;this.changed(message || 'Original sprite restored.');}catch(error){this.message(error.message);}};card.append(reset);root.append(card);
    }
  }
  changed(message = "Unsaved · preview updated") {
    if (this.subject === "rhino") invalidateRhinoFrames();
    this.message(message);
    this.refresh();
    this.animate(0);
  }
  pose() {
    return this.mode === "setup"
      ? Object.fromEntries(
          Object.entries(this.model.joints).map(([n, j]) => [
            n,
            [...j.position],
          ]),
        )
      : poseAt(this.model, this.clip, this.frame);
  }
  equipment() {
    if (Object.keys(this.previewEquipment).length) return this.previewEquipment;
    if (this.gear === "magic")
      return { hand1: "wand", cape: "cape", neck: "charm", head: "hat" };
    if (this.gear === "charm") return { neck: "charm" };
    return this.gear === "sword"
      ? { hand1: "sword", hand2: "shield" }
      : this.gear === "bow"
        ? { hand1: "bow" }
        : this.gear === "armor"
          ? {
              head: "hat",
              chest: "armor",
              gloves: "gloves",
              pants: "pants",
              feet: "boots",
              hand1: "sword",
              hand2: "shield",
            }
          : this.gear === "daggers"
            ? { hand1: "dagger", hand2: "dagger" }
            : {};
  }
  actor() {
    const [faceX, faceY] = directionVector(this.direction);
    return {
      sprite: this.definition.sprite,
      kind: this.definition.sprite,
      faceX,
      faceY,
      animationAction: this.mode === "setup" ? "idle" : this.clip,
      playerFrame: this.frame,
      angleRestOnly:this.mode==='setup',
      equipment: this.equipment(),
      appearance: this.previewAppearance,
      attack: ["punch", "slash"].includes(this.clip)
        ? Math.max(
            0.01,
            0.34 * (1 - this.frame / this.model.clips[this.clip].length),
          )
        : 0,
      charge: this.clip === "draw" ? this.frame / 7 : 0,
    };
  }
  refresh() {
    if (!this.root?.isConnected) return;
    this.root.dataset.mode=this.mode;
    if(this.$('.ps-mode-label'))this.$('.ps-mode-label').textContent=this.mode==='setup'?'SETUP · Rest skeleton':'ANIMATE · '+this.clip;
    this.root.querySelectorAll('[data-animation]').forEach(b=>b.classList.toggle('active',b.dataset.animation===this.clip));
    const constraints=this.$('.ps-ik-list');if(constraints){constraints.replaceChildren();for(const chain of Object.values(this.model.ik||{})){
      const button=document.createElement('button');button.textContent='◇ '+chain.end+' ← '+chain.mid;button.classList.toggle('active',chain.end===this.selected);button.onclick=()=>{this.selected=chain.end;this.tool='ik';this.refresh();this.animate(0);};constraints.append(button);
    }}
    this.boneTools?.refresh();
    const angleBox=this.$('.ps-angle-controls');
    if(angleBox){angleBox.hidden=this.subject!=='player';const supported=ANGLE_JOINTS.includes(this.selected);angleBox.querySelector('select').value=supported?this.selected:'';
      const angle=supported?jointAngle(this.model,this.clip,this.frame,this.direction,this.selected,this.mode==='setup'):0;
      angleBox.querySelectorAll('input').forEach(input=>{input.disabled=!supported;if(document.activeElement!==input)input.value=Math.round(angle*10)/10;});
      angleBox.querySelector('.ps-angle-value').textContent=supported?this.selected+' · '+DIRECTIONS[this.direction]+' · '+Math.round(angle)+'°':'Select a hand or foot above, or click its bone.';
    }
    this.root.querySelectorAll("[data-shape]").forEach((e) => {
      if (document.activeElement !== e)
        e.value = this.model.shape[e.dataset.shape];
    });
    const $ = this.$,
      c = this.model.clips[this.clip];
    $(".ps-zoom").textContent =
      Math.round((this.scale / (this.definition.scale || 7)) * 100) + "%";
    $(".ps-canvas").classList.toggle("pan-tool", this.tool === "pan");
    $(".ps-selected").textContent = this.selected;
    $(".ps-parent").textContent =
      "Parent: " + (this.model.joints[this.selected].parent || "ground / root");
    const pos = this.pose()[this.selected];
    const partVisibility = this.model.visibility?.[this.selected];
    $(".ps-visibility").hidden = !partVisibility;
    this.root.querySelectorAll("[data-visible-facing]").forEach((input) => {
      input.checked =
        partVisibility?.[Number(input.dataset.visibleFacing)] ?? true;
    });
    this.root.querySelectorAll("[data-axis]").forEach((e) => {
      if (document.activeElement !== e)
        e.value = pos[Number(e.dataset.axis)].toFixed(1);
    });
    this.root
      .querySelectorAll("[data-joint]")
      .forEach((b) => {
        b.classList.toggle("active", b.dataset.joint === this.selected);
        b.style.borderLeftColor=this.model.joints[b.dataset.joint].editor?.color||'#476356';
        b.style.borderLeftWidth='3px';
      });
    this.root
      .querySelectorAll("[data-direction]")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          Number(b.dataset.direction) === this.direction,
        ),
      );
    this.root
      .querySelectorAll("[data-do]")
      .forEach((b) =>
        b.classList.toggle(
          "active",
          b.dataset.do === this.mode || b.dataset.do === this.tool,
        ),
      );
    this.root
      .querySelectorAll("[data-palette]")
      .forEach((e) => (e.value = this.model.palette[e.dataset.palette]));
    $(".ps-clip").value = this.clip;
    $(".ps-fps").value = c.fps;
    $(".ps-loop").checked = c.loop;
    $(".ps-scrub").max = c.length - 1;
    $(".ps-hint").textContent =
      this.mode === "setup"
        ? "SETUP · move the rest skeleton; all clips share these proportions."
        : this.tool==='ik' ? 'IK · drag a cyan endpoint; knee/elbow bends and limb lengths stay fixed.' : "ANIMATE · drag to pose and key this frame. Changes are shared across all eight facings.";
    $('[data-do="play"]').textContent = this.playing ? "Pause" : "Play";
  }
  async command(action) {
    if (action === "zoom-in" || action === "zoom-out") {
      this.zoomAt(action === "zoom-in" ? 1.25 : 0.8);
      return;
    }
    if (action === "reset-view") {
      this.scale = this.definition.scale || 7;
      this.panX = 0; this.panY = -24;
      this.refresh();
      this.animate(0);
      return;
    }
    const c = this.model.clips[this.clip];
    if (["setup", "animate"].includes(action)) {
      this.mode = action;
      this.playing = false;
    } else if (["move", "rotate", "scale", "shear", "pan", "ik"].includes(action)) this.tool = action;
    else if (action === "play") {
      this.mode = "animate";
      if (this.frame >= c.length - 1) this.frame = 0;
      this.playing = !this.playing;
    } else if (["first", "prev", "next"].includes(action)) {
      this.playing = false;
      this.frame =
        action === "first"
          ? 0
          : Math.max(
              0,
              Math.min(
                c.length - 1,
                Math.round(this.frame) + (action === "next" ? 1 : -1),
              ),
            );
    } else if (action === "undo" && this.history.length) {
      this.future.push(copy(this.model));
      this.replace(this.history.pop());
      this.message("Undone");
    } else if (action === "redo" && this.future.length) {
      this.history.push(copy(this.model));
      this.replace(this.future.pop());
      this.message("Redone");
    } else if (action === "key") {
      this.remember();
      this.playing = false;
      setJointKey(
        this.model,
        this.clip,
        this.frame,
        this.selected,
        this.pose()[this.selected],
      );
      this.message("Joint keyed");
    } else if (action === "copy") {
      this.clipboard = copy(this.pose());
      this.clipboardAngles=Object.fromEntries(ANGLE_JOINTS.filter(n=>this.model.joints[n]).map(n=>[n,jointAngle(this.model,this.clip,this.frame,this.direction,n)]));
      this.message("Whole pose copied");
    } else if (action === "paste" && this.clipboard) {
      this.remember();
      this.playing = false;
      for (const [n, p] of Object.entries(this.clipboard))
        setJointKey(this.model, this.clip, this.frame, n, p);
      if(this.clipboardAngles){const key=c.keys.find(k=>k.frame===Math.round(this.frame));key.angles||={};key.angles[this.direction]=copy(this.clipboardAngles);}
      this.message("Pose pasted");
    } else if (action === "delete") {
      const key = c.keys.find((k) => k.frame === Math.round(this.frame));
      if (key?.joints[this.selected]) {
        this.remember();
        delete key.joints[this.selected];
        for(const angles of Object.values(key.angles||{}))delete angles[this.selected];
        c.keys = c.keys.filter((k) => Object.keys(k.joints).length);
        if (!c.keys.length) c.keys = [{ frame: 0, joints: {} }];
        this.message("Joint key deleted");
      }
    } else if (action === "save") {
      try {
        const message = await this.save();
        this.message(message || "Saved · gameplay and studio now use this rig");
      } catch (e) {
        this.message(e.message);
      }
    } else if (action === "export") {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(this.model, null, 2)], {
          type: "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "wildbound-" + this.subject + "-rig.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else if (action === "reset") {
      this.remember();
      this.replace(this.definition.defaults());
      this.frame = 0;
      this.message("Default restored · Undo available");
    }
    this.refresh();
    this.animate(0);
  }
  canvasPoint(e, canvas) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * canvas.width) / r.width,
      y: ((e.clientY - r.top) * canvas.height) / r.height,
    };
  }
  get viewCenterX() { return this.root?.querySelector('.ps-canvas')?.width / 2 || 280; }
  zoomAt(factor, point = { x: this.viewCenterX, y: 190 }) {
    const base = this.definition.scale || 7,
      old = this.scale;
    this.scale = Math.max(base * 0.25, Math.min(base * 8, old * factor));
    this.panX =
      point.x - this.viewCenterX - ((point.x - this.viewCenterX - this.panX) * this.scale) / old;
    this.panY =
      point.y - 315 - ((point.y - 315 - this.panY) * this.scale) / old;
    this.refresh();
    this.animate(0);
  }
  startDrag(e) {
    if (e.button === 1 || (e.button === 0 && this.tool === "pan")) {
      const canvas = this.$(".ps-canvas");
      this.panning = {
        start: this.canvasPoint(e, canvas),
        x: this.panX,
        y: this.panY,
      };
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("panning");
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return;
    const canvas = this.$(".ps-canvas"),
      mouse = this.canvasPoint(e, canvas),
      pose = this.pose();
    if(this.tool!=='ik'&&this.boneTools?.start(mouse)){canvas.setPointerCapture(e.pointerId);e.preventDefault();return;}
    if(this.angleHandle && this.bones && Math.hypot(mouse.x-this.angleHandle.x,mouse.y-this.angleHandle.y)<12){
      this.remember();this.playing=false;this.dragging={angle:true,center:this.angleHandle.center,base:this.angleHandle.base};canvas.setPointerCapture(e.pointerId);return;
    }
    const candidates = Object.entries(pose)
      .filter(([name])=>this.model.joints[name].editor?.selectable!==false)
      .map(([n, p]) => {
        const q = projectPoint(p, this.direction);
        return {
          n,
          d: Math.hypot(
            mouse.x - (this.viewCenterX + this.panX + q.x * this.scale),
            mouse.y - (315 + this.panY + q.y * this.scale),
          ),
        };
      })
      .sort((a, b) =>
        Math.abs(a.d - b.d) < 3 &&
        (a.n === this.selected || b.n === this.selected)
          ? a.n === this.selected
            ? -1
            : 1
          : a.d - b.d,
      );
    if (!candidates.length || candidates[0].d > 16) return;
    this.selected = candidates[0].n;
    this.playing = false;
    this.frame = Math.min(
      this.model.clips[this.clip].length - 1,
      Math.round(this.frame),
    );
    this.remember();
    this.dragging = {
      start: mouse,
      pose: this.pose(),
      rest: copy(this.model.joints),
      model: copy(this.model),
    };
    canvas.setPointerCapture(e.pointerId);
    this.refresh();
    e.preventDefault();
  }
  editPositions(original, delta, rotate = null) {
    const affected=transformBones(this.model,original,this.selected,this.direction,rotate?'rotate':'move',[0,0],'world',this.boneTools?.children??true);
    for (const name of Object.keys(affected)) {
      let p = original[name].map((v, i) => v + delta[i]);
      if (rotate) {
        const projected = projectPoint(original[name], this.direction),
          ox = projected.x - rotate.center.x,
          oy = projected.y - rotate.center.y;
        const dx =
            ox * Math.cos(rotate.angle) - oy * Math.sin(rotate.angle) - ox,
          dy = ox * Math.sin(rotate.angle) + oy * Math.cos(rotate.angle) - oy;
        const d = screenDelta(dx, dy, this.direction);
        p = original[name].map((v, i) => v + d[i]);
      }
      p = p.map((v) => Math.max(-60, Math.min(60, v)));
      if (this.mode === "setup") this.model.joints[name].position = p;
      else setJointKey(this.model, this.clip, this.frame, name, p);
    }
  }
  drag(e) {
    if(this.boneTools?.gesture){this.boneTools.drag(this.canvasPoint(e,this.$('.ps-canvas')));return;}
    if (this.panning) {
      const point = this.canvasPoint(e, this.$(".ps-canvas"));
      this.panX = this.panning.x + point.x - this.panning.start.x;
      this.panY = this.panning.y + point.y - this.panning.start.y;
      this.animate(0);
      return;
    }
    const drag = this.dragging;
    if (!drag) return;
    const mouse = this.canvasPoint(e, this.$(".ps-canvas"));
    if(drag.angle){this.setAngle((Math.atan2(mouse.y-drag.center.y,mouse.x-drag.center.x)-drag.base)*180/Math.PI);return;}
    this.replace(drag.model);
    if(this.tool==='ik'){
      if(this.mode!=='animate'){this.message('IK poses animation frames. Switch to Animate.');return;}
      const chain=this.model.ik?.[this.selected];
      if(!chain){this.message('Enable the selected endpoint under IK constraints first.');return;}
      const delta=screenDelta((mouse.x-drag.start.x)/this.scale,(mouse.y-drag.start.y)/this.scale,this.direction);
      const target=drag.pose[chain.end].map((v,i)=>v+delta[i]);
      const result=solveTwoBone(drag.pose[chain.root],drag.pose[chain.mid],drag.pose[chain.end],target);
      // Bake the pole and target; runtime IK maintains segment lengths between keys.
      setJointKey(this.model,this.clip,this.frame,chain.mid,result.mid);
      setJointKey(this.model,this.clip,this.frame,chain.end,result.end);
      for(const child of descendants(this.model,chain.end))if(child!==chain.end)setJointKey(this.model,this.clip,this.frame,child,drag.pose[child].map((v,i)=>v+result.end[i]-drag.pose[chain.end][i]));
      this.changed('IK pose keyed · '+chain.end);return;
    }
    if(this.tool==='scale'||this.tool==='shear') {
      const dx=(mouse.x-drag.start.x)/60,dy=(mouse.y-drag.start.y)/60;
      this.boneTools.apply(drag.pose,this.tool,this.tool==='scale'?[Math.max(.1,1+dx),Math.max(.1,1+dy)]:[Math.max(-75,Math.min(75,dx*45)),Math.max(-75,Math.min(75,dy*45))]);this.changed();return;
    }
    let rot = null;
    const parent = this.model.joints[this.selected].parent;
    if (this.tool === "rotate" && parent) {
      const center = projectPoint(drag.pose[parent], this.direction);
      rot = {
        center,
        angle:
          Math.atan2(
            (mouse.y - 315 - this.panY) / this.scale - center.y,
            (mouse.x - this.viewCenterX - this.panX) / this.scale - center.x,
          ) -
          Math.atan2(
            (drag.start.y - 315 - this.panY) / this.scale - center.y,
            (drag.start.x - this.viewCenterX - this.panX) / this.scale - center.x,
          ),
      };
    }
    this.editPositions(
      drag.pose,
      screenDelta(
        (mouse.x - drag.start.x) / this.scale,
        (mouse.y - drag.start.y) / this.scale,
        this.direction,
      ),
      rot,
    );
    this.changed();
  }
  timelineGeometry() {
    const names = [
      ...new Set([
        "pelvis",
        "chest",
        "head",
        this.selected,
        ...this.definition.tracks,
      ]),
    ];
    return {
      names: names.filter((n) => this.model.joints[n]).slice(0, 8),
      left: 120,
      right: this.$(".ps-tracks").width - 30,
      row: 16,
      top: 27,
    };
  }
  timelinePoint(e) {
    const p = this.canvasPoint(e, this.$(".ps-tracks")),
      g = this.timelineGeometry(),
      clip = this.model.clips[this.clip];
    return {
      ...p,
      frame: Math.max(
        0,
        Math.min(
          clip.length - 1,
          Math.round(((p.x - g.left) / (g.right - g.left)) * (clip.length - 1)),
        ),
      ),
      joint: g.names[Math.floor((p.y - g.top) / g.row)],
    };
  }
  startTimeline(e) {
    const p = this.timelinePoint(e),
      clip = this.model.clips[this.clip],
      g = this.timelineGeometry();
    this.playing = false;
    this.frame = p.frame;
    const key = clip.keys.find((k) => k.frame === p.frame && k.joints[p.joint]);
    const keyX = g.left + (p.frame / (clip.length - 1)) * (g.right - g.left);
    this.timelineDrag = {
      key: key && Math.abs(p.x - keyX) < 12 ? copy(key.joints[p.joint]) : null,
      from: p.frame,
      joint: p.joint,
      copy: e.shiftKey,
    };
    this.$(".ps-tracks").setPointerCapture(e.pointerId);
    this.refresh();
    this.animate(0);
  }
  moveTimeline(e) {
    if (!this.timelineDrag) return;
    this.frame = this.timelinePoint(e).frame;
    this.animate(0);
  }
  endTimeline(e) {
    const drag = this.timelineDrag;
    if (!drag) return;
    const dest = this.timelinePoint(e).frame;
    this.timelineDrag = null;
    if (drag.key && dest !== drag.from) {
      this.remember();
      const c = this.model.clips[this.clip];
      const source=c.keys.find(k=>k.frame===drag.from);
      const angles=Object.fromEntries(Object.entries(source?.angles||{}).filter(([,v])=>Number.isFinite(v[drag.joint])).map(([d,v])=>[d,v[drag.joint]]));
      if (!drag.copy) {
        const key = c.keys.find((k) => k.frame === drag.from);
        delete key.joints[drag.joint];
        for(const values of Object.values(key.angles||{}))delete values[drag.joint];
        c.keys = c.keys.filter((k) => Object.keys(k.joints).length);
      }
      setJointKey(
        this.model,
        this.clip,
        dest,
        drag.joint,
        drag.key.map((v, i) => v + this.model.joints[drag.joint].position[i]),
      );
      const target=c.keys.find(k=>k.frame===dest);for(const [d,value] of Object.entries(angles)){target.angles||={};(target.angles[d]||={})[drag.joint]=value;}
      this.message(drag.copy ? "Key copied" : "Key moved");
    }
    this.refresh();
    this.animate(0);
  }
  animate(dt) {
    if (!this.root?.isConnected) return;
    const clip = this.model.clips[this.clip];
    if (this.playing && this.mode === "animate") {
      this.frame += dt * clip.fps;
      if (clip.loop) this.frame %= clip.length;
      else if (this.frame >= clip.length - 1) {
        this.frame = clip.length - 1;
        this.playing = false;
        this.refresh();
      }
    }
    const canvas = this.$(".ps-canvas"),
      c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#343b3e";
    c.fillRect(0, 0, canvas.width, 380);
    c.strokeStyle = "#485155";
    c.lineWidth = 1;
    const step = this.scale * 4;
    for (
      let x = (((this.viewCenterX + this.panX) % step) + step) % step;
      x < canvas.width;
      x += step
    ) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, 380);
      c.stroke();
    }
    for (
      let y = (((315 + this.panY) % step) + step) % step;
      y < 380;
      y += step
    ) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(canvas.width, y);
      c.stroke();
    }
    c.fillStyle = "#252b2e";
    c.beginPath();
    c.ellipse(
      this.viewCenterX + this.panX,
      315 + this.panY + (5 * this.scale) / 7,
      (58 * this.scale) / 7,
      (17 * this.scale) / 7,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
    if (!this.surface) {
      this.surface = document.createElement("canvas");
      this.surface.width = this.surface.height = 96;
    }
    const sc = this.surface.getContext("2d"),
      pose = this.pose(),
      actor = this.actor();
    const paint = (p, alpha = 1) => {
      sc.clearRect(0, 0, 96, 96);
      sc.save();
      sc.translate(48, 64);
      captureLayers(this.model);
      try { this.definition.draw(sc, actor, this.frame/(this.model.clips[this.clip].fps||12), this.model, p); }
      finally { releaseLayers(this.model); }
      sc.restore();
      c.globalAlpha = alpha;
      c.drawImage(
        this.surface,
        this.viewCenterX + this.panX - 48 * this.scale,
        315 + this.panY - 64 * this.scale,
        96 * this.scale,
        96 * this.scale,
      );
      c.globalAlpha = 1;
    };
    if (this.onion && this.mode === "animate")
      paint(poseAt(this.model, this.clip, this.frame - 1), 0.2);
    paint(pose);
    this.refreshBoneSprites();
    const layerNames=renderLayers(this.model,this.direction);
    if(this.layerSelect && JSON.stringify(layerNames)!==this.layerNames){
      const selected=this.layerSelect.value;this.layerSelect.replaceChildren(...layerNames.map(id=>new Option(id,id)));
      this.layerSelect.value=layerNames.includes(selected)?selected:layerNames[0] || '';
      this.layerNames=JSON.stringify(layerNames);
    }
    this.graph?.draw();
    const projected = Object.fromEntries(
      Object.entries(pose).map(([n, v]) => {
        const p = projectPoint(v, this.direction);
        return [
          n,
          {
            x: this.viewCenterX + this.panX + p.x * this.scale,
            y: 315 + this.panY + p.y * this.scale,
          },
        ];
      }),
    );
    if (this.bones)
      for (const [n, j] of Object.entries(this.model.joints)) {
        const p = projected[n],
          parent = projected[j.parent];
        const style=j.editor||{},color=style.color||'#e2d9b2';
        c.strokeStyle = color;
        c.lineWidth = n === this.selected ? 3 : 1.5;
        if (parent) {
          c.beginPath();
          c.moveTo(parent.x, parent.y);
          c.lineTo(p.x, p.y);
          c.stroke();
        }
        c.fillStyle = n === this.selected ? color : "#303250";
        c.beginPath();
        const radius=Math.max(2,Math.min(9,style.iconSize||3))+(n===this.selected?2:0);
        if(style.icon==='diamond'){c.moveTo(p.x,p.y-radius);c.lineTo(p.x+radius,p.y);c.lineTo(p.x,p.y+radius);c.lineTo(p.x-radius,p.y);c.closePath();}
        else if(style.icon==='cross'){c.moveTo(p.x-radius,p.y);c.lineTo(p.x+radius,p.y);c.moveTo(p.x,p.y-radius);c.lineTo(p.x,p.y+radius);}
        else c.arc(p.x, p.y, radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        if(style.showName){c.font='11px sans-serif';c.fillStyle=color;c.fillText(n,p.x+radius+3,p.y-4);}
      }
    c.fillStyle = "#e6d79a";
    this.angleHandle=null;
    if(this.tool!=='ik')this.boneTools?.draw(c,projected);
    if(this.bones)for(const chain of Object.values(this.model.ik||{})){
      const point=projected[chain.end];if(!point)continue;
      c.strokeStyle='#64e1e8';c.lineWidth=2;c.beginPath();c.arc(point.x,point.y,9,0,Math.PI*2);c.stroke();
      if(this.tool==='ik'){c.font='10px sans-serif';c.fillStyle='#a5f5f5';c.fillText('IK '+chain.end,point.x+12,point.y-10);}
    }
    if(this.subject==='player'&&ANGLE_JOINTS.includes(this.selected)&&this.bones&&this.tool==='pan'){
      const anchor=projected[this.selected];
      const angle=jointAngle(this.model,this.clip,this.frame,this.direction,this.selected,this.mode==='setup');
      let base=-Math.PI/2;
      if(this.selected.startsWith('foot')){const raw=pose[this.selected],toe=projectPoint([raw[0],raw[1]+6,raw[2]-.5],this.direction),foot=projectPoint(raw,this.direction);base=Math.atan2(toe.y-foot.y,toe.x-foot.x);}
      const a=base+angle*Math.PI/180,x=anchor.x+Math.cos(a)*55,y=anchor.y+Math.sin(a)*55;
      this.angleHandle={x,y,center:anchor,base};
      c.strokeStyle='#ffcf67';c.lineWidth=3;c.beginPath();c.moveTo(anchor.x,anchor.y);c.lineTo(x,y);c.stroke();
      c.fillStyle='#ffcf67';c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();c.font='12px sans-serif';c.fillText(Math.round(angle)+'°',x+8,y-5);
    }
    c.fillRect(this.viewCenterX - 5 + this.panX, 315 + this.panY, 10, 1);
    c.fillRect(this.viewCenterX + this.panX, 310 + this.panY, 1, 10);
    const pc = this.$(".ps-preview").getContext("2d");
    pc.imageSmoothingEnabled = false;
    pc.fillStyle = "#24273f";
    pc.fillRect(0, 0, 160, 120);
    pc.drawImage(this.surface, 80 - 48 * 2, 92 - 64 * 2, 192, 192);
    const trackCanvas = this.$(".ps-tracks");
    const trackWidth = Math.max(400, Math.round(trackCanvas.clientWidth));
    if (trackCanvas.width !== trackWidth) trackCanvas.width = trackWidth;
    if (trackCanvas.height !== 155) trackCanvas.height = 155;
    const t = trackCanvas.getContext("2d"),
      g = this.timelineGeometry();
    t.fillStyle = "#171f26";
    t.fillRect(0, 0, trackWidth, 155);
    t.font = "11px monospace";
    for (let f = 0; f < clip.length; f++) {
      const x = g.left + (f / (clip.length - 1)) * (g.right - g.left);
      t.fillStyle = "#798c8c";
      t.fillText(f, x - 3, 18);
      t.strokeStyle = "#314047";
      t.beginPath();
      t.moveTo(x, 25);
      t.lineTo(x, 155);
      t.stroke();
    }
    g.names.forEach((name, i) => {
      const y = g.top + i * g.row + g.row / 2;
      t.fillStyle = name === this.selected ? "#254d4b" : "#202a31";
      t.fillRect(0, y - g.row / 2, trackWidth, g.row - 1);
      t.fillStyle = name === this.selected ? "#83ead0" : "#c2ceca";
      t.fillText(name, 9, y + 4);
      for (const k of clip.keys) {
        if (!k.joints[name]) continue;
        const x = g.left + (k.frame / (clip.length - 1)) * (g.right - g.left);
        t.fillStyle = "#e4bb71";
        t.beginPath();
        t.moveTo(x, y - 5);
        t.lineTo(x + 5, y);
        t.lineTo(x, y + 5);
        t.lineTo(x - 5, y);
        t.closePath();
        t.fill();
      }
    });
    const playX =
      g.left +
      (Math.min(clip.length - 1, this.frame) / (clip.length - 1)) *
        (g.right - g.left);
    t.strokeStyle = "#71e4ce";
    t.lineWidth = 2;
    t.beginPath();
    t.moveTo(playX, 25);
    t.lineTo(playX, 155);
    t.stroke();
    const scrub = this.$(".ps-scrub");
    const ratio = trackCanvas.getBoundingClientRect().width / trackCanvas.width;
    // Range thumbs travel between their centers, half a thumb inside each edge.
    scrub.style.marginLeft = g.left * ratio - 7 + "px";
    scrub.style.width = (g.right - g.left) * ratio + 14 + "px";
    scrub.value = Math.min(clip.length - 1, this.frame);
    this.$(".ps-time").textContent =
      `${String(Math.floor(this.frame)).padStart(2, "0")} / ${String(clip.length - 1).padStart(2, "0")} · ${DIRECTIONS[this.direction]}`;
  }
}

export { RigStudio as PlayerStudio };
