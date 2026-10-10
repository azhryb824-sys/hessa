import {evaluateSaudiFidelityV5 as score} from "../lib/ai/saudi-fidelity-v5";
const c={dialect:"najdi" as const,prompt:"اشرح",age:14,required:/معادلة/};
const clean=score("خلنا نفهم المعادلة: إذا زدنا نفس العدد على الطرفين، تظل متوازنة.",c);
if(clean.issues.length||clean.score<.85)throw Error("valid rejected "+JSON.stringify(clean));
for(const text of ["وش تبي؟ بس بس تقدر تفهم المعادلة.","شوف ليه السؤال عن المعادلة؟","أبي تفهم المعادلة.","مش تضيع في المعادلة."]){const x=score(text,c);if(x.score>=.85||x.pass)throw Error("bad passed "+JSON.stringify(x))}
const irrelevant=score("خلّنا نمشي خطوة خطوة، ونتأكد من كل خطوة قبل الانتقال للي بعدها.",c);
if(irrelevant.pass)throw Error("generic fallback passed");
console.log("Saudi fidelity v5 scorer tests: PASS");
