import crypto from "crypto";
import User from "../models/userModels.js";

const generateReferralCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    const randomPart = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();

    code = `HH-${randomPart}`;

    exists = await User.exists({ referralCode: code });
  }

  return code;
};

export default generateReferralCode;