import menuModel from "../model/menuModel.js"
import itemModel from "../model/itemModel.js"

import fs from "fs"
import path from "path"
import cloudinary from "../middlewares/cloudinary.js"

const processSingleImage = async (files) => {
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
    if (files?.[0]?.path) fs.unlink(files[0].path, () => {});
    throw error;
  }
};

export const createMenu = async (req, res, next) => {
    try {
        let subRestaurant_id = req.params.subRestaurant_id
        const { menuName } = req.body
        if (!menuName || !subRestaurant_id ) {
            return res.status(400).json({
                status: 400,
                message: "invalid payload"
            })
        }
        const image = req.file 
      ? await processSingleImage([req.file]) // Pass single file in array
      : null;
        const menu = await menuModel.create({
            subRestaurant_id,
            menuName,
            image
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

export const getMenuListBySubRestaurantId = async (req,res,next) => {
    try {
        let subRestaurant_id = req.params.subRestaurant_id

        if (!subRestaurant_id) {
            return res.status(400).json({message:"subRestaurant Id is required"})

        }

        let menu_list = await menuModel.find({subRestaurant_id},{createdAt:0,updatedAt:0})
        if (!menu_list) {
            return res.status(400).json({message:"no menu found with this subRestaurant Id"})
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

export const searchWithinMenu = async (req, res, next) => {
    try {
        let menuId = req.params.menuid; 
        if (!menuId) {
            return res.status(400).json({ message: "Menu ID is required" });
        }

        let search = req.query.search; 
        if (!search || typeof search !== "string") {
            return res.status(400).json({ error: "Invalid 'search' query parameter" });
        }

        const trimmedKeyword = search.trim();
        if (!trimmedKeyword) {
            return res.status(400).json({ error: "Invalid 'search' query parameter" });
        }

        const keywords = trimmedKeyword.split(/\s+/).map((word) => new RegExp(word, "i"));
        console.log(keywords,'keywords**',menuId);
        

        let itemQuery = {
            menu_id: menuId,
            $or: keywords.map((keyword) => ({
                $or: [
                    { itemName: { $regex: keyword } },
                    { description: { $regex: keyword } },
                    { ingredients: { $regex: keyword } },
                ],
            })),
        };

        let items = await itemModel.find(itemQuery, {
            _id: 1,
            itemName: 1,
            price: 1,
            image: 1,
            description: 1,
            calories: 1,
            available: 1,
            ingredients: 1,
            createdAt: 1,
            updatedAt: 1,
        });

        return res.status(200).json({
            status: "success",
            totalItems: items.length,
            data: { items },
        });
    } catch (error) {
        next(error);
    }
};

  


 

