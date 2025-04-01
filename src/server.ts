import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import init from "./service/db";
import dotenv from "dotenv";
import {
    kakaoTokenHandler,
    loginHandler,
    logoutHandler,
    refreshTokenHandler,
    signupHandler,
} from "./service/auth";
import {
    checkProfileByTokenHandler,
    checkProfileHandler,
    generateSupportHandler,
    saveProfileHandler,
} from "./service/support";
import {
    mypageChartHandler,
    mypageProfileHandler,
    mypageSaveProfileHandler,
    mypagehistoryHandler,
} from "./service/mypage";
import {
    checkDietLogHandler,
    getUserDiet,
    clearDietLogHandler,
} from "./service/diet";

dotenv.config();

const app = express();
const port = 8566;

app.use(
    cors({
        origin: process.env.ORIGIN || "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

init();

app.post("/auth/login", loginHandler);
app.post("/auth/signup", signupHandler);
app.post("/auth/refresh", refreshTokenHandler);
app.post("/auth/logout", logoutHandler);
app.post("/kakao/token", kakaoTokenHandler);

app.get("/diet/check", getUserDiet);
app.post("/diet/log", checkDietLogHandler);
app.delete("/diet/log", clearDietLogHandler);

app.get("/profile/check", checkProfileHandler);
app.get("/profile/token", checkProfileByTokenHandler);
app.post("/profile/save", saveProfileHandler);
app.post("/generate/support", generateSupportHandler);

app.get("/mypage/profile", mypageProfileHandler);
app.get("/mypage/chart", mypageChartHandler);
app.get("/mypage/history", mypagehistoryHandler);
app.post("/mypage/save", mypageSaveProfileHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
