import {HessaAICore} from "../lib/ai/core";
const cases=[
{m:"وش الفرق بين المنوال والوسيط؟",need:/منوال.*تكرار|تكرار.*منوال/},
{m:"ليش الصفر ما عنده مقلوب ضربي؟",need:/صفر.*1|1.*صفر/},
{m:"ليش 1/12 أصغر من 1/5؟",need:/أجزاء|مقام/},
{m:"بعد ما أثبت تطابق مثلثين، وش أقدر أستنتج؟",need:/أضلاع.*زوايا|زوايا.*أضلاع/},
{m:"هل مثال مضاد واحد يكفي ضد عبارة تقول كل الحالات؟",need:/مثال.*كل|كل.*مثال/},
{m:"في الاستقراء، هل فحص n و n+1 لحاله يكفي بدون خطوة انتقال؟",need:/انتقال|استقراء/},
{m:"إيش يعني 50% لطفل؟",need:/نص|نصف|100/},
{m:"وش يعني محيط الشكل؟",need:/حدود|حول/}
];
async function main(){const core=new HessaAICore();let p=0;for(const [i,c] of cases.entries()){const r=await core.tutor({message:c.m,subject:"الرياضيات",student:{age:i===6?9:15,preferredDialect:i%2?"hijazi":"saudi"},history:[],retrievedContext:[]} as any);const generic=/^خلّنا نمشي خطوة خطوة/.test(r.answer);const ok=c.need.test(r.answer)&&!generic;p+=+ok;console.log(`[${i+1}/${cases.length}] ${ok?"PASS":"FAIL"} | ${r.verification.method} | ${r.answer}`)}console.log(JSON.stringify({suite:"hessa-concept-reteach-architecture-v1",passed:p,total:cases.length,rate:p/cases.length},null,2));if(p<7)process.exitCode=1}main().catch(e=>{console.error(e);process.exit(1)});