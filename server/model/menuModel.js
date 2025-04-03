import mongoose, { Schema } from "mongoose";

const menuSchema = new Schema({

    menuName: {
        type: String
    },
},
    {
        versionKey: false,
        timestamps: true
    }
);

const menuModel = mongoose.model("Menu", menuSchema)
export default menuModel