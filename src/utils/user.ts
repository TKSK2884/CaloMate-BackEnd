import crypto from "crypto";
import mysql from "mysql2/promise";
import { connectPool } from "../service/db";
import { UserInfo, UserProfile } from "../structure/type";

export async function getUserById(id: string): Promise<UserInfo | null> {
    try {
        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT `id`, `nickname` FROM `account` WHERE `id` = ?",
            [id]
        );

        if (result.length == 0) {
            return null;
        }

        return {
            id: result[0].id,
            nickname: result[0].nickname,
        };
    } catch (error) {
        console.log("getUserById Error:", error);
        return null;
    }
}

export function generateToken(): string {
    let randomizedToken: string =
        Math.random().toString() + new Date().getDate().toString();

    randomizedToken = crypto
        .createHash("sha256")
        .update(randomizedToken)
        .digest("hex");

    return randomizedToken;
}

export async function getUserProfileByToken(
    token: string
): Promise<UserProfile | null> {
    try {
        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT `age`, `gender`, `height`, `weight`, `activityLevel`, `target` FROM `profile` WHERE `token` = ?",
            [token]
        );

        if (result.length == 0) {
            return null;
        }

        const genderType = result[0].gender;
        let gender: string = "male";

        if (genderType != 1) {
            gender = "female";
        }

        const profile = result[0];

        return {
            age: profile.age,
            gender: gender,
            height: profile.height,
            weight: profile.weight,
            activityLevel: profile.activityLevel,
            target: profile.target,
        };
    } catch (error) {
        console.log("getuserProfile Error:", error);
        return null;
    }
}

export async function getUserProfileById(
    id: number
): Promise<UserProfile | null> {
    try {
        const [result] = await connectPool.query<mysql.RowDataPacket[]>(
            "SELECT `age`, `gender`, `height`, `weight`, `activityLevel`, `target` FROM `profile` WHERE `user_id` = ? ORDER BY `created_at` DESC LIMIT 1",
            [id]
        );

        if (result.length == 0) {
            return null;
        }

        const genderType = result[0].gender;
        let gender: string = "male";

        if (genderType != 1) {
            gender = "female";
        }

        const profile = result[0];

        return {
            age: profile.age,
            gender: gender,
            height: profile.height,
            weight: profile.weight,
            activityLevel: profile.activityLevel,
            target: profile.target,
        };
    } catch (error) {
        console.log("UserProfileById Error:", error);
        return null;
    }
}
