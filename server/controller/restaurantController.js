import restaurantModel from "../model/restaurantModel.js"
import subrestaurantModel from "../model/subrestaurantModel.js"
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

export const createRestaurant = async (req, res, next) => {
  try {
    const { name, description, contact } = req.body;
    
    // Validation
    if (!name || !description || !contact) {
      return res.status(400).json({
        status: 400,
        message: "Name, description, and contact are required"
      });
    }

    // Process image - Check req.file for single upload
    const image = req.file 
      ? await processSingleImage([req.file]) // Pass single file in array
      : null;

    // Create restaurant with Cloudinary URL
    const restaurant = await restaurantModel.create({
      name,
      description,
      contact,
      image // This will now contain the Cloudinary URL
    });

    return res.status(201).json({
      status: 201,
      message: "Restaurant created",
      restaurant
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRestaurant = async (req, res, next) => {
  
  try {
    let { page = 1, limit = 10 } = req.query;  
    page = parseInt(page);
    limit = parseInt(limit);

    let restaurants = await restaurantModel
      .find({},{createdAt:0,updatedAt:0})
      .skip((page - 1) * limit)  
      .limit(limit); 

    let total = await restaurantModel.countDocuments();  

    return res.status(200).json({
      status: "success",
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      restaurants
    });
    
  } catch (error) {
    next(error);
  }
};



export const updateRestaurant= async(req,res,next)=>{
  try {
    const restaurantId=req.params.id
    const {description}=req.body
    if(!restaurantId){ return res.status(400).json({status:400,message:"please provide restaurant id"})}
        const existingRestaurant = await restaurantModel.findById(restaurantId);
        if(!existingRestaurant){
            return res.status(400).json({message:"restaurant not found"});
        }
        let newimagePath=existingRestaurant.image;
        let updatedimage_url=existingRestaurant.image_url;
        if (req.file) {
             newimagePath = req.file.path;
            const result = await  cloudinary.uploader.upload(newimagePath);
    
            updatedimage_url=result.secure_url;
        if (existingRestaurant.image&& newimagePath) {
            const oldImagePath = path.join("images/", "..",existingRestaurant.image);
            fs.unlink(oldImagePath, (err) => {
              console.log("image unlinked sucessfully");
              if (err) {
                console.error("Failed to delete old image:", err);
              }
            });
          }}
        const restaurant=await restaurantModel.findByIdAndUpdate(restaurantId,
            {$set:{description,
                image:newimagePath,
                image_url:updatedimage_url
            }},
            {new:true}
        )
    return res.status(200).json({status:200,message:"restaurant updated",restaurant})
  } catch (error) {
    next(error)
  }
}

export const findRestaurantById=async(req,res,next)=>{
  try {
    const restaurantId=req.params.id
    if(!restaurantId){return res.status(400).json({status:400,message:"please provide restaurent id"})}
    const restaurant= await restaurantModel.findById(restaurantId,{createdAt:0, updatedAt:0})
    if(!restaurant){return res.status(400).json({status:400,message:"restaurant not found"})}
    return res.status(200).json({status:200,restaurant})
  } catch (error) {
    next(error)
  }
}


export const searchFromKeyword = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 5 } = req.query; 
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    if (!search) {
      return res.status(400).json({ error: "Missing 'search' query parameter" });
    }

    const trimmedKeyword = search.trim();
    if (!trimmedKeyword) {
      return res.status(400).json({ error: "Invalid 'search' query parameter" });
    }

    const keywords = trimmedKeyword.split(/\s+/).map((word) => new RegExp(word, "i"));

    let restaurantQuery = {
      $or: keywords.map((keyword) => ({
        $or: [{ name: { $regex: keyword } }, { description: { $regex: keyword } }],
      })),
    };

    let subRestaurantQuery = {
      $or: keywords.map((keyword) => ({
        $or: [
          { name: { $regex: keyword } },
          { "location.address": { $regex: keyword } },
          { "location.city": { $regex: keyword } },
          { "location.state": { $regex: keyword } },
          { "location.country": { $regex: keyword } },
          { "location.zipCode": { $regex: keyword } },
          { rating: { $regex: keyword } },
          { opening_timing: { $regex: keyword } },
          { status: { $regex: keyword } },
          { description: { $regex: keyword } },
        ],
      })),
    };

    let menuQuery = {
      $or: keywords.map((keyword) => ({
        $or: [{ menuName: { $regex: keyword } }],
      })),
    };

    let itemQuery = {
      $or: keywords.map((keyword) => ({
        $or: [
          { itemName: { $regex: keyword } },
          { ingredients: { $regex: keyword } },
          { description: { $regex: keyword } },
        ],
      })),
    };

    const numericValue = Number(trimmedKeyword);
    if (!isNaN(numericValue)) {
      itemQuery.$or.push({ price: numericValue }, { calories: numericValue });
    }

    const [restaurant, subRestaurant, menu, item] = await Promise.all([
      restaurantModel.find(restaurantQuery,{createdAt:0,updatedAt:0}).skip(skip).limit(limitNum),
      subrestaurantModel.find(subRestaurantQuery,{createdAt:0,updatedAt:0}).skip(skip).limit(limitNum),
      menuModel.find(menuQuery,{createdAt:0,updatedAt:0}).skip(skip).limit(limitNum),
      itemModel.find(itemQuery,{createdAt:0,updatedAt:0}).skip(skip).limit(limitNum),
    ]);

    const [restaurantCount, subRestaurantCount, menuCount, itemCount] = await Promise.all([
      restaurantModel.countDocuments(restaurantQuery),
      subrestaurantModel.countDocuments(subRestaurantQuery),
      menuModel.countDocuments(menuQuery),
      itemModel.countDocuments(itemQuery),
    ]);

    if (!restaurant.length && !subRestaurant.length && !menu.length && !item.length) {
      return res.status(404).json({ message: "No related data found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        restaurant,
        subRestaurant,
        menu,
        item,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRestaurants: restaurantCount,
        totalSubRestaurants: subRestaurantCount,
        totalMenus: menuCount,
        totalItems: itemCount,
      },
    });

  } catch (error) {
    next(error);
  }
};

export const searchWithinRestaurant = async (req, res, next) => {
 
  try {
    let restaurantId = req.params.restaurantid
    if (!restaurantId) {
      return res.status(400).json({ message: "restaurant id is required" })
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

    //------------------------------------------------------------------

    let subRestaurants = await subrestaurantModel.find(
      { restaurant_id: restaurantId },
      { _id: 1, name: 1, location: 1, rating: 1, opening_timing: 1, status: 1, description: 1 }
    );
    let subRestaurantIds = subRestaurants.map(sub => sub._id.toString());

    let menus = await menuModel.find(
      { subRestaurant_id: { $in: subRestaurantIds } },
      { _id: 1, menuName: 1 }
    );
    let menuIds = menus.map(sub => sub._id.toString());

    let items = await itemModel.find(
      { menu_id: { $in: menuIds } },
      { _id: 1, itemName: 1, ingredients: 1, description: 1 }
    );

    //---------------------------------------------------

    let subRestaurantQuery = {
      _id: { $in: subRestaurantIds },
      $or: keywords.map((keyword) => ({
        $or: [
          { name: { $regex: keyword } },
          { "location.address": { $regex: keyword } },
          { "location.city": { $regex: keyword } },
          { "location.state": { $regex: keyword } },
          { "location.country": { $regex: keyword } },
          { "location.zipCode": { $regex: keyword } },
          { rating: { $regex: keyword } },
          { opening_timing: { $regex: keyword } },
          { status: { $regex: keyword } },
          { description: { $regex: keyword } },
        ],
      })),
    };

    let menuQuery = {
      _id: { $in: menuIds }, 
      $or: keywords.map((keyword) => ({
        $or: [{ menuName: { $regex: keyword } }],
      })),
    };

    let itemQuery = {
      _id: { $in: items.map((item) => item._id.toString()) }, 
      $or: keywords.map((keyword) => ({
        $or: [
          { itemName: { $regex: keyword } },
          { ingredients: { $regex: keyword } },
          { description: { $regex: keyword } },
        ],
      })),
    };

    let filteredSubRestaurants = await subrestaurantModel.find(subRestaurantQuery);
    let filteredMenus = await menuModel.find(menuQuery);
    let filteredItems = await itemModel.find(itemQuery);


    return res.status(200).json({
      status: "success",
      data: {
        subRestaurants: filteredSubRestaurants,
        menus: filteredMenus,
        items: filteredItems
      }
    });
  } catch (error) {
    next(error)
  }

};



