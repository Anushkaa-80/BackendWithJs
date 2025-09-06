import { Schema } from "mongoose"
import mongoose from "mongoose"


const subscriptionSchema = new Schema({
subscriber:{
    type:Schema.Types.ObjectId, //the oone who is subscribing
    ref: "User"
},
channel:
{
    type:Schema.Types.ObjectId, //the channel being subscribed to
    ref: "User"
}

}, {timestamps:true})


export const Subscription = mongoose.model("Subscription", subscriptionSchema)