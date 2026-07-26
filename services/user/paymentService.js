import Cart from "../../models/cartModel.js"
import Address from "../../models/addressModel.js"
import Order from "../../models/orderModel.js"
import Product from "../../models/productModel.js"
import mongoose from "mongoose"



export const getPaymentPage=async(userId , addressId)=>{
    const cart =await Cart.findOne({userId})
    .populate({
        path:"items.productId",
        populate:[
            "brand",
            "category"
        ]
    })
    .lean()

    if(!cart||cart.items.length===0){
        throw new Error("Cart is empty")
    }

    const shippingAddress=await Address.findOne({
        _id:addressId,
        userId
    }).lean()

    if(!shippingAddress){
        throw new Error("Address not found")
    }

    let subtotal=0

    for(const item of cart.items){
        const variant=item.productId.variants.find(v=>v.size===item.size)

        if(!variant)
            continue

        subtotal+=variant.price*item.quantity
    }
    const shipping=subtotal>=500?0:99
    const tax=Math.round(subtotal*0.08)
    const discount=0
    const grandTotal=subtotal+shipping+tax

    return{
        cart,
        shippingAddress,
        subtotal,
        shipping,
        tax,
        discount,
        grandTotal
    }
}

export const placeOrder=async(userId,addressId,paymentMethod)=>{
    const seession=await mongoose.startSession()

    session.startTransaction()

    try{
        const cart=await Cart.findOne({userId})
        .populate("items.productId")
        .session(session)

        if(!cart||cart.items.length===0){
            throw new Error("Cart is empty")
        }
        const address=await Address.findOne({
            _id:addressId,
            userId
        }).session(session)

        if(!address){
            throw new Error('Address not found')
        }
        let subtotal=0

        const orderItems=[]

         const orderedCartItemIds = []

        for(const item of cart.items){
            const product=item.productId

              if (!product || product.isBlocked || product.isDeleted) {
                continue
            }

            const variant=product.variants.find(v=>v.size===item.size)

             if (!variant || variant.stock <= 0) {
                continue
            }

            if(!variant){
                throw new Error(`Variant not found for ${product.productName}`)
            }

            if(variant.stock<item.quantity){
                throw new Error(`${product.productName} is out of stock`)
            }
        
        subtotal+=variant.price*item.quantity

        orderItems.push({
            productId:product._id,
            productName:product.productName,
            size:item.size,
            quantity:item.quantity,
           regularPrice: variant.price,

                salePrice: variant.price,

                totalPrice: variant.price * item.quantity,

                productImage: product.productImage[0]

            });

              orderedCartItemIds.push(item._id)

        }

          if (orderItems.length === 0) {
            throw new Error("None of the items in your cart are currently available")
        }

        const shipping = subtotal >= 500 ? 0 : 99;

        const tax=Math.round(subtotal*0.08)

        const discount = 0;

        const grandTotal =
            subtotal +
            shipping +
            tax-
            discount

        const orderId =
            "HH" + Date.now();

        const order = await Order.create([{

            orderId,

            userId,

            items: orderItems,

            address:address._id,

            paymentMethod,

            paymentStatus:
                paymentMethod === "COD"
                    ? "Pending"
                    : "Pending",

            subTotal: subtotal,

            shipping,
             tax,
            discount,

            grandTotal

        }], { session });

        
        for (const orderItem of orderItems) {
            await Product.updateOne(
                { _id: orderItem.productId, "variants.size": orderItem.size },
                { $inc: { "variants.$.stock": -orderItem.quantity } },
                { session }
            )
        }
 
        
        cart.items = cart.items.filter(
            item => !orderedCartItemIds.some(id => id.equals(item._id))
        )
        await cart.save({ session })
 
        await session.commitTransaction()
 
        return {
            success: true,
            orderId: order[0]._id,
            redirectUrl: "/user/order-success"
        }
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}
 