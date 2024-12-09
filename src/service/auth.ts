import { connectPool } from "./db";
import { Request } from "express";
import crypto from "crypto";
import mysql from "mysql2/promise";

const mySalt: string | undefined = process.env.SALT;

export async function loginHandler(req: Request, res: any) {
    try {
        const { id, password }: { id: string; password: string } = req.body;

        if (!id || !password) {
            return res.status(400).json({
                success: false,
                error: "Invalid ID or password",
            });
        }

        const hashedPassword: string = crypto
            .createHash("sha256")
            .update(password + mySalt)
            .digest("hex");

        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT `id`, `nickname` FROM `account` WHERE `user_id`=? AND `user_pw`=?",
            [id, hashedPassword]
        );

        if (result.length == 0) {
            return res.status(401).json({
                success: false,
                error: "Invalid ID or password",
            });
        }

        const user = result[0];

        return res.status(200).json({
            data: { id: user.id, nickname: user.nickname },
            success: true,
        });
    } catch (error) {
        console.error("Error in loginHandler:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}

export async function signupHandler(req: Request, res: any) {
    try {
        const {
            id,
            password,
            nickname,
        }: { id: string; password: string; nickname: string } = req.body;

        if (!id || !password || !nickname) {
            return res.status(400).json({
                success: false,
                error: "ID, password, email and nickname are required",
            });
        }

        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT COUNT(*) AS count FROM `account` WHERE `user_id`=? OR `nickname`=?",
            [id, nickname]
        );

        if (result[0].count > 0) {
            return res.status(400).json({
                success: false,
                error: "ID or Nickname already exists",
            });
        }

        const hashedPassword: string = crypto
            .createHash("sha256")
            .update(password + mySalt)
            .digest("hex");

        await connectPool.query(
            "INSERT INTO `account` (`user_id`, `user_pw`, `nickname`) VALUES (?, ?, ?)",
            [id, hashedPassword, nickname]
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    } catch (error) {
        console.log("Error in registerHandler", error);
        return res.status(500).json({
            error: "Internal server error",
        });
    }
}
