import {HessaAICore} from "../lib/ai/core";
const cases=[
{m:"وش معنى خمسة أثمان؟ اشرحها لطفل.",age:9,need:/8|ثمان|5|خمس|أجزاء/},
{m:"لو قارنت نص الشيء بربعه، أي قطعة أكبر وليش؟",age:9,need:/نص|نصف|ربع|أكبر|جزء/},
{m:"أقيس طول الطريق حول أطراف الحديقة، هذا وش اسمه؟",age:10,need:/محيط|حول|حدود|أطراف/},
{m:"الكلام عن الضرب مو واضح، علمني بمجموعات أو نقاط.",age:10,need:/مجموعات|نقاط|عناصر|رسم/},
{m:"هل أصدق من الرسم بس إن زاويتين قد بعض؟",age:15,need:/لا|مو|دليل|قياس|خاصية/},
{m:"المعلومات الموجودة تسمح بأكثر من جواب، وش تسوي؟",age:17,need:/ما|معلومات|توضيح|احتمال|تخمين/},
{m:"50 بالمية يعني إيش لطفل بدون حساب؟",age:8,need:/نص|نصف|50|100/},
{m:"25 بالمية معناها إيش من الكل؟",age:9,need:/ربع|25|100/},
{m:"7 × 6، لا تقول لي كم، بس عطيني طريقة أمثلها.",age:11,need:/مجموعات|عناصر|جمع|مثّل|مثل/,ban:/\b42\b/},
{m:"72 ÷ 8، لا تحسبها لي، بس وجهني.",age:12,need:/ضرب|فكّر|فكر|ما راح أكشف/,ban:/\b9\b/},
{m:"كيف أراجع خطوة في برهان وأعرف إنها مو قفزة؟",age:17,need:/سبب|قاعدة|معط|تبرير|خطوة/},
{m:"إذا ما عندي معلومة تكفي لجواب واحد، هل الأفضل أخمن؟",age:16,need:/لا|مو|ما نقدر|معلومة|تخمن|تخمين/}
];
async function main(){const core=new HessaAICore();let p=0;const failures:any[]=[];for(const [i,c] of cases.entries()){const r=await core.tutor({message:c.m,subject:"الرياضيات",student:{age:c.age,preferredDialect:i%3===0?"hijazi":i%3===1?"najdi":"saudi"},history:[],retrievedContext:[]} as any);const ok=c.need.test(r.answer)&&!(c.ban?.test(r.answer));p+=+ok;if(!ok)failures.push({id:i+1,...c,answer:r.answer,method:r.verification.method});console.log(`[${i+1}/${cases.length}] ${ok?"PASS":"FAIL"} | ${r.verification.method} | ${r.answer}`)}console.log(JSON.stringify({suite:"hessa-saudi-development-v3",passed:p,total:cases.length,rate:p/cases.length,failures},null,2));if(p<10)process.exitCode=1}main().catch(e=>{console.error(e);process.exit(1)});