import express from "express";
import { createSubRestaurant, getSubrestaurantByLocation, getSubRestaurantsByRestaurantId, searchForSubRestaurantsAndFood, searchWithinSubRestaurant, updateSubRestaurant } from "../controller/subrestaurantController.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();


router.post("/:restaurant_id",upload,createSubRestaurant)
router.get("/allsubrestaurants/:restaurant_id",getSubRestaurantsByRestaurantId)
router.put("/updateSubRestaurant/:id",upload,updateSubRestaurant)
router.get("/subrestaurant-food",searchForSubRestaurantsAndFood)
router.get("/menu-item/:subrestaurantid",searchWithinSubRestaurant)
router.get("/bylocation",getSubrestaurantByLocation)



export default router;