import express from "express";
import dotenv from "dotenv"
import connectDB from "./config/db.js"
const app = express();


app.get("/",(req,res)=>{
  console.log("trigger")
   res.send("Helo world")
})




const startServer = async () => {
  try {
    
    await connectDB();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();