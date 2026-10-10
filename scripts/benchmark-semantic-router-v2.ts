import {semanticRouteV2} from "../lib/ai/semantic-router-v2";
const cases=[
["لا تقول لي الناتج، بس لمّح","hint"],["أنا حسبت 2/3 + 1/3 = 3/6، وين الغلط؟","misconception"],
["الشرح مو واضح، أبي طريقة ثانية","reteach"],["المعطيات ما تكفي لجواب واحد، وش نسوي؟","epistemic"],
["ليش المقام الأكبر يخلي 1/9 أصغر؟","concept"],["حلي صح؟","verify"],["17 + 8","direct"],
["لا تحسبها لي؛ علمني كيف أبدأ","hint"],["أقدر أجزم إن النمط هذا الوحيد؟","epistemic"],
["فسر لي معنى المتغير","concept"],["أنا أعتقد 1/8 أكبر لأن 8 أكبر، صح؟","misconception"],
["وريني بالرسم بدل الكلام، ما فهمت","reteach"]
] as const;
let p=0;for(const [i,[m,want]] of cases.entries()){const r=semanticRouteV2(m,10);const ok=r.intent===want;p+=+ok;console.log(`[${i+1}/${cases.length}] ${ok?"PASS":"FAIL"} ${want} <- ${r.intent} | ${r.reasons.join(",")}`)}
console.log(JSON.stringify({suite:"semantic-router-v2",passed:p,total:cases.length,rate:p/cases.length},null,2));if(p!==cases.length)process.exitCode=1;
