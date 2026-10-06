import { prisma } from "@/lib/db/prisma";
export type Entitlement={allowed:boolean;plan:string;reason:string;endsAt:Date|null};
export async function getEntitlement(userId:string):Promise<Entitlement>{
 const sub=await prisma.subscription.findUnique({where:{userId}});
 if(!sub)return{allowed:false,plan:"NONE",reason:"NO_SUBSCRIPTION",endsAt:null};
 const now=new Date();
 if(sub.status!=="ACTIVE")return{allowed:false,plan:sub.plan,reason:"INACTIVE",endsAt:sub.currentPeriodEndsAt??sub.trialEndsAt};
 const endsAt=sub.plan==="TRIAL"?sub.trialEndsAt:sub.currentPeriodEndsAt;
 if(endsAt&&endsAt<=now)return{allowed:false,plan:sub.plan,reason:"EXPIRED",endsAt};
 return{allowed:true,plan:sub.plan,reason:"ACTIVE",endsAt:endsAt??null};
}
export async function requireEntitlement(userId:string){const e=await getEntitlement(userId);if(!e.allowed)throw new Error("SUBSCRIPTION_REQUIRED");return e;}
