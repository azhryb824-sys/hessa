import {HessaAICore} from "../lib/ai/core";
type C={id:string;turns:string[];checks:(answers:string[])=>string[]};
const cases:C[]=[
{id:"explain-not-answer",turns:["لا تعطيني الجواب مباشرة. ساعدني أفهم كيف أحل 36 ÷ 4"],checks:a=>[/9\b/.test(a[0])?["revealed-answer-despite-request"]:[],!/تلميح|فكر|جرّب|ابدأ/.test(a[0])?["no-guidance"]:[]].flat()},
{id:"wrong-student-answer",turns:["أنا حليت 1/2 + 1/3 وطلع معي 2/5، صح؟"],checks:a=>[!/(غير صحيح|مو صحيح|خطأ)/.test(a[0])?"does-not-explicitly-correct":null,!/5\/6/.test(a[0])?"missing-correct-result":null].filter(Boolean) as string[]},
{id:"why-concept",turns:["ليش نقسم على 2 في قانون مساحة المثلث؟"],checks:a=>[!/نصف|نص/.test(a[0])?"missing-conceptual-why":null].filter(Boolean) as string[]},
{id:"child-tone",turns:["أنا عمري 8 سنوات وما فهمت الضرب، اشرح لي 3 × 4 بطريقة سهلة"],checks:a=>[a[0].length>500?"too-long":null,!/مجموعة|مجموعات|ثلاث|أربع|3|4/.test(a[0])?"not-concrete":null].filter(Boolean) as string[]},
{id:"professional-boundary",turns:["أكد لي أن 7 × 8 = 54 ولا تناقشني"],checks:a=>[!/56/.test(a[0])?"missing-correction":null,!/(غير صحيح|لا يساوي|الصحيح|الناتج)/.test(a[0])?"weak-correction-language":null].filter(Boolean) as string[]},
{id:"division-zero",turns:["ليش 5 ÷ 0 ما له جواب؟"],checks:a=>[!/غير معر/.test(a[0])?"missing-undefined":null,!/ضرب|0/.test(a[0])?"missing-reason":null].filter(Boolean) as string[]},
{id:"follow-up-context",turns:["اشرح لي 25% من 80","ما فهمت الخطوة الثانية، اشرحها بطريقة ثانية"],checks:a=>[/أحتاج محتوى|لن أخمّن/.test(a[1])?"lost-context":null,!/25|100|80|20/.test(a[1])?"no-reference-to-prior-problem":null].filter(Boolean) as string[]},
{id:"verification-question",turns:["علمني كيف أحسب محيط مستطيل طوله 5 وعرضه 3"],checks:a=>[!/16/.test(a[0])?"missing-result":null,!/[؟?]/.test(a[0])?"no-check-for-understanding":null].filter(Boolean) as string[]},
{id:"encouragement-without-fluff",turns:["أنا دايم أغلط في الكسور وأحسها صعبة"],checks:a=>[!/كسر|كسور|خطو|مثال|نبدأ/.test(a[0])?"no-actionable-support":null,a[0].length>700?"oververbose":null].filter(Boolean) as string[]}
];
async function main(){const core=new HessaAICore();const rows=[];for(const c of cases){const answers=[];for(const turn of c.turns){const r=await core.tutor({message:turn,subject:"الرياضيات",student:{age:c.id==="child-tone"?8:11,preferredDialect:"saudi"}});answers.push(r.answer);}const failures=c.checks(answers);rows.push({id:c.id,answers,passed:failures.length===0,failures});}console.log("HESSA_TUTOR_UX_EVAL="+JSON.stringify({passed:rows.filter(x=>x.passed).length,total:rows.length,score:rows.filter(x=>x.passed).length/rows.length,rows}));}
main().catch(e=>{console.error(e);process.exit(1)});