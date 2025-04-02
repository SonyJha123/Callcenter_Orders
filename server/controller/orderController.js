import orderModel from "../model/orderModel.js";

export const createOrder = async (req, res, next) => {
    try {
        const { items, subtotal, tax,delivery_fees,discount,promo_discount,remaining_balance,additional_charge,total,payment_method,delivery_mode,customer_name,customer_phone,customer_email,pickup_address,delivery_address,description } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                status: 400,
                message: "Invalid payload: items should be a non-empty array"
            });
        }

        for (const item of items) {
            if (!item.item_id || !item.quantity || !item.price) {
                return res.status(400).json({
                    status: 400,
                    message: "Invalid payload: each item must have item_id, quantity, and price"
                });
            }
        }
        

        const order = await orderModel.create({
            items,
             subtotal, 
            tax,
            delivery_fees,
            discount,
            promo_discount,
            remaining_balance,
            additional_charge,
            total,
            payment_method,
            delivery_mode,
            customer_name,
            customer_phone,
            customer_email,
            pickup_address,
            delivery_address,
            description,
            status: "CONFIRMED"
        });

        return res.status(201).json({
            status: 201,
            message: "Order placed successfully",
            order
        });

    } catch (error) {
        next(error);
    }
};

export const getAllOrders = async (req, res, next) => {
    try {
        const orders = await orderModel.find({});

        return res.status(200).json({
            status: 200,
            message: "Orders fetched successfully",
            orders
        });
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req, res, next) => {
    try {
        const orderId  = req.params.id;
        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.status(404).json({
                status: 404,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Order fetched successfully",
            order
        });
    } catch (error) {
        next(error);
    }
}

export const deleteOrder = async (req, res, next) => {
    try {
        const orderId  = req.params.id;
        const order = await orderModel.findByIdAndDelete(orderId);

        if (!order) {
            return res.status(404).json({
                status: 404,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Order deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}




// export const createOrder = async (req, res, next) => {
//     try {
//         const { items, tax, discount } = req.body;

//         if (!Array.isArray(items) || items.length === 0) {
//             return res.status(400).json({
//                 status: 400,
//                 message: "Invalid payload: items should be a non-empty array"
//             });
//         }

//         for (const item of items) {
//             if (!item.item_id || !item.quantity || !item.price) {
//                 return res.status(400).json({
//                     status: 400,
//                     message: "Invalid payload: each item must have item_id, quantity, and price"
//                 });
//             }
//         }

//         const taxInPercentage = Number(tax) || 0;
        
//         const discountInPercentage = Number(discount) || 0;

//         const subTotal = items.reduce((acc, e) => acc + e.quantity * e.price, 0);

//         const discountAmount = Number(((discountInPercentage * subTotal) / 100).toFixed(2));
//         console.log(discountAmount,'discountAmount');
        
//         const taxAmount = Number(((taxInPercentage * subTotal) / 100).toFixed(2));
//         console.log(taxAmount,'taxAmount');
        

//         const totalAmount = Number((subTotal - discountAmount + taxAmount).toFixed(2));
//         console.log(totalAmount,'totalAmount');
        

//         const order = await orderModel.create({
//             items,
//             subtotal: Number(subTotal.toFixed(2)),  
//             discount: discountAmount,
//             tax: taxAmount,
//             total: totalAmount,
//             status: "CONFIRMED"
//         });

//         return res.status(201).json({
//             status: 201,
//             message: "Order placed successfully",
//             order
//         });

//     } catch (error) {
//         next(error);
//     }
// };


