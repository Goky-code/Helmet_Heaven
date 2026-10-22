
import mongoose from "mongoose";
import User from "../../models/userModels.js";
import Wallet from "../../models/walletModel.js";
import WalletTransaction from "../../models/walletTransaction.js"

export const rewardReferral = async (newUserId, referrerId) => {
     console.log("Referral reward started");
  console.log("New user ID:", newUserId);
  console.log("Referrer ID:", referrerId);

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

       
        const newUser = await User.findById(newUserId).session(session);

        if (!newUser) {
            throw new Error("Registered user not found");
        }

        if (
            !newUser.referredBy ||
            newUser.referredBy.toString() !== referrerId.toString()
        ) {
            throw new Error("Referral relationship is invalid");
        }

        if (newUser.referralRewardProcessed) {
            await session.abortTransaction();
            return { success: true, alreadyProcessed: true };
        }

        if (newUserId.toString() === referrerId.toString()) {
            throw new Error("Self-referral is not allowed");
        }

        const referrer = await User.findById(referrerId).session(session);

        if (!referrer || referrer.isBlocked) {
            throw new Error("Referrer is unavailable");
        }

        
        const referrerTransactionId = `REF-${newUserId}-REFERRER`;
        const newUserTransactionId = `REF-${newUserId}-NEWUSER`;

        const existingTransactions = await WalletTransaction.find({
            transactionId: {
                $in: [referrerTransactionId, newUserTransactionId]
            }
        }).session(session);

        if (existingTransactions.length > 0) {
            throw new Error(
                "Referral transactions already exist; please investigate before retrying"
            );
        }

        
        const referrerWallet = await Wallet.findOneAndUpdate(
            { userId: referrerId },
            { $setOnInsert: { userId: referrerId, balance: 0 } },
            { new: true, upsert: true, session, setDefaultsOnInsert: true }
        );

        const newUserWallet = await Wallet.findOneAndUpdate(
            { userId: newUserId },
            { $setOnInsert: { userId: newUserId, balance: 0 } },
            { new: true, upsert: true, session, setDefaultsOnInsert: true }
        );

       
        await Wallet.updateOne(
            { _id: referrerWallet._id },
            { $inc: { balance: 100 } },
            { session }
        );

        await Wallet.updateOne(
            { _id: newUserWallet._id },
            { $inc: { balance: 50 } },
            { session }
        );

       
       await WalletTransaction.create(
  [
    {
      walletId: referrerWallet._id,
      userId: referrerId,
      transactionId: referrerTransactionId,
      type: "CREDIT",
      amount: 100,
      description: "Referral reward",
      subDescription: `Referral signup reward for ${newUser.email}`,
      status: "COMPLETED",
      referenceId: newUserId.toString(),
    },
    {
      walletId: newUserWallet._id,
      userId: newUserId,
      transactionId: newUserTransactionId,
      type: "CREDIT",
      amount: 50,
      description: "Referral signup bonus",
      subDescription: "Welcome reward for using a referral code",
      status: "COMPLETED",
      referenceId: referrerId.toString(),
    },
  ],
  {
    session,
    ordered: true,
  }
)

       
        newUser.referralRewardProcessed = true;
        await newUser.save({ session });

        await session.commitTransaction();

        return { success: true, alreadyProcessed: false };
    } catch (error) {

        console.error("Referral reward failed:", error);

        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        throw error;
    } finally {
        await session.endSession();
    }
};
