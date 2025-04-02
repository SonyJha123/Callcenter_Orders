import express from "express"
import { createOrder, deleteOrder, getAllOrders, getOrderById } from "../controller/orderController.js";

const router = express.Router()

router.post("/createorder",createOrder)
router.get("/getallorders",getAllOrders)
router.get("/byid/:id",getOrderById)
router.delete("/:id",deleteOrder)



export default router;