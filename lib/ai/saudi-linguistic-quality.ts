const crossDialect=[/(^|[^\p{L}])(?:عايز|عايزة|بدك|شو|إزاي|مخافش|مش)(?=$|[^\p{L}])/gu,/ما يعنيش/u];
const malformed=[/أنت\s+عمري/u,/أنا\s+بيعي/u,/نبدأ\s+بساعة\s+بسيطة/u,/بس\s+بس\s+بس/u,/بس\s+بسّط(?:ها)?/u,/خلّنا\s+نموي/u,/مقام\s+موترك/u,/المقام\s+الموترك/u,/وبيعرف\s+أنك/u,/بس\s+بس(?:\s|[،.!؟])/u,/شوف\s+ليه\s+السؤال/u,/أبي\s+تفهم/u,/بس\s+بسيط/u,/ما\s+كان\s+الشيء\s+صحيح/u];
const repetition=[/(\b[\p{L}]+\b)(?:\s+\1){2,}/gu];
export type SaudiLinguisticQuality={ok:boolean;score:number;issues:string[]};
export function evaluateSaudiLinguisticQuality(answer:string):SaudiLinguisticQuality{
 const issues:string[]=[];
 for(const r of crossDialect){r.lastIndex=0;if(r.test(answer))issues.push("CROSS_DIALECT:"+r.source)}
 for(const r of malformed)if(r.test(answer))issues.push("MALFORMED:"+r.source);
 for(const r of repetition){r.lastIndex=0;if(r.test(answer))issues.push("REPETITION:"+r.source)}
 const score=Math.max(0,1-issues.length*.25);
 return{ok:issues.length===0,score,issues};
}
