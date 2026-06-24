import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";


export const getTodos = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const todos = await prisma.todo.findMany({
            where: { userId: req.userId },
            orderBy: { id: "desc" },
        });

        return res.status(200).json({ todos });
    } catch (err) {
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

export const createTodo = async (req: Request, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { title } = req.body;
        const todo = await prisma.todo.create({ data: { title, userId: req.userId } });

        return res.status(201).json({ todo });
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const updateTodo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { done } = req.body;

        if (typeof id !== "string") {
            return res.status(400).json({ message: "Invalid ID" });
        }

        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const todo = await prisma.todo.findFirst({ where: { id, userId: req.userId } });
        if (!todo) {
            return res.status(404).json({ message: "todo not found" });
        }

        const updatedTodo = await prisma.todo.update({ 
            where: { id }, 
            data: { done } 
        });

        return res.status(200).json({ updatedTodo });
    } catch (err) {
        return res.status(500).json({ message: "Internal Server error" });
    }
};