import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import init from "./service/db";
import dotenv from "dotenv";
import {
    loginHandler,
    logoutHandler,
    refreshTokenHandler,
    signupHandler,
} from "./service/auth";

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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
