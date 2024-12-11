import mysql from "mysql2/promise";
import { connectPool } from "../service/db";

export const getUserById = async (id: string) => {
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
};
