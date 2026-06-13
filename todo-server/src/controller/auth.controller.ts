import prisma from "../lib/prisma.js";
import argon2 from "argon2";
import type { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken, saveRefreshToken } from "../utils/token.js";
import jwt from "jsonwebtoken"
import { access } from "node:fs";

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
            return res.status(400).json({
                status: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await argon2.hash(password);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword },
        });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        await saveRefreshToken(user.id, refreshToken);

        return res.status(201).json({
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email },
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ message: "User not exists" })
        }
        const valid = await argon2.verify(user?.password!, password);
        if (!valid) {
            res.status(404).json({ message: "User not exists" })
        }
        const accessToken = generateAccessToken(user?.id!)
        const refreshToken = generateRefreshToken(user?.id!)
        await saveRefreshToken(user?.id!, refreshToken)
        return res.status(200).json({ accessToken, refreshToken, user: { id: user?.id, email: user?.email } })

    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" })
    }
}
export const refresh = async (req: Request, res: Response) => {

    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: 'No token' });

        }
        const payload = jwt.verify(refreshToken, process.env.REFRESHTOKEN!) as { userId: string }
        const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
        if (!stored || stored.expiredAt < new Date()) {
            return res.status(403).json({ message: 'Token revoked or expired' });
        }
        return res.status(200).json({ accessToken: generateAccessToken(payload.userId) })
    } catch (err) {
        res.status(500).json({ message: "Internal Server Error" })
    }
}
export const me = async (req: Request, res: Response) => {
    try {
        const { userId } = (req as any);
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } })
        if (!user) {
            res.status(404).json({ message: "user Not Exist" })
        }
        res.status(200).json({ user })

    } catch (err) {
        res.status(500).json({ message: "Internal Server Error", err })
    }
}
export const logout = async (req: Request, res: Response) => {

    try {
        const { refreshToken } = req.body;
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        })
        res.status(200).json({ message: "user is Logout" })

    } catch (err) {
        res.status(500).json({ message: "Internal Server Error", err })

    }
}