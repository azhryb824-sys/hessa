import fs from "node:fs";
type Pack={id:string;explanation:string;alternatives:string[];misconceptions:string[];intervention:string;examples:string[][];practice:string[];mastery:string[]};
const packs=JSON.parse(fs.readFileSync("data/curriculum/hessa-math-primary-teaching-packs-v1.json","utf8")) as Pack[];
const rows:any[]=[];
for(const p of packs){
 rows.push({id:p.id+"-teach",task:"TEACH",messages:[{role:"system",content:"أنت معلم حصة. اشرح بلغة عربية واضحة ومناسبة للطفل، خطوة قصيرة في كل مرة."},{role:"user",content:"اشرح هذه المهارة."},{role:"assistant",content:p.explanation}]});
 p.alternatives.forEach((a,i)=>rows.push({id:`${p.id}-alternative-${i+1}`,task:"RETEACH",messages:[{role:"system",content:"غيّر طريقة الشرح عندما لا يفهم الطالب، ولا تكرر الأسلوب نفسه."},{role:"user",content:"ما فهمت، اشرح بطريقة ثانية."},{role:"assistant",content:a}]}));
 rows.push({id:p.id+"-remediate",task:"REMEDIATE",messages:[{role:"system",content:"شخّص الخطأ ثم قدم تدخلًا علاجيًا صغيرًا دون لوم الطالب."},{role:"user",content:`أخطأت في هذه المهارة. أخطاء شائعة محتملة: ${p.misconceptions.join("، ")}`},{role:"assistant",content:p.intervention}]});
}
fs.mkdirSync("data/training",{recursive:true});
fs.writeFileSync("data/training/hessa-math-primary-behavior-v1.jsonl",rows.map(x=>JSON.stringify(x)).join("\n")+"\n");
console.log("Training rows:",rows.length);
