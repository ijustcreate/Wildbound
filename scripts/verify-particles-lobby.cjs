const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/particles-lobby-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1440,height:940,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 console.log(await w.webContents.executeJavaScript(`(async()=>{
  const {openCharacterGallery}=await import('./src/character-gallery.mjs');
  const host=document.createElement('div');host.dataset.device='qa';document.body.append(host);
  const player={device:'qa',id:101,name:'Test'},heroes=[{id:'z',name:'Zebra'},{id:'a',name:'alpha'},{id:'m',name:'Mira'}];let assigned;
  const profiles={data:{heroes},assign(p,h){assigned=h.id;},async remove(){}};
  openCharacterGallery({profiles,game:{players:[player]},player,onChange(){},onNew(){}});
  const panel=host.querySelector('section');if(panel.dataset.selected!=='a'||!panel.querySelector('[aria-label="Previous character"]').hidden)throw Error('A-Z or first boundary failed');
  panel.shiftCharacter(1);if(panel.dataset.selected!=='m'||assigned)throw Error('Carousel preview failed');panel.shiftCharacter(1);
  if(panel.dataset.selected!=='z'||!panel.querySelector('[aria-label="Next character"]').hidden)throw Error('End boundary failed');panel.querySelector('.carousel-name').click();if(assigned!=='z'||panel.isConnected)throw Error('Name did not select');host.remove();
  window.setupPreview('lobby');const input=document.querySelector('.player-slot input[readonly]');input.click();const d=document.querySelector('#rename-character-dialog');if(!d)throw Error('Rename confirmation missing');d.querySelector('button').click();if(document.querySelector('#controller-keyboard'))throw Error('Cancel opened keyboard');input.click();document.querySelector('#rename-character-dialog button:last-child').click();if(!document.querySelector('#controller-keyboard'))throw Error('Rename keyboard missing');document.querySelector('[data-keyboard-action="Cancel"]').click();
  if([...document.querySelectorAll('.player-slot button')].some(b=>b.textContent==='Edit name'))throw Error('Old rename button remains');
  const diff=document.querySelector('[data-option-target="difficulty"]');for(let i=0;i<3;i++){diff.click();if(!document.querySelector('#difficulty-description').textContent)throw Error('Difficulty help missing');}
  return 'Carousel A-Z, end arrows, direct name selection, rename confirmation and difficulty help verified';
 })()`));
 await w.webContents.executeJavaScript("window.setupPreview('gallery')");await new Promise(r=>setTimeout(r,250));
 fs.writeFileSync(path.join(root,'test-output/carousel-lobby.png'),(await w.webContents.capturePage()).toPNG());
 console.log(await w.webContents.executeJavaScript(`(async()=>{
  [...document.querySelectorAll('#party-menu button')].find(b=>b.textContent==='Rig studio').click();
  [...document.querySelectorAll('dialog[open] nav button')].find(b=>b.textContent==='Particles').click();
  const root=document.querySelector('.particle-editor');if(!root)throw Error('No particle tab');
  const size=root.querySelector('[aria-label="Size"]');size.value='5';size.dispatchEvent(new Event('input'));root.querySelector('[data-action="save"]').click();
  const {effects}=await import('./src/particles.mjs');if(effects.torch.size!==5||!localStorage.getItem('wildbound-particles-v1'))throw Error('Effect save failed');
  return 'Particle tab, live controls and saved gameplay preset verified';
 })()`));
 await new Promise(r=>setTimeout(r,450));fs.writeFileSync(path.join(root,'test-output/particle-editor.png'),(await w.webContents.capturePage()).toPNG());
 await w.webContents.executeJavaScript(`document.querySelector('dialog[open]').close();window.setupPreview('lobby')`);w.setSize(1000,700);await new Promise(r=>setTimeout(r,200));
 fs.writeFileSync(path.join(root,'test-output/lobby-compact.png'),(await w.webContents.capturePage()).toPNG());
 app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
