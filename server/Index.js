import express from "express"
import dotenv from "dotenv"
import bodyParser from "body-parser"
import cors from "cors"
import errorHandler from "./helper/error_handeling.js"
import connectdb from "./mongodb.js"
import userRoutes from "./route/userRoutes.js"
import restaurantRoutes from "./route/restaurantRoute.js"
import subRestaurantRoutes from "./route/subrestaurantRoute.js"
import menuRoutes from "./route/menuRoute.js"
import itemRoutes from "./route/itemRoutes.js"
import orderRoutes from "./route/orderRoute.js"
import adminRoutes from "./route/adminRoute.js"



const app = express()
dotenv.config()
 const port = process.env.PORT
 app.use(express.json());
  

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())
app.use("/users",userRoutes)
app.use("/restaurants",restaurantRoutes)
app.use("/subrestaurants",subRestaurantRoutes)
app.use("/menu",menuRoutes)
app.use("/items",itemRoutes)
app.use("/orders",orderRoutes)
app.use("/admins",adminRoutes)


app.use(errorHandler);
app.get("/", (req, res) => {
    res.send('Backend server is running!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

connectdb()