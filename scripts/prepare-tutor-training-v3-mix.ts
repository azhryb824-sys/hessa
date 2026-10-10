import fs from"node:fs";import crypto from"node:crypto";
const read=(p:string)=>fs.readFileSync(p,"utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const gold=read("data/training/v3/gold.jsonl"),v1=read("data/training/v1/train.jsonl");
const bench=JSON.parse(fs.readFileSync("benchmarks/hessa-tutor-v3-regression.json","utf8"));const held=new Set(bench.tests.flatMap((x:any)=>x.messages));
const hash=(x:any)=>crypto.createHash("sha256").update(x.id??JSON.stringify(x.messages)).digest("hex");
const clean=(x:any)=>!x.messages.some((m:any)=>m.role==="user"&&held.has(m.content));
const goldSorted=gold.filter(clean).sort((a:any,b:any)=>hash(a).localeCompare(hash(b)));
const goldVal:any[]=[],goldTrain:any[]=[];const bySkill=new Map<string,any[]>();for(const x of goldSorted){if(!bySkill.has(x.skill))bySkill.set(x.skill,[]);bySkill.get(x.skill)!.push(x)}
for(const items of bySkill.values()){const n=Math.max(4,Math.round(items.length*.12));goldVal.push(...items.slice(0,n));goldTrain.push(...items.slice(n))}
const v1Clean=v1.filter(clean).sort((a:any,b:any)=>hash(a).localeCompare(hash(b)));
const caps:any={multiplication:180,division:220,fractions:180,percent:150,algebra:150,geometry:150,"multi-turn":100};
const picked:any[]=[];const counts:any={};for(const x of v1Clean){const k=x.skill??"unknown",cap=caps[k]??80;if((counts[k]??0)>=cap)continue;counts[k]=(counts[k]??0)+1;picked.push({...x,source:"v1-retention"})}
const weightedGold=[...goldTrain,...goldTrain.map((x:any)=>({...x,id:x.id+"-r2",source:"v3-gold-repeat"}))];const train=[...picked,...weightedGold].sort((a:any,b:any)=>hash(a).localeCompare(hash(b)));
fs.mkdirSync("data/training/v3/mix",{recursive:true});fs.writeFileSync("data/training/v3/mix/train.jsonl",train.map(JSON.stringify).join("\n")+"\n");fs.writeFileSync("data/training/v3/mix/validation.jsonl",goldVal.map(JSON.stringify).join("\n")+"\n");
const userTrain=new Set(train.flatMap((x:any)=>x.messages.filter((m:any)=>m.role==="user").map((m:any)=>m.content)));const leakage=[...held].filter(x=>userTrain.has(x));console.log(JSON.stringify({train:train.length,validation:goldVal.length,goldUniqueTrain:goldTrain.length,goldWeighted:weightedGold.length,v1Retention:picked.length,v1SkillCounts:counts,regressionLeakage:leakage.length},null,2));if(train.length<1800||goldVal.length<40||leakage.length)process.exitCode=1;