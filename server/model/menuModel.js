import mongoose, { Schema } from "mongoose";

const menuSchema = new Schema({
    subRestaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubRestaurant"
    },

    menuName: {
        type: String
    },
    image:{type:String}
},
    {
        versionKey: false,
        timestamps: true
    }
);

const menuModel = mongoose.model("Menu", menuSchema)
export default menuModel