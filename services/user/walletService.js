import mongoose from "mongoose"
import Wallet from "../../models/walletModel.js"
import WalletTransaction from "../../models/walletTransaction.js"
import crypto from "crypto"

export const getWalletDetails=async(userId,page=1,limit=8)=>{
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

export const refundToWallet=async({
  userId,amount,orderId,itemId,productName,
})=>{
  if(!userId){
    throw new Error("User ID is required")
  }
  if(!amount||amount<=0){
    throw new Error("Invalid refund amount")
  }

  const referenceId=`REFUND_${orderId}_${itemId}`

  const existingTransaction=await WalletTransaction.findOne({
    referenceId,
    type:"CREDIT",
  })

  if(existingTransaction){
    return{
      alreadyRefunded:true,
      transaction:existingTransaction,
    }
  }

  let wallet =await Wallet.findOne({userId})

  if(!wallet){
    wallet=await Wallet.create({
      userId,balance:0,
    })
  }

  wallet.balance+=amount
  await wallet.save()

  const transaction=await WalletTransaction.create({
    walletId: wallet._id,
    userId,
    transactionId: `TXN_${crypto.randomUUID()}`,
    type: "CREDIT",
    amount,
    description: "Order Refund",
    subDescription: productName
      ? `Refund for ${productName}`
      : "Refund for returned product",
    status: "COMPLETED",
    referenceId,
  })

  return {
    alreadyRefunded:false,
    wallet,
    transaction,
  }
}

export const createTopUpTransaction=async({
  userId,amount,razorpayOrderId,
})=>{
  const wallet=await Wallet.findOneAndUpdate(
    {userId},{$setOnInsert:{balance:0}},
    {upsert:true, returnDocument: "after",setDefaultsOnInsert:true,}
  )

  const transaction=await WalletTransaction.create({
    walletId:wallet._id,
    userId,
    transactionId: `TXN_${crypto.randomUUID()}`,
    type: "CREDIT",
    amount,
    description: "Wallet Top-up",
    subDescription: "Money added through Razorpay",
    status: "PENDING",
    referenceId: razorpayOrderId,
  })
  return transaction
}

export const completeTopUp=async({
  userId,razorpayOrderId
})=>{
  const session=await mongoose.startSession()

  try{
    session.startTransaction()

    const transaction=await WalletTransaction.findOne({
     userId,
    referenceId: razorpayOrderId,
      type: "CREDIT",
      description: "Wallet Top-up",
      status: "PENDING",
    }).session(session)

    if(!transaction){
      throw new Error("Pending transaction not found or payment already processed")
    }
    const wallet = await Wallet.findOneAndUpdate(
      { _id: transaction.walletId, userId },
      { $inc: { balance: transaction.amount } },
      { new: true, session })

      if(!wallet){
        throw new Error("Wallet not found")
      }
      transaction.status="COMPLETED"
      await transaction.save({session})
      await session.commitTransaction()

      return{
        balance:wallet.balance,
        transaction,
      }
  }catch(error){
    await session.abortTransaction()
    throw error
  }finally{
    await session.endSession()
  }
}