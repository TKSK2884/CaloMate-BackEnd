import { JwtPayload } from "jsonwebtoken";

export interface UserInfo {
    id: number;
    nickname: string;
}

export interface CustomJwtPayload extends JwtPayload {
    id: string;
    nickname: string;
}
