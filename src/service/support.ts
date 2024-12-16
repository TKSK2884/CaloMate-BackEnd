import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { connectPool } from "./db";
import { Request } from "express";
import { ProfileBody, UserInfo, UserProfile } from "../structure/type";
import {
    generateToken,
    getUserProfileById,
    getUserProfileByToken,
} from "../utils/user";
import { callOpenAIAPI } from "../api/openAi";
import { generatePrompt } from "../utils/string";
import { verifyAccessToken } from "../utils/jwt";

export async function checkProfileHandler(req: Request, res: any) {
    const user: string | jwt.JwtPayload | null | undefined = verifyAccessToken(
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

        const user: string | jwt.JwtPayload | null | undefined =
            verifyAccessToken(req.headers.authorization);

        // user 정보가 있을때
        if (user != null) {
            const userInfo = user as { id: number; nickname: string };

            // const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            //     "SELECT COUNT(*) AS count FROM `profile` WHERE `user_id` = ?",
            //     [userInfo.id]
            // );

            // if (result[0].count > 0) {
            //     return res.status(200).json({
            //         success: true,
            //         message: "이미 등록된 프로필이 존재합니다.",
            //     });
            // }

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
            }

            return res.status(201).json({
                success: true,
                message: "프로필 등록 성공",
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

export async function generateSupportHandler(req: Request, res: any) {
    const { text, token }: { text: string; token: string } = req.body;

    if (text.trim() == "") {
        return res.status(400).json({
            success: false,
            error: "Text does not exist.",
        });
    }

    let profile: UserProfile | null = null;

    const user: string | jwt.JwtPayload | null | undefined = verifyAccessToken(
        req.headers.authorization
    );

    // user정보가 있을때
    if (user != null) {
        const userInfo = user as { id: number; nickname: string };
        profile = await getUserProfileById(userInfo.id);
    }

    // token정보가 있을때
    if (token != null) {
        profile = await getUserProfileByToken(token);
    }

    if (profile == null) {
        return res.status(500).json({
            success: false,
            error: "No profile information",
        });
    }

    const prompt = generatePrompt(profile) + " " + text;

    try {
        const result: string | null = await callOpenAIAPI(prompt);

        if (result == null) {
            return res.status(400).json({
                success: false,
                error: "",
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: "",
        });
    }
}
