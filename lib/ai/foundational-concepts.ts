
import type {ConceptResponse} from "./concept-tutor";

export function teachFoundationalConcept(message:string):ConceptResponse|null{
  const text=message
    .replace(/[\u064B-\u065F\u0670\u0640]/g,"")
    .replace(/[أإآ]/g,"ا")
    .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660))
    .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x06F0))
    .replace(/−/g,"-");

  // مقارنة عددين سالبين؛ لا نلتقط بسطَي كسرين أو أجزاء من عملية.
  if(!/[\/÷×*=]/.test(text)&&
     /(?:اصغر|اكبر|قارن)/.test(text)){
    const values=text.match(/-\d+(?:\.\d+)?/g)??[];
    if(values.length===2){
      const a=Number(values[0]),b=Number(values[1]);
      if(a<0&&b<0&&Math.abs(a)<=1000000&&Math.abs(b)<=1000000){
        const symbol=a>b?">":a<b?"<":"=";
        const claim=text.match(
          /(-\d+(?:\.\d+)?)\s+(اصغر|اكبر)\s+من\s+(-\d+(?:\.\d+)?)/
        );
        const judgment=claim
          ?((claim[2]==="اصغر"?a<b:a>b)
            ?"نعم، المقارنة صحيحة. "
            :"لا، المقارنة تحتاج تصحيح. ")
          :"";
        const why=a===b
          ?"العددان لهما نفس القيمة."
          :"بين عددين سالبين، العدد الأقرب للصفر هو الأكبر. على خط الأعداد، العدد الموجود جهة اليمين هو الأكبر.";
        return {
          concept:"negative-number-order",
          confidence:.99,
          answer:`${judgment}المقارنة: ${a} ${symbol} ${b}. ${why}`
        };
      }
    }
  }

  // تعريف الثلث، دون اعتراض أسئلة ثلثي الكمية أو حساب ثلث عدد.
  const third=/(?:^|[\s،؛.!؟?])(?:الثلث|ثلث)(?=$|[\s،؛.!؟?])/.test(text);
  if(third&&!/(?:ثلثين|ثلثي|نصف|نصها|ربع|اثلاث|قسمة|نضرب)/.test(text)){
    if(/(?:كبيرة|اكبر)/.test(text)&&
       /(?:صغار|صغيرة|اصغر|غير متساوية|مو متساوية)/.test(text)){
      return {
        concept:"third-unequal-parts",
        confidence:.99,
        answer:"لا، القطعة الكبيرة ما نسميها ثلثًا لمجرد إن عدد القطع ثلاث. الثلث يعني حصة واحدة من ثلاث حصص قد بعض، لأن كل حصة لازم تمثل نفس المقدار من الكمية. إذا القطع تختلف في الحجم، ما تكون كل قطعة ثلثًا."
      };
    }
    if(/(?:معنى|يعني|اشرح|فهم|استوعب)/.test(text)&&
       !/(?:ثلث|الثلث)\s+(?:من\s+)?\d/.test(text)){
      return {
        concept:"third-as-equal-parts",
        confidence:.99,
        answer:"الثلث يعني جزءًا واحدًا من ثلاثة أجزاء قد بعض. تخيل شريطًا قسمناه ثلاث قطع متساوية؛ قطعة واحدة منه تمثل الثلث. لو القطع مو قد بعض، ما نقدر نسمي كل قطعة ثلثًا."
      };
    }
  }
  return null;
}
