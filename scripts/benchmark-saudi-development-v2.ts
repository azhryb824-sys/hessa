import {evaluateSaudiFidelityV5} from "../lib/ai/saudi-fidelity-v5";
type D="saudi"|"hijazi"|"najdi";type C={id:number,d:D,age:number,intent:string,m:string,need:RegExp,ban?:RegExp};
const cases:C[]=[
{id:1,d:"saudi",age:9,intent:"concept",m:"لو قسمت نفس الساندويتش 6 أجزاء بدل 3، ليش القطعة تصغر؟",need:/أجزاء|تقسيم|أصغر/},
{id:2,d:"hijazi",age:16,intent:"concept",m:"فرّق لي بين المنوال والمتوسط من ناحية إيش يقيس كل واحد.",need:/منوال|متوسط|تكرار|جمع/},
{id:3,d:"najdi",age:12,intent:"hint",m:"56 ÷ 7، أبي دفعة بسيطة بس لا تطلع لي الجواب.",need:/فكّر|فكر|ضرب|تلميح|ما راح أكشف/,ban:/\b8\b/},
{id:4,d:"saudi",age:15,intent:"epistemic",m:"قاعدتي وافقت خمس قيم. هل هذا لحاله يخليها حقيقة؟",need:/لا|مو|ما نقدر|قاعدة|برهان|معلومات/},
{id:5,d:"hijazi",age:10,intent:"reteach",m:"طريقة تعريف الكسر بالكلام ما نفعت معايا، وريني الفكرة بشكل ثاني.",need:/رسم|قسم|أجزاء|ظل|دائرة/},
{id:6,d:"najdi",age:17,intent:"proof",m:"إيش اللي يخلي المثال المضاد قوي ضد جملة تبدأ بـ كل؟",need:/مثال|كل|حالة|عبارة/},
{id:7,d:"saudi",age:13,intent:"geometry",m:"إذا ثبت تطابق شكلين مثلثين، إيش أعرف عن الأجزاء اللي تقابل بعض؟",need:/أضلاع|زوايا|متناظر|متساوي/},
{id:8,d:"hijazi",age:8,intent:"age-fit",m:"اشرح لي 25% بسرعة كأني صغير.",need:/ربع|25|100|مئة/},
{id:9,d:"najdi",age:16,intent:"reason",m:"ليش ما أقدر ألاقي عدد أضربه في صفر ويطلع واحد؟",need:/صفر|1|واحد|ضرب/},
{id:10,d:"saudi",age:14,intent:"misconception",m:"أنا أقول 1/7 أكبر من 1/3 لأن 7 أكبر. فين الفكرة المعكوسة؟",need:/أجزاء|مقام|أصغر|تقسيم/},
{id:11,d:"hijazi",age:17,intent:"meta",m:"كيف أعرف إن الاستنتاج حقي مبني على المعطيات مو مجرد قفزة؟",need:/معط|سبب|قاعدة|تبرير|خطوة/},
{id:12,d:"najdi",age:9,intent:"child",m:"وش هو محيط الشكل بدون قانون؟",need:/حول|حدود|أطراف/},
{id:13,d:"saudi",age:16,intent:"induction",m:"في الاستقراء، ليش لازم خطوة تربط k باللي بعدها؟",need:/انتقال|استقراء|k|n|التالي/},
{id:14,d:"hijazi",age:11,intent:"hint",m:"6 مجموعات وكل وحدة فيها 5، لا تحسبها عني؛ علمني كيف أبدأ.",need:/مجموعة|جمع|عد|مثّل|مثل/,ban:/\b30\b/},
{id:15,d:"najdi",age:15,intent:"concept",m:"وش الفرق بين الوسيط والمنوال إذا البيانات فيها رقم متكرر كثير؟",need:/وسيط|منوال|تكرار|ترتيب/},
{id:16,d:"saudi",age:18,intent:"uncertainty",m:"إذا نموذجين مختلفين يشرحون نفس النقاط الموجودة، أقدر أجزم بواحد؟",need:/لا|مو|ما نقدر|بيانات|معلومات|دليل/},
{id:17,d:"hijazi",age:9,intent:"concept",m:"نص الشيء وربع الشيء، مين أكبر وليش؟",need:/نص|نصف|ربع|جزء/},
{id:18,d:"najdi",age:16,intent:"review",m:"بعد ما أطلع قيمة المجهول، كيف أراجعها بطريقة مستقلة؟",need:/تعويض|معادلة|طرف|تحقق/},
{id:19,d:"saudi",age:12,intent:"truth",m:"هل الصفر له مقلوب زي باقي الأعداد؟",need:/لا|مو|صفر|1|واحد/},
{id:20,d:"hijazi",age:15,intent:"concept",m:"إيش معنى إن ضلعين متناظرين في مثلثين متطابقين؟",need:/ضلع|متناظر|متساوي|تطابق/}
];
const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
async function main(){const l=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});if(!l.ok)throw Error("login "+l.status);const cookie=(l.headers.get("set-cookie")??"").split(";")[0];let p=0,sum=0;const failures:any[]=[];
for(const c of cases){const st=Date.now();const r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:c.m,subject:"الرياضيات",student:{age:c.age,preferredDialect:c.d},history:[],retrievedContext:[]})});if(!r.ok){failures.push({...c,http:r.status});console.log(`[${c.id}/20] FAIL HTTP ${r.status}`);continue}const j=await r.json();const answer=String(j.answer??"");const q=evaluateSaudiFidelityV5(answer,{dialect:c.d,prompt:c.m,age:c.age,required:c.need});const forbidden=!!c.ban?.test(answer);const ok=q.pass&&!forbidden;const score=forbidden?Math.min(q.score,.5):q.score;p+=+ok;sum+=score;if(!ok)failures.push({...c,score,issues:[...q.issues,...(forbidden?["FORBIDDEN_OUTPUT"]:[])],answer,method:j.verification?.method});console.log(`[${String(c.id).padStart(2,"0")}/20] ${ok?"PASS":"FAIL"} | ${c.d} | ${c.intent} | ${((Date.now()-st)/1000).toFixed(1)}s | ${score.toFixed(3)} | ${j.verification?.method}`)}
console.log(JSON.stringify({suite:"hessa-saudi-development-v2",passed:p,total:cases.length,rate:+(p/cases.length).toFixed(3),overall:+(sum/cases.length).toFixed(3),failures},null,2));if(p<17)process.exitCode=1}
main().catch(e=>{console.error(e);process.exit(1)});