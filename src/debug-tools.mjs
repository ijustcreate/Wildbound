// Loaded only for smoke tests or an explicit tools preview.
export function installDebugTools(ctx) {
  window.previewGhostMinions=async()=>{
    await window.showcase('game');
    const {summonGhost}=await import('./temple.mjs');
    const p=ctx.game.players[0];ctx.game.ghosts=[];ctx.game.enemies=[];
    for(let i=0;i<3;i++)summonGhost(ctx.game,{kind:'lion',x:p.x-50+i*40,y:p.y+55,hp:0,killedBy:p.id,ritualKill:true,damage:10,defeated:true});
    ctx.game.ghosts.forEach((a,i)=>{a.cooldown=i*.4;});ctx.renderRoster();
    if(document.querySelectorAll('.minion-dot').length!==3)throw Error('Ghost cooldown indicators missing');
    ctx.renderer.draw(ctx.game,0);return true;
  };
  window.verifyLobbyActions=async()=>{
    const lobby=ctx.playableLobby,p=ctx.game.players.find(p=>p.device==='keyboard');
    const press=code=>window.dispatchEvent(new KeyboardEvent('keydown',{key:code==='Space'?' ':code.slice(3).toLowerCase(),code,bubbles:true,cancelable:true}));
    const release=code=>window.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
    press('KeyJ');lobby.update(.05,ctx.inputFrame());release('KeyJ');lobby.update(.05,{});
    const a=lobby.practice.players.find(a=>a.id===p.id);if(!(a.jumpHeight>0))throw Error('Lobby keyboard jump failed');
    press('Space');lobby.update(.05,ctx.inputFrame());release('Space');if(!(a.dashTime>0))throw Error('Lobby keyboard dodge failed');
    const dice=document.getElementById('dice-count');dice.value='1';dice.dispatchEvent(new Event('change'));
    await lobby.difficultyArt.decode();
    lobby.open(p,'difficulty');
    if(lobby.nodes.get(p.id).querySelectorAll('canvas').length!==3)throw Error('Missing difficulty icons');
    lobby.close(p);lobby.draw();return {passed:3};
  };
  window.verifyInputOwnership=()=>{
    ctx.newLobby();
    const p=ctx.game.addPlayer('keyboard'),q=ctx.game.addPlayer('pad:7');ctx.renderLobby();
    for(const [i,player] of [p,q].entries()){
      ctx.profiles.assign(player,ctx.profiles.create('Input '+i+' '+Date.now().toString().slice(-6)));
      const s=ctx.playableLobby.state.members.get(player.id);s.spawned=true;ctx.playableLobby.close(player);
    }
    const a=ctx.playableLobby.state.members.get(p.id),b=ctx.playableLobby.state.members.get(q.id);
    const ax=a.x,bx=b.x;
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',code:'KeyD',bubbles:true}));
    ctx.playableLobby.update(.05,ctx.inputFrame());
    window.dispatchEvent(new KeyboardEvent('keyup',{key:'d',code:'KeyD',bubbles:true}));
    if(a.x<=ax||b.x!==bx)throw Error('Keyboard movement leaked into the controller player');
    ctx.playableLobby.open(q,'board');
    const button=[...ctx.playableLobby.nodes.get(q.id).querySelectorAll('button')].find(b=>b.textContent==='Ready');button.focus();
    const enter=new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true});button.dispatchEvent(enter);
    if(q.ready||!enter.defaultPrevented)throw Error('Keyboard activates controller panel');
    const before=a.x;ctx.playableLobby.update(.05,{'pad:7':{x:1}});
    if(a.x!==before)throw Error('Controller input moved keyboard player');
    ctx.playableLobby.close(q);
    const controllerX=b.x;ctx.playableLobby.update(.05,{'pad:7':{x:1}});
    if(b.x<=controllerX||a.x!==before)throw Error('Independent controller movement failed');
    return {passed:4,players:ctx.game.players.map(p=>({id:p.id,device:p.device}))};
  };
  window.verifyPlayableLobby = () => {
    const assert=(value,message)=>{if(!value)throw Error(message);};
    const click=(device,text)=>{
      const panel=document.querySelector(`.lobby-player-panel[data-owner-device="${device}"]`);
      const button=[...panel?.querySelectorAll('button')||[]].find(b=>b.textContent===text);
      assert(button,'Missing '+device+' control: '+text);button.click();
    };
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true}));
    const lobby=ctx.playableLobby,p=ctx.game.players.find(p=>p.device==='keyboard');
    assert(p,'Keyboard joins');click('keyboard','+ New character');
    document.querySelector('.lobby-player-panel input').value='Test '+Date.now().toString().slice(-6);click('keyboard','Create & join');
    assert(lobby.state.members.get(p.id).spawned,'Created character spawns');
    const q=ctx.game.addPlayer('pad:7');ctx.renderLobby();
    assert(lobby.nodes.has(q.id)&&!lobby.nodes.has(p.id),'Selection is independent');
    const before=lobby.state.members.get(p.id).x;
    lobby.update(.05,{keyboard:{x:1,y:0}});
    assert(lobby.state.members.get(p.id).x>before,'Player moves while another selects');
    assert(!lobby.available(q).some(h=>h.id===p.profileId),'Cannot select the same hero twice');
    const pad={index:7,axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};
    // The first saved hero is in use: focus moves to New character, then A opens it.
    lobby.state.members.get(q.id).focus=1;pad.buttons[0].pressed=true;ctx.lobbyController(pad,[]);
    assert(lobby.state.members.get(q.id).panel==='create','Controller owns its creation panel');
    document.querySelector('[data-owner-device="pad:7"] input').value='Other '+Date.now().toString().slice(-6);click('pad:7','Create & join');
    const s=lobby.state.members.get(p.id);s.x=635;s.y=210;
    lobby.update(.01,{keyboard:{interact:true}});
    assert(s.panel==='environment','E opens nearby map object');
    p.ready=true;q.ready=true;click('keyboard','Forest');assert(!p.ready&&!q.ready,'Changing map resets everyone');
    const interactBoard=player=>{const m=lobby.state.members.get(player.id);m.x=770;m.y=420;m.held={};lobby.update(.01,{[player.device]:{interact:true}});assert(m.panel==='board','Board opens prompt');click(player.device,'Ready');};
    interactBoard(p);assert(!q.ready,'Readiness is per player');interactBoard(q);
    lobby.update(1,{});assert(lobby.state.countdown>0,'All ready starts countdown');
    p.ready=false;lobby.update(.01,{});assert(lobby.state.countdown===null,'Cancel aborts countdown');
    p.ready=true;lobby.update(3.1,{});assert(ctx.screen==='play','Countdown starts expedition');
    ctx.show('home');
    return {passed:10};
  };
  window.verifyHouseSave=async()=>{
   localStorage.removeItem("wildbound-house-state-v1");localStorage.removeItem("wildbound-house-designs-v1");
   const {HouseBuilder}=await import('./house-builder.mjs');const {houseLibrary,flushHouseStorage}=await import('./house-design.mjs');
   ctx.game=new ctx.Game();ctx.wireGame();ctx.game.environment='house';const p=ctx.game.addPlayer('keyboard');ctx.game.start();const hp=p.hp,inventory=JSON.stringify(p.inventory);
   const root=document.createElement('section');document.body.append(root);const b=new HouseBuilder();b.mount(root);
   const bed=b.house.furniture.find(f=>f.kind==='bed');bed.x=912;b.draw();await flushHouseStorage();
   const recovered=new HouseBuilder();if(recovered.house.furniture.find(f=>f.kind==='bed').x!==912)throw Error('Draft not recovered');
   await [...root.querySelectorAll('button')].find(x=>x.textContent==='Use this version').onclick();
   if(ctx.game.house.furniture.find(f=>f.kind==='bed').x!==912)throw Error('Visible draft not applied live');
   if(p.hp!==hp||JSON.stringify(p.inventory)!==inventory)throw Error('Apply reset player');
   const next=new ctx.Game();next.environment='house';next.addPlayer('keyboard');next.start();if(next.house.furniture.find(f=>f.kind==='bed').x!==912)throw Error('Next game ignored active house');
   b.house.walls.push({x:780,y:780,w:40,h:40});b.draw();await [...root.querySelectorAll('button')].find(x=>x.textContent==='Use this version').onclick();
   if(!b.status.textContent.startsWith('Not applied:')||ctx.game.house.walls.some(w=>w.x===780&&w.y===780))throw Error('Invalid house applied');root.remove();
   return 'Draft recovery, Use saves visible edits, current and next expedition application, progress preservation and invalid-save feedback passed';
  };
  window.templePreview=async(stage)=>{
    const {ensureTemple,TEMPLE_STAIRS}=await import('./temple.mjs');ctx.game=new ctx.Game();ctx.wireGame();ctx.game.environment='temple';const p=ctx.game.addPlayer('keyboard','Ember');ctx.game.start();ctx.game.openingBoard=false;ensureTemple(ctx.game);ctx.game.bloom=3;ctx.game.explored=new Set(Array.from({length:2500},(_,i)=>i));ctx.game.spawnEvent(ctx.EVENTS.findIndex(e=>e.kind==='gorilla'));ctx.game.eventTime=0;ctx.game.reveal=null;ctx.show('play');ctx.paused=true;ctx.renderer=new ctx.Renderer(ctx.$('game-canvas'),ctx.assets);ctx.renderer.camera={x:800,y:800,zoom:.7};
    if(stage==='upper'||stage==='chest'){Object.assign(p,TEMPLE_STAIRS);ctx.game.enterRoom(p,ctx.game.portals.find(d=>d.temple));if(stage==='chest')ctx.game.openInventory(p,'temple');}
    ctx.renderer.draw(ctx.game,0);ctx.heroUI.draw(ctx.game,ctx.renderer);return true;
  };
  window.verifyLobbyFlow=()=>window.verifyPlayableLobby();
  window.expansionPreview=async(stage)=>{
    const {EVENTS}=await import('./core.mjs');
    const {RIG_SUBJECTS}=await import('./rig-subjects.mjs');
    if(stage==='rigs'){
      const c=document.createElement('canvas');c.width=1200;c.height=700;const x=c.getContext('2d');x.fillStyle='#233d43';x.fillRect(0,0,c.width,c.height);x.imageSmoothingEnabled=false;
      for(const [row,kind] of ['white_lion','snow_leopard','spider'].entries()){
        x.fillStyle='#f2e8c7';x.font='18px sans-serif';x.fillText(kind.replaceAll('_',' '),20,30+row*220);
        for(let d=0;d<8;d++){const angle=d*Math.PI/4;x.save();x.translate(75+d*150,170+row*220);x.scale(2.5,2.5);RIG_SUBJECTS[kind].draw(x,{kind,faceX:Math.sin(angle),faceY:Math.cos(angle),animationAction:'run',playerFrame:d},1);x.restore();}
      }
      return c.toDataURL();
    }
    ctx.game=new ctx.Game();ctx.wireGame();ctx.game.environment=stage==='house'?'house':'ice';
    const p=ctx.game.addPlayer('keyboard');ctx.game.start();ctx.game.openingBoard=false;ctx.game.bloom=3;ctx.game.explored=new Set(Array.from({length:2500},(_,i)=>i));
    ctx.game.spawnEvent(EVENTS.findIndex(e=>e.kind===(stage==='house'?'spider':'white_lion')));
    if(stage==='ice')ctx.game.spawnEvent(EVENTS.findIndex(e=>e.kind==='snow_leopard'));
    if(stage==='blizzard'){ctx.game.spawnEvent(EVENTS.findIndex(e=>e.type==='blizzard'));ctx.game.snowDepth=.9;ctx.game.time=12;p.x=480;p.y=480;}
    ctx.game.eventTime=0;ctx.game.reveal=null;ctx.show('play');ctx.paused=true;ctx.boardPinned=false;
    ctx.renderer=new ctx.Renderer(ctx.$('game-canvas'),ctx.assets);ctx.renderer.camera={x:800,y:800,zoom:stage==='house'?.65:.85};if(stage==='blizzard')ctx.renderer.camera={x:520,y:520,zoom:1.3};ctx.renderer.draw(ctx.game,0);
    return ctx.$('game-canvas').toDataURL();
  };
  window.setupPreview = (stage) => {
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    document.querySelectorAll('.character-gallery,#delete-character-dialog').forEach(d=>d.remove());
    document.querySelector('#character-name-dialog')?.remove();document.querySelector('#controller-keyboard')?.remove();
    ctx.newLobby();const p=ctx.game.addPlayer('pad:0','Scout');ctx.renderLobby();
    if(stage==='create'||stage==='keyboard')ctx.nameNewCharacter(p);
    if(stage==='keyboard')document.querySelector('#character-name-dialog .appearance-toolbar button').click();
    if(stage==='gallery'||stage==='delete'){
      for(const name of ['River','Ember','Felix','Scout','Ranger','Astral','Moonside','Felix Danger','Ember the Fox','Dad','Moonbeam','Willow'])if(!ctx.profiles.data.heroes.some(h=>h.name===name))ctx.profiles.create(name);
      ctx.game.addPlayer('pad:1','Player Two');ctx.renderLobby();
      document.querySelector('.player-slot [data-lobby-focus$="-saved"]').click();
      document.querySelector('[data-device="pad:1"] [data-lobby-focus$="-saved"]').click();
      if(stage==='delete')document.querySelector('.character-gallery').deleteSelected();
    }
    if(stage==='angles'){
      ctx.designer.tab='Players';ctx.designer.playerStudio.setSubject('player');ctx.designer.open();
      const ps=ctx.designer.playerStudio;ps.selected='handR';ps.direction=1;ps.frame=0;ps.mode='animate';ps.refresh();ps.animate(0);
    }
    if(stage==='event'){
      let hero=ctx.profiles.data.heroes[0]||ctx.profiles.create('Event Explorer');ctx.profiles.assign(p,hero);ctx.startGame();
      ctx.game.event={name:'Eyes in the water',verse:'Two green eyes and a patient grin.\nThe river wants to let you in.',tip:'Sidestep the lunge, then attack its flank.'};ctx.game.eventTime=6;ctx.game.eventDuration=7;
    }
  };
  window.animationContactSheet = () => {
    const c = document.createElement("canvas");
    c.width = 800;
    c.height = 650;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    x.fillStyle = "#e9ecdf";
    x.fillRect(0, 0, 800, 650);
    x.fillStyle = "#173e34";
    x.font = "18px Georgia";
    x.fillText("WILDBOUND · PROCEDURAL MOTION STUDIES", 25, 32);
    const names = ["explorer-teal", "lion", "panther", "snake", "bat", "golem"];
    const anim = new ctx.Animator(ctx.assets);
    names.forEach((name, row) => {
      x.fillStyle = "#173e34";
      x.font = "12px monospace";
      x.fillText(name, 20, 90 + row * 92);
      for (let i = 0; i < 7; i++) {
        const t = (i / 7) * Math.PI * 2;
        x.fillStyle = "#cad4bb";
        x.fillRect(159 + i * 90, 49 + row * 92, 86, 86);
        const a = {
          id: 1,
          x: 200 + i * 90,
          y: 92 + row * 92,
          kind: name,
          sprite: name,
          step: t,
          moving: true,
          faceX: 0,
          faceY: 1,
          state: "hunt",
          attack: row === 0 && i >= 4 ? 0.34 - (i - 4) * 0.1 : 0,
        };
        anim.draw(x, a, t, 55);
      }
    });
    return c.toDataURL("image/png");
  };
  window.creatureRevisionPreview = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 430;
    const c = canvas.getContext("2d");
    c.fillStyle = "#23332f";
    c.fillRect(0, 0, 960, 430);
    c.fillStyle = "#dace9e";
    c.font = "bold 26px system-ui";
    c.fillText("WILDBOUND · DRAGON & FIRE ELEMENTAL", 32, 45);
    c.fillStyle = "#8fa99b";
    c.font = "15px system-ui";
    c.fillText("Actual in-game rigs", 32, 72);
    c.strokeStyle = "#3b4c42";
    c.lineWidth = 1;
    for (let x = 32; x < 940; x += 32) {
      c.beginPath();
      c.moveTo(x, 95);
      c.lineTo(x, 355);
      c.stroke();
    }
    for (let y = 99; y < 360; y += 32) {
      c.beginPath();
      c.moveTo(24, y);
      c.lineTo(936, y);
      c.stroke();
    }
    const animator = new ctx.Animator(ctx.assets);
    animator.draw(
      c,
      {
        sprite: "dragon",
        x: 300,
        y: 316,
        faceX: -1,
        faceY: 0.5,
        animationAction: "idle",
        playerFrame: 2,
      },
      0,
      145,
    );
    animator.draw(
      c,
      {
        sprite: "fire_elemental",
        x: 740,
        y: 316,
        faceX: 0,
        faceY: 1,
        animationAction: "idle",
        playerFrame: 2,
      },
      0,
      155,
    );
    c.fillStyle = "#e8d59c";
    c.font = "bold 20px system-ui";
    c.fillText("DRAGON", 240, 390);
    c.fillText("FIRE ELEMENTAL", 660, 390);
    return canvas.toDataURL("image/png");
  };
  window.playerContactSheet = (subject = "player", equipment = {}) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1040;
    canvas.height = 900;
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    c.fillStyle = "#303250";
    c.fillRect(0, 0, 1040, 900);
    c.font = "bold 21px system-ui";
    c.fillStyle = "#ded280";
    c.fillText(
      "WILDBOUND / " +
        subject.toUpperCase() +
        " / " +
        ctx.RIG_SUBJECTS[subject].clip.toUpperCase() +
        " · 8 DIRECTIONS",
      32,
      36,
    );
    c.font = "13px system-ui";
    c.fillStyle = "#aea3ce";
    c.fillText(
      "Actual game renderer • one rig • eight keyed poses • fixed ground anchor",
      32,
      61,
    );
    const animator = new ctx.Animator(ctx.assets);
    ctx.DIRECTIONS.forEach((name, d) => {
      const [faceX, faceY] = ctx.directionVector(d),
        y = 155 + d * 100;
      c.fillStyle = "#ada0d4";
      c.fillText(name, 25, y - 25);
      c.fillStyle = "#494563";
      c.fillRect(70, y + 3, 930, 1);
      for (let f = 0; f < 8; f++) {
        animator.draw(
          c,
          {
            sprite: ctx.RIG_SUBJECTS[subject].sprite,
            equipment,
            x: 120 + f * 120,
            y,
            faceX,
            faceY,
            animationAction: ctx.RIG_SUBJECTS[subject].clip,
            playerFrame: f,
          },
          0,
          subject === "dragon"
            ? 50
            : subject === "player"
              ? 102
              : subject === "bat"
                ? 63
                : 78,
        );
        c.fillStyle = "#a49bbb";
        c.fillText(String(f), 116 + f * 120, y + 22);
      }
    });
    return canvas.toDataURL("image/png");
  };
  window.showcase = async (view) => {
    if (view === "event-text" || view === "music-settings") {
      await window.showcase("game");
      if (view === "event-text") {
        ctx.game.eventTime = 5;
        ctx.updateHud();
      } else ctx.$("settings-dialog").showModal();
      await new Promise((resolve) => setTimeout(resolve, 200));
      return;
    }
    if (view === "graph-editor") {
      await window.showcase("dragon-studio");
      const ps = ctx.designer.playerStudio;
      ps.selected = "wingTipL";
      ps.direction = 1;
      ps.root.querySelector('[data-view="graph"]').click();
      ps.root.querySelector(".ps-render-order").open = true;
      ps.refresh();
      ps.animate(0);
      await new Promise((resolve) => setTimeout(resolve, 180));
      return;
    }
    for (const d of document.querySelectorAll("dialog[open]")) d.close();
    if (view === "environment") {
      ctx.game = new ctx.Game(() => 0.42);
      ctx.wireGame();
      const p = ctx.game.addPlayer("keyboard", "Ember");
      ctx.game.start();
      ctx.game.openingBoard = false;
      p.x = 480;
      p.y = 660;
      ctx.game.weather = { type: "monsoon", life: 45, intensity: 1 };
      ctx.game.time = 12;
      ctx.game.scenery.push(
        {
          id: "preview-tree",
          x: 530,
          y: 625,
          size: 98,
          kind: "tree",
          procedural: true,
          harvest: 24,
          maxHarvest: 84,
          hitAt: 12,
        },
        {
          id: "preview-rock",
          x: 450,
          y: 710,
          size: 48,
          kind: "rock",
          procedural: true,
          chipped: 1,
          harvest: 24,
          maxHarvest: 36,
          hitAt: 12,
        },
      );
      for (let y = 12; y < 29; y++)
        for (let x = 6; x < 24; x++) ctx.game.explored.add(y * 50 + x);
      ctx.game.footprints = Array.from({ length: 9 }, (_, i) => ({
        x: 465 + i * 2,
        y: 725 - i * 6,
        angle: -1.5,
        time: 10 + i * 0.1,
        water: false,
      }));
      ctx.game.dropLoot(505, 710, "log", 2, "Harvested");
      ctx.game.dropLoot(493, 710, "stone", 1, "Harvested");
      ctx.renderer = new ctx.Renderer(ctx.$("game-canvas"), ctx.assets);
      ctx.renderer.camera = { x: 475, y: 665, zoom: 1.7 };
      ctx.show("play");
      ctx.paused = true;
      ctx.boardPinned = false;
      ctx.renderer.draw(ctx.game, 0);
      ctx.updateHud();
      await new Promise((r) => setTimeout(r, 160));
      return;
    }
    if (view === "loot") {
      ctx.game = new ctx.Game(() => 0.42);
      ctx.wireGame();
      const p = ctx.game.addPlayer("keyboard", "Scout");
      ctx.game.start();
      p.x = 600;
      p.y = 570;
      ctx.game.event = null;
      ctx.game.loot = [];
      ctx.ITEM_ART_TYPES.forEach((type, i) =>
        ctx.game.dropLoot(
          520 + (i % 5) * 38,
          600 + Math.floor(i / 5) * 38,
          type,
          type === "arrow" ? 12 : 1,
          "Board treasure",
        ),
      );
      ctx.renderer = new ctx.Renderer(ctx.$("game-canvas"), ctx.assets);
      ctx.renderer.camera = { x: 610, y: 620, zoom: 3 };
      ctx.show("play");
      ctx.paused = true;
      ctx.boardPinned = false;
      await new Promise((r) => setTimeout(r, 160));
      return;
    }
    if (
      view === "studio" ||
      view === "events" ||
      (view.endsWith("-studio") &&
        ctx.RIG_SUBJECTS[view.replace("-studio", "")])
    ) {
      ctx.show("workshop");
      ctx.designer.tab = view === "events" ? "Events" : "Players";
      ctx.designer.playerStudio.setSubject(
        view.endsWith("-studio") ? view.replace("-studio", "") : "player",
      );
      ctx.designer.kind = "lion";
      ctx.designer.open();
      ctx.designer.animate(0.1);
      await new Promise((r) => setTimeout(r, 160));
      return;
    }
    if (["ending", "sealing", "regrowth"].includes(view)) {
      ctx.game = new ctx.Game(() => 0.42);
      ctx.wireGame();
      const p = ctx.game.addPlayer("keyboard", "Ember");
      ctx.game.addPlayer("preview:1", "Astral");
      ctx.game.start();
      p.progress = ctx.FINISH;
      ctx.game.spawnEvent(0);
      ctx.game.beginSeal(p);
      if (view === "sealing") ctx.game.sealTime = 1.3;
      else {
        ctx.game.completeVictory();
        if (view === "regrowth") {
          ctx.game.newExpedition();
          ctx.game.bloom = 1.2;
        }
      }
      ctx.paused = true;
      ctx.boardPinned = false;
      ctx.show("play");
      ctx.renderer = new ctx.Renderer(ctx.$("game-canvas"), ctx.assets);
      ctx.renderer.camera = { x: ctx.CENTER, y: ctx.CENTER, zoom: 0.72 };
      ctx.renderer.draw(ctx.game, 0.016);
      ctx.updateHud();
      await new Promise((r) => setTimeout(r, 160));
      return;
    }
    if (
      [
        "storage",
        "inventory",
        "storage-chest",
        "magic-gear",
        "robot-shop",
        "vending-shop",
      ].includes(view)
    ) {
      ctx.game = new ctx.Game();
      ctx.wireGame();
      ctx.game.environment="forest"; // Fixed map for storage UI fixtures.
      const p = ctx.game.addPlayer("keyboard", "Ember"),
        q = ctx.game.addPlayer("preview:1", "Astral");
      ctx.game.start();
      ctx.game.scenery=ctx.game.scenery.filter(s=>Math.hypot(s.x-500,s.y-500)>150);
      p.x = 500;
      p.y = 500;
      q.x = 560;
      q.y = 490;
      ctx.give(p.inventory, "sword");
      ctx.give(p.inventory, "shield");
      ctx.give(p.inventory, "potion", 4);
      ctx.give(p.inventory, "arrow", 18);
      ctx.give(p.inventory, "bow");
      ctx.give(p.chests[0], "gloves");
      ctx.equip(p, 1);
      ctx.equip(p, 1);
      if (view === "magic-gear") {
        p.equipment = {
          ...p.equipment,
          head: "hat",
          neck: "charm",
          cape: "night_cape",
          hand1: "violet_wand",
          hand2: null,
        };
        p.mana = 62;
      }
      p.coins = 35;
      ctx.game.openingBoard = false;
      ctx.game.explored = new Set(Array.from({ length: 2500 }, (_, i) => i));
      ctx.paused = true;
      ctx.show("play");
      ctx.boardPinned = false;
      ctx.renderer = new ctx.Renderer(ctx.$("game-canvas"), ctx.assets);
      ctx.renderer.camera = { x: 530, y: 500, zoom: 1.1 };
      ctx.game.update(0.05, {});
      if (
        view === "storage" ||
        view === "storage-chest" ||
        view === "robot-shop" ||
        view === "vending-shop"
      ) {
        ctx.game.portal(p);
        {
          const entryDoor = ctx.game.portals.find((d) => d.owner === p.id);
          p.x = entryDoor.x;
          p.y = entryDoor.y;
          ctx.game.enterRoom(p, entryDoor);
        }
        if (view === "storage-chest") ctx.game.openInventory(p, 0);
        if (view === "robot-shop") {
          ctx.game.openShop(p, "robot");
          p.robotStock = [
            { type: "sword", qty: 1 },
            { type: "stamina_potion", qty: 2 },
          ];
        }
        if (view === "vending-shop") {
          ctx.game.openShop(p, "vending");
          ctx.game.purchaseVending(p, 1);
          ctx.game.tickAdventure(0.9, {});
        }
      } else {
        ctx.game.openInventory(p);
        if (view === "magic-gear") ctx.game.inventoryAction(p, "panel:gear");
      }
      ctx.renderer.draw(ctx.game, 0.05);
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      ctx.updateHud();
      await new Promise((r) => setTimeout(r, 150));
      return;
    }
    if (view === "occlusion") {
      ctx.game = new ctx.Game();
      ctx.wireGame();
      const tree = ctx.game.scenery.find(
        (d) =>
          d.kind === "tree" &&
          d.x > 400 &&
          d.x < 1200 &&
          d.y > 400 &&
          d.y < 1200,
      );
      const a = ctx.game.addPlayer("keyboard", "Behind canopy"),
        b = ctx.game.addPlayer("preview:1", "In front");
      ctx.game.start();
      ctx.game.time = 4;
      a.rolls = 1;
      a.x = tree.x;
      a.y = tree.y - 12;
      b.x = tree.x + 70;
      b.y = tree.y + 60;
      ctx.paused = true;
      ctx.boardPinned = false;
      ctx.show("play");
      ctx.renderer = new ctx.Renderer(ctx.$("game-canvas"), ctx.assets);
      ctx.renderer.camera = { x: tree.x + 30, y: tree.y + 20, zoom: 1.5 };
      for (let i = 0; i < 25; i++) ctx.renderer.draw(ctx.game, 0.05);
      ctx.updateHud();
    } else if (view === "opening-board") {
      ctx.game = new ctx.Game();
      ctx.wireGame();
      ctx.game.addPlayer("keyboard", "Scout");
      ctx.game.addPlayer("preview:1", "Ember");
      ctx.game.start();
      ctx.renderer = new ctx.Renderer(ctx.$("game-canvas"), ctx.assets);
      ctx.show("play");
      ctx.paused = true;
      ctx.boardPinned = false;
      ctx.renderer.draw(ctx.game, 0);
      ctx.updateHud();
    } else if (view === "game") {
      ctx.game = new ctx.Game(() => 0.42);
      ctx.wireGame();
      ctx.game.addPlayer("keyboard", "Scout");
      ctx.game.addPlayer("preview:1", "Ember");
      ctx.game.addPlayer("preview:2", "Astral");
      ctx.game.start();
      ctx.game.time = 5;
      ctx.game.spawnEvent(0);
      ctx.game.players[0].progress = 7;
      ctx.game.players[0].boardProgress = 7;
      ctx.game.players[0].rolls = 1;
      ctx.game.players[1].x += 30;
      ctx.renderer = new ctx.Renderer(ctx.$("game-canvas"), ctx.assets);
      ctx.paused = true;
      ctx.boardPinned = true;
      ctx.show("play");
      ctx.renderer.camera = { x: ctx.CENTER, y: ctx.CENTER, zoom: 1.05 };
      ctx.updateHud();
      ctx.renderer.draw(ctx.game, 0.016);
    } else if (view === "lobby") {
      ctx.newLobby();
      ctx.game.addPlayer("keyboard", "Scout");
      ctx.game.addPlayer("preview:1", "Ember");
      ctx.game.addPlayer("preview:2", "Astral");
      ctx.renderLobby();
    } else if (view === "footprint") {
      ctx.show("workshop");
      ctx.workshop.openSprite("tree");
      ctx.$("sprite-layer").value = "footprint";
      ctx.$("sprite-layer").onchange();
    } else if (view === "crop") {
      ctx.show("workshop");
      await ctx.workshop.loadImage(
        new File(
          [await (await fetch("assets/concept-sheet.png")).blob()],
          "concept-sheet.png",
          { type: "image/png" },
        ),
      );
      ctx.workshop.crop = { x: 20, y: 18, w: 216, h: 266 };
      ctx.workshop.drawSource();
    } else {
      ctx.show(view);
      if (view === "workshop") ctx.workshop.openSprite("lion");
    }
    await new Promise((r) => setTimeout(r, 250));
  };
  window.runSmokeTests = async () => {
    ctx.replaceLionMotion(ctx.defaultLionMotion());
    for (const kind of [
      "bat",
      "snake",
      "monkey",
      "vine",
      "golem",
      "trap",
      "rhino",
      "panther",
      "boar",
      "beetle",
      "crocodile",
      "skeleton",
      "archer",
      "skeleton_unarmed",
      "skeleton_boss",
    ])
      ctx.RIG_SUBJECTS[kind].replace(ctx.RIG_SUBJECTS[kind].defaults());
    const results = [];
    const check = (name, fn) => {
      try {
        if (!fn()) throw Error("Assertion failed");
        results.push({ name, pass: true });
      } catch (e) {
        results.push({ name, pass: false, error: e.message });
      }
    };
    for (const track of ctx.MUSIC_TRACKS) {
      const playable = await new Promise((resolve) => {
        const audio = new Audio();
        audio.muted = true;
        audio.preload = "auto";
        const done = (result) => {
          clearTimeout(timeout);
          audio.oncanplay = audio.onerror = null;
          audio.removeAttribute("src");
          audio.load();
          resolve(result);
        };
        const timeout = setTimeout(() => done(false), 10000);
        audio.oncanplay = () =>
          done(Number.isFinite(audio.duration) && audio.duration > 0);
        audio.onerror = () => done(false);
        audio.src = track.file;
        audio.load();
      });
      check("Music decodes: " + track.name, () => playable);
    }
    check('Expedition soundtrack offers random and explicit tracks',()=>ctx.$('music-track').value==='random'&&!ctx.$('music-track').disabled&&ctx.MUSIC_TRACKS.length>=11&&ctx.music.loop);
    check(
      "Three-player second roll renders water elementals and all heroes at fullscreen size",
      () => {
        const g = new ctx.Game(() => 0.2);
        for (let i = 0; i < 3; i++) g.addPlayer("pad:" + i);
        g.start();
        g.openingBoard = false;
        g.turnOrder = [g.players[0].id];
        g.hitTable(g.players[1]);
        g.spawnEvent(ctx.EVENTS.findIndex((e) => e.kind === "water_elemental"));
        const canvas = document.createElement("canvas");
        Object.defineProperties(canvas, {
          clientWidth: { value: 1920 },
          clientHeight: { value: 1080 },
        });
        const r = new ctx.Renderer(canvas, ctx.assets);
        r.draw(g, 0.016);
        for (let i = 0; i < 190; i++) g.update(0.016);
        r.draw(g, 0.016);
        return (
          g.players.length === 3 &&
          g.players.every((p) => Number.isFinite(p.x) && p.hp > 0)
        );
      },
    );
    check(
      "25 generated sprites load and validate",
      () =>
        Object.keys(ctx.assets.library).length >= 25 &&
        Object.values(ctx.assets.library).every(ctx.validateSprite),
    );
    check(
      "Pixel loader draws before game imports and stops when ready",
      () =>
        window.wildboundBoot.firstDraw < window.wildboundBoot.importStarted &&
        document.getElementById("loading").classList.contains("done") &&
        window.wildboundBoot.painted,
    );
    const bootAnimation = window.wildboundBoot;
    bootAnimation.startAnimation();
    await new Promise((r) => setTimeout(r, 100));
    const stallStart = Date.now();
    while (Date.now() - stallStart < 450) {}
    const stallEnd = Date.now();
    await new Promise((r) => setTimeout(r, 100));
    check(
      "Pixel loader keeps advancing on its worker during a blocked game thread",
      () =>
        bootAnimation.mode === "worker" &&
        new Set(
          bootAnimation.frames
            .filter((f) => f.time > stallStart && f.time < stallEnd)
            .map((f) => f.phase),
        ).size >= 4,
    );
    bootAnimation.stopAnimation();
    ctx.$("local-button").click();
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        code: "Enter",
        key: "Enter",
        bubbles: true,
      }),
    );
    check(
      "Keyboard joins via lobby Enter",
      () =>
        ctx.game.players.length === 1 &&
        ctx.game.players[0].device === "keyboard",
    );
    ctx.game.addPlayer("test-controller", "Ember");
    ctx.nameNewCharacter(ctx.game.players[0]);
    const nameDialog = document.querySelector("#character-name-dialog");
    nameDialog.querySelector("input").value =
      "Test " + crypto.randomUUID().slice(0, 8);
    nameDialog.querySelector("form").requestSubmit();
    check("New character name dialog creates a persistent named hero", () =>
      ctx.profiles.data.heroes.some(
        (h) => h.id === ctx.game.players[0].profileId,
      ),
    );
    ctx.nameNewCharacter(ctx.game.players[1]);
    const secondDialog = document.querySelector("#character-name-dialog");
    secondDialog.querySelector("input").value =
      ctx.game.players[0].name.toUpperCase();
    secondDialog.querySelector("form").requestSubmit();
    check(
      "Duplicate names are rejected in the creation dialog",
      () =>
        secondDialog.open &&
        secondDialog.querySelector(".name-error").textContent.length > 0,
    );
    secondDialog.querySelector("input").value =
      "Test " + crypto.randomUUID().slice(0, 8);
    secondDialog.querySelector("form").requestSubmit();
    ctx.renderLobby();
    check(
      "Lobby portrait displays selected saved gear and refreshes when switching characters",
      () => {
        const hero = ctx.game.players[0],
          saved = ctx.profiles.data.heroes.find((h) => h.id === hero.profileId);
        const plain = document.querySelector(".player-slot canvas").toDataURL();
        saved.equipment.hand1 = "sword";
        saved.equipment.hand2 = "shield";
        saved.equipment.head = "hat";
        ctx.profiles.assign(hero, saved);
        ctx.renderLobby();
        const equipped = document
          .querySelector(".player-slot canvas")
          .toDataURL();
        const other = ctx.profiles.create(
          "Preview " + crypto.randomUUID().slice(0, 8),
        );
        ctx.renderLobby();
        document.querySelector('.player-slot [data-lobby-focus$="-saved"]').click();
        const picker=document.querySelector('.character-gallery');
        for(let i=0;i<ctx.profiles.data.heroes.length;i++)picker.shiftCharacter(-1);
        for(let i=0;i<ctx.profiles.data.heroes.length&&picker.dataset.selected!==other.id;i++)picker.shiftCharacter(1);
        picker.querySelector('.carousel-name').click();
        const switched = document
          .querySelector(".player-slot canvas")
          .toDataURL();
        const correct =
          hero.profileId === other.id &&
          plain === switched &&
          equipped !== plain;
        ctx.profiles.assign(hero, saved);
        ctx.renderLobby();
        return correct;
      },
    );
    for (const button of document.querySelectorAll('.party-ready')) button.click();
    ctx.$("begin-button").click();
    check(
      "Lobby opens gameplay",
      () => ctx.screen === "play" && ctx.game.phase === "play",
    );
    check("Turn order starts unassigned", () => ctx.game.current === null);
    check(
      "Losing window focus clears keyboard and mouse without pausing gameplay",
      () => {
        ctx.keys.add("KeyW");
        ctx.mouse.down = true;
        ctx.mouse.dash = true;
        ctx.mouse.active = true;
        const wasPaused = ctx.paused;
        window.dispatchEvent(new Event("blur"));
        return (
          ctx.paused === wasPaused &&
          !ctx.keys.size &&
          !ctx.mouse.down &&
          !ctx.mouse.dash &&
          !ctx.mouse.active
        );
      },
    );
    ctx.game.players[0].x = 800;
    ctx.game.players[0].y = 720;
    ctx.game.players[0].faceY = 1;
    check("Current player attack rolls table", () => {
      ctx.game.attack(ctx.game.players[0]);
      return !!ctx.game.roll;
    });
    check(
      "Repeated hits cannot reroll",
      () => !ctx.game.hitTable(ctx.game.players[0]),
    );
    for (let i = 0; i < 100; i++) ctx.game.update(0.05);
    check(
      "Roll advances and opening lion or temple tiger appears",
      () =>
        ctx.game.players[0].progress >= 2 &&
        ctx.game.current === null &&
        ctx.game.enemies.some((e) => e.kind === (ctx.game.generatedEnvironment==="temple"?"tiger":"lion")),
    );
    // Exercise stacking with a creature event; weather legitimately adds no enemies.
    const smokeSpawnEvent = ctx.game.spawnEvent;
    ctx.game.spawnEvent = function () {
      return smokeSpawnEvent.call(this, 0);
    };
    ctx.game.hitTable(ctx.game.players[1]);
    for (let i = 0; i < 100; i++) ctx.game.update(0.05);
    ctx.game.spawnEvent = smokeSpawnEvent;
    check(
      "Threats stack and first round locks roster",
      () =>
        ctx.game.enemies.length >= 2 &&
        ctx.game.locked &&
        !ctx.game.addPlayer("late"),
    );
    ctx.show("workshop");
    ctx.workshop.openSprite("lion");
    check(
      "Workshop loads editable pixels",
      () =>
        ctx.workshop.sprite.width === 48 &&
        ctx.$("sprite-name").value === "lion",
    );
    const old = ctx.workshop.sprite.pixels[0];
    ctx.workshop.checkpoint();
    ctx.workshop.sprite.pixels[0] = 1;
    ctx.workshop.undo();
    check(
      "Pixel undo restores original",
      () => ctx.workshop.sprite.pixels[0] === old,
    );
    const image = { width: 4, height: 4, data: new Uint8ClampedArray(64) };
    for (let i = 0; i < 64; i += 4) image.data.set([255, 0, 0, 255], i);
    check("Image crop converts to exact dimensions", () => {
      const s = ctx.convertRegion(image, { x: 0, y: 0, w: 4, h: 4 }, 32);
      return (
        s.width === 32 && s.pixels.length === 1024 && s.pixels.some(Boolean)
      );
    });
    const originalPads = Object.getOwnPropertyDescriptor(
      navigator,
      "getGamepads",
    );
    const fakePads = [0, 1].map((index) => ({
      index,
      id: "Simulated controller " + index,
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 16 }, () => ({ pressed: false })),
    }));
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => fakePads,
    });
    try {
      ctx.previousPads.clear();
      ctx.newLobby();
      fakePads.forEach((p) => (p.buttons[0].pressed = true));
      ctx.inputFrame();
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Enter",
          key: "Enter",
          bubbles: true,
        }),
      );
      check(
        "Two controllers and keyboard claim separate slots",
        () =>
          ctx.game.players.length === 3 &&
          new Set(ctx.game.players.map((p) => p.device)).size === 3,
      );
      fakePads.forEach((p) => (p.buttons[0].pressed = false));
      for (const hero of ctx.game.players)
        ctx.profiles.assign(
          hero,
          ctx.profiles.create("Pad " + crypto.randomUUID().slice(0, 8)),
        );
      ctx.startGame();
      ctx.game.players[0].x = 800;
      ctx.game.players[0].y = 720;
      ctx.game.players[0].faceY = 1;
      const x = ctx.game.players[0].x,
        other = ctx.game.players[1].x;
      fakePads[0].axes[0] = 1;
      ctx.game.update(0.05, ctx.inputFrame());
      check(
        "Opening board prevents controller movement",
        () => ctx.game.players[0].x === x,
      );
      ctx.game.openingBoard = false;
      ctx.game.update(0.05, ctx.inputFrame());
      check(
        "Controller movement affects only its assigned player",
        () => ctx.game.players[0].x > x && ctx.game.players[1].x === other,
      );
      check(
        "Controller players keep moving after the keyboard window loses focus",
        () => {
          const before = ctx.game.players[0].x,
            keyboard = ctx.game.players.find((p) => p.device === "keyboard"),
            keyboardX = keyboard.x;
          window.dispatchEvent(new Event("blur"));
          ctx.game.update(0.05, ctx.inputFrame());
          return (
            !ctx.paused &&
            ctx.game.players[0].x > before &&
            keyboard.x === keyboardX
          );
        },
      );
      ctx.game.openingBoard = true;
      fakePads[0].axes[0] = 0;
      ctx.game.players[0].faceX = 0;
      ctx.game.players[0].faceY = 1;
      fakePads[1].buttons[0].pressed = true;
      ctx.game.update(0.05, ctx.inputFrame());
      check("Wrong controller cannot trigger board roll", () => !ctx.game.roll);
      fakePads[0].buttons[0].pressed = true;
      ctx.game.update(0.05, ctx.inputFrame());
      fakePads[0].buttons[0].pressed = false;
      ctx.game.update(0.05, ctx.inputFrame());
      check("Current controller attack rolls the board", () => !!ctx.game.roll);
      fakePads[0].buttons[9].pressed = true;
      ctx.inputFrame();
      check(
        "Controller Start pauses play",
        () => ctx.paused && ctx.$("pause-dialog").open,
      );
      ctx.$("pause-dialog").close();
    } finally {
      if (originalPads)
        Object.defineProperty(navigator, "getGamepads", originalPads);
      else delete navigator.getGamepads;
      ctx.previousPads.clear();
    }
    ctx.show("workshop");
    await ctx.workshop.loadImage(
      new File(
        [await (await fetch("assets/concept-sheet.png")).blob()],
        "concept-sheet.png",
        { type: "image/png" },
      ),
    );
    check(
      "Large source image opens crop dialog",
      () => ctx.$("crop-dialog").open && ctx.workshop.source.width > 1000,
    );
    ctx.workshop.crop = { x: 20, y: 18, w: 216, h: 266 };
    ctx.$("crop-size").value = "32";
    ctx.$("use-crop").click();
    check(
      "Crop enters editable pixel canvas",
      () => ctx.workshop.sprite.width === 32 && !ctx.$("crop-dialog").open,
    );
    ctx.$("sprite-name").value = "smoke-import";
    ctx.$("save-sprite").click();
    const loaded = new ctx.Assets();
    await loaded.load();
    check(
      "Saved imported sprite survives library reload",
      () => loaded.library["smoke-import"]?.width === 32,
    );
    delete ctx.assets.overrides["smoke-import"];
    delete ctx.assets.library["smoke-import"];
    ctx.assets.cache.delete("smoke-import");
    localStorage.setItem(
      "wildbound-sprites",
      JSON.stringify(ctx.assets.overrides),
    );
    ctx.workshop.library();
    ctx.$("crop-size").value = "48";
    ctx.workshop.openSprite("tree");
    ctx.$("sprite-layer").value = "footprint";
    ctx.$("sprite-layer").onchange();
    ctx.workshop.checkpoint();
    ctx.workshop.sprite.footprint.fill(0);
    ctx.workshop.setTool("pencil");
    const r = ctx.$("pixel-canvas").getBoundingClientRect();
    ctx.workshop.paint({
      clientX: r.left + r.width * 0.5,
      clientY: r.top + r.height * 0.88,
    });
    check(
      "Collision layer painting changes mask without changing artwork",
      () =>
        ctx.workshop.sprite.footprint.some(Boolean) &&
        ctx.workshop.sprite.pixels.every(
          (p, i) => p === ctx.assets.library.tree.pixels[i],
        ),
    );
    const mask = structuredClone(ctx.workshop.sprite.footprint);
    ctx.$("sprite-name").value = "smoke-footprint";
    ctx.workshop.save();
    const again = new ctx.Assets();
    await again.load();
    check(
      "Collision footprint survives saving and reloading",
      () =>
        JSON.stringify(again.library["smoke-footprint"].footprint) ===
        JSON.stringify(mask),
    );
    delete ctx.assets.library["smoke-footprint"];
    delete ctx.assets.overrides["smoke-footprint"];
    localStorage.setItem(
      "wildbound-sprites",
      JSON.stringify(ctx.assets.overrides),
    );
    ctx.$("sprite-layer").value = "art";
    ctx.$("sprite-layer").onchange();
    ctx.workshop.openSprite("lion");
    const p = ctx.game.players[0];
    p.hp = 60;
    ctx.give(p.inventory, "potion");
    ctx.game.usePotion(p);
    check(
      "Potion restores health and consumes inventory stack",
      () => p.hp === 100,
    );
    ctx.game.openInventory(p);
    ctx.heroUI.draw(ctx.game, ctx.renderer);
    check(
      "Mouse inventory controls survive frames and activate tabs and items",
      () => {
        const panel = ctx.heroUI.panels.get(p.id);
        const tab = panel.querySelector('[data-action="gear"]');
        tab.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
        );
        for (let n = 0; n < 5; n++) ctx.heroUI.draw(ctx.game, ctx.renderer);
        if (
          tab !== panel.querySelector('[data-action="gear"]') ||
          !tab.isConnected
        )
          return false;
        tab.click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        if (p.ui.panel !== "gear") return false;
        panel.querySelector('[data-action="item3"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        if (p.ui.index !== 3) return false;
        panel.querySelector('[data-action="pack"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        return p.ui.panel === "pack";
      },
    );
    check("Mouse item action equips gear and close dismisses the panel", () => {
      ctx.give(p.inventory, "sword");
      const index = p.inventory.findIndex((item) => item?.type === "sword");
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      const panel = ctx.heroUI.panels.get(p.id);
      panel.querySelector('[data-action="item' + index + '"]').click();
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      panel.querySelector('[data-action="use"]').click();
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      const equipped = p.equipment.hand1 === "sword";
      panel.querySelector('[data-action="close"]').click();
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      const closed = !p.ui && !panel.isConnected;
      ctx.game.openInventory(p);
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      return equipped && closed;
    });
    check("Compact player status panels have no action buttons", () => {
      ctx.renderRoster();
      const card = [...ctx.$("roster").children].find((c) => c.hero === p);
      for (let n = 0; n < 5; n++) ctx.renderRoster();
      return (
        card.isConnected &&
        !card.querySelector("button") &&
        card.getBoundingClientRect().width < 210
      );
    });
    check("Inventory window and ten paper-doll slots exist", () => {
      ctx.game.inventoryAction(p, "panel:gear");
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      return ctx.heroRoot.querySelectorAll(".paper-doll button").length === 10;
    });
    check(
      "Equipment sits above backpack; drag equips offhand and rejects invalid slots",
      () => {
        const gear = { ...p.equipment },
          pack = structuredClone(p.inventory);
        p.inventory = [
          { type: "sword", qty: 1 },
          { type: "hat", qty: 1 },
        ];
        p.equipment.hand2 = null;
        ctx.game.openInventory(p);
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const panel = ctx.heroUI.panels.get(p.id),
          bag = panel.querySelector(".inventory-window"),
          doll = panel.querySelector(".equipment-window");
        const sideBySide =
          doll.getBoundingClientRect().bottom <=
          bag.getBoundingClientRect().top;
        const drag = (source, target) => {
          const dataTransfer = new DataTransfer();
          source.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, dataTransfer }),
          );
          for (let i = 0; i < 3; i++) ctx.heroUI.draw(ctx.game, ctx.renderer);
          target.dispatchEvent(
            new DragEvent("dragover", {
              bubbles: true,
              cancelable: true,
              dataTransfer,
            }),
          );
          target.dispatchEvent(
            new DragEvent("drop", {
              bubbles: true,
              cancelable: true,
              dataTransfer,
            }),
          );
          source.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, dataTransfer }),
          );
          ctx.heroUI.draw(ctx.game, ctx.renderer);
        };
        drag(
          panel.querySelector('[data-container="pack"] button'),
          panel.querySelector('[data-slot="hand2"]'),
        );
        const equipped =
          p.equipment.hand2 === "sword" && ctx.count(p, "sword") === 0;
        const before = JSON.stringify([p.inventory, p.equipment]);
        drag(
          panel.querySelector('[data-container="pack"] button'),
          panel.querySelector('[data-slot="hand2"]'),
        );
        const rejected = JSON.stringify([p.inventory, p.equipment]) === before;
        drag(
          panel.querySelector('[data-slot="hand2"]'),
          panel.querySelector('[data-container="pack"]'),
        );
        const removed = !p.equipment.hand2 && ctx.count(p, "sword") === 1;
        p.inventory = pack;
        p.equipment = gear;
        ctx.game.openInventory(p);
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        return sideBySide && equipped && rejected && removed;
      },
    );
    check("Wand mana meter appears only while a magical weapon is held", () => {
      const oldGear = { ...p.equipment };
      p.equipment.hand1 = "wand";
      p.mana = 62;
      ctx.renderRoster();
      const shown = ctx
        .$("roster")
        .querySelector(".mana-meter")
        .textContent.includes("62 / 100 MANA");
      p.equipment.hand1 = null;
      ctx.renderRoster();
      const hidden = !ctx.$("roster").querySelector(".mana-meter").textContent;
      p.equipment = oldGear;
      ctx.renderRoster();
      return shown && hidden;
    });
    p.ui = null;
    ctx.game.portal(p);
    {
      const entryDoor = ctx.game.portals.find((d) => d.owner === p.id);
      p.x = entryDoor.x;
      p.y = entryDoor.y;
      ctx.game.enterRoom(p, entryDoor);
    }
    ctx.heroUI.draw(ctx.game, ctx.renderer);
    check(
      "Private room shows three accessible chests",
      () => ctx.heroRoot.textContent.includes("Chest 3") && p.room !== null,
    );
    check(
      "Chest and backpack are separate mouse-operable windows with two-way transfers",
      () => {
        const savedPack = structuredClone(p.inventory),
          savedChests = structuredClone(p.chests);
        ctx.game.openInventory(p, 0);
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const bag = ctx.heroRoot.querySelector(".inventory-window"),
          chest = ctx.heroRoot.querySelector(".chest-window");
        if (!bag || !chest) return false;
        const layout =
          bag.getBoundingClientRect().bottom <=
          chest.getBoundingClientRect().top;
        ctx.heroRoot.querySelector('[data-action="storage-pack-0"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const type = p.inventory[0].type,
          qty = ctx.count(p, type),
          storedBefore = p.chests[0]
            .filter((i) => i?.type === type)
            .reduce((n, i) => n + i.qty, 0);
        ctx.heroRoot.querySelector('[data-action="transfer-pack"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const stored =
          ctx.count(p, type) < qty && p.chests[0].some((i) => i?.type === type);
        const n = p.chests[0].findIndex((i) => i?.type === type);
        ctx.heroRoot
          .querySelector('[data-action="storage-chest-' + n + '"]')
          .click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        ctx.heroRoot.querySelector('[data-action="transfer-chest"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const taken = ctx.count(p, type) === qty + storedBefore;
        ctx.heroRoot.querySelector('[data-action="close-chest"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const independent =
          !!p.ui && !!p.room && !ctx.heroRoot.querySelector(".chest-window");
        p.inventory = savedPack;
        p.chests = savedChests;
        p.ui = null;
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        return layout && stored && taken && independent;
      },
    );
    check("Storage chest names rename through the mouse UI", () => {
      p.ui = null;
      ctx.game.openInventory(p, 1);
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      const button = ctx.heroRoot.querySelector('[data-action="rename-chest"]');
      if (!button) return false;
      button.click();
      const form = ctx.heroRoot.querySelector(".chest-rename");
      form.querySelector("input").value = "Spare weapons";
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      const ok =
        p.chestNames[1] === "Spare weapons" &&
        ctx.heroRoot.textContent.includes("Spare weapons");
      p.ui = null;
      return ok;
    });
    check(
      "Robot, vending and split controls support mouse transactions",
      () => {
        const saved = structuredClone(p.inventory),
          coins = p.coins;
        p.inventory = [{ type: "potion", qty: 6 }];
        p.coins = 10;
        p.ui = null;
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        ctx.heroRoot.querySelector('[data-action="robot"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        ctx.heroRoot.querySelector('[data-action="split"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const split = p.inventory.length === 2 && p.inventory[0].qty === 3;
        ctx.heroRoot.querySelector('[data-action="use"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const sold =
          p.coins === 19 &&
          p.inventory.length === 1 &&
          ctx.game
            .shopOwner(p)
            .robotStock.some((i) => i?.type === "potion" && i.qty >= 3);
        p.ui = null;
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        ctx.heroRoot.querySelector('[data-action="vending"]').click();
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        ctx.heroRoot.querySelector('[data-action="vend-0"]').click();
        const pending =
          p.coins === 9 &&
          ctx.count(p, "potion") === 3 &&
          ctx.heroRoot.querySelectorAll(".vending-slots button").length === 12;
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const vendingPanel = ctx.heroUI.panels.get(p.id);
        const oldHeight = ctx.heroRoot.style.height;
        ctx.heroRoot.style.height = "580px";
        for (let i = 0; i < 3; i++) ctx.heroUI.draw(ctx.game, ctx.renderer);
        const fits = vendingPanel.scrollHeight <= vendingPanel.clientHeight + 1;
        ctx.heroRoot.style.height = oldHeight;
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        if (!fits) throw Error("Vending panel overflows compact viewport");
        const vendCanvas = ctx.heroRoot.querySelector(".vending-canvas"),
          beforeImage = vendCanvas.toDataURL();
        ctx.game.tickAdventure(0.35, {});
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        const animated = vendCanvas.toDataURL() !== beforeImage;
        ctx.game.tickAdventure(1.4, {});
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        ctx.heroRoot.querySelector(".vending-tray button").click();
        const bought = pending && animated && ctx.count(p, "potion") === 4;
        p.inventory = saved;
        p.coins = coins;
        p.ui = null;
        ctx.heroUI.draw(ctx.game, ctx.renderer);
        return split && sold && bought;
      },
    );
    check(
      "Storage shows the full room using the same player animator and gear",
      () => {
        const originalDraw = ctx.renderer.animator.draw;
        const calls = [];
        ctx.renderer.animator.draw = function (ctx, actor, time, size) {
          calls.push({ actor, size });
          return originalDraw.call(this, ctx, actor, time, size);
        };
        try {
          ctx.heroUI.draw(ctx.game, ctx.renderer);
        } finally {
          ctx.renderer.animator.draw = originalDraw;
        }
        const canvas = ctx.heroRoot.querySelector("canvas");
        const worldScale =
          (ctx.renderer.camera.zoom *
            ctx.renderer.canvas.getBoundingClientRect().width) /
          ctx.renderer.canvas.width;
        return (
          calls.some(
            (c) =>
              c.actor.id === p.id &&
              c.size === 43 &&
              c.actor.equipment === p.equipment &&
              c.actor.x === p.roomX,
          ) && canvas.dataset.roomFit === "true"
        );
      },
    );
    check("Storage walking updates facing and animation distance", () => {
      const before = p.roomStep || 0;
      ctx.game.update(0.05, { [p.device]: { x: 1, y: 0 } });
      const moving = p.roomMoving && p.faceX === 1 && p.roomStep > before;
      ctx.game.update(0.05, { [p.device]: { x: 0, y: 0 } });
      return moving && !p.roomMoving;
    });
    ctx.game.leaveRoom(p);
    ctx.heroUI.draw(ctx.game, ctx.renderer);
    check(
      "Last visitor returning closes portal",
      () => ctx.game.portals.filter(d=>!d.temple).length === 0,
    );
    ctx.profiles.capture(ctx.game);
    await ctx.profiles.save();
    const reloaded = await new ctx.Profiles().load();
    check("Character gear and private chests survive disk reload", () => {
      const h = reloaded.data.heroes.find((h) => h.id === p.profileId);
      return (
        h &&
        JSON.stringify(h.chests) === JSON.stringify(p.chests) &&
        JSON.stringify(h.equipment) === JSON.stringify(p.equipment)
      );
    });
    const saved = ctx.saveSession(ctx.game);
    await window.desktop?.saveSession(saved);
    const recovered = ctx.restoreSession(await window.desktop.loadSession());
    check(
      "Saved expedition restores character and world seed",
      () =>
        recovered.seed === ctx.game.seed &&
        recovered.players[0].profileId === p.profileId,
    );
    ctx.designer.tab = "Rig & animation";
    ctx.designer.kind = "wasp";
    ctx.designer.open();
    ctx.designer.animate(0.1);
    check(
      "Rig editor exposes part joints and animation keys",
      () =>
        ctx.designer.dialog.textContent.includes("Parent joint") &&
        ctx.designer.dialog.textContent.includes("Set key for selected part"),
    );
    ctx.designer.tab = "Events";
    ctx.designer.render();
    const oldCount = ctx.EVENTS.length;
    [...ctx.designer.dialog.querySelectorAll("button")]
      .find((b) => b.textContent === "Add event")
      .click();
    check("Event editor creates a usable new encounter", () => {
      ctx.game.spawnEvent(ctx.EVENTS.length - 1);
      return (
        ctx.EVENTS.length === oldCount + 1 &&
        ctx.game.event.name === "New encounter"
      );
    });
    ctx.EVENTS.pop();
    ctx.designer.eventIndex = 0;
    ctx.designer.dialog.close();
    check("Directional body-part artwork is available to rigs", () =>
      ["down", "up", "left", "right"].every(
        (f) =>
          ctx.assets.canvas("part-teal-head-" + f) &&
          ctx.creatures["explorer-teal"].rig.parts.find(
            (p) => p.name === "head",
          ).views[f],
      ),
    );
    const originalPlayer = structuredClone(ctx.playerMotion);
    ctx.designer.tab = "Players";
    ctx.designer.playerStudio.setSubject("player");
    ctx.designer.open();
    const ps = ctx.designer.playerStudio;
    check("Graph tab supports frame context actions and undo", () => {
      const before = JSON.stringify(ps.model),
        length = ps.model.clips[ps.clip].length;
      ps.root.querySelector('[data-view="graph"]').click();
      ps.animate(0);
      const canvas = ps.graph.canvas,
        r = canvas.getBoundingClientRect();
      canvas.dispatchEvent(
        new MouseEvent("contextmenu", {
          clientX: r.left + r.width / 2,
          clientY: r.top + r.height / 2,
          bubbles: true,
        }),
      );
      [...ps.root.querySelectorAll(".ps-context-menu button")]
        .find((b) => b.textContent === "Insert frame before")
        .click();
      const inserted = ps.model.clips[ps.clip].length === length + 1;
      ps.command("undo");
      ps.root.querySelector('[data-view="tracks"]').click();
      return inserted && JSON.stringify(ps.model) === before;
    });
    check("Paper-doll slot clicks open an inline dropdown with None first", () => {
      for (const slot of ['hair', 'head', 'neck', 'cape', 'shoulders', 'gloves', 'chest', 'hand1', 'hand2', 'pants', 'feet']) {
        const target = ps.$('.ps-doll [data-slot="' + slot + '"]');
        if (target.tagName === 'BUTTON') target.click();
        const picker = ps.$('.ps-items');
        if (picker.closest('[data-slot]')?.dataset.slot !== slot || picker.options[0].text !== 'None' || picker.options.length < 2) return false;
        picker.selectedIndex = 1;
        picker.dispatchEvent(new Event('change'));
        const clearing = ps.$('.ps-items');
        clearing.selectedIndex = 0;
        clearing.dispatchEvent(new Event('change'));
        if (slot === 'hair' ? ps.previewAppearance.hair !== 'none' : ps.previewEquipment[slot] != null) return false;
      }
      return true;
    });
    check(
      "Paper doll lists slot-compatible items and keeps fit edits separate per facing",
      () => {
        ps.gearSlot = "head";
        ps.direction = 0;
        ps.mountWardrobe();
        const select = ps.$(".ps-items");
        select.value = "hat";
        select.dispatchEvent(new Event("change"));
        if (ps.actor().equipment.head !== "hat") return false;
        const across = ps.$(".ps-fit input[type=number]");
        across.value = 3;
        across.dispatchEvent(new Event("change"));
        const south = ctx.playerMotion.wearables.hat[0].x;
        ps.direction = 4;
        ps.mountWardrobe();
        const north = Number(ps.$(".ps-fit input[type=number]").value);
        ps.animate(0);
        ctx.replacePlayerMotion(originalPlayer);
        ps.previewEquipment = {};
        ps.direction = 0;
        ps.mountWardrobe();
        return south === 3 && north === 0;
      },
    );
    ps.playing = false;
    ps.frame = 2;
    ps.direction = 0;
    ps.animate(0);
    check(
      "One player studio exposes all eight facings and scrub controls",
      () =>
        ctx.designer.dialog.querySelectorAll("[data-direction]").length === 8 &&
        !!ctx.designer.dialog.querySelector(".ps-scrub"),
    );
    const scrub = ps.$(".ps-scrub");
    scrub.value = 5;
    scrub.dispatchEvent(new Event("input"));
    check(
      "Scrubbing pauses playback at the selected frame",
      () => !ps.playing && ps.frame === 5,
    );
    check(
      "Rig canvas zoom buttons, wheel and pan preserve animation data",
      () => {
        const canvas = ps.$(".ps-canvas"),
          before = JSON.stringify(ps.model),
          r = canvas.getBoundingClientRect();
        ps.$('[data-do="zoom-in"]').click();
        const zoomed = ps.scale > 7;
        canvas.dispatchEvent(
          new WheelEvent("wheel", {
            deltaY: -80,
            clientX: r.left + r.width / 2,
            clientY: r.top + r.height / 2,
            cancelable: true,
          }),
        );
        const wheeled = ps.scale > 8.75;
        const capture = canvas.setPointerCapture;
        canvas.setPointerCapture = () => {};
        ps.$('[data-do="pan"]').click();
        const x = ps.panX;
        const point = {
          button: 0,
          pointerId: 44,
          clientX: r.left + 100,
          clientY: r.top + 100,
        };
        canvas.dispatchEvent(new PointerEvent("pointerdown", point));
        canvas.dispatchEvent(
          new PointerEvent("pointermove", {
            ...point,
            clientX: point.clientX + 30,
          }),
        );
        canvas.dispatchEvent(new PointerEvent("pointerup", point));
        canvas.setPointerCapture = capture;
        const panned = ps.panX > x;
        ps.$('[data-do="reset-view"]').click();
        ps.command("move");
        return (
          zoomed &&
          wheeled &&
          panned &&
          ps.scale === 7 &&
          ps.panX === 0 &&
          ps.panY === 0 &&
          JSON.stringify(ps.model) === before
        );
      },
    );
    check(
      "Scrubber thumb and playhead align at every frame and timeline width",
      () => {
        const tracks = ps.$(".ps-tracks"),
          slider = ps.$(".ps-scrub"),
          style = tracks.style.width,
          frame = ps.frame;
        let pass = true;
        for (const width of ["520px", "100%"]) {
          tracks.style.width = width;
          for (const value of [0, 0.731, 3.5, 7]) {
            ps.frame = value;
            ps.animate(0);
            const r = tracks.getBoundingClientRect(),
              s = slider.getBoundingClientRect(),
              g = ps.timelineGeometry(),
              fraction = value / 7;
            const thumb = s.left + 7 + fraction * (s.width - 14),
              line =
                r.left +
                ((g.left + fraction * (g.right - g.left)) * r.width) /
                  tracks.width;
            pass &&=
              Math.abs(thumb - line) < 0.1 &&
              Math.abs(Number(slider.value) - value) < 0.0001;
          }
        }
        tracks.style.width = style;
        ps.frame = frame;
        ps.animate(0);
        return pass;
      },
    );
    const pc = ps.$(".ps-canvas"),
      rect = pc.getBoundingClientRect(),
      point = ctx.projectPoint(ctx.poseAt(ctx.playerMotion, "run", 5).handR, 0);
    const start = {
      clientX: rect.left + ((280 + point.x * ps.scale) * rect.width) / 560,
      clientY: rect.top + ((315 + point.y * ps.scale) * rect.height) / 380,
      button: 0,
      pointerId: 17,
    };
    const capture = pc.setPointerCapture;
    pc.setPointerCapture = () => {};
    pc.dispatchEvent(new PointerEvent("pointerdown", start));
    pc.dispatchEvent(
      new PointerEvent("pointermove", {
        ...start,
        clientX: start.clientX + (28 * rect.width) / 560,
      }),
    );
    pc.dispatchEvent(new PointerEvent("pointerup", start));
    pc.setPointerCapture = capture;
    check(
      "Dragging a player joint writes the pose used by gameplay",
      () =>
        Math.abs(
          ctx.poseAt(ctx.playerMotion, "run", 5).handR[0] -
            ctx.poseAt(originalPlayer, "run", 5).handR[0] -
            4,
        ) < 0.05,
    );
    ps.command("undo");
    check(
      "Player joint edit can be undone",
      () => JSON.stringify(ctx.playerMotion) === JSON.stringify(originalPlayer),
    );
    ps.command("redo");
    ps.command("save");
    check(
      "Player keys persist in the shared definition package",
      () =>
        JSON.stringify(
          JSON.parse(localStorage.getItem("wildbound-design")).player,
        ) === JSON.stringify(ctx.playerMotion),
    );
    const pixelProbe = (mode) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 96;
      const c = canvas.getContext("2d");
      new ctx.Animator(ctx.assets).draw(
        c,
        {
          sprite: "explorer-teal",
          x: 48,
          y: 70,
          faceX: 0,
          faceY: 1,
          animationAction: "run",
          playerFrame: 5,
          rigOverride: { mode },
        },
        0,
        48,
      );
      return canvas.toDataURL();
    };
    check(
      "Legacy and sheet modes cannot override the active player animator",
      () =>
        pixelProbe("legacy") === pixelProbe("frames") &&
        pixelProbe("frames") === pixelProbe("rig"),
    );
    const tracks = ps.$(".ps-tracks"),
      tr = tracks.getBoundingClientRect(),
      tg = ps.timelineGeometry();
    const trackEvent = (frame, shiftKey = false) => ({
      clientX:
        tr.left +
        ((tg.left + (frame / 7) * (tg.right - tg.left)) * tr.width) /
          tracks.width,
      clientY:
        tr.top +
        ((tg.top + (tg.names.indexOf("handR") + 0.5) * tg.row) * tr.height) /
          tracks.height,
      pointerId: 19,
      shiftKey,
    });
    const captureTrack = tracks.setPointerCapture;
    tracks.setPointerCapture = () => {};
    const movedKey = structuredClone(
      ctx.playerMotion.clips.run.keys.find((k) => k.frame === 5).joints.handR,
    );
    ps.startTimeline(trackEvent(5));
    ps.moveTimeline(trackEvent(6));
    ps.endTimeline(trackEvent(6));
    check(
      "Dragging a key retimes only the selected joint",
      () =>
        !ctx.playerMotion.clips.run.keys.find((k) => k.frame === 5).joints
          .handR &&
        JSON.stringify(
          ctx.playerMotion.clips.run.keys.find((k) => k.frame === 6).joints
            .handR,
        ) === JSON.stringify(movedKey),
    );
    ps.startTimeline(trackEvent(6, true));
    ps.endTimeline(trackEvent(7, true));
    check("Shift-drag copies a key without removing its source", () =>
      [6, 7].every(
        (f) =>
          JSON.stringify(
            ctx.playerMotion.clips.run.keys.find((k) => k.frame === f).joints
              .handR,
          ) === JSON.stringify(movedKey),
      ),
    );
    tracks.setPointerCapture = captureTrack;
    ctx.replacePlayerMotion(originalPlayer);
    ps.command("save");
    check(
      "Human facial handles drag independently, hide per facing, save and undo",
      () => {
        ps.mode = "animate";
        ps.clip = "run";
        ps.frame = 2;
        ps.direction = 0;
        ps.tool = "move";
        ps.refresh();
        ps.root.querySelector('[data-joint="eyeL"]').click();
        const before = structuredClone(ps.pose()),
          canvas = ps.$(".ps-canvas"),
          r = canvas.getBoundingClientRect(),
          q = ctx.projectPoint(before.eyeL, 0);
        const e = {
          button: 0,
          pointerId: 71,
          clientX: r.left + ((280 + q.x * ps.scale) * r.width) / 560,
          clientY: r.top + ((315 + q.y * ps.scale) * r.height) / 380,
        };
        const oldCapture = canvas.setPointerCapture;
        canvas.setPointerCapture = () => {};
        canvas.dispatchEvent(new PointerEvent("pointerdown", e));
        canvas.dispatchEvent(
          new PointerEvent("pointermove", {
            ...e,
            clientX: e.clientX + (ps.scale * 3 * r.width) / 560,
          }),
        );
        canvas.dispatchEvent(new PointerEvent("pointerup", e));
        canvas.setPointerCapture = oldCapture;
        const moved =
          ps.selected === "eyeL" &&
          Math.abs(ps.pose().eyeL[0] - before.eyeL[0] - 3) < 0.01 &&
          JSON.stringify(ps.pose().head) === JSON.stringify(before.head);
        const toggle = ps.root.querySelector('[data-visible-facing="0"]');
        toggle.checked = false;
        toggle.onchange();
        ps.command("save");
        const pack = JSON.parse(localStorage.getItem("wildbound-design"));
        const hidden = pack.player.visibility.eyeL[0] === false;
        ps.command("undo");
        const undone = ps.model.visibility.eyeL[0] === true;
        ctx.replacePlayerMotion(originalPlayer);
        ps.refresh();
        ps.command("save");
        return moved && hidden && undone;
      },
    );
    const originalLion = structuredClone(ctx.lionMotion);
    check('Hand angle control keys the current facing and rig undo restores it',()=>{
      ps.selected='handR';ps.direction=1;ps.frame=0;ps.mode='animate';ps.refresh();
      const input=ps.$('.ps-angle-controls input[type="number"]');input.value=45;input.dispatchEvent(new Event('change'));
      ps.animate(0);const key=ps.model.clips[ps.clip].keys.find(k=>k.frame===0);
      const result=key.angles?.[1]?.handR===45 && !!ps.angleHandle;
      ps.command('undo');return result&&!ps.model.clips[ps.clip].keys.find(k=>k.frame===0).angles?.[1]?.handR;
    });
    const picker = ps.$(".ps-subject");
    picker.value = "lion";
    picker.dispatchEvent(new Event("change"));
    check(
      "Lion and player use the same editor instance and controls",
      () =>
        ctx.designer.playerStudio === ps &&
        ps.model === ctx.lionMotion &&
        !!ps.$(".ps-scrub") &&
        ps.root.querySelectorAll("[data-direction]").length === 8,
    );
    ps.playing = false;
    check('Lion bone sprite opens in the sprite editor, saves to one facing, and supports rig undo',()=>{
      ps.direction=6;ps.selected='head';ps.refresh();ps.animate(0);
      const buttons=[...ps.$('.ps-bone-sprites').querySelectorAll('button')];
      buttons.find(b=>b.textContent==='Edit in sprite editor').click();
      if(!ctx.workshop.attachmentSave) return false;
      ctx.workshop.sprite.palette.push('#123456');ctx.workshop.sprite.pixels[0]=ctx.workshop.sprite.palette.length-1;
      ctx.$('save-sprite').click();
      const saved=ctx.lionMotion.boneSprites?.Mane?.[6]?.palette.includes('#123456') && ctx.designer.dialog.open;
      ps.command('undo');ps.command('save');
      return saved && !ctx.lionMotion.boneSprites?.Mane?.[6];
    });
    ps.frame = 2;
    ps.selected = "frontPawR";
    ps.direction = 0;
    ps.refresh();
    ps.animate(0);
    const lc = ps.$(".ps-canvas"),
      lr = lc.getBoundingClientRect(),
      lp = ctx.projectPoint(ps.pose().frontPawR, 0);
    const le = {
      clientX: lr.left + ((280 + lp.x * ps.scale) * lr.width) / 560,
      clientY: lr.top + ((315 + lp.y * ps.scale) * lr.height) / 380,
      button: 0,
      pointerId: 25,
    };
    const oldCapture = lc.setPointerCapture;
    lc.setPointerCapture = () => {};
    lc.dispatchEvent(new PointerEvent("pointerdown", le));
    lc.dispatchEvent(
      new PointerEvent("pointermove", {
        ...le,
        clientX: le.clientX + (21 * lr.width) / 560,
      }),
    );
    lc.dispatchEvent(new PointerEvent("pointerup", le));
    lc.setPointerCapture = oldCapture;
    check(
      "Lion paw dragging updates the runtime pose without changing the player",
      () =>
        Math.abs(
          ctx.poseAt(ctx.lionMotion, "run", 2).frontPawR[0] -
            ctx.poseAt(originalLion, "run", 2).frontPawR[0] -
            3,
        ) < 0.05 &&
        JSON.stringify(ctx.playerMotion) === JSON.stringify(originalPlayer),
    );
    ps.command("save");
    check(
      "Lion rig is persisted alongside player rig",
      () =>
        JSON.stringify(
          JSON.parse(localStorage.getItem("wildbound-design")).lion,
        ) === JSON.stringify(ctx.lionMotion),
    );
    ps.command("undo");
    check(
      "Lion undo is isolated from player history",
      () =>
        JSON.stringify(ctx.lionMotion) === JSON.stringify(originalLion) &&
        JSON.stringify(ctx.playerMotion) === JSON.stringify(originalPlayer),
    );
    check("Lion facial parts expose facing visibility and undo", () => {
      ps.selected = "eyeR";
      ps.direction = 2;
      ps.refresh();
      const visibility = ctx.designer.dialog.querySelector(".ps-visibility");
      const toggle = visibility.querySelector('[data-visible-facing="2"]');
      if (visibility.hidden || toggle.checked) return false;
      toggle.checked = true;
      toggle.onchange();
      if (!ctx.lionMotion.visibility.eyeR[2]) return false;
      ps.command("undo");
      return (
        ctx.lionMotion.visibility.eyeR[2] === false &&
        !!ctx.lionMotion.joints.earL
      );
    });
    ctx.replaceLionMotion(originalLion);
    ps.command("save");
    for (const kind of [
      "bat",
      "snake",
      "monkey",
      "vine",
      "golem",
      "trap",
      "rhino",
      "panther",
      "boar",
      "beetle",
      "crocodile",
      "skeleton",
      "archer",
      "skeleton_unarmed",
      "skeleton_boss",
    ]) {
      check(
        kind + " uses shared rig editing, runtime keys, save and isolated undo",
        () => {
          ps.setSubject(kind);
          ps.mount(ctx.designer.dialog.querySelector(".player-studio"));
          ps.playing = false;
          ps.mode = "animate";
          ps.frame = 2;
          ps.direction = 0;
          ps.refresh();
          const model = structuredClone(ps.model),
            selected = ps.selected;
          const before = ps.pose()[selected][0];
          const input = ps.root.querySelector('[data-axis="0"]');
          input.value = before + 2;
          input.onchange();
          if (
            Math.abs(
              ctx.poseAt(ps.model, ps.clip, 2)[selected][0] - before - 2,
            ) > 0.01
          )
            return false;
          ps.command("save");
          const pack = JSON.parse(localStorage.getItem("wildbound-design"));
          if (
            JSON.stringify(
              kind === "bat"
                ? pack.bat
                : kind === "rhino"
                  ? pack.rhino
                  : kind === "crocodile"
                    ? pack.alligator
                    : pack.beastMotions?.[kind] ||
                      pack.skeletonMotions?.[kind] ||
                      pack.creatureMotions[kind],
            ) !== JSON.stringify(ps.model)
          )
            return false;
          ps.command("undo");
          const restored = JSON.stringify(ps.model) === JSON.stringify(model);
          ps.command("save");
          return (
            restored &&
            ps.root.querySelectorAll("[data-direction]").length === 8
          );
        },
      );
    }
    ps.setSubject("player");
    ctx.designer.dialog.close();
    await window.showcase("game");
    return { failed: results.filter((r) => !r.pass).length, results };
  };

  window.fieldContactSheet = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 660;
    const c = canvas.getContext("2d");
    c.fillStyle = "#14261f";
    c.fillRect(0, 0, 960, 660);
    c.fillStyle = "#e2e7cc";
    c.font = "18px system-ui";
    c.fillText("WILDBOUND 0.9 · EQUIPMENT / EIGHT FACINGS", 24, 30);
    const outfits = [
      {
        head: "hat",
        chest: "armor",
        pants: "pants",
        feet: "boots",
        hand1: "sword",
        hand2: "shield",
        neck: "charm",
      },
      {
        head: "moon_circlet",
        cape: "cape",
        hand1: "wand",
        gloves: "gloves",
        shoulders: "shoulder_armor",
      },
      { head: "hat", chest: "armor", hand1: "bow", hand2: "occupied" },
      { cape: "cape", hand1: "cinder_wand", pants: "pants" },
    ];
    for (let row = 0; row < 4; row++)
      for (let d = 0; d < 8; d++) {
        const [faceX, faceY] = ctx.directionVector(d);
        c.save();
        c.translate(60 + d * 120, 160 + row * 155);
        c.scale(3, 3);
        ctx.drawPlayer(
          c,
          {
            faceX,
            faceY,
            equipment: outfits[row],
            appearance: {
              skin: "#b97850",
              shirt: "#39745b",
              pants: "#665b87",
              shoes: "#49372d",
              hair: "ponytail",
              hairColor: "#593923",
              face: "freckles",
            },
            animationAction: row % 2 ? "run" : "idle",
            playerFrame: 2,
          },
          0,
        );
        c.restore();
      }
    return canvas.toDataURL();
  };
  window.runFieldSmokeTests = async () => {
    const results = [],
      check = (name, value) => results.push({ name, pass: !!value });
    const previousGame = ctx.game,
      previousPaused = ctx.paused,
      originalPads = navigator.getGamepads;
    try {
      ctx.game = new ctx.Game(() => 0.4);
      ctx.wireGame();
      const p = ctx.game.addPlayer("keyboard", "Trail Tester"),
        q = ctx.game.addPlayer("pad:0", "Pad Tester");
      ctx.game.start();
      ctx.game.openingBoard = false;
      ctx.renderer = new ctx.Renderer(ctx.$("game-canvas"), ctx.assets);
      ctx.show("play");
      const pad = {
        index: 0,
        id: "Test Controller",
        connected: true,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 16 }, () => ({
          pressed: false,
          value: 0,
        })),
      };
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: () => [pad],
      });
      ctx.previousPads.clear();
      const press = (i) => {
        pad.buttons[i] = { pressed: true, value: 1 };
        ctx.inputFrame();
        pad.buttons[i] = { pressed: false, value: 0 };
        ctx.inputFrame();
      };
      press(11);
      check(
        "R3 opens Field Kit for the owning controller",
        ctx.fieldKit.dialog.open && ctx.fieldKit.player === q && ctx.paused,
      );
      ctx.fieldKit.tab = "Craft";
      ctx.fieldKit.render();
      const select = ctx.fieldKit.dialog.querySelector("select");
      select.focus();
      press(15);
      check(
        "Controller changes trap mode and retains focus",
        q.field.trap === "slow" &&
          document.activeElement.dataset.focus === "Trap mode",
      );
      press(1);
      check(
        "Controller B closes Field Kit and resumes",
        !ctx.fieldKit.dialog.open && !ctx.paused,
      );
      ctx.fieldKit.open(p);
      for (const tab of ["Craft", "Skills"]) {
        ctx.fieldKit.tab = tab;
        ctx.fieldKit.render();
        if(tab==='Settings') check('Settings shows named controls for each player device',ctx.fieldKit.dialog.querySelectorAll('.controller-card').length===2 && ctx.fieldKit.dialog.textContent.includes('Left stick') && ctx.fieldKit.dialog.textContent.includes('inventory'));
        check(
          "Field Kit " + tab + " fits dialog",
          ctx.fieldKit.dialog.scrollWidth <=
            ctx.fieldKit.dialog.clientWidth + 1,
        );
      }
      ctx.fieldKit.close();
      ctx.nameNewCharacter(q);
      const dialog = document.querySelector("#character-name-dialog");
      dialog.querySelector('button[type="submit"]').focus();
      press(12);
      check(
        "Controller navigates character creation",
        dialog.contains(document.activeElement) &&
          document.activeElement !== dialog.querySelector('button[type="submit"]'),
      );
      press(1);
      check(
        "Controller cancels creation",
        !document.querySelector("#character-name-dialog"),
      );
      if (!ctx.game.players.includes(q)) ctx.game.players.push(q);
      ctx.game.openInventory(p);
      q.ui = null;
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      const oldNode = ctx.heroUI.panels.get(p.id).querySelector('button');
      ctx.game.openInventory(q, 'shared');
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      const a = ctx.heroUI.panels.get(p.id).getBoundingClientRect();
      const b = ctx.heroUI.panels.get(q.id).getBoundingClientRect();
      check('Opening a second inventory reflows the cached first panel without replacing its controls',
        a.right <= b.left && oldNode === ctx.heroUI.panels.get(p.id).querySelector('button'));
      q.ui = null;
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      check('Closing a neighbouring inventory restores single-player layout', !ctx.heroUI.panels.get(p.id).classList.contains('party-panel'));
      for (let n = 0; n < 4; n++)
        ctx.game.addPlayer("pad:" + (n + 1), "Tester " + n);
      for (const hero of ctx.game.players) ctx.game.openInventory(hero);
      ctx.heroUI.draw(ctx.game, ctx.renderer);
      const panels = [...ctx.heroRoot.querySelectorAll(".hero-panel")].map(
        (n) => n.getBoundingClientRect(),
      );
      check(
        "Six simultaneous player panels do not overlap",
        panels.length === 6 &&
          panels.every((a, i) =>
            panels.every(
              (b, j) =>
                i === j ||
                a.right <= b.left ||
                b.right <= a.left ||
                a.bottom <= b.top ||
                b.bottom <= a.top,
            ),
          ),
      );
      ctx.game.players = [p];
      p.device = 'keyboard';
      p.ui = null;
      ctx.paused = false;
      ctx.previousPads.clear();
      press(0);
      check('First controller button takes over a solo keyboard hero without character creation',
        p.device === 'pad:0' && ctx.game.players.length === 1 && !document.querySelector('#character-name-dialog'));
      p.device = 'keyboard';
      pad.axes[0] = 1;
      const movement = ctx.inputFrame();
      p.x = 1100; p.y = 1100;
      const beforeX = p.x;
      ctx.game.update(0.1, movement);
      check('Left stick takes over and moves the existing hero', p.device === 'pad:0' && p.x > beforeX);
      pad.axes[0] = 0;
      p.device = 'pad:3';
      press(0);
      check('Reindexed controller reclaims its hero before joining', p.device === 'pad:0' && ctx.game.players.length === 1);
      pad.index = 1;
      // Keep the first controller connected while a second one sends gameplay input.
      Object.defineProperty(navigator, 'getGamepads', { configurable:true,
        value: () => [{...pad, index:0, axes:[0,0,0,0], buttons:pad.buttons.map(()=>({pressed:false,value:0}))}, pad] });
      press(0);
      press(11);
      check('Unassigned controller actions do not open creation or Field Kit', ctx.game.players.length === 1 && !document.querySelector('#character-name-dialog') && !ctx.fieldKit.dialog.open);
      pad.index = 0;
      Object.defineProperty(navigator, 'getGamepads', { configurable:true, value:()=>[pad] });
      p.device = 'keyboard';
      press(9);
      check('Start still explicitly joins a second local player', ctx.game.players.length === 2 && !!document.querySelector('#character-name-dialog'));
      document.querySelector('#character-name-dialog .name-cancel')?.click();
      ctx.newLobby();ctx.previousPads.clear();
      press(0);press(0);
      if(document.querySelector('.character-gallery')){for(let n=0;n<8&&!document.querySelector('.character-gallery .picker-focus')?.textContent.includes('+ New');n++)press(13);press(0);}
      press(0);
      const keyboard=document.querySelector('#controller-keyboard');
      check('Controller joins party, opens New character, and opens the on-screen keyboard',!!keyboard);
      if(keyboard) {
        const go=(selector)=>{for(let n=0;n<70&&!document.activeElement.matches(selector);n++)press(15);if(!document.activeElement.matches(selector))throw Error('Keyboard focus target not reachable: '+selector);};
        go('[data-keyboard-action="Clear"]');press(0);
        const name='PAD'+String(Date.now()).slice(-7);
        for(const letter of name){go('[data-letter="'+letter+'"]');press(0);}
        press(9);
        check('Controller keyboard commits the typed name and returns to creation',!document.querySelector('#controller-keyboard') && document.querySelector('[name="characterName"]').value===name);
        for(let n=0;n<15&&document.activeElement.type!=='submit';n++)press(13);
        press(0);
        check('Controller creates the named character without a mouse',!document.querySelector('#character-name-dialog')&&ctx.game.players[0].name===name);
        for(let n=0;n<20&&!document.activeElement.dataset.lobbyFocus?.endsWith('-saved');n++)press(13);
        const originalProfile=ctx.game.players[0].profileId;
        press(0);
        const gallery=document.querySelector('.character-gallery');
        check('Controller opens portrait character gallery',!!gallery);
        press(2);
        check('Character deletion requires confirmation with Cancel focused',!!document.querySelector('.character-gallery.confirming .picker-focus')&&document.querySelector('.character-gallery.confirming .picker-focus').textContent.includes('Cancel'));
        press(1);
        check('Cancelling deletion keeps the character',ctx.profiles.data.heroes.some(h=>h.id===originalProfile));
        if(gallery.querySelector('[aria-label="Previous character"]').hidden)press(15);else press(14);press(0);
        check('Controller can choose a different saved character and retain selector focus',ctx.game.players[0].profileId!==originalProfile && document.activeElement.dataset.lobbyFocus?.endsWith('-saved'));
        press(9);
        check('Controller Start begins the expedition without immediately pausing',ctx.game.phase==='play'&&!ctx.paused&&!ctx.$('pause-dialog').open);
      }
    } catch (e) {
      results.push({ name: e.stack, pass: false });
    } finally {
      if (ctx.fieldKit.dialog.open) ctx.fieldKit.close();
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: originalPads,
      });
      ctx.previousPads.clear();
      ctx.game = previousGame;
      ctx.paused = previousPaused;
    }
    return { failed: results.filter((r) => !r.pass).length, results };
  };
}
