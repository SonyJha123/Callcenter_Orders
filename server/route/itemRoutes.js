import express from "express";
import { createItem, getAllItems, getItemById, getItemCountByMenuId,  getItemsByMenuId, getSuggestionOfRelatedItem, } from "../controller/itemController.js";
import { uploadSingleImage } from "../middlewares/multer.js";


const router = express.Router();


router.post("/:menu_id", uploadSingleImage, createItem)
router.get("/submenu/:menu_id",getItemsByMenuId) 
router.get("/item/:item_id",getItemById) 
router.get("/getItemCount/:menu_id",getItemCountByMenuId)
router.get("/suggestions/:itemid",getSuggestionOfRelatedItem)


router.get("/allitems",getAllItems)


export default router;