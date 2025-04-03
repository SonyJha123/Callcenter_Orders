import mongoose from "mongoose";


const userschema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        minlength:3
    },
   phone:{
        type: Number,
        required: true,
        unique: false,
    },

    
    location: {
        address: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        country: { type: String, required: false },
        zipCode: { type: String, required: false },
        
      },


},
{
    versionKey:false,
    timestamps:true
})

const userModel = mongoose.model("User",userschema);

export default userModel;