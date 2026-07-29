
import Order from "../../models/orderModel.js"

export const getUserOrders=async(userId,page=1,limit=5)=>{

    const skip=(page-1)*limit
    const totalOrders=await Order.countDocuments({userId})
    const orders=await Order.find({userId})
       .populate("items.productId")
       .sort({createdAt:-1})
       .skip(skip)
       .limit(limit)
       .lean()

       const formattedOrders=orders.map(order=>({
        orderId:order.orderId,
        status:order.orderStatus,
        dateplaced:new Date(order.createdAt).toLocaleDateString("en-IN"),
        totalPrice: order.grandTotal,

        items: order.items.map(item => ({

            image: item.productImage,

            name: item.productName,

            size: item.size,

            qty: item.quantity

        }))

    }))

    return {

        orders: formattedOrders,

        currentPage: page,

        totalPages: Math.ceil(totalOrders / limit)

    }

}


