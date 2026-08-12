import Order from "../../models/orderModel.js"

export const getOrderDetails=async(userId,orderId)=>{

    const CANCELLABLE_ITEM_STATUSES = ["Pending", "Processing", "Confirmed", "Shipped", "Out For Delivery"]

    const order=await Order.findOne({
        userId,orderId
    }).lean()

    if(!order) return null

     const items = order.items.map(item => ({
        productId: item.productId,
        image: item.productImage,
        name: item.productName,
        description: item.variantName,
        size: item.size,
        qty: item.quantity,
        price: `₹${item.totalPrice}`,
        status: item.status,

        canCancel: CANCELLABLE_ITEM_STATUSES.includes(item.status),
        canReturn: item.status === "Delivered",

        cancelReason: item.cancelReason,
        cancelComment: item.cancelComment,
        returnReason: item.returnReason,
        returnComment: item.returnComment,
        cancelledAt: item.cancelledAt,
        returnedAt: item.returnedAt
    }))

    const canCancel = items.some(i => i.canCancel)
    const canReturn = items.some(i => i.canReturn)
    const CanDownloadInvoice = order.orderStatus === "Delivered"

    return{
        orderId:order.orderId,
        status:order.orderStatus,
        datePlaced:new Date(order.createdAt).toLocaleDateString("en-IN"),
        totalPrice:`₹${order.grandTotal}`,
        subtotal: `₹${order.subTotal}`,

        shippingFee:
            order.shipping === 0
                ? "Free"
                : `₹${order.shipping}`,

        tax: `₹${order.tax}`,

        total: `₹${order.grandTotal}`,

        canCancel,

        canReturn,

        CanDownloadInvoice,
  
        shippingAddress: {

            name: order.address.name,

            line1: order.address.houseName,

            line2: order.address.street,

            city: order.address.city,

            state: order.address.state,

            pincode: order.address.pincode

        },

        paymentMethod: {

            name: order.paymentMethod,

            badge: order.paymentMethod

        },
         items

        //: order.items.map(item => ({

        //     productId: item.productId,

        //     image: item.productImage,

        //     name: item.productName,

        //     description: item.variantName,

        //     size: item.size,

        //     qty: item.quantity,

        //     price: `₹${item.totalPrice}`,

        //     status: item.status,
           
        //     cancelReason: item.cancelReason,
        //     cancelComment: item.cancelComment,

        //     returnReason: item.returnReason,
        //     returnComment: item.returnComment,

        //     cancelledAt: item.cancelledAt,
        //     returnedAt: item.returnedAt

        // }))

    }

}

export const getInvoiceData=async(userId,orderId)=>{
    const order=await Order.findOne({
        userId,orderId
    }).lean()

    if(!order) return null

    return order
}