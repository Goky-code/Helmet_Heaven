import Order from "../../models/orderModel.js";

export const getOrderSuccessDetails = async (orderId, userId) => {
    const order = await Order.findOne({ _id: orderId, userId }).lean();

    if (!order) {
        return null;
    }

    return {
        _id: order._id,
        orderNumber: order.orderId,
        items: order.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            size: item.size,
            quantity: item.quantity,
            price: item.salePrice || item.regularPrice,
            productImage: item.productImage
        })),
        deliveryAddress: {
            street: order.address?.street || "",
            apartment: order.address?.houseName || "",
            city: order.address?.city || "",
            state: order.address?.state || "",
            zip: order.address?.pincode || ""
        },
        subtotal: order.subTotal,
        shipping: order.shipping,
        tax: order.tax,
        couponDiscount: order.discount || 0,
        total: order.grandTotal
    };
};