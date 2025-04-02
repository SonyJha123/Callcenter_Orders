import mongoose from "mongoose";
import { type } from "os";
import validator from "validator";

const userschema = new mongoose.Schema({
    First_name:{
        type: String,
        require: true,
        minlength:3
    },
    Last_name:{
        type: String,
        require: true,
        minlength:3
    },
    phoneno:{
        type: Number,
        require: true
    },
    
    email:{
        type: String,
        require: true,
        unique: true,
        validate:[validator.isEmail,'please provide valid email']
    },

    password:{
        type: String,
        require:[true,'please provide password'],
        minlength:8,
    },

    gender:{
        type:String,
        enum:["Male","Female","Others"]
    },
    image:{type:String},
    role:{
        type:String,
        enum:["Admin","Restaurant-Owner","Sub-Restaurant-Manager","Chef", "Waiter","Customer"],
        default:"Customer"
    },
    otp:{
        type:Number
    },
    token:{
        type:String
    }
},
{
    versionKey:false,
    timestamps:true
})

const userModel = mongoose.model("User",userschema);

export default userModel;