import Address from "../models/addressModel.js";

export const getUserAddresses = async (userId) => {
  return await Address.find({ userId });
};

export const createAddress = async (userId, addressData) => {

  const {
    name,
    street,
    apartment,
    city,
    state,
    zip,
    phone,
    isDefault,
  } = addressData;

  if (isDefault === "on") {
    await Address.updateMany(
      { userId },
      { isDefault: false }
    );
  }

  await Address.create({
    userId,
    name,
    street,
    apartment,
    city,
    state,
    zip,
    phone,
    isDefault: isDefault === "on",
  });
};

export const getAddressById = async (id) => {

  const address = await Address.findById(id);

  if (!address) {
    throw new Error("Address not found");
  }

  return address;
};

export const editAddress = async (
  userId,
  addressId,
  addressData
) => {

  const {
    name,
    street,
    apartment,
    city,
    state,
    zip,
    phone,
    isDefault,
  } = addressData;

  const nameRegex = /^[A-Za-z\s]+$/;

  if (!nameRegex.test(name.trim())) {
    throw new Error(
      "Recipient name can only contain alphabets."
    );
  }

  if (!nameRegex.test(state.trim())) {
    throw new Error(
      "State can only contain alphabets."
    );
  }

  if (isDefault === "on") {

    await Address.updateMany(
      { userId },
      { isDefault: false }
    );

  }

  await Address.findByIdAndUpdate(
    addressId,
    {
      name,
      street,
      apartment,
      city,
      state,
      zip,
      phone,
      isDefault: isDefault === "on",
    }
  );
};

export const removeAddress = async (id) => {

  await Address.findByIdAndDelete(id);

};

export const makeDefaultAddress = async (
  userId,
  addressId
) => {

  await Address.updateMany(
    { userId },
    { isDefault: false }
  );

  await Address.findByIdAndUpdate(
    addressId,
    {
      isDefault: true,
    }
  );
};