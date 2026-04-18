import express from "express";
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import session from "express-session"
import passport from "./config/passport.js";
import path from 'path';
import { fileURLToPath } from "url"
import adminRoutes from "./routes/adminRoutes.js";

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
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname,'public')));
app.set("view engine", "ejs");                                       
app.set("views", "views");





app.use("/user",userRoutes);
app.use("/auth",authRoutes)

app.use("/admin", adminRoutes);


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