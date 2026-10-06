import fs from "node:fs";import path from "node:path";
const roots=["app/api"];const forbidden=["student@hessa.local","demo-password"];const hits:string[]=[];
function walk(dir:string){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),st=fs.statSync(p);if(st.isDirectory())walk(p);else if(/\.(ts|tsx)$/.test(name)){const text=fs.readFileSync(p,"utf8");for(const token of forbidden)if(text.includes(token))hits.push(p+" -> "+token);}}}
for(const root of roots)if(fs.existsSync(root))walk(root);
if(hits.length){console.error("Release blocked: demo identity/credential found in production API",hits);process.exitCode=1;}else console.log("Release identity scan passed.");
