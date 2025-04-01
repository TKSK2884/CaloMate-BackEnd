import mysql from "mysql2/promise";
import jwt, { JwtPayload } from "jsonwebtoken";
import { connectPool } from "./db";
import { Request } from "express";
import {
    AIResponse,
    Meal,
    ProfileBody,
    UserInfo,
    UserProfile,
} from "../structure/type";
import {
    generateToken,
    getUserProfileById,
    getUserProfileByToken,
} from "../utils/user";
import { callOpenAIAPI } from "../api/openAi";
import { generatePrompt } from "../utils/string";
import { verifyAccessToken } from "../utils/jwt";

export async function checkProfileHandler(req: Request, res: any) {
    const user: JwtPayload | null = verifyAccessToken(
        req.headers.authorization
    );

    if (user == null) {
        return res.status(200).json({
            success: true,
            data: null,
        });
    }

    const userInfo = user as { id: number; nickname: string };

    const UserProfile: UserProfile | null = await getUserProfileById(
        userInfo.id
    );

    if (UserProfile == null) {
        return res.status(200).json({
            success: true,
            data: null,
        });
    }

    return res.status(200).json({
        success: true,
        data: UserProfile,
    });
}

export async function saveProfileHandler(req: Request, res: any) {
    try {
        const {
            age,
            gender,
            height,
            weight,
            activityLevel,
            target,
        }: ProfileBody = req.body;

        if (!age || age <= 0) {
            throw new Error("유효하지 않은 나이");
        }
        if (!gender) {
            throw new Error("유효하지 않은 성별");
        }
        if (!height || height <= 0) {
            throw new Error("유효하지 않은 키");
        }
        if (!weight || weight <= 0) {
            throw new Error("유효하지 않은 몸무게");
        }
        if (!activityLevel || !activityLevel.id) {
            throw new Error("유효하지 않은 활동 수준");
        }
        if (!target || !target.id) {
            throw new Error("유효하지 않은 목표");
        }

        const user: JwtPayload | null = verifyAccessToken(
            req.headers.authorization
        );

        // user 정보가 있을때
        if (user != null) {
            const userInfo = user as { id: number; nickname: string };

            const [save] = await connectPool.query<mysql.ResultSetHeader>(
                "INSERT INTO `profile` (`age`, `gender`, `height`, `weight`, `activityLevel`, `target`, `user_id`)" +
                    " VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    age,
                    gender,
                    height,
                    weight,
                    activityLevel.id,
                    target.id,
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
        }

        // user 정보가 없을때
        else {
            const token: string = generateToken();

            const [save] = await connectPool.query<mysql.ResultSetHeader>(
                "INSERT INTO `profile` (`age`, `gender`, `height`, `weight`, `activityLevel`, `target`, `token`)" +
                    " VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    age,
                    gender,
                    height,
                    weight,
                    activityLevel.id,
                    target.id,
                    token,
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
                data: {
                    profileToken: token,
                },
            });
        }
    } catch (error) {
        console.error("프로필 추가 중 오류 발생:", error);

        return res.status(400).json({
            success: false,
            error: "Profile failed to create",
        });
    }
}

export async function checkProfileByTokenHandler(req: Request, res: any) {
    const token = req.query.token as string;

    if (!token) {
        return res.status(400).json({
            success: false,
            error: "Token not found.",
        });
    }

    const profile: UserProfile | null = await getUserProfileByToken(token);

    if (profile == null) {
        return res.status(500).json({
            success: false,
            error: "Profile information not found.",
        });
    }

    return res.status(200).json({
        success: true,
        data: profile,
    });
}

export async function generateSupportHandler(req: Request, res: any) {
    const { token }: { token: string } = req.body;

    let profile: UserProfile | null = null;

    const user: string | jwt.JwtPayload | null | undefined = verifyAccessToken(
        req.headers.authorization
    );

    if (user != null) {
        // user정보가 있을때
        const userInfo = user as { id: number; nickname: string };
        profile = await getUserProfileById(userInfo.id);
    } else if (token != null) {
        // token정보가 있을때
        profile = await getUserProfileByToken(token);
    }

    if (profile == null) {
        return res.status(500).json({
            success: false,
            error: "Profile information not found.",
        });
    }

    const prompt = generatePrompt(profile);

    try {
        const result: string | null = await callOpenAIAPI(prompt);

        if (result == null) {
            return res.status(400).json({
                success: false,
                error: "",
            });
        }

        if (user != null) {
            const userInfo = user as { id: number; nickname: string };

            const [save] = await connectPool.query<mysql.ResultSetHeader>(
                "INSERT INTO `result` (`content`, `user_id`) " +
                    " VALUES (?, ?)",
                [result, userInfo.id]
            );

            const resultId: number = save.insertId;
            const today: string = new Date().toISOString().split("T")[0];

            const convertedResult: AIResponse = JSON.parse(result);

            for (const item of convertedResult.diet) {
                await connectPool.query(
                    "INSERT INTO diet_logs (user_id, result_id, meal, calories, carbs, protein, fat, date, checked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        userInfo.id,
                        resultId,
                        item.meal,
                        item.calories,
                        item.carbs,
                        item.protein,
                        item.fat,
                        today,
                        false,
                    ]
                );
            }

            return res.status(200).json({
                success: true,
                data: {
                    diet: convertedResult.diet,
                    workout: convertedResult.workout,
                    resultId: resultId,
                },
            });
        } else if (token != null) {
            await connectPool.query<mysql.ResultSetHeader>(
                "INSERT INTO `result` (`content`, `token`) " + " VALUES (?, ?)",
                [result, token]
            );
        }

        const convertedResult: AIResponse = JSON.parse(result);

        return res.status(200).json({
            success: true,
            data: {
                diet: convertedResult.diet,
                workout: convertedResult.workout,
            },
        });
    } catch (error) {
        console.error("상담 생성중 에러:", error);

        return res.status(500).json({
            success: false,
            error: "Supoort failed to create",
        });
    }
}
