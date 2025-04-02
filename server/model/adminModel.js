import mongoose, { Schema } from "mongoose";


const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
       
    },
    email: {
        type: String,
        required: true,
        unique: true,

    },
    phone: {
        type: Number,
        required: true,
        unique: true,

    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true,versionKey:false });


const adminModel = mongoose.model('Admin', adminSchema);

export default adminModel;