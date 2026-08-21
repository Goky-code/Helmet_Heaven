import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js"
import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import mongoose, { mongo } from "mongoose";

export const getCheckoutData = async (userId, buyNowItem = null) => {
    try {
        const addresses = await Address.find({ userId }).lean();

        if (buyNowItem) {
            const product = await Product.findById(buyNowItem.productId)
                .populate([
                    { path: "category", match: { isListed: true, isDeleted: false } },
                    { path: "brand", match: { isListed: true, isDeleted: false } },
                ])
                .lean();

            let items = [];
            if (product && !product.isDeleted && !product.isBlocked && product.category && product.brand) {
                const variant = product.variants.find(v => v.size === buyNowItem.size);
                if (variant && variant.stock > 0) {
                    const quantity = Math.min(Number(buyNowItem.quantity) || 1, variant.stock, 5);
                    items = [{ productId: product, size: buyNowItem.size, quantity }];
                }
            }

            const subtotal = items.reduce((sum, item) => {
                const variant = item.productId.variants.find(v => v.size === item.size);
                return sum + (variant ? variant.price * item.quantity : 0);
            }, 0);

            const shipping = subtotal >= 500 ? 0 : 99;
            const tax = Math.round(subtotal * 0.08);
            const total = subtotal + shipping + tax;
            const selectedAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

            return {
                cart: { items },
                addresses,
                selectedAddressId: selectedAddress?._id || null,
                subtotal, shipping, tax, total,
            };
        }

        const cart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                populate: [
                    { path: "category", match: { isListed: true, isDeleted: false } },
                    { path: "brand", match: { isListed: true, isDeleted: false } },
                ],
            })
            .lean();

        if (!cart) {
            return {
                cart: { items: [] }, addresses,
                selectedAddressId: addresses.length ? addresses[0]._id : null,
                subtotal: 0, shipping: 0, tax: 0, total: 0,
            };
        }

        let subtotal = 0;
        const validItems = [];
        for (const item of cart.items) {
            const product = item.productId;
            if (!product || product.isDeleted || product.isBlocked || !product.category || !product.brand) continue;
            const variant = product.variants.find(v => v.size === item.size);
            if (!variant || variant.stock <= 0) continue;
            subtotal += variant.price * item.quantity;
            validItems.push({ ...item, productId: product });
        }
        cart.items = validItems;

        const shipping = subtotal >= 500 ? 0 : 99;
        const tax = Math.round(subtotal * 0.08);
        const total = subtotal + shipping + tax;
        const selectedAddress = addresses.find(a => a.isDefault) || addresses[0] || null;

        return {
            cart, addresses,
            selectedAddressId: selectedAddress?._id || null,
            subtotal, shipping, tax, total,
        }
    } catch (error) {
        throw error;
    }
}

export const placeOrder = async (userId, addressId, paymentMethod, couponCode = null, buyNowItem = null) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const address = await Address.findOne({ _id: addressId, userId, isDeleted: false }).session(session);
        if (!address) throw new Error("Invalid address");

        let orderItems = [];
        let subtotal = 0;
        let cart = null;

        if (buyNowItem) {
            const product = await Product.findById(buyNowItem.productId).session(session);
            if (!product) throw new Error("Product not found");
            if (product.isDeleted) throw new Error(`${product.productName} is unavailable`);
            if (product.isBlocked) throw new Error(`${product.productName} is blocked`);

            const variant = product.variants.find(v => v.size === buyNowItem.size);
            if (!variant) throw new Error("Variant not found");
            if (variant.stock < buyNowItem.quantity) {
                throw new Error(`${product.productName} has only ${variant.stock} stock left`);
            }

            subtotal = variant.price * buyNowItem.quantity;
            orderItems.push({
                product: product._id,
                productName: product.productName,
                size: buyNowItem.size,
                quantity: buyNowItem.quantity,
               regularPrice: variant.price,
                salePrice: variant.price,
               totalPrice: variant.price * buyNowItem.quantity,
            });
        } else {
            cart = await Cart.findOne({ userId }).populate("items.productId").session(session);
            if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

            for (const item of cart.items) {
                const product = item.productId;               
                if (!product) throw new Error("Product not found");
                if (product.isDeleted) throw new Error(`${product.productName} is unavailable`);
                if (product.isBlocked) throw new Error(`${product.productName} is blocked`);

                const variant = product.variants.find(v => v.size === item.size);
                if (!variant) throw new Error("Variant not found");
                if (variant.stock < item.quantity) {
                    throw new Error(`${product.productName} has only ${variant.stock} stock left`);
                }

                subtotal += variant.price * item.quantity;
                orderItems.push({
                    product: product._id,
                    productName: product.productName,
                    size: item.size,
                    quantity: item.quantity,
                   regularPrice: variant.price,
                    salePrice: variant.price,
                   totalPrice: variant.price * item.quantity,
                });
            }
        }

        const shipping = subtotal >= 500 ? 0 : 99;
        const tax = Math.round(subtotal * 0.08);
        const discount = 0;
        const grandTotal = subtotal + shipping + tax - discount;

        const order = await Order.create([{
            userId, items: orderItems,address, paymentMethod,
            subTotal:subtotal,shipping, tax, discount,
            grandTotal, orderStatus: "Pending",
            paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
        }], { session });

        if (buyNowItem) {
            await Product.updateOne(
                { _id: buyNowItem.productId, "variants.size": buyNowItem.size },
                { $inc: { "variants.$.stock": -buyNowItem.quantity } },
                { session }
            );
        } else {
            for (const item of cart.items) {
                await Product.updateOne(
                    { _id: item.productId._id, "variants.size": item.size },
                    { $inc: { "variants.$.stock": -item.quantity } },
                    { session }
                );
            }
            cart.items = [];
            await cart.save({ session });
        }

        await session.commitTransaction();
        return { success: true, orderId: order[0]._id, message: "Order placed successfully" };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}