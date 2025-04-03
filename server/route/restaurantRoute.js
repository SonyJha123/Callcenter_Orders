import express from "express";
import { createRestaurant } from "../controller/restaurantController.js";

const router = express.Router();


router.post("/",createRestaurant)




export default router;