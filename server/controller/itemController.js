import itemModel from "../model/itemModel.js"
import path from "path"
import fs from "fs"
import cloudinary from "../middlewares/cloudinary.js"


const processSingleImage = async (files) => {
    console.log('inside processSingleImage**');

    if (!files || !files.length) return null;

    try {
        // Take the first file
        const file = files[0];
        const result = await cloudinary.uploader.upload(file.path);

        // Cleanup local file
        fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        return result.secure_url;
    } catch (error) {
        // Cleanup on error
        if (files?.[0]?.path) fs.unlink(files[0].path, () => { });
        throw error;
    }
};


export const createItem = async (req, res, next) => {
    try {
        let menu_id = req.params.menu_id;
        let { itemName, price, description, available, calories, ingredients } = req.body;

        if (!menu_id || !itemName || !price || !ingredients) {
            return res.status(400).json({
                status: 400,
                message: "Invalid payload"
            });
        }

        const image = req.file ? await processSingleImage([req.file]) : null;

        if (typeof ingredients === 'string') {
            try {
                ingredients = JSON.parse(ingredients);
            } catch (error) {
                return res.status(400).json({
                    status: 400,
                    message: "Invalid ingredients format"
                });
            }
        }

        const item = await itemModel.create({
            menu_id,
            itemName,
            price,
            image,
            description,
            available,
            calories,
            ingredients
        });

        return res.status(200).json({
            status: 200,
            message: "Item created",
            item
        });
    } catch (error) {
        next(error);
    }
};



export const getItemsByMenuId = async (req, res, next) => {
    try {
        let menu_id = req.params.menu_id

        if (!menu_id) {
            return res.status(400).json({ message: "menu Id is required" })

        }

        let menu_items = await itemModel.find({ menu_id }, { createdAt: 0, updatedAt: 0 })
        if (!menu_items) {
            return res.status(400).json({ message: "no item found with this menu Id" })
        }


        return res.status(200).json({
            status: "success",
            menu_items
        })
    } catch (error) {
        next(error)

    }
}

export const getItemById = async (req, res, next) => {
    try {
        let item_id = req.params.item_id

        if (!item_id) {
            return res.status(400).json({ message: "item Id is required" })

        }

        let item = await itemModel.findById(item_id, { createdAt: 0, updatedAt: 0 })
        if (!item) {
            return res.status(400).json({ message: "no item found with this menu Id" })
        }


        return res.status(200).json({
            status: "success",
            item
        })
    } catch (error) {
        next(error)

    }
}
export const getItemCountByMenuId = async (req, res, next) => {
    try {
        const menu_id = req.params.menu_id
        if (!menu_id) {
            return res.status(400).json({
                message: "menu Id is required"
            })
        }
        const items = await itemModel.find({ menu_id })
       
        if (items.length === 0) {
            return res.status(404).json({
                message: "menu not found with this id"
            }) 
        }
        let itemCount = 0;
        for (let i = 0; i < items.length; i++) {
            itemCount++
        }
        return res.status(200).json({
            status: "success",
            count: itemCount
        })
    } catch (error) {
        next(error)
    }
}

export const getSuggestionOfRelatedItem = async(req,res,next) => {
    try {
        let itemId = req.params.itemid
        console.log(itemId,'itemId');
        
        if (!itemId) {
            return res.status(400).json({message:"Item id is required"})
        }
        let itemInfo = await itemModel.findById(itemId,{menu_id:1,_id:-1})
        let menuId = itemInfo.menu_id

        let suggestions = await itemModel.find({menu_id:menuId},{createdAt:0,updatedAt:0})

        return res.status(200).json({status:"success",data:suggestions})

    } catch (error) {
        next(error)
    }
}

export const getAllItems = async (req, res, next) => {
    try {
        let items = await itemModel.find({}, { createdAt: 0, updatedAt: 0 })
        
        return res.status(200).json({
            status: "success",
            items
        })
    } catch (error) {
        next(error)

    }
}
