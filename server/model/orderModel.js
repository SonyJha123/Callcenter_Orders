import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({

    items: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item"
        },
        quantity: { type: Number },
        price: { type: Number }

    }],

    subtotal: { type: Number },
    tax: { type: Number },
    delivery_fees: { type: Number },
    discount: { type: Number },
    promo_discount: { type: Number },
    remaining_balance: { type: Number },
    additional_charge:{
        type:Number
    },
    total: { type: Number },

    status: { type: String, enum: ["PENDING","CONFIRMED","PREPARING","DELIVERED","CANCELLED","FAILED","ONHOLD"], default: "PENDING" },

    
    payment_method:{
        type:String,
        enum:["CASH","CARD","UPI"],
        default:"CASH"
    },
    delivery_mode:{//
        type:String,
        enum:["DINE_IN","TAKEAWAY","HOME_DELIVERY","CURBSIDE_PICKUP","DRIVE_THRU","SCHEDULED_DELIVERY"],
        default:"HOME_DELIVERY"
    },
    transaction_id:{
        type:String
    },
    user_id:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    customer_name:{
        type:String
    },
    customer_phone:{
        type:Number
    },
    customer_email:{
        type:String
    },
    pickup_address:{
        type:String
    },
    pickup_time:{
        type:Date
    },
    delivery_address:{
        type:String
    },
    delivery_time:{
        type:Date
    },
    description:{
        type:String
    },
    order_time:{
        type:Date
    },




},
    {
        versionKey: false,
        timestamps: true
    }
);

const orderModel = mongoose.model("Order", orderSchema)
export default orderModel