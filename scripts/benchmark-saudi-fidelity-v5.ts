import {evaluateSaudiFidelityV5} from "../lib/ai/saudi-fidelity-v5";
import {readFileSync} from "node:fs";
const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
const cases=[
["saudi","ليش إذا طرحت نفس العدد من طرفي المعادلة تظل صحيحة؟",14,/طرف|توازن|معادلة/],
["saudi","إذا غلطت في خطوة بالحساب، كيف أعرف وين الغلط؟",14,/خطوة|غلط|خطأ|تحقق/],
["saudi","فهمني فكرة البرهان بالتناقض بكلام بسيط، مو تعريف كتاب.",14,/تناقض|افتراض|نفترض/],
["saudi","إذا قلت لك check my steps في مسألة، وش المفروض تسوي؟",14,/خطوة|أراجع|أفحص/],
["saudi","عندي 2، 4، 8 بس. أقدر أقول أكيد اللي بعده 16؟",14,/مو أكيد|ما نقدر|لا يمكن|قواعد|احتمال/],
["hijazi","أنا عمري 9، مو فاهم المتغير، اشرحه لي بطريقة سهلة.",9,/متغير|رمز|عدد/],
["hijazi","لسه ما فهمت الكسور، غير الطريقة ولا تعيد نفس الكلام.",12,/كسر|جزء|أجزاء|رسم|تمثيل/],
["hijazi","ليش ما أجمع المقامين وخلاص؟",12,/مقام|أجزاء|حجم/],
["hijazi","أنا مو فاهم الضرب مرة، علمني ببساطة.",8,/ضرب|مجموعات|جمع|مرات/],
["najdi","وش أسوي أول إذا أبي أراجع حلي بدون ما تعيد الحل عني؟",14,/خطوة|مراجعة|راجع|حل/],
["najdi","أنا أقول كل عدد أولي فردي، صح ولا لا؟",14,/2|٢|زوجي|أولي/],
["najdi","أبي أفهم ليه نسوي نفس العملية على طرفين المعادلة.",13,/طرف|توازن|معادلة/]
] as const;
async function main(){
const l=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});
if(!l.ok)throw Error("login HTTP "+l.status);
const lb=await l.json() as {success?:boolean};if(!lb.success)throw Error("login failed");
const cookie=(l.headers.get("set-cookie")??"").split(";")[0];
let sum=0,pass=0;const per:Record<string,{sum:number,n:number,pass:number}>={};
for(let i=0;i<cases.length;i++){
const [dialect,prompt,age,required]=cases[i];
const r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:prompt,subject:"الرياضيات",student:{age,preferredDialect:dialect},history:[],retrievedContext:[]})});
const body=await r.text();if(!r.ok)throw Error("case "+(i+1)+" HTTP "+r.status+" "+body.slice(0,200));
const answer=String((JSON.parse(body) as {answer?:string}).answer??"");
const result=evaluateSaudiFidelityV5(answer,{dialect,prompt,age,required});
sum+=result.score;pass+=Number(result.pass);
per[dialect]??={sum:0,n:0,pass:0};per[dialect].sum+=result.score;per[dialect].n++;per[dialect].pass+=Number(result.pass);
console.log(JSON.stringify({id:i+1,dialect,...result,answer},null,2));
}
console.log(JSON.stringify({suite:"hessa-saudi-fidelity-v5",overall:+(sum/cases.length).toFixed(3),passed:pass,total:cases.length,perDialect:Object.fromEntries(Object.entries(per).map(([k,v])=>[k,{score:+(v.sum/v.n).toFixed(3),passed:v.pass,total:v.n}]))},null,2));
if(process.env.HESSA_FIDELITY_V5_STRICT==="1"&&pass!==cases.length)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
