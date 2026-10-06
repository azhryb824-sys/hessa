export function mapQuestionToSkill(question:string,subject?:string):string|null{
 if(subject&&subject!=="الرياضيات")return null;
 const q=question.replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).toLowerCase();
 if(/%|نسبه|نسبة|\d+\s*:\s*\d+/.test(q))return"g6-ratios";
 if(/(?:س|x)\s*[+\-]|\d+\s*(?:س|x)/i.test(q))return"g6-algebra";
 if(/مثلث|مساح.*مثلث/.test(q))return"g6-geometry";
 if(/محيط|مساح.*(?:مستطيل|مربع)/.test(q))return"g4-geometry";
 if(/\d+\s*\/\s*\d+/.test(q))return"g5-fractions-ops";
 if(/\d+(?:\.\d+).*\d+(?:\.\d+)/.test(q))return"g5-decimals";
 if(/[×*]|ضرب/.test(q))return"g3-multiply";
 if(/[÷/]|قسم|قسمة/.test(q))return"g3-division";
 if(/[+]|جمع/.test(q))return"g2-add-sub-100";
 if(/[-−]|طرح|ناقص/.test(q))return"g2-add-sub-100";
 return null;
}