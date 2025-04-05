import crypto from "crypto";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import { connectPool } from "./db";
import { Request } from "express";
import { CustomJwtPayload } from "../structure/type";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import {
    getUserById,
    getUserProfileById,
    searchAccountID,
    searchLinkedID,
} from "../utils/user";
import { updateProfileWithToken, updateResultWithToken } from "../utils/result";
import { kakaoLogin } from "../utils/kakao";
import { UserProfile } from "../structure/type";

const mySalt: string | undefined = process.env.SALT;

export async function loginHandler(req: Request, res: any) {
    try {
        const {
            id,
            password,
            token,
        }: { id: string; password: string; token: string | null } = req.body;

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

        const user: CustomJwtPayload = {
            id: result[0].id,
            nickname: result[0].nickname,
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        });

        // token으로 기록 기능 삭제
        // if (token != null) {
        //     const updateResultMessage: string | null =
        //         await updateResultWithToken(user.id, token);
        //     await updateProfileWithToken(user.id, token);

        //     await getUserProfileById(user.id);
        //     await getUserProfileById(user.id);

        //     const userProfile: UserProfile | null = await getUserProfileById(
        //         user.id
        //     );

        //     return res.status(200).json({
        //         success: true,
        //         message: updateResultMessage,
        //         data: {
        //             accessToken: accessToken,
        //             user: user,
        //             userProfile: userProfile,
        //         },
        //     });
        // }

        const userProfile: UserProfile | null = await getUserProfileById(
            user.id
        );

        return res.status(200).json({
            success: true,
            data: {
                accessToken: accessToken,
                user: user,
                userProfile: userProfile,
            },
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

export async function logoutHandler(req: Request, res: any) {
    res.clearCookie("refreshToken");

    return res.status(200).json({ success: true });
}

export async function getUserInfoHandler(req: Request, res: any) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res
                .status(401)
                .json({ success: false, message: "Unauthorized" });
        }

        const token: string = authHeader.split(" ")[1];

        const secret: string = process.env.ACCESS_TOKEN_SECRET ?? "";

        let decodedToken;

        try {
            decodedToken = jwt.verify(token, secret) as { id: string };
        } catch (error) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid token" });
        }

        const user = await getUserById(decodedToken.id); // 데이터베이스에서 사용자 정보 조회
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                nickname: user.nickname,
            },
        });
    } catch (error) {
        console.error("사용자 정보 가져오기 실패:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}

export async function refreshTokenHandler(req: Request, res: any) {
    const refreshToken: string | null = req.cookies.refreshToken;

    if (refreshToken == null) {
        return res
            .status(401)
            .json({ success: false, message: "No refresh token." });
    }

    try {
        const user = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET ?? ""
        );

        if (typeof user === "string") {
            throw new Error("Invalid token payload");
        }

        const convertedUser = user as CustomJwtPayload;

        const userProfile: UserProfile | null = await getUserProfileById(
            convertedUser.id
        );

        const newAccessToken = generateAccessToken(convertedUser);

        return res.status(200).json({
            success: true,
            data: {
                accessToken: newAccessToken,
                user: convertedUser,
                userProfile: userProfile,
            },
        });
    } catch (error) {
        console.error("Failed to validate refresh token:", error);
        return res
            .status(403)
            .json({ success: false, message: "Invalid refresh token." });
    }
}

export async function kakaoTokenHandler(req: Request, res: any) {
    try {
        const { code }: { code: string } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: "Missing code",
            });
        }

        const tokenUrl: string = "https://kauth.kakao.com/oauth/token";

        const kakaoLoginInfo = await kakaoLogin(code, tokenUrl);

        if (kakaoLoginInfo == null) {
            return res.status(500).json({
                success: false,
                error: "Failed to login to Kakao",
            });
        }

        const fetchedID: string = kakaoLoginInfo.id;
        const fetchedNickname: string = kakaoLoginInfo.nickname;

        if (fetchedID == "" || fetchedNickname == "") {
            return res.status(400).json({
                success: false,
                error: "Failed to login to Kakao",
            });
        }

        const linkService: string = "kakao";
        const userType: number = 1;

        const [result] = (await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT * FROM `linked_user` WHERE `user_id` = ? " +
                "AND `user_nickname` = ? AND `linked_service` = ?",
            [fetchedID, fetchedNickname, linkService]
        )) as mysql.RowDataPacket[];

        if (result.length != 0) {
            const user: CustomJwtPayload = {
                id: result[0].id,
                nickname: result[0].nickname,
            };

            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
            });

            return res.status(200).json({
                success: true,
                data: { accessToken: accessToken, user: user },
            });
        }

        await connectPool.query(
            "INSERT INTO `linked_user`" +
                " (`user_id`, `user_nickname`, `linked_service`)" +
                " VALUES (?,?,?)",
            [fetchedID, fetchedNickname, linkService]
        );

        const socialLinkedID: string = await searchLinkedID(fetchedID);

        if (socialLinkedID == "") {
            return res.status(400).json({
                success: false,
                error: "Bad request",
            });
        }

        await connectPool.query(
            "INSERT INTO `account` " +
                "(`social_linked_id`, `nickname` , `user_type`)" +
                " VALUES (?,?,?)",
            [socialLinkedID, fetchedNickname, userType]
        );

        const userId: number | null = await searchAccountID(fetchedID);

        if (userId == null) {
            return res.status(400).json({
                success: false,
                error: "Bad request",
            });
        }

        const user: CustomJwtPayload = {
            id: userId,
            nickname: fetchedNickname,
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        });

        return res.status(200).json({
            success: true,
            data: { accessToken: accessToken, user: user },
        });
    } catch (error) {
        console.error("카카오 토큰 핸들러 에러:", error);
    }
}
