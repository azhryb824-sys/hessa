export type MasteryStatus = "NOT_STARTED" | "LEARNING" | "REMEDIATE" | "RETEST" | "MASTERED";
export type LearningAction = "TEACH" | "PRACTICE" | "DIAGNOSE" | "REMEDIATE" | "RETEST" | "ADVANCE";
export type MasteryEvidence={attempts:number;correct:number;recentScores:number[];threshold:number;variants?:string[];difficulties?:number[]};
export function computeMastery(attempts:number,correct:number,recentScores:number[],threshold:number,variants:string[]=[],difficulties:number[]=[]){
 const accuracy=attempts?correct/attempts:0;const recent=recentScores.slice(-4);const recentMean=recent.length?recent.reduce((a,b)=>a+b,0)/recent.length:0;
 const variantCount=new Set(variants).size;const difficultyCount=new Set(difficulties).size;
 const breadth=Math.min(1,(variantCount/2)*.6+(difficultyCount/2)*.4);
 const confidence=Math.min(.98,(Math.min(attempts,6)/6)*.55+(recent.length/4)*.2+breadth*.25);
 let status:MasteryStatus=attempts?"LEARNING":"NOT_STARTED";
 if(attempts>=2&&accuracy<.6)status="REMEDIATE";
 if(attempts>=3&&accuracy>=.6&&accuracy<threshold)status="RETEST";
 const enoughBreadth=(variants.length===0&&difficulties.length===0)?(attempts>=5&&recent.length>=3):variantCount>=2&&difficultyCount>=2;
 if(attempts>=5&&accuracy>=threshold&&recentMean>=threshold&&enoughBreadth)status="MASTERED";
 return{accuracy,recentMean,breadth,confidence,status,enoughBreadth};
}
export function chooseLearningAction(status:MasteryStatus,attempts:number,lastCorrect?:boolean):LearningAction{if(status==="NOT_STARTED")return"TEACH";if(status==="MASTERED")return"ADVANCE";if(status==="REMEDIATE")return"REMEDIATE";if(status==="RETEST")return"RETEST";if(attempts===1&&lastCorrect===false)return"DIAGNOSE";return"PRACTICE";}