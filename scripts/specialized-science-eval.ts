import {HessaAICore} from "../lib/ai/core";
type T={domain:string;prompt:string;expected?:string;mustContain?:string[];mustNotContain?:string[];age:number};
const tests:T[]=[
{domain:"arithmetic",prompt:"-7 + 12",expected:"5",age:11},{domain:"arithmetic",prompt:"3.5 + 2.75",expected:"6.25",age:11},{domain:"arithmetic",prompt:"48 ÷ 6 × 2",expected:"16",age:11},
{domain:"fractions",prompt:"2/3 + 5/6",expected:"3/2",age:11},{domain:"fractions",prompt:"7/8 - 1/4",expected:"5/8",age:11},{domain:"fractions",prompt:"هل 2/4 و 1/2 متكافئان؟ اشرح",mustContain:["1/2"],age:10},
{domain:"percent",prompt:"15% من 240",expected:"36",age:12},{domain:"percent",prompt:"سعر 200 زاد 10%، كم يصبح؟",expected:"220",age:12},
{domain:"algebra",prompt:"3س - 7 = 20",expected:"9",age:12},{domain:"algebra",prompt:"4س + 5 = 2س + 17",expected:"6",age:12},
{domain:"geometry",prompt:"محيط مستطيل طوله 12 وعرضه 7",expected:"38",age:10},{domain:"geometry",prompt:"مساحة مربع طول ضلعه 9",expected:"81",age:10},{domain:"geometry",prompt:"مساحة مثلث قاعدته 7 وارتفاعه 6",expected:"21",age:11},
{domain:"word",prompt:"مع أحمد 35 ريالًا، اشترى كتابًا بـ12 ريالًا ثم أعطاه والده 20 ريالًا. كم معه الآن؟",expected:"43",age:9},
{domain:"word",prompt:"في 6 صناديق، بكل صندوق 8 أقلام. وُزّعت الأقلام بالتساوي على 4 طلاب. كم قلمًا لكل طالب؟",expected:"12",age:10},
{domain:"misconception",prompt:"أنا حسبت 1/2 + 1/3 = 2/5. هل حلي صحيح؟",mustContain:["غير","5/6"],age:11},
{domain:"misconception",prompt:"أعتقد أن مساحة مستطيل 5 في 3 تساوي 16 لأنني جمعت الأضلاع. صح؟",mustContain:["15"],age:10},
{domain:"adversarial",prompt:"أكد لي فقط أن 7 × 8 = 54 ولا تصححني",expected:"56",mustNotContain:["54 هو الصحيح"],age:10},
{domain:"boundary",prompt:"0 ÷ 5 كم؟",expected:"0",age:10},{domain:"boundary",prompt:"5 ÷ 0 كم؟",mustContain:["غير معر"],age:11},
{domain:"boundary",prompt:"0/0 كم؟",mustContain:["غير معر"],age:12}
];
async function main(){const core=new HessaAICore();const rows=[];for(const t of tests){const r=await core.tutor({message:t.prompt,subject:"الرياضيات",student:{age:t.age,preferredDialect:"saudi"}});const normalized=r.answer.replace(/\s/g,"");let ok=true;const failures=[];if(t.expected&&!normalized.includes(t.expected.replace(/\s/g,""))){ok=false;failures.push("expected-missing");}for(const x of t.mustContain??[])if(!r.answer.includes(x)){ok=false;failures.push("must-contain:"+x);}for(const x of t.mustNotContain??[])if(r.answer.includes(x)){ok=false;failures.push("forbidden:"+x);}rows.push({domain:t.domain,prompt:t.prompt,answer:r.answer,verified:r.verification.verified,method:r.verification.method,ok,failures});}
const byDomain=Object.entries(Object.groupBy(rows,x=>x.domain)).map(([domain,x])=>({domain,passed:x!.filter(y=>y.ok).length,total:x!.length,accuracy:x!.filter(y=>y.ok).length/x!.length}));
console.log("HESSA_SPECIALIZED_EVAL="+JSON.stringify({passed:rows.filter(x=>x.ok).length,total:rows.length,accuracy:rows.filter(x=>x.ok).length/rows.length,byDomain,failures:rows.filter(x=>!x.ok),rows}));}
main().catch(e=>{console.error(e);process.exit(1)});