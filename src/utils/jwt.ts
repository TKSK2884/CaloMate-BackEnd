import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserInfo } from "../structure/type";

dotenv.config();

function generateAccessToken(user: UserInfo) {
    return jwt.sign(
        { id: user.id, nickname: user.nickname },
        process.env.ACCESS_TOKEN_SECRET ?? "",
        {
            expiresIn: "15m", // 15분
        }
    );
}

function generateRefreshToken(user: UserInfo) {
    return jwt.sign(
        { id: user.id, nickname: user.nickname },
        process.env.REFRESH_TOKEN_SECRET ?? "",
        {
            expiresIn: "7d", // 7일
        }
    );
}
