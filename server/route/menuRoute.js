import express from "express";
import { createMenu,getMenuById,getMenuListBySubRestaurantId, searchWithinMenu } from "../controller/menuController.js";
import { uploadSingleImage } from "../middlewares/multer.js";


const router = express.Router();


router.post("/:subRestaurant_id",uploadSingleImage, createMenu)
router.get("/menulist/:subRestaurant_id",getMenuListBySubRestaurantId)
router.get("/byid/:menuid",getMenuById)

router.get("/withinmenu/:menuid",searchWithinMenu)



export default router;