import mongoose from "mongoose";
import {DB_NAME} from "../constant.js";

const connectDB = async ()=>
{
    try{
     const connectionInstance = await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}?retryWrites=true&w=majority`);
     console.log(`\n MongoDB connected !! DB HOST : ${connectionInstance.connection.host}`);
     // there are different host for different purpose production,development  in mongodb 
    }
    catch(error) {
        console.log("MONGODB connection error", error);
        process.exit(1)

    }
}

export default connectDB;