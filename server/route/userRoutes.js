import express from "express"
import { createUser, deleteUser, findAllUsers, forgotPassword, login, otpverify, resetpassword, updateUser } from "../controller/userController.js";
import { uploadSingleImage } from "../middlewares/multer.js";

const router=express.Router();
router.post("/",uploadSingleImage,createUser)
router.post("/login",login)
router.post("/forgotPassword",forgotPassword)
router.post("/otpverify",otpverify)
router.post("/resetpassword",resetpassword)
router.get("/findUserById/:id")
router.get("/findAllUsers",findAllUsers)
router.get("/deleteUser/:id",deleteUser)
router.put("/updateUser/:id",uploadSingleImage,updateUser)

export default router;