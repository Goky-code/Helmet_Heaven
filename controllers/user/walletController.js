import * as walletService from "../../services/user/walletService.js"
import HTTP_STATUS from "../../utils/httpStatus.js";
 

export const loadWallet =async(req,res)=>{
    try{
        const userId=req.session.user?._id

        if(!userId){
            return res.redirect("/user/login")
        }

        const page=parseInt(req.query.page)||1
        const limit=10

        const{
            balance,transactions,currentPage,totalPages,
        }=await walletService.getWalletDetails(userId,page,limit)

        res.render("user/wallet/walletPage",{
            balance,transactions,currentPage,totalPages,
        })
    }catch(error){
        console.error("wallet loading error",error)

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send("error",{
            message:"unable to load wallet",
        })
    }
}