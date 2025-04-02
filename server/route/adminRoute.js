import express from "express"
import { createAdmin, findAdminById, login } from "../controller/adminController.js";
const router=express.Router();

router.post("/",createAdmin)
router.post("/login",login)


router.get("/byid/:id",findAdminById)


export default router;