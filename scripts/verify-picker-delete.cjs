const {app,BrowserWindow}=require('electron'),path=require('node:path');const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output','picker-delete-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,webPreferences:{offscreen:true}});try{await w.loadFile(path.join(root,'index.html'),{query:{tools:'1'}});await w.webContents.executeJavaScript('window.wildboundBoot.ready');console.log(await w.webContents.executeJavaScript(`(async()=>{
 const {openCharacterGallery}=await import('./src/character-gallery.mjs');
 const host=document.createElement('div');host.dataset.device='test-pad';document.body.append(host);
 const player={device:'test-pad',name:'Test',id:99},heroes=[{id:'a',name:'Alpha'},{id:'b',name:'Beta'}];let deleted=null,assigned=null;
 const profiles={data:{heroes},assign(p,h){assigned=h.id;p.profileId=h.id;},async remove(id){deleted=id;this.data.heroes=this.data.heroes.filter(h=>h.id!==id);}};
 openCharacterGallery({profiles,game:{players:[player]},player,onChange(){},onNew(){}});
 let panel=host.querySelector('section');panel.shiftCharacter(1);
 if(!panel.isConnected||assigned||panel.dataset.selected!=='b'||panel.querySelector('[data-character="b"]').getAttribute('aria-pressed')!=='true')throw Error('Click did not select without assigning');
 [...panel.querySelectorAll('button')].find(b=>b.textContent==='Delete · X').click();
 if(!panel.textContent.includes('Delete Beta?')||!panel.querySelector('.picker-focus').textContent.includes('Cancel')||deleted)throw Error('Unsafe confirmation');
 panel.querySelector('.picker-focus').click();if(deleted||panel.dataset.selected!=='b')throw Error('Cancel changed selection or deleted');
 const pad={axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};pad.buttons[2].pressed=true;panel.handleController(pad,[]);
 if(!panel.textContent.includes('Delete Beta?'))throw Error('Controller X targeted wrong character');
 panel.querySelector('.danger').click();await new Promise(r=>setTimeout(r,30));if(deleted!=='b'||profiles.data.heroes.length!==1)throw Error('Confirmed delete failed');
 panel.querySelector('.carousel-name').click();if(assigned!=='a'||panel.isConnected)throw Error('Use character failed');host.remove();return 'Mouse selection, controller Delete, Cancel, confirmed deletion and Use character passed.';
})()`));app.exit(0);}catch(e){console.error(e);app.exit(1);}});
