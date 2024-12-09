import express from "express";
import cors from "cors";
import init from "./service/db";
import dotenv from "dotenv";
import { loginHandler, signupHandler } from "./service/auth";

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

init();

app.post("/auth/login", loginHandler);
app.post("/auth/signup", signupHandler);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
