import mongoose from "mongoose";
import { type } from "os";
const RatingSchema = new mongoose.Schema({
    restaurantId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Restaurant",
        require:true
    },
    UserId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        require:true
    },
    Rating:{
        type:Number,
        required: true,
        min: 1,
        max: 5,
    },
    Comment:{
        type:String,
        MaxLength:500
    }
},
{
    versionKey:false,
    timestamps:true
})

const Ratingmodel = mongoose.model("rating",RatingSchema);
export default Ratingmodel;