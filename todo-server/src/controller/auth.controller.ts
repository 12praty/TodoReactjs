import prisma from "../lib/prisma.js";
import argon2 from "argon2";
import type { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken, saveRefreshToken } from "../utils/token.js";

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
