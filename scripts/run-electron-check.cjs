const {spawn}=require('node:child_process');
const path=require('node:path');
const electron=process.env.WILDBOUND_ELECTRON_EXE||require('electron');
const child=spawn(electron,[...process.argv.slice(2),'--mute-audio'],{cwd:path.resolve(__dirname,'..'),stdio:'inherit',windowsHide:true});
const timer=setTimeout(()=>{console.error('Electron verification timed out.');child.kill();process.exitCode=1;},240000);
child.on('error',error=>{clearTimeout(timer);console.error(error);process.exitCode=1;});
child.on('exit',code=>{clearTimeout(timer);process.exitCode=code??1;});
