import crypto from "node:crypto";
const rounds=210000;
export function makePasswordHash(value:string){const salt=crypto.randomBytes(16).toString("hex");const derived=crypto.pbkdf2Sync(value,salt,rounds,32,"sha256").toString("hex");return ["pbkdf2",String(rounds),salt,derived].join(".");}
export function checkPassword(value:string,stored:string){const p=stored.split(".");if(p.length!==4||p[0]!=="pbkdf2")return false;const n=Number(p[1]);if(!Number.isInteger(n)||n<100000)return false;const actual=crypto.pbkdf2Sync(value,p[2],n,32,"sha256");const expected=Buffer.from(p[3],"hex");return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);}
