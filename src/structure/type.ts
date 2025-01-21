import { JwtPayload } from "jsonwebtoken";

export interface UserInfo {
    id: number;
    nickname: string;
}

export interface CustomJwtPayload extends JwtPayload {
    id: number;
    nickname: string;
}

export interface ProfileBody {
    age: number;
    gender: number;
    height: number;
    weight: number;
    activityLevel: SelectMenu;
    target: SelectMenu;
}

export interface SelectMenu {
    id: string;
    label: string;
}

export interface UserProfile {
    age: number;
    gender: string;
    height: number;
    weight: number;
    activityLevel: string;
    target: string;
}
