const fs=require('fs'),{loadM2}=require('./lib/wow-m2.cjs');
for(const[name,id]of[['black-dragon',4416923],['copperfur',3072362],['zhevra',126560]]){
 const prefix='test-output/'+name+'-source/',m=loadM2(prefix+id+'.m2');
 fs.writeFileSync(prefix+'inventory.json',JSON.stringify({bones:m.bones.map((b,index)=>({index,parent:b.parent,pivot:b.pivot})),sequences:m.sequences},null,2));
 console.log(name,m.bones.length,'bones',m.sequences.length,'sequences');
 console.log(m.sequences.map(s=>[s.index,s.id,s.duration,s.flags,s.alias].join(' ')).join('\n'));
 for(const i of[0,1,2,3,4,5,6,7,8,9])try{m.sample(i,0);console.log(i,'ok')}catch(e){console.log(i,e.message)}
}
const t=fs.readFileSync('test-output/black-dragon-page.html','utf8'),a=t.indexOf("new Listview({template: 'sound'"),b=t.indexOf('});',a);
fs.writeFileSync('test-output/black-dragon-source/sounds-snippet.txt',t.slice(a,b+3));console.log(t.slice(a,b+3));
