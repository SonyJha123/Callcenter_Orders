import userModel from "../model/userModel.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import cloudinary from "../middlewares/cloudinary.js"
import fs from "fs";
import path from "path";
import orderModel from "../model/orderModel.js";

export const createUser= async(req,res,next)=>{
    try{const{name,phone,location}=req.body
        if(!name||
            !phone||
            !location
        ){
            return res.status(400).json({
                status:400,
                message:"invalid payload"
            })
        }
    let User=await userModel.create({
        name,phone,location
    })
   
    return res.status(200).json({
        status:200,
        message:"User created",
        User
    })
    }catch(error){
        next(error)
    }
}

export const getUserByPhone = async (req, res, next) => {
    try {
        const phone = req.params.phone;
        
        if (!phone) {
            return res.status(400).json({
                message: "Phone is required"
            });
        }

        const user = await userModel.findOne({ phone });

        if (!user) {
            return res.status(404).json({
                status: 404,
                message: "User not found"
            });
        }

        let orders = await orderModel.find({ user_id: user._id }).populate("items.item_id");

        return res.status(200).json({
            status: 200,
            message: "User found",
            user,
            orders : orders? orders : [],
        });

    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


   

export const login = async(req,res,next)=>{
    const {email,password}=req.body
    if(!email||!password){return res.status(400).json({
        status:400,
        message:"please enter email or password"
    })}
    const User= await userModel.findOne({email})
    if(!User){return res.status(400).json({
        status:400,
        message:"User not found"
    })}
    const match=bcrypt.compare(password,User.password)
    if(!match){ return res.status(400).json({
        status:400,
        message:"please provide correct email or password"
    })}
    const token= jwt.sign({id:User._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
     return res.status(200).json({
        status:200,
        message:"login successful",
        User,
        token});
}

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {return res.status(404).json({ message: 'User not found' });}
        const randomSixDigits =  Math.floor(100000 + Math.random() *900000);
        const updateUser= await userModel.findByIdAndUpdate(
            user._id,
            {$set:{otp:randomSixDigits}},
            {new:true}
    );
    var transport = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    const mailOptions = {
        from: {
            address: "hello@example.com",
            name: "Mailtrap Test"
        },
        to: "karamjot061@gmail.com", 
        subject: "Reset Password",
        text: `Your OTP code is ${updateUser.otp}`,
    };
    const info = await transport.sendMail(mailOptions);

    console.log("Email sent: ", info.messageId);
    return res.status(200).json({ message: "Email sent successfully!", info });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const otpverify = async (req,res)=>{
   try{ const {email,otp}=req.body;
   if(!email || !otp){return res.status(400).json({message:"please provide email and otp"})}
    const user = await userModel.findOne({email})
    if(!email){return res.status(400).json({message:"user not found"})}
    const expirytime= 3*60*1000;
    const currenttime = new Date();
    const otpGeneratedAt=new Date(user.updatedAt);
    const timeDifference = currenttime-otpGeneratedAt;
    if(timeDifference>expirytime){return res.status(400).json({message:"otp has expired"})};
    if(user.otp !== parseInt(otp)){return res.status(400).json({message:"opt didnt matched"})};
    return res.status(200).json({message:"otp verfied",user})

}catch(error){
    return res.status(400).json({message:"otp not verified"})
   }
}
export const resetpassword = async(req,res) =>{
    try{
        const {email,password}=req.body;
        const user = await userModel.findOne({email});
        if(!user){return res.status(400).json({message:"user not found"})};
        const hashedpassword = await bcrypt.hash(password,10);
        const updatedpassword= await userModel.findByIdAndUpdate(
            user._id,
            {$set:{password:hashedpassword}},
            {new:true}
        )
        return res.status(200).json({message:"password updated"});
    }
    catch(error){
        return res.status(400).json({message:"failed to reset password"})
    }
}
export const findUserById=async(req,res,next)=>{
    try {
        const UserId=req.params.id
        if(!UserId){return res.status(400).json({
            status:400,
            message:"User not found"
        })}
        const User=await userModel.findById(UserId)
        return res.status(200).json({
            status:200,
            message:"User found",
            User
        })
    } catch (error) {
        next(error)
    }
}
export const findAllUsers = async(req,res,next)=>{
    try {
        const Users=await userModel.find()
        return res.status(200).json({
            status:200,
            message:"All users",
            Users
        })
    } catch (error) {
        next(error)
    }
}
export const deleteUser = async(req,res,next)=>{
    try {
        const UserId=req.params.id;
        if(!UserId){return res.status(400).json({
            status:400,
            message:"User not found"
        })}
        const User=await userModel.findByIdAndDelete(UserId);
        return res.status(200).json({
            status:200,
            message:"User deleted"
        })
    } catch (error) {
        next(error)
    }
}
export const updateUser = async(req,res,next)=>{
    try {
        const UserId=req.params.id
        const {email,phoneno}=req.body
        if(!UserId){ return res.status(400).json({status:400,message:"please provide user id"})}
        const existingUser = await userModel.findById(UserId);
        if(!existingUser){
            return res.status(400).json({message:"User not found"});
        }
        let newimagePath=existingUser.image;
        let updatedimage_url=existingUser.image_url;
        if (req.file) {
             newimagePath = req.file.path;
            const result = await  cloudinary.uploader.upload(newimagePath);
    
            updatedimage_url=result.secure_url;
        if (existingUser.image&& newimagePath) {
            const oldImagePath = path.join("images/", "..",existingUser.image);
            fs.unlink(oldImagePath, (err) => {
              console.log("image unlinked sucessfully");
              if (err) {
                console.error("Failed to delete old image:", err);
              }
            });
          }}
        const updatedUser=await userModel.findByIdAndUpdate(UserId,
            {$set:{email,
                phoneno,
                image:newimagePath,
                image_url:updatedimage_url
            }},
            {new:true}
        )
    return res.status(200).json({status:200,message:"user updated",updatedUser})
    } catch (error) {
        next(error)
    }
}

