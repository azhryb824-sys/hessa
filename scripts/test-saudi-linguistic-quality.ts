import {evaluateSaudiLinguisticQuality as q} from "../lib/ai/saudi-linguistic-quality";
const good=["خلنا نفهم الفكرة بمثال بسيط.","مو أكيد؛ نحتاج معلومات أكثر قبل ما نحدد القاعدة.","نوحّد الكسور بمقام مشترك ثم نجمع البسط."];
const bad=["أنت عمري 9، خلنا نبدأ.","خلينا نبدأ بس بس بس.","أنا بيعي خمس حبات.","مش تضيع في التفاصيل.","نبدأ بساعة بسيطة.","نستخدم مقام موترك.","شوف ليه السؤال اللي تبغى تراجعه.","أبي تفهم ليه نسوي كذا.","خلينا نبدأ بس بسيط.","نفترض أن الشيء ما كان صحيح."];
for(const x of good){const r=q(x);if(!r.ok)throw Error("good rejected: "+x+" "+r.issues.join(","))}
for(const x of bad){const r=q(x);if(r.ok)throw Error("bad accepted: "+x)}
console.log("Saudi linguistic quality tests: PASS");
