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
