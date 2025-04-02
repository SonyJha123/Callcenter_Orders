import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema({
  menu_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"menu"

  },
  itemName: {
    type: String
  },
  price: {
    type: Number
  },
  
  image: {
    type: String
  },
  description: {
    type: String
  },
  calories: {
    type: String
},
// sizes: [
//   {
//       size: { type: String, enum: ["Small", "Medium", "Large"] },
//       price: { type: Number }
//   }
// ],
// addons: [
//   {
//       name: { type: String },
//       price: { type: Number }
//   }
// ],
  available: {
    type: Boolean,
    default: true
  },
  ingredients:[{
    type:String
  }]
  
},
  {
    versionKey: false,
    timestamps: true
  }
);

const itemModel = mongoose.model("Item", itemSchema)
export default itemModel