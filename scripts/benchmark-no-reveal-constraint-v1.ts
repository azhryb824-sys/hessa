import {HessaAICore} from "../lib/ai/core";
const cases=[
{message:"ساعدني في 54 ÷ 6 بتلميح فقط.",forbidden:/\b9\b/},
{message:"8 مجموعات في كل مجموعة 4، لا تقول الناتج.",forbidden:/\b32\b/},
{message:"63 ÷ 7، لا تحلها لي؛ اسألني سؤال يوصلني.",forbidden:/\b9\b/},
{message:"أبغى تلميح لمسألة 5 × 6 ولا تكشف الجواب.",forbidden:/\b30\b/},
{message:"بدون ما تعطيني الحل: 72 ÷ 8",forbidden:/\b9\b/},
{message:"لمّح لي كيف أحسب 9 × 4.",forbidden:/\b36\b/}
];
async function main(){const core=new HessaAICore();let p=0;for(const [i,c] of cases.entries()){const r=await core.tutor({message:c.message,subject:"الرياضيات",student:{age:12,preferredDialect:"saudi"},history:[],retrievedContext:[]} as any);const ok=!c.forbidden.test(r.answer)&&/no-reveal|hidden-answer/.test(r.verification.method);p+=+ok;console.log(`[${i+1}/${cases.length}] ${ok?"PASS":"FAIL"} | ${r.verification.method} | ${r.answer}`)}console.log(JSON.stringify({suite:"hessa-no-reveal-constraint-v1",passed:p,total:cases.length,rate:p/cases.length},null,2));if(p!==cases.length)process.exitCode=1}main().catch(e=>{console.error(e);process.exit(1)});