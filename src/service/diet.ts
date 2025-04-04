import mysql from "mysql2/promise";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectPool } from "./db";
import { Request } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AIResponse, CheckedMeal, Meal } from "../structure/type";

export async function checkDietLogHandler(req: Request, res: any) {
    try {
        const {
            meal,
            date,
            checked,
        }: { meal: string; date: string; checked: boolean } = req.body;

        const user: JwtPayload | null = verifyAccessToken(
            req.headers.authorization
        );

        if (user == null) {
            return res.status(401).json({
                success: false,
                message: "Unauthenticated user.",
            });
        }

        const userInfo = user as { id: number; nickname: string };

        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT `id` FROM `result` WHERE `user_id` = ? ORDER BY `created_at` DESC LIMIT 1",
            [userInfo.id]
        );

        const resultId = result[0]?.id ?? null;

        if (resultId == null) {
            return res.status(500).json({
                success: false,
                error: "result information not found.",
            });
        }

        const [save] = await connectPool.query<mysql.ResultSetHeader>(
            "UPDATE diet_logs SET checked = ? WHERE user_id = ? AND meal = ? AND date = ? AND result_id = ?",
            [checked, userInfo.id, meal, date, resultId]
        );

        return res.status(200).json({
            success: true,
            data: {
                insertedId: save.insertId,
            },
        });
    } catch (error) {
        console.error("❌ 식단 저장 실패:", error);
        return res.status(500).json({
            success: false,
            message: "diet failed to create.",
        });
    }
}

export async function clearDietLogHandler(req: Request, res: any) {
    try {
        const {
            date,
            resultId,
        }: {
            date: string;
            resultId: number;
        } = req.body;

        const user = verifyAccessToken(req.headers.authorization);

        if (user == null) {
            return res.status(401).json({
                success: false,
                message: "Unauthenticated user.",
            });
        }

        const userInfo = user as { id: number; nickname: string };

        const [result] = await connectPool.query<mysql.ResultSetHeader>(
            "DELETE FROM `diet_logs` WHERE `user_id` = ? AND `date` = ? AND `result_id` = ?",
            [userInfo.id, date, resultId]
        );

        return res.status(200).json({
            success: true,
            affectedRows: result.affectedRows,
            message:
                result.affectedRows > 0
                    ? "삭제 완료"
                    : "삭제할 데이터가 없습니다",
        });
    } catch (error) {
        console.error("❌ 식단 삭제 실패:", error);
        return res.status(500).json({
            success: false,
            error: "diet failed to delete",
        });
    }
}

export async function getUserDiet(req: Request, res: any) {
    const user: JwtPayload | null = verifyAccessToken(
        req.headers.authorization
    );

    if (user == null) {
        return res.status(500).json({
            success: false,
            error: "user information not found.",
        });
    }

    const userInfo = user as { id: number; nickname: string };

    const [result] = await connectPool.query<mysql.RowDataPacket[]>(
        "SELECT `id`, `content`" +
            "FROM `result` " +
            "WHERE `user_id` = ? " +
            "AND DATE(CONVERT_TZ(`created_at`, '+00:00', '+09:00')) = CURDATE() " +
            "ORDER BY `created_at` DESC " +
            "LIMIT 1",
        [userInfo.id]
    );

    // 결과가 없을수도 있으니 에러 처리가 아니라 null값을 내려줘야함
    if (result.length == 0) {
        return res.status(200).json({
            success: true,
            data: null,
        });
    }

    const resultId: number = result[0].id;
    const content: AIResponse = JSON.parse(result[0]?.content) ?? null;

    const [logs] = await connectPool.query<mysql.RowDataPacket[]>(
        "SELECT `meal`, `checked` FROM `diet_logs` WHERE `user_id` = ? AND `result_id` = ?",
        [userInfo.id, resultId]
    );

    const checkedMap = new Map(logs.map((log) => [log.meal, log.checked]));

    const enrichedDiet: CheckedMeal[] = content.diet.map((item: Meal) => ({
        ...item,
        checked: !!checkedMap.get(item.meal),
    }));

    return res.status(200).json({
        success: true,
        data: {
            diet: enrichedDiet,
            workout: content.workout,
            resultId: resultId,
        },
    });
}
