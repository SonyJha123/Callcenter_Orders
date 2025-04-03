import express from "express"
import { createUser, getUserByPhone } from "../controller/userController.js";

const router=express.Router();
router.post("/",createUser)
router.get("/byphone/:phone",getUserByPhone)

// router.post("/login",login)
// router.post("/forgotPassword",forgotPassword)
// router.post("/otpverify",otpverify)
// router.post("/resetpassword",resetpassword)
// router.get("/findUserById/:id")
// router.get("/findAllUsers",findAllUsers)
// router.get("/deleteUser/:id",deleteUser)
// router.put("/updateUser/:id",uploadSingleImage,updateUser)

export default router;