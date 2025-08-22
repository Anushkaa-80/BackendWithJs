import express from "express";
// we make app from express
import cors from "cors";
import cookieParser from "cookie-parser";
//cors, cookie are configured after the app is created.
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser());
 

//routes import, seggragation kiya jata hai files ka


import userRouter from './routes/user.routes.js'

//routes declaration
//router ko laane ke liye middleware lana padega
app.use("/api/v1/users", userRouter);

//std: define    the api
//http://localhost:8000/api/v1/users/register
 //users act as preffix

export {app}