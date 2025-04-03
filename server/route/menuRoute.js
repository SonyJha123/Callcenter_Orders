import express from "express";
import { createMenu,getMenuById,getMenuList } from "../controller/menuController.js";


const router = express.Router();


router.post("/",createMenu)
router.get("/menulist/",getMenuList)
router.get("/byid/:menuid",getMenuById)



export default router;