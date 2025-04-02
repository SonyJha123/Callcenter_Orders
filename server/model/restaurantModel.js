import mongoose, { Schema } from "mongoose";


const restaurantschema = new Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: false },
    description: { type: String, required: true },
    contact:{type:Number,required:true}
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const restaurantModel = mongoose.model("Restaurant", restaurantschema);
export default restaurantModel;
