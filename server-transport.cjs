const {WebSocket} = require('ws');

function serverAddress(address) {
  const url = new URL(String(address).trim());
  if (!['ws:','wss:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/game')
    throw Error('Use ws://server:4183/game or wss://server/game.');
  return url.href;
}
class ServerTransport {
  constructor(emit) { this.emit=emit;this.generation=0;this.seq=0;this.ready=false; }
  async connect(address,name,joinToken,resumeToken,resumeCandidates=[]) {
    this.stop();
    this.address=serverAddress(address);
    this.name=String(name).trim().slice(0,16);
    this.joinToken=String(joinToken);
    this.resumeToken=resumeToken||undefined;
    this.resumeCandidates=Array.isArray(resumeCandidates)?resumeCandidates.slice(0,100):[];
    this.attempt=0;this.stopped=false;
    return this.open(true);
  }
  open(initial=false) {
    const generation=this.generation;
    this.ready=false;this.seq=0;
    this.emit({type:'connection',state:this.attempt?'reconnecting':'connecting',address:this.address});
    return new Promise((resolve,reject)=>{
      let accepted=false,settled=false,rejected=false,helloSent=false;
      const socket=this.socket=new WebSocket(this.address,{handshakeTimeout:7000,maxPayload:16*1024*1024});
      const timeout=setTimeout(()=>socket.terminate(),10000);
      const fail=error=>{if(!settled){settled=true;reject(error);}};
      socket.on('message',raw=>{
        if(generation!==this.generation)return;
        let data;
        try{data=JSON.parse(raw,(_key,item)=>item&&Object.keys(item).length===1&&Array.isArray(item.$wildboundSet)?new Set(item.$wildboundSet):item);}
        catch{socket.close(1002,'Invalid server message.');return;}
        if(data.type==='server-info'&&!accepted&&!helloSent){
          if(data.version!==1||typeof data.instanceId!=='string'){rejected=true;fail(Error('Server protocol is incompatible.'));socket.close();return;}
          if(!this.resumeToken)this.resumeToken=this.resumeCandidates.find(candidate=>candidate?.instanceId===data.instanceId)?.resumeToken;
          helloSent=true;socket.send(JSON.stringify({type:'hello',version:1,name:this.name,joinToken:this.joinToken,...(this.resumeToken?{resumeToken:this.resumeToken}:{})}));
        }else if(data.type==='welcome'){
          if(data.version!==1||!Number.isSafeInteger(data.playerId)||!/^[a-f0-9]{64}$/.test(data.resumeToken)){rejected=true;fail(Error('Invalid server handshake.'));socket.close();return;}
          clearTimeout(timeout);accepted=true;this.ready=true;this.attempt=0;this.resumeToken=data.resumeToken;
          this.emit({...data,persistent:true,address:this.address});this.emit({type:'connection',state:'connected',address:this.address});
          if(!settled){settled=true;resolve({address:this.address,playerId:data.playerId});}
        }else if(data.type==='rejected'){
          rejected=true;fail(Error(data.message||'Connection rejected.'));this.emit({type:'connection',state:'rejected',message:data.message});
        }else if(accepted)this.emit({...data,persistent:true});
      });
      socket.on('error',error=>{if(initial)fail(Error(`Cannot connect to the forest server: ${error.message}`));});
      socket.on('close',()=>{
        clearTimeout(timeout);if(generation!==this.generation||this.stopped)return;
        this.ready=false;fail(Error('Server connection closed before joining.'));
        if(rejected||initial&&!accepted){this.stopped=true;return;}
        this.emit({type:'connection',state:'reconnecting',message:'Connection lost. Your server explorer is saved; reconnecting…'});
        this.attempt++;const delay=Math.min(15000,500*2**Math.min(this.attempt,5));
        this.timer=setTimeout(()=>this.open().catch(()=>{}),delay);
      });
    });
  }
  send(data) {
    if(!this.ready||this.socket?.readyState!==WebSocket.OPEN)return false;
    if(!data||!['input','action'].includes(data.type))return false;
    this.socket.send(JSON.stringify({...data,seq:this.seq++}));return true;
  }
  stop() {
    this.stopped=true;this.ready=false;this.generation++;clearTimeout(this.timer);
    this.socket?.close();this.socket=null;
    this.joinToken=null;this.resumeToken=null;
  }
}
module.exports={ServerTransport,serverAddress};
