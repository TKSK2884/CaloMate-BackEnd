import jwt, { JwtPayload } from "jsonwebtoken";
import { CustomJwtPayload, UserInfo } from "../structure/type";

export function generateAccessToken(user: CustomJwtPayload) {
    return jwt.sign(
        { id: user.id, nickname: user.nickname },
        process.env.ACCESS_TOKEN_SECRET ?? "",
        {
            expiresIn: "24h", // 24시간
        }
    );
}

export function generateRefreshToken(user: CustomJwtPayload) {
    return jwt.sign(
        { id: user.id, nickname: user.nickname },
        process.env.REFRESH_TOKEN_SECRET ?? "",
        {
            expiresIn: "7d", // 7일
        }
    );
}

export function verifyAccessToken(
    authorization: string | undefined
): jwt.JwtPayload | null {
    try {
        const authToken: string | undefined = authorization?.split(" ")[1];

        if (!authToken || authToken === "null") {
            return null;
        }

        return jwt.verify(
            authToken,
            process.env.ACCESS_TOKEN_SECRET!
        ) as jwt.JwtPayload;
    } catch (error) {
        console.error("AccessToken verification failed:", error);
        return null;
    }
}
