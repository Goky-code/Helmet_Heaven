import express from "express";
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import session from "express-session"
import path from 'path';
import { fileURLToPath } from "url"

const app = express();

import userRoutes from "./routes/userRoutes.js"
import authRoutes from "./routes/authRoutes.js"


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

 dotenv.config()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
    
  })
)

app.use(express.static(path.join(__dirname,'public')));
app.set("view engine", "ejs");                                       
app.set("views", "views");





app.use("/user",userRoutes);
app.use("/auth",authRoutes)




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