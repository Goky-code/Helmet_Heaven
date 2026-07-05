import User from "../models/userModels.js";

export const getUserProfile = async (userId) => {

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateUserProfile = async (
  userId,
  body,
  file
) => {

  const { firstname, lastname, phone } = body;

  const nameRegex = /^[A-Za-z\s]+$/;
  const phoneRegex = /^[0-9]{10}$/;

  if (firstname !== undefined) {

    if (!firstname.trim()) {
      throw new Error("First name is required.");
    }

    if (!nameRegex.test(firstname.trim())) {
      throw new Error("First name can only contain alphabets.");
    }

  }

  if (lastname !== undefined) {

    if (!lastname.trim()) {
      throw new Error("Last name is required.");
    }

    if (!nameRegex.test(lastname.trim())) {
      throw new Error("Last name can only contain alphabets.");
    }

  }

  if (phone && !phoneRegex.test(phone.trim())) {
    throw new Error("Phone number must be exactly 10 digits.");
  }

  const updateData = {};

  if (firstname)
    updateData.firstName = firstname.trim();

  if (lastname)
    updateData.lastName = lastname.trim();

  if (phone)
    updateData.phone = phone.trim();

  if (file)
    updateData.profileImage = file.path;

  const updatedUser =
    await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

  return updatedUser;
};