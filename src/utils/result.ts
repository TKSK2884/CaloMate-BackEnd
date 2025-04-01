import mysql from "mysql2/promise";
import { connectPool } from "../service/db";

export async function updateResultWithToken(id: number, token: string) {
    try {
        const [save] = await connectPool.query<mysql.ResultSetHeader>(
            "UPDATE `result` SET `user_id` = ? WHERE `user_id` IS NULL AND `token` = ?",
            [id, token]
        );

        if (save.affectedRows > 0) {
            return "결과가 저장되었습니다.";
        } else {
            return null;
        }
    } catch (error) {
        console.error("결과 업데이트중 에러:", error);
        return null;
    }
}

export async function updateProfileWithToken(id: number, token: string) {
    try {
        const [save] = await connectPool.query<mysql.ResultSetHeader>(
            "UPDATE `profile` SET `user_id` = ? WHERE `user_id` IS NULL AND `token` = ?",
            [id, token]
        );

        if (save.affectedRows > 0) {
            return;
        } else {
            return null;
        }
    } catch (error) {
        console.error("토큰으로 프로필 업데이트중 에러:", error);
        return null;
    }
}
