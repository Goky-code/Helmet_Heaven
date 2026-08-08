import dns from "node:dns"
dns.setDefaultResultOrder("ipv4first");
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
import productRouter from "./routes/productRoutes.js"
import shopRoutes from "./routes/shopRoutes.js"
import cartRoutes from "./routes/cartRoutes.js"
import productDetailsRouter from "./routes/productDetailsRoute.js" 
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js"
import checkoutRoute from "./routes/checkoutRoute.js"
import paymentRoute from  "./routes/paymentRoute.js"
import orderSuccessRoutes from "./routes/orderSuccessRoutes.js";
import myOrdersRoute from "./routes/myOrdersRoute.js"
import myOrderDetailsRoute from "./routes/myOrderDetailsRoute.js"
import { setNavCounts } from "./middlewares/setNavCounts.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


app.use(setNavCounts);

// ── Routes ──
app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/admin", categoryRouter);
app.use("/admin", brandRouter);
app.use("/admin", productRouter);
app.use("/", shopRoutes);
app.use("/user", productDetailsRouter);
app.use("/user", wishlistRoutes);
app.use("/user", cartRoutes);
app.use("/admin", orderRoutes)
app.use("/user",checkoutRoute)
app.use("/user" ,paymentRoute)
app.use("/user", orderSuccessRoutes)
app.use("/user", myOrdersRoute)
app.use("/user",myOrderDetailsRoute)

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