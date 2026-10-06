export type MathErrorCode="OPERATION_CONFUSION"|"PLACE_VALUE"|"REGROUPING"|"FRACTION_DENOMINATOR"|"PERCENT_SCALE"|"RATIO_SIMPLIFICATION"|"EQUATION_INVERSE"|"GEOMETRY_FORMULA"|"CALCULATION"|"UNKNOWN";
export function diagnoseMathError(question:string,studentAnswer:string,correctAnswer:string):{code:MathErrorCode;confidence:number;feedback:string}{
 const q=question.replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
 const a=Number(studentAnswer),c=Number(correctAnswer);
 if(/%/.test(q)&&Number.isFinite(a)&&Number.isFinite(c)&&(Math.abs(a-c*100)<1e-9||Math.abs(a*100-c)<1e-9))return{code:"PERCENT_SCALE",confidence:.9,feedback:"يبدو أن الخطأ في تحويل النسبة المئوية إلى جزء من مئة."};
 if(/\d+\s*\/\s*\d+/.test(q)&&studentAnswer.includes("/"))return{code:"FRACTION_DENOMINATOR",confidence:.72,feedback:"راجع توحيد المقامات والتأكد من أن الأجزاء من النوع نفسه قبل الجمع أو الطرح."};
 if(/(?:س|x)/i.test(q))return{code:"EQUATION_INVERSE",confidence:.72,feedback:"راجع العملية العكسية وحافظ على تساوي طرفي المعادلة ثم تحقق بالتعويض."};
 if(/مساح|محيط|مثلث|مستطيل|مربع/.test(q))return{code:"GEOMETRY_FORMULA",confidence:.75,feedback:"حدد أولًا هل المطلوب مساحة أم محيطًا، ثم اختر القانون والوحدة المناسبة."};
 if(/[+\-×*÷]/.test(q)&&Number.isFinite(a)&&Number.isFinite(c))return{code:"CALCULATION",confidence:.6,feedback:"العملية مناسبة غالبًا، لكن توجد مشكلة في تنفيذ الحساب. أعد الحل خطوة خطوة وتحقق بالتقدير."};
 return{code:"UNKNOWN",confidence:.3,feedback:"نحتاج سؤال تحقق قصيرًا لتحديد سبب الخطأ بدل التخمين."};
}