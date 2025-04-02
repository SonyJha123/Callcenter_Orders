import subrestaurantModel from "../model/subrestaurantModel.js"
import cloudinary from "../middlewares/cloudinary.js"
import path from "path"
import fs from "fs"
import itemModel from "../model/itemModel.js";
import menuModel from "../model/menuModel.js";



const processMultipleImages = async (files) => {
  if (!files || !files.length) return [];
  try {
    const uploadPromises = files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path);
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
      return result.secure_url;
    });
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    files.forEach(file => {
      if (file?.path) {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
    });
    throw error;
  }
};

export const createSubRestaurant = async (req, res, next) => {
  try {
    let restaurant_id = req.params.restaurant_id
    const { name, location, description, distance, opening_timing, status, rating, contact } = req.body
    if (!name || !location || !opening_timing || !status || !rating || !contact) {
      return res.status(400).json({
        status: 400,
        message: "invalid payload"
      })
    }
    const images = req.files
      ? await processMultipleImages(req.files)
      : null;

    let subRestaurant = await subrestaurantModel.create({
      restaurant_id,
      name,
      location,
      description,
      distance,
      opening_timing,
      status,
      rating,
      image: images,
      contact

    })
    return res.status(200).json({
      status: 200,
      message: "sub-restaurant created",
      subRestaurant
    })
  } catch (error) {
    next(error)
  }
}

export const getSubRestaurantsByRestaurantId = async (req, res, next) => {
  try {
    let restaurant_id = req.params.restaurant_id

    let subRestaurants = await subrestaurantModel.find({ restaurant_id }, { createdAt: 0, updatedAt: 0 })
    if (!subRestaurants) {
      return res.json({ message: 'No subRestaurant found' })
    }
    return res.status(200).json({ status: "success", subRestaurants })
  } catch (error) {
    next(error)

  }
}
export const updateSubRestaurant = async (req, res, next) => {
  try {
    const subRestaurant = req.params.id
    const { description } = req.body
    if (!subRestaurant) { return res.status(400).json({ status: 400, message: "please provide restaurant id" }) }
    const existingsubRestaurant = await subrestaurantModel.findById(subRestaurant);
    if (!existingsubRestaurant) {
      return res.status(400).json({ message: "restaurant not found" });
    }
    let newimagePath = existingsubRestaurant.image;
    let updatedimage_url = existingsubRestaurant.image_url;
    if (req.file) {
      newimagePath = req.file.path;
      const result = await cloudinary.uploader.upload(newimagePath);

      updatedimage_url = result.secure_url;
      if (existingsubRestaurant.image && newimagePath) {
        const oldImagePath = path.join("images/", "..", existingsubRestaurant.image);
        fs.unlink(oldImagePath, (err) => {
          console.log("image unlinked sucessfully");
          if (err) {
            console.error("Failed to delete old image:", err);
          }
        });
      }
    }
    const restaurant = await subrestaurantModel.findByIdAndUpdate(subRestaurant,
      {
        $set: {
          description,
          image: newimagePath,
          image_url: updatedimage_url
        }
      },
      { new: true }
    )
    return res.status(200).json({ status: 200, message: "restaurant updated", restaurant })
  } catch (error) {
    next(error)
  }
}


export const searchForSubRestaurantsAndFood = async (req, res, next) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: "Missing 'keyword' query parameter" });
    }

    const trimmedKeyword = keyword.trim();

    const subrestaurants = await subrestaurantModel.find({
      name: { $regex: new RegExp(`^${trimmedKeyword}`, "i") },
    });

    if (subrestaurants.length > 0) {
      return res.status(200).json({ success: true, subrestaurants });
    }

    let query = {
      $or: [
        { itemName: { $regex: new RegExp(trimmedKeyword, "i") } },
        { ingredients: { $regex: new RegExp(trimmedKeyword, "i") } },
        { description: { $regex: new RegExp(trimmedKeyword, "i") } },
        isNaN(trimmedKeyword) ? null : { price: Number(trimmedKeyword) },
        isNaN(trimmedKeyword) ? null : { calories: Number(trimmedKeyword) },
      ].filter(condition => condition !== null), // Remove null conditions
    };

    const items = await itemModel.find(query, { createdAt: 0, updatedAt: 0 });

    if (items.length === 0) {
      return res.status(404).json({ message: "No subrestaurants or related food items found" });
    }

    return res.status(200).json({ success: true, items });
  } catch (error) {
    next(error);
  }
};

export const searchWithinSubRestaurant = async (req, res, next) => {
  try {
    let subrestaurantId = req.params.subrestaurantid;
    if (!subrestaurantId) {
      return res.status(400).json({ message: "subrestaurant id is required" });
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

    let menuQuery = {
      subRestaurant_id: subrestaurantId,
      $or: keywords.map((keyword) => ({ menuName: { $regex: keyword } })),
    };
    let menus = await menuModel.find(menuQuery);

    let menuIds = menus.map(menu => menu._id.toString());

    let itemQuery = {
      menu_id: { $in: menuIds },
      $or: keywords.map((keyword) => ({
        $or: [
          { itemName: { $regex: keyword } },
          { ingredients: { $regex: keyword } },
          { description: { $regex: keyword } },
        ],
      })),
    };
    let items = await itemModel.find(itemQuery);

    return res.status(200).json({
      status: "success",
      data: {
        menus,
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};




