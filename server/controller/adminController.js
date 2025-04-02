import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import adminModel from "../model/adminModel.js";


export const createAdmin= async(req,res,next)=>{
    try{
        const{name,email,phone,password}=req.body
        let image = req.file?.path || null
       

        if(!name||
            !phone||
            !password||
            !email
        ){
            return res.status(400).json({
                status:400,
                message:"Invalid payload"
            })
        }


    const hashedpassword= await bcrypt.hash(password,10)
    const admin=await adminModel.create({
        name,email,phone,password:hashedpassword
    })

    return res.status(200).json({
        status:"success",
        message:"Admin created",
        admin
    })
    }catch(error){
        next(error)
    }
}
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: 400,
                message: "Please enter email and password"
            });
        }

        const admin = await adminModel.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                status: 400,
                message: "Admin not found"
            });
        }

        const match = await bcrypt.compare(password, admin.password); 
        if (!match) {
            return res.status(400).json({
                status: 400,
                message: "Incorrect email or password"
            });
        }

        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        const { password: _, ...adminData } = admin.toObject();

        return res.status(200).json({
            status: 200,
            message: "Login successful",
            admin: adminData, 
            token
        });
    } catch (error) {
        next(error);
    }
};


export const findAdminById=async(req,res,next)=>{
    try {
        const adminId=req.params.id
        if(!adminId){return res.status(400).json({
            message:"admin id is required"
        })}
        const admin=await adminModel.findById(adminId)
        if(!admin){return res.status(400).json({
            message:"admin is not found"
        })}
        return res.status(200).json({
            status:"success",
            admin
        })
    } catch (error) {
        next(error)
    }
}



