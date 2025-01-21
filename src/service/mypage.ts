import mysql from "mysql2/promise";
import { connectPool } from "./db";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt";

export async function mypageProfileHandler(req: Request, res: any) {
    const user: JwtPayload | null = verifyAccessToken(
        req.headers.authorization
    );

    if (user == null) {
        return res.status(400).json({
            success: false,
            error: "Invalid access token",
        });
    }

    const userInfo = user as { id: number; nickname: string };

    try {
        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT * FROM `profile` WHERE `user_id` = ? ORDER BY `created_at`",
            [userInfo.id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No profile found",
            });
        }

        return res.status(200).json({
            success: true,
            data: result, // 최근순의 프로필 정보들
        });
    } catch (error) {
        console.error("프로필 정보 조회중 에러:", error);

        return res.status(500).json({
            success: false,
            error: "Error retrieving profile information",
        });
    }
}

export async function mypageSaveProfileHandler(req: Request, res: any) {
    try {
        const user: JwtPayload | null = verifyAccessToken(
            req.headers.authorization
        );

        const { weight } = req.body;

        if (user == null) {
            return res.status(400).json({
                success: false,
                error: "Invalid access token",
            });
        }

        if (weight == null) {
            return res.status(400).json({
                success: false,
                error: "Invalid weight info",
            });
        }

        const userInfo = user as { id: number; nickname: string };

        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT * FROM `profile` WHERE `user_id` = ? ORDER BY `created_at` DESC LIMIT 1",
            [userInfo.id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No profile found",
            });
        }

        const profile = result[0];

        const [save] = await connectPool.query<mysql.ResultSetHeader>(
            "INSERT INTO `profile` (`age`, `gender`, `height`, `weight`, `activityLevel`, `target`, `user_id`)" +
                " VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                profile.age,
                profile.gender,
                profile.height,
                weight,
                profile.activityLevel,
                profile.target,
                userInfo.id,
            ]
        );

        if (save.affectedRows > 0) {
            console.log("프로필이 새로 추가되었습니다.");
        } else {
            console.error("프로필 추가 실패");
            return res.status(400).json({
                success: false,
                error: "Profile failed to create",
            });
        }

        return res.status(201).json({
            success: true,
        });
    } catch {
        return res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
}

export async function mypagehistoryHandler(req: Request, res: any) {
    const user: JwtPayload | null = verifyAccessToken(
        req.headers.authorization
    );

    if (user == null) {
        return res.status(400).json({
            success: false,
            error: "Invalid access token",
        });
    }

    const userInfo = user as { id: number; nickname: string };

    try {
        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT `question`, `content`, `created_at` FROM `result` WHERE `user_id` = ? ORDER BY `created_at` DESC LIMIT 5",
            [userInfo.id]
        );

        if (result.length === 0) {
            return res.status(404).json({
                success: false,
                error: "No result found",
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("마이페이지 이전 상담 내역 조회중 에러:", error);

        return res.status(500).json({
            success: false,
            error: "Error looking up previous history",
        });
    }
}
