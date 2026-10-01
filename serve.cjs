const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
http.createServer((request,response)=>{
  let pathname;
  try {pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);} catch {response.writeHead(400).end();return;}
  const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(target!==root&&!target.startsWith(root+path.sep)){response.writeHead(403).end();return;}
  fs.readFile(target,(error,bytes)=>{
    if(error){response.writeHead(404).end('Not found');return;}
    response.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
  });
}).listen(4174,'127.0.0.1',()=>console.log('Wildbound Character Viewer: http://127.0.0.1:4174/'));
