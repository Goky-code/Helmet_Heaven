import * as myOrderService from "../../services/user/myOrderService.js"
import Cart from "../../models/cartModel.js"
import Wishlist from "../../models/wishlistModel.js"

export const loadMyOrders=async(req,res)=>{
    try{
        const userId=req.session.user
        const page=Number(req.query.page)||1

        const data=await myOrderService.getUserOrders(userId,page)

        res.render("user/myOrders/myorders",{
            orders:data.orders,
            currentpage:data.currentpage,
            totalPages:data.totalPages
        })
        
    }catch(error){
        console.log(error)
        res.redirect("/pageNotFound")
    }
}