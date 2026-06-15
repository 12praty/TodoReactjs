import { Request, Response, NextFunction } from "express";
import * as Jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}

export const Authorization = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return res.status(404).json({ message: "There is no token" });
    }
    const payload = Jwt.verify(token as string, process.env.ACCESSTOKEN!) as unknown as { userId: string };
    req.userId = payload.userId;
    next();
  } catch (err) {
    res.status(500).json({ message: "Internal Server error" });
  }
};