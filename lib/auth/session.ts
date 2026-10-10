import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
const COOKIE="hessa_session";
function sign(value:string){const secret=process.env.HESSA_SESSION_SECRET;if(!secret)throw new Error("HESSA_SESSION_SECRET is required");return createHash("sha256").update(secret+"|"+value).digest("hex");}
export async function createSession(userId:string){const store=await cookies();const value=userId+"."+sign(userId);store.set(COOKIE,value,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*30});}
export async function clearSession(){const store=await cookies();store.set(COOKIE,"",{httpOnly:true,path:"/",maxAge:0});}
export async function getCurrentUser(){const store=await cookies();const raw=store.get(COOKIE)?.value;if(!raw)return null;const dot=raw.lastIndexOf(".");if(dot<1)return null;const id=raw.slice(0,dot),sig=raw.slice(dot+1),expected=sign(id);if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;return prisma.user.findUnique({where:{id},include:{studentProfile:true}});}
export async function requireStudent(){const user=await getCurrentUser();if(!user||user.role!=="STUDENT")throw new Error("UNAUTHORIZED");return user;}
