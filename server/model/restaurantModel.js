import mongoose, { Schema } from "mongoose";


const restaurantschema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    },
  {
    versionKey: false,
    timestamps: true,
  }
);

const restaurantModel = mongoose.model("Restaurant", restaurantschema);
export default restaurantModel;
