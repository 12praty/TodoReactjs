import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

export const generateAccessToken = ((userId:string):string=>{
    return jwt.sign({userId},process.env.ACCESSTOKEN!,{expiresIn:'15m'})

})

export const generateRefreshToken = ((userId:string):string=>{
    return jwt.sign({userId},process.env.REFRESHTOKEN!,{expiresIn:'7d'})

})



export const saveRefreshToken = async (userId: string, token: string): Promise<void> => {
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7);
    await prisma.refreshToken.create({ data: { token, userId, expiredAt } });
} 