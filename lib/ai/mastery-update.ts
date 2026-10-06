import { computeMastery } from "./mastery-engine";
export type SkillEvidence={skillId:string;correct:boolean;score:number};
export function aggregateSkillEvidence(items:SkillEvidence[]){
 const map=new Map<string,{attempts:number;correct:number;scores:number[]}>();
 for(const item of items){const x=map.get(item.skillId)??{attempts:0,correct:0,scores:[]};x.attempts++;if(item.correct)x.correct++;x.scores.push(item.score);map.set(item.skillId,x);}
 return map;
}
export function nextMastery(previous:{attempts:number;correctAttempts:number},current:{attempts:number;correct:number;scores:number[]},threshold=.85){
 const attempts=previous.attempts+current.attempts;
 const correct=previous.correctAttempts+current.correct;
 const mastery=computeMastery(attempts,correct,current.scores,threshold);
 return{attempts,correctAttempts:correct,accuracy:mastery.accuracy,confidence:mastery.confidence,status:mastery.status,lastScore:current.scores.at(-1)??null,masteredAt:mastery.status==="MASTERED"?new Date():null};
}