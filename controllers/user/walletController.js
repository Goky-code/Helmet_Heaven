import crypto from "crypto";
import * as walletService from "../../services/user/walletService.js"
import * as razorpayService from "../../services/user/razorpayService.js"
import HTTP_STATUS from "../../utils/httpStatus.js";
 

export const loadWallet =async(req,res)=>{
    try{
        const userId=req.session.user?._id

        if(!userId){
            return res.redirect("/user/login")
        }

        const page=parseInt(req.query.page)||1
        const limit=8

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

export const loadAddMoneyPage=async(req,res)=>{
    if (!req.session.user?._id) {
    return res.redirect("/user/login");
  }

  return res.render("user/wallet/walletPayment",{
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    selectedAmount: 500,
    quickAmounts: [100, 500, 1000, 2000],
  })

}
 
export const createWalletTopUpOrder=async(req,res)=>{
    try{
        const userId=req.session.user?._id

        if(!userId){
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success:false,
                message:"Please log in again"
            })
        }
        const amount=Number(req.body.amount)

        if(!Number.isSafeInteger(amount)||amount<100||amount>10000){
       return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Enter an amount between ₹100 and ₹10,000",
      })  
        }

        const order=await razorpayService.createRazorpayOrder ({amount,
      receipt: `wallet_${crypto.randomUUID()}`,
    })

    await walletService.createTopUpTransaction({
        userId,
        amount,
        razorpayOrderId:order.id,
    })
     return res.status(HTTP_STATUS.OK).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    })
}catch(error){
     console.error("Wallet top-up order error:", error);

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to initiate wallet top-up",
    });
}
}

export const verifyWalletTopUp=async(req,res)=>{
    try{
        const userId=req.session.user?._id

        if(!userId){
          return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Please log in again",
      })  
        }
        const{
           razorpay_order_id: razorpayOrderId,
           razorpay_payment_id: razorpayPaymentId,
           razorpay_signature: razorpaySignature,
            } = req.body;   
        
        if(!razorpayOrderId||!razorpayPaymentId||!razorpaySignature){

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Payment verification details are missing",
      });
    }

    const isValid= razorpayService.verifyPaymentSignature({
        razorpayOrderId,razorpayPaymentId,razorpaySignature,
    })

     if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid payment signature",
      })
    }
    const result=await walletService.completeTopUp({
        userId,razorpayOrderId,
    })

      req.session.walletTopUpSuccess = {
      amountAdded: result.transaction.amount,
      newBalance: result.balance,
      transactionId: result.transaction.transactionId,
}

         await new Promise((resolve, reject) => {
         req.session.save((error) => {
         if (error) return reject(error);
         resolve()
  })
})
     return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Money added to your wallet successfully",
      balance: result.balance,
      redirectUrl: "/user/wallet/topup-success",
    })
    }catch(error){
         console.error("Wallet top-up verification error:", error);

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Payment verification failed",
    })
    }
}

export const loadTopUpSuccessPage=async(req,res)=>{
    try{
        const userId=req.session.user?._id
        if(!userId){
            return res.redirect("/user/login")
        }
    
   const successData = req.session.walletTopUpSuccess;
    if(!successData){
        return res.redirect("/user/wallet")
    }
   
    return res.render("user/wallet/walletTopupSuccess", {
      amountAdded: successData.amountAdded,
      newBalance: successData.newBalance,
      transactionId: successData.transactionId,
      cartCount: 0,
      wishlistCount: 0,
    })
  } catch (error) {
    console.error("Top-up success page error:", error);
    return res.redirect("/user/wallet");
  }
}