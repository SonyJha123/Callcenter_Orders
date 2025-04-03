import mongoose from "mongoose";


const userschema = new mongoose.Schema({
    name:{
        type: String,
        require: true,
        minlength:3
    },
   phone:{
        type: Number,
        require: true,
        unique: true,
        minlength:10,
    },
    
    location: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        zipCode: { type: String, required: true },
        
      },


},
{
    versionKey:false,
    timestamps:true
})

const userModel = mongoose.model("User",userschema);

export default userModel;