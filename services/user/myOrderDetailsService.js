import Order from "../../models/orderModel.js"

export const getOrderDetails=async(userId,orderId)=>{
    const order=await Order.findOne({
        userId,orderId
    }).lean()

    if(!order) return null

    const canCancel=[ "Pending",
    "Processing",
    "Confirmed",
    "Shipped",
    "Out for Delivery"].includes(order.orderStatus)
    const canReturn=order.orderStatus==="Delivered"
    const CanDownloadInvoice=order.orderStatus==="Delivered"

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

        items: order.items.map(item => ({

            productId: item.productId,

            image: item.productImage,

            name: item.productName,

            description: item.variantName,

            size: item.size,

            qty: item.quantity,

            price: `₹${item.totalPrice}`,

            status: item.status

        }))

    }

}

export const getInvoiceData=async(userId,orderId)=>{
    const order=await Order.findOne({
        userId,orderId
    }).lean()

    if(!order) return null

    return order
}