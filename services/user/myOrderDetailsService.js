import Order from "../../models/orderModel.js"
import Product from "../../models/productModel.js"
import { calculateOrderStatus } from "../admin/orderService.js"
import * as walletService from "./walletService.js"

export const getOrderDetails=async(userId,orderId)=>{

    const CANCELLABLE_ITEM_STATUSES = ["Pending", "Processing", "Confirmed", "Shipped", "Out For Delivery"]

    const order=await Order.findOne({
        userId,orderId
    }).lean()

    if(!order) return null

     const items = order.items.map(item => ({
        itemId:item._id,
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

export const cancelOrderItems=async(userId,orderId,selectedItems,body)=>{

    const order=await Order.findOne({
        userId,orderId
    })
    if (!order) {
        throw new Error("Order not found");
    }
     if (!Array.isArray(selectedItems)) {
        selectedItems = [selectedItems];
    }

    if (selectedItems.length === 0) {
        throw new Error("Please select at least one product");
    }

      const cancellableStatuses = [
            "Pending",
            "Processing",
            "Confirmed",
            "Shipped",
            "Out For Delivery"
        ]

    for (const itemId of selectedItems) {

        const item = order.items.id(itemId);

        if (!item) {
            throw new Error("Order item not found");
        }
       
        if (item.status === "Cancelled") {
            continue;
        }

        if (!cancellableStatuses.includes(item.status)) {
            throw new Error(
                `${item.productName} cannot be cancelled now`
            );
        }

        const reason = body[`reason_${itemId}`] || ""
        const comment = body[`comment_${itemId}`] || ""

        if(order.paymentMethod==="Wallet"&&order.paymentStatus==="Paid"){
            const refundAmount=Number(item.totalPrice)

            if(!refundAmount||refundAmount<=0){
                throw new Error(`Invalid refund amount for ${item.productName}`)
            }

            const refundResult=await walletService.refundToWallet({
                userId:order.userId,
                amount:refundAmount,
                orderId:order._id.toString(),
                itemId:item._id.toString(),
                productName:item.productName
            })

            item.refundStatus="Completed"

        }

      
        const stockResult = await Product.updateOne(
            {
                _id: item.productId,
                "variants.size": item.size
            },
            {
                $inc: {
                    "variants.$.stock": item.quantity
                }
            }
        )

         if (stockResult.matchedCount === 0) {
            throw new Error(
                `Product/variant not found for ${item.productName}`
            );
        }

        item.status = "Cancelled";
        item.cancelledAt = new Date();
        item.cancelReason = reason;
        item.cancelComment = comment;
    }

    
    const allCancelled = order.items.every(
        item => item.status === "Cancelled"
    );

    if (allCancelled) {
        order.orderStatus = "Cancelled";
    }else{
        order.orderStatus=calculateOrderStatus(order.items)
    }

    await order.save();

    return order;
}

export const getInvoiceData=async(userId,orderId)=>{
    const order=await Order.findOne({
        userId,orderId
    }).lean()

    if(!order) return null

    return order
}