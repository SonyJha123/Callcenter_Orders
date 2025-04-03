import menuModel from "../model/menuModel.js"




export const createMenu = async (req, res, next) => {
    try {
        const { menuName } = req.body
        if (!menuName ) {
            return res.status(400).json({
                status: 400,
                message: "invalid payload"
            })
        }
        
        const menu = await menuModel.create({
            menuName,
        })
        return res.status(200).json({
            status: 200,
            message: "menu created",
            menu
        })
    } catch (error) {
        next(error)
    }
}

export const getMenuList = async (req,res,next) => {
    try {

        let menu_list = await menuModel.find({},{createdAt:0,updatedAt:0})
        
        if (!menu_list) {
            return res.status(400).json({message:"no menu found "})
        }
        
        return res.status(200).json({
            status: "success",
            menu_list
        })
    } catch (error) {
        next(error)

    }
}

export const getMenuById = async(req,res,next) => {
    
    try {
        let menuId = req.params.menuid
        if (!menuId) {
            return res.status(400).json({message:"menu id is required"})
        }
        let menu = await menuModel.findById(menuId,{createdAt:0,updatedAt:0})
       
        if (!menu) {
            return res.status(404).json({message:"no menu find with this id"})

        }
        return res.status(200).json({status:"success",menu})

    } catch (error) {
        next()
    }
}



  


 

