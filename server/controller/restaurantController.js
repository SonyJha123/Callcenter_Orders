import restaurantModel from "../model/restaurantModel.js"

export const createRestaurant = async (req, res, next) => {
  try {
    const { name, description } = req.body
    if (!name || !description ) {
      return res.status(400).json({
        status: 400,
        message: "invalid payload"
      })
    }
    const restaurant = await restaurantModel.create({
      name,
      description
    })
    return res.status(200).json({
      status: 200,
      message: "restaurant created",
      restaurant
    })
   
  } catch (error) {
    next(error)
  }
}
