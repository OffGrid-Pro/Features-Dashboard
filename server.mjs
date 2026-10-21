import http from 'node:http';
import {readFile} from 'node:fs/promises';
const files={'/project-data.json':'project-data.json','/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.mjs':'app.mjs','/core.mjs':'core.mjs','/github.mjs':'github.mjs'};
const mime={json:'application/json',html:'text/html',css:'text/css',mjs:'text/javascript'};
const port=Number(process.env.PORT)||4173;
http.createServer(async(req,res)=>{const file=files[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);res.end('Not found');return;}try{res.setHeader('Content-Type',mime[file.split('.').at(-1)]+'; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(await readFile(new URL(file,import.meta.url)));}catch{res.writeHead(500);res.end('Unable to load dashboard');}}).listen(port,'127.0.0.1',()=>console.log(`Dashboard: http://localhost:${port}`));
