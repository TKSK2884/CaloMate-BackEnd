import mysql from "mysql2/promise";
import { connectPool } from "../service/db";

export async function kakaoLogin(
    code: string,
    tokenUrl: string
): Promise<{ id: string; nickname: string } | null> {
    try {
        const data: Record<string, string> = {
            grant_type: "authorization_code",
            client_id: process.env.KAKAO_ACCESS_KEY || "",
            redirect_uri: process.env.KAKAO_REDIRECT_URI || "",
            code: code,
        };

        const kakaoResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams(data).toString(),
        });

        const result = await kakaoResponse.json();

        if (result.access_token == null) {
            return null;
        }

        const accessToken: string = result.access_token;

        const userInfoUrl: string = "https://kapi.kakao.com/v2/user/me";

        const kakaoUserInfo = await fetch(userInfoUrl, {
            method: "GET",
            headers: {
                Authorization: "Bearer " + accessToken,
            },
        });

        const userInfoResult = await kakaoUserInfo.json();

        const fetchedID = userInfoResult.id;
        const fetchedNickname = userInfoResult.properties.nickname;

        return {
            id: fetchedID,
            nickname: fetchedNickname,
        };
    } catch (error) {
        console.error("카카오 로그인 에러:", error);
        return null;
    }
}
