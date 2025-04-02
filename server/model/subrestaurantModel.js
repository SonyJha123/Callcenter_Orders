import mongoose, { Schema } from "mongoose";


const subrestaurantschema = new Schema(
  {
    name: { type: String, required: true },
    restaurant_id: { type: String, required: true },
    location: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        zipCode: { type: String, required: true },
        latitude: { type: String, default: "40.7128" },
        longitude: { type: String, default: "-74.0060" }
      },
      image: [{ type: String, required: false }],
      rating: { type: String, required: false },
      distance: { type: String, required: false },
      contact: { type: Number, required: false },

      opening_timing:{
        type:String,
        required:true
      },

      status:{
        type:String,
        enum:["open","close"],
        required:true
      },
      // image:{type:String},
      description: { type: String, required: true },
    },
  {
    versionKey: false,
    timestamps: true,
  }
);

const subrestaurantModel = mongoose.model("SubRestaurant", subrestaurantschema);
export default subrestaurantModel;
