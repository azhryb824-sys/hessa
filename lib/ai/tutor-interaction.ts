export type TutorIntent="HINT"|"CHECK_ANSWER"|"WHY"|"RETEACH"|"EMOTIONAL_DIFFICULTY"|"SOLVE";
export function detectTutorIntent(message:string):TutorIntent{
 if(/(?:لا|بدون\s+ما)\s*(?:تعطيني|تقول|تكتب).*?(?:جواب|حل|ناتج|قيمة)|تلميح|ساعدني\s+أفهم/i.test(message))return"HINT";
 if(/(?:حلي|حسبت|إجابتي|اجابتي).*?(?:صح|صحيح)|صح[؟?]?$/i.test(message))return"CHECK_ANSWER";
 if(/ليش|لماذا|سبب|ليه/.test(message))return"WHY";
 if(/ما\s*فهمت|لم\s*أفهم|طريقة\s+ثانية|بطريقة\s+ثانية|وضحها/.test(message))return"RETEACH";
 if(/دايم\s+أغلط|دائم.*أخط|صعب|صعبة|مو\s+فاهم/.test(message))return"EMOTIONAL_DIFFICULTY";
 return"SOLVE";
}
export function professionalizeMathAnswer(message:string,base:string,intent:TutorIntent){
 if(intent==="HINT"){const expr=message.match(/(-?\d+(?:\.\d+)?)\s*([+\-×*÷/])\s*(-?\d+(?:\.\d+)?)/);if(expr)return`أكيد. ما راح أعطيك الناتج مباشرة. خلّنا نبدأ بتلميح: حدّد العملية أولًا. عندنا ${expr[1]} ${expr[2]} ${expr[3]}. إذا كانت قسمة، اسأل نفسك: أي عدد إذا ضربناه في ${expr[3]} يعطينا ${expr[1]}؟ جرّب أنت، واكتب لي العدد الذي وصلت له.`;}
 if(intent==="CHECK_ANSWER"){return `خلّنا نتحقق من حلك بدقة. ${base.includes("غير صحيح")||base.includes("غير")?base:`النتيجة التي ذكرتها ليست صحيحة. ${base}`} أين حصل الاختلاف؟ راجع العملية التي أجريتها على الأجزاء، ثم جرّب مرة ثانية.`;}
 if(intent==="WHY"&&/مثلث|مساح/.test(message))return"لأن المثلث يمكن أن يكون نصف مستطيل له القاعدة والارتفاع نفسيهما. مساحة المستطيل هي القاعدة × الارتفاع، والمثلث يأخذ نصف هذه المساحة؛ لذلك نقسم على 2. تخيّل مستطيلًا وقسمه بخط قطري: تحصل على مثلثين متساويين. هل تحب نجربها بأرقام بسيطة؟";
 if(intent==="EMOTIONAL_DIFFICULTY"&&/كسر|كسور/.test(message))return"الكسور تصير أوضح لما نمشي خطوة واحدة في كل مرة. نبدأ بمعنى الكسر نفسه: في 1/2 المقام 2 يعني أن الكل مقسوم إلى جزأين متساويين، والبسط 1 يعني أننا أخذنا جزءًا واحدًا. بعدها ننتقل للجمع. جرّب معي أولًا: لو قسمنا بيتزا إلى جزأين متساويين وأخذنا جزءًا واحدًا، ما الكسر الذي يمثل الجزء المأخوذ؟";
 return base;
}
export function addUnderstandingCheck(answer:string,intent:TutorIntent){if(intent!=="SOLVE"||/[؟?]\s*$/.test(answer))return answer;return answer+"\n\nللتأكد من الفهم: هل تريد أن تجرب مسألة مشابهة بنفسك؟";}
