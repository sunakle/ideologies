import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const port=Number(process.argv[2]||4174);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'};
if(!fs.existsSync(path.join(root,'index.html'))){console.error('Сначала выполните npm run build.');process.exit(1)}
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 const requested=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!requested.startsWith(root)&&requested!==path.join(root,'index.html')){res.writeHead(403).end();return}
 fs.stat(requested,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'}).end('Файл не найден');return}res.writeHead(200,{'Content-Type':types[path.extname(requested)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});fs.createReadStream(requested).pipe(res)})
});
server.on('error',e=>{console.error(e.message);process.exitCode=1});
server.listen(port,'127.0.0.1',()=>console.log(`Атлас идеологий: http://127.0.0.1:${port}/\nCtrl+C — остановить сервер.`));
