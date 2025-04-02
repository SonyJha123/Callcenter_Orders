import express from "express";
import { createRestaurant, findRestaurantById, getAllRestaurant, searchFromKeyword, searchWithinRestaurant, updateRestaurant } from "../controller/restaurantController.js";
import { uploadSingleImage } from "../middlewares/multer.js";


const router = express.Router();


router.post("/",uploadSingleImage,createRestaurant)
router.get("/allrestaurants",getAllRestaurant)
router.put("/updateRestaurant/:id",uploadSingleImage,updateRestaurant)
router.get("/byid/:id",uploadSingleImage,findRestaurantById)

router.get("/bykeyword",searchFromKeyword)

router.get("/subrestaurant-menu-item/:restaurantid",searchWithinRestaurant)




export default router;