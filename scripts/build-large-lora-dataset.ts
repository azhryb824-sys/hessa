import fs from "node:fs";
type Pack={id:string;explanation:string;alternatives:string[];misconceptions:string[];intervention:string;examples:string[][];practice:string[];mastery:string[]};
const packs=JSON.parse(fs.readFileSync("data/curriculum/hessa-math-primary-teaching-packs-v1.json","utf8")) as Pack[];
function hash(s:string){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
const rows:any[]=[];
for(const p of packs){
 for(let variant=0;variant<12;variant++){
  const alt=p.alternatives[variant%p.alternatives.length];
  const misconception=p.misconceptions[variant%p.misconceptions.length];
  rows.push({id:`${p.id}-teach-${variant}`,skillId:p.id,family:"teach",input:`اشرح المهارة لطفل. استخدم أسلوبًا مناسبًا ثم مثالًا قصيرًا. تنويع ${variant+1}.`,output:`${p.explanation} ${alt}`});
  rows.push({id:`${p.id}-remediate-${variant}`,skillId:p.id,family:"remediate",input:`الطالب أخطأ ويظهر لديه هذا التصور: ${misconception}. ماذا تفعل؟`,output:p.intervention});
  const ex=p.examples[variant%p.examples.length]; rows.push({id:`${p.id}-worked-${variant}`,skillId:p.id,family:"worked-example",input:`اشرح مثالًا محلولًا: ${ex[0]}`,output:`نحل المثال خطوة خطوة بما يناسب مستوى الطالب. الناتج النهائي: ${ex[1]}.`});
 }
}
const splits={train:[] as any[],validation:[] as any[],test:[] as any[]};
for(const row of rows){const bucket=hash(row.skillId+"|"+row.family+"|"+row.id)%100;if(bucket<80)splits.train.push(row);else if(bucket<90)splits.validation.push(row);else splits.test.push(row);}
fs.mkdirSync("data/training/generated",{recursive:true});
for(const [name,data] of Object.entries(splits))fs.writeFileSync(`data/training/generated/hessa-math-${name}-v1.jsonl`,data.map(x=>JSON.stringify(x)).join("\n")+"\n");
console.log({total:rows.length,train:splits.train.length,validation:splits.validation.length,test:splits.test.length});
