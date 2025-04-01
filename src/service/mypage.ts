import mysql from "mysql2/promise";
import dayjs from "dayjs";
import { connectPool } from "./db";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../utils/jwt";
import { getKoreanWeekDates } from "../utils/day";

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
        const { weight } = req.body;

        if (weight == null) {
            return res.status(400).json({
                success: false,
                error: "Invalid weight info",
            });
        }

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

export async function mypageChartHandler(req: Request, res: any) {
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

    const weekDates: string[] = getKoreanWeekDates();

    const startDate: string = weekDates[0];
    const endDate: string = weekDates[6];

    const [logs] = await connectPool.query<mysql.RowDataPacket[]>(
        `SELECT 
            DATE(date) as date,
            COUNT(*) as total,
            SUM(CASE WHEN checked = 1 THEN 1 ELSE 0 END) as completed
        FROM diet_logs
        WHERE user_id = ? AND date BETWEEN ? AND ?
        GROUP BY DATE(date)
        ORDER BY DATE(date)`,
        [userInfo.id, startDate, endDate]
    );

    const formattedLogs = logs.map((log) => ({
        ...log,
        date: dayjs(log.date).format("YYYY-MM-DD"),
        total: Number(log.total),
        completed: Number(log.completed),
    }));

    const logsMap = new Map(formattedLogs.map((log) => [log.date, log]));

    const weekStats = weekDates.map((date) => {
        const dayLog = logsMap.get(date);
        const total = dayLog?.total ?? 0;
        const completed = dayLog?.completed ?? 0;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { date, total, completed, rate };
    });

    return res.status(200).json({
        success: true,
        data: weekStats,
    });
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
            "SELECT `content`, `created_at` FROM `result` WHERE `user_id` = ? ORDER BY `created_at` DESC LIMIT 5",
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
