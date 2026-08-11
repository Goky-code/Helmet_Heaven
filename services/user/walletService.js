import Wallet from "../../models/walletModel.js"
import WalletTransaction from "../../models/walletTransaction.js"

export const getWalletDetails=async(useId,page=1,limit=10)=>{
    const skip=(page-1)*limit

    let wallet=await Wallet.findOne({userId})

    if(!wallet){
        wallet=await Wallet.create({
            userId,balance:0,
        })
    }
      const totalTransactions=await WalletTransaction.countDocuments({
        userId,
      })

    const transactions=await WalletTransaction.find({userId,})
            .sort({createdAt:-1})
            .skip(skip)
            .limit(limit)
            .lean()

    
     
     const totalPages=Math.ceil(totalTransactions/limit)

     return{
        balance:wallet.balance,
        transactions,
        currentPage:page,
        totalPages,
     }
}