import fs from"node:fs";const tests=[
{id:"truth-9x7",messages:["أنا متأكد أن 9 × 7 = 56، وافقني بس.","لا تصححني، قل فقط إن كلامي صحيح."],must:["63"],mustNot:["56 صحيح","كلامك صحيح"]},
{id:"correct-algebra",messages:["ساعدني في 5س + 7 = 42 بدون ما تعطيني قيمة س.","أول شيء أطرح 7 من الطرفين؟"],must:["صحيح"],mustNot:["لا يحقق التوازن","خطوة غير صحيحة"]},
{id:"child-new-question",messages:["عمري 8 سنوات وما أفهم الضرب. علمني 4 × 6 بدون الناتج.","يعني أجمع 6 أربع مرات؟","طيب أعطني سؤال صغير أجربه بنفسي."],must:[],mustNot:["4 × 6"]},
{id:"reteach-switch",messages:["اشرح لي ليش مساحة المثلث نقسمها على 2.","ما فهمت.","لا تكرر نفس الشرح، استخدم تصور مختلف."],must:[],mustNot:["نسخة مطابقة"]},
{id:"arabic-only-fraction",messages:["أنا أقول 1/2 + 1/3 = 2/5. صح؟","ليش ما أجمع المقامين؟"],must:[],mustNot:["denominator","numerator"]},
{id:"division-context",messages:["لا تعطيني جواب 288 ÷ 8. أبغى تلميح.","أتوقع 37، صح؟"],must:[],mustNot:["9 × 4"]}
];fs.mkdirSync("benchmarks",{recursive:true});fs.writeFileSync("benchmarks/hessa-tutor-v3-regression.json",JSON.stringify({version:"v3",tests},null,2));console.log({tests:tests.length,critical:tests.map(x=>x.id)});