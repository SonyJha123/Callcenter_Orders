import mongoose from "mongoose"
  
  const connectdb = async (req, res) => {
    try {
        await mongoose.connect(process.env.CONNECTION_STRING)

        console.log("🟢 Database connected successfully");
        
    } catch (error) {
        return res.status(400).json({message:"🔴 database not connected**"})
    }
  }

  export default connectdb;