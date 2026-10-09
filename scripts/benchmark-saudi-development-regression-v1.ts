import {evaluateSaudiFidelityV5} from "../lib/ai/saudi-fidelity-v5";
type D="saudi"|"hijazi"|"najdi";type C={id:number,dialect:D,age:number,prompt:string,required:RegExp};
const cases:C[]=[
{id:1,dialect:"saudi",age:9,prompt:"وش معنى 4/7؟ أبي أفهم السبعة تحت وش تسوي.",required:/7|أجزاء|متساوي/},
{id:2,dialect:"hijazi",age:8,prompt:"لما أقول نص الكيكة، إيش أقصد؟",required:/جزئين|متساوي|نص|نصف/},
{id:3,dialect:"najdi",age:10,prompt:"وش يعني س في المسألة؟",required:/رمز|عدد|قيمة|يتغير/},
{id:4,dialect:"hijazi",age:16,prompt:"فرّق لي بين الوسيط والمتوسط بطريقة سهلة.",required:/متوسط|وسيط|ترتيب|جمع/},
{id:5,dialect:"saudi",age:10,prompt:"5 صناديق بكل صندوق 3 كرات، لا تحسبها لي؛ وش أسوي؟",required:/مجموع|صندوق|ضرب|عد/},
{id:6,dialect:"najdi",age:17,prompt:"لقيت نمط يضبط كم حد، هل هذا يكفي أقول إنه الوحيد؟",required:/مو|ما نقدر|قاعدة|أكثر|معلومات/},
{id:7,dialect:"hijazi",age:13,prompt:"واحد يقول كل رقم آخره خمسة أولي، كيف أرد عليه؟",required:/مو|غير|5|أولي|قسمة/},
{id:8,dialect:"saudi",age:15,prompt:"ليش إذا ضربت المتباينة بسالب لازم أعكس الإشارة؟",required:/سالب|اتجاه|إشارة|متباين/},
{id:9,dialect:"hijazi",age:9,prompt:"قسمنا نفس البيتزا 3 قطع وبعدين 6 قطع، ليش قطع الست أصغر؟",required:/أجزاء|أصغر|نفس|تقسيم/},
{id:10,dialect:"najdi",age:16,prompt:"كيف أفرق بين إني تحققت من مثال وبين إني أثبت قاعدة؟",required:/مثال|برهان|قاعدة|تحقق/}
];
const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
async function main(){const l=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});if(!l.ok)throw Error("login "+l.status);const cookie=(l.headers.get("set-cookie")??"").split(";")[0];let p=0;const failures:any[]=[];
for(const c of cases){const r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:c.prompt,subject:"الرياضيات",student:{age:c.age,preferredDialect:c.dialect},history:[],retrievedContext:[]})});if(!r.ok){failures.push({...c,http:r.status});continue}const j=await r.json();const answer=String(j.answer??"");const q=evaluateSaudiFidelityV5(answer,{dialect:c.dialect,prompt:c.prompt,age:c.age,required:c.required});p+=+q.pass;if(!q.pass)failures.push({...c,score:q.score,issues:q.issues,answer});console.log(`[${c.id}/10] ${q.pass?"PASS":"FAIL"} ${q.score.toFixed(3)} | ${answer.slice(0,100)}`)}
console.log(JSON.stringify({suite:"hessa-saudi-development-regression-v1",passed:p,total:cases.length,rate:p/cases.length,failures},null,2));if(p<9)process.exitCode=1}
main().catch(e=>{console.error(e);process.exit(1)});