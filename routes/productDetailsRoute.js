import express from "express"
import {loadProductDetails} from "../controllers/user/productdetailsController.js"
import { loadCart } from "../controllers/user/cartController.js"
import { isUserAuth } from "../middlewares/userAuth.js"
 const router=express.Router()


router.get('/product/:id', loadProductDetails)

// router.get('/counts', async (req, res) => {
//   try {
//     if (!req.session?.userId) {
//       return res.json({ cartCount: 0, wishCount: 0 });
//     }
//     const userId = req.session.userId;

//     const cart = await Cart.findOne({ userId });
//     const wish = await Wishlist.findOne({ userId });

//     const cartCount = cart?.items?.length ?? 0;
//     const wishCount = wish?.items?.length ?? 0;

//     res.json({ cartCount, wishCount });
//   } catch (err) {
//     res.json({ cartCount: 0, wishCount: 0 });
//   }
// });

 export default router