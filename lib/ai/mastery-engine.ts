export type MasteryStatus = "NOT_STARTED" | "LEARNING" | "REMEDIATE" | "RETEST" | "MASTERED";
export type LearningAction = "TEACH" | "PRACTICE" | "DIAGNOSE" | "REMEDIATE" | "RETEST" | "ADVANCE";
export function computeMastery(attempts:number,correct:number,recentScores:number[],threshold:number){
 const accuracy=attempts?correct/attempts:0;
 const recent=recentScores.slice(-3);
 const recentMean=recent.length?recent.reduce((a,b)=>a+b,0)/recent.length:0;
 const confidence=Math.min(.98,(attempts/5)*.75+(recent.length/3)*.23);
 let status:MasteryStatus=attempts?"LEARNING":"NOT_STARTED";
 if(attempts>=2&&accuracy<.6)status="REMEDIATE";
 if(attempts>=3&&accuracy>=.6&&accuracy<threshold)status="RETEST";
 if(attempts>=4&&accuracy>=threshold&&recentMean>=threshold)status="MASTERED";
 return{accuracy,confidence,status};
}
export function chooseLearningAction(status:MasteryStatus,attempts:number,lastCorrect?:boolean):LearningAction{
 if(status==="NOT_STARTED")return"TEACH";
 if(status==="MASTERED")return"ADVANCE";
 if(status==="REMEDIATE")return"REMEDIATE";
 if(status==="RETEST")return"RETEST";
 if(attempts===1&&lastCorrect===false)return"DIAGNOSE";
 return"PRACTICE";
}