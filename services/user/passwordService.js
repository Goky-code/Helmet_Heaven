import User from "../models/userModels.js";
import bcrypt from "bcrypt";

export const updatePassword = async (
  userId,
  currentPassword,
  newPassword,
  confirmPassword
) => {

  if (newPassword !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.authType === "google") {
    throw new Error(
      "Password change not available for Google login users"
    );
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );

  user.password = hashedPassword;

  await user.save();

  return true;
};