
import dotenv from "dotenv"
dotenv.config()
import express from "express";
import connectDB from "./config/db.js"
import session from "express-session"
import passport from "./config/passport.js";
import path from 'path';
import { fileURLToPath } from "url"
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import categoryRouter from "./routes/categoryRoutes.js";
import brandRouter from "./routes/brandRoutes.js";



const app = express();



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false, // ← changed from true
    cookie: {
      secure: false,        // set true only if using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
)
app.use(passport.initialize());

// console.log("Client ID:", process.env.GOOGLE_CLIENT_ID);
// console.log("Client Secret:", process.env.GOOGLE_CLIENT_SECRET);

app.use(passport.session());
app.use(express.static(path.join(__dirname,'public')));
app.set("view engine", "ejs");                                       
app.set("views", "views");


app.use("/user",userRoutes);
app.use("/auth",authRoutes)

app.use("/admin", adminRoutes);
app.use("/admin", categoryRouter);

app.use("/admin",brandRouter)

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