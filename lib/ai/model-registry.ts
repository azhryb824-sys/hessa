export type OpenModelProfile={id:string;family:"qwen"|"gpt-oss"|"deepseek";role:"primary"|"challenger";adapter?:string;maxContext?:number};
export const HESSA_MODELS:OpenModelProfile[]=[
{id:"Qwen/Qwen3.5-397B-A17B",family:"qwen",role:"primary",adapter:"math-sa"},
{id:"openai/gpt-oss-120b",family:"gpt-oss",role:"challenger",adapter:"math-sa"},
{id:"deepseek-ai/DeepSeek-R1",family:"deepseek",role:"challenger",adapter:"math-sa"}
];
export function getModelProfile(id:string){return HESSA_MODELS.find(m=>m.id===id);}
