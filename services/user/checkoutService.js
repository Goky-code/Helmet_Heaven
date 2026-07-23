import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js"
import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import mongoose, { mongo } from "mongoose";

export const getCheckoutData=async(userId)=>{
    try{
    const [cart,addresses]=await Promise.all([
        Cart.findOne({userId})
        .populate({
            path:"items.productId",
            populate:[
                {
                    path:"category",
                    match:{
                        isListed:true,
                        isDeleted:false,
                    },
                },
                {
                    path:"brand",
                    match:{
                        isListed:true,
                        isDeleted:false,
                    },
                },
            ],
        })
        .lean(),
        Address.find({
            userId
           
        }).lean()
    ])

    if(!cart){
        return{
            cart:{items:[]},
            addresses,
            selectedAddressId:addresses.length?addresses[0]._id:null,
            subtotal:0,
            shipping:0,
            tax:0,
            total:0,
        }
    }

    let subtotal=0
    const validItems=[]

    for(const item of cart.items){
        const product=item.productId

        if(!product)
            continue

        if(product.isDeleted)
            continue
        if(product.isBlocked)
            continue
        if(!product.category)
            continue
        if(!product.brand)
            continue

        const variant=product.variants.find(v=>v.size===item.size)

        if(!variant)
            continue
        if(variant.stock<=0)
            continue
        subtotal+=variant.price*item.quantity

        validItems.push({
            ...item,
            productId:product,

        })
    }
    cart.items=validItems
    const shipping=subtotal>=500?0:99
    const tax=Math.round(subtotal*0.08)
    const total=subtotal+shipping+tax
    const selectedAddress=addresses.find(a=>a.isDefault)||addresses[0]||null

    return{
        cart,
        addresses,
        selectedAddressId:selectedAddress?._id||null,
        subtotal,
        shipping,
        tax,
        total,
    }
}catch(error){
    throw error
}

}

export const placeOrder=async(userId,addressId,paymentMethod,couponCode=null)=>{
    const session=await mongoose.startSession()
    session.startTransaction()

    try{
        const address=await Address.findOne({
            _id:addressId,
            userId,
            isDeleted:false,
        })
        if(!address){
            throw new Error("Invalid address")
        }
        const cart=await Cart.findOne({userId})
        .populate("items.productId")
        .session(session)

        if(!cart||cart.items.length===0){
            throw new Error("cart is empty")
        }

        let subtotal=0
        const orderItems=[]

        for(const item of cart.items){
            const product=items.productId

            if(!product){
                throw new Error('product not found')
            }
            if(product.isDeleted){
                throw new Error(`${product.productName} is unavailable`)
            }
            if(product.isBlocked){
                throw new Error(`${product.productName} is blocked`)
            }
            const variant=product.variants.find(v=>v.size===item.size)

            if(!variant){
                throw new Error("variant not found")
            }
            if(variant.stock<item.quantity){
                throw new Error(`${product.productName} has only ${variant.stock} stock left`)
            }
            subtotal+=variant.price*item.quantity

            orderItems.push({
                product:product._id,
                productName:product.productName,
                size:item.size,
                quantity:item.quantity,
                price:variant.price,
                total:variant.price*item.quantity,
            })
        }

         const shipping = subtotal >= 500 ? 0 : 99;

         const tax = Math.round(subtotal * 0.08);

           let discount = 0;

            const grandTotal =
             subtotal +
             shipping +
              tax -
             discount

               const order = await Order.create([{

      userId,

      items: orderItems,

      shippingAddress: address,

      paymentMethod,

      subtotal,

      shippingCharge: shipping,

      tax,

      discount,

      totalAmount: grandTotal,

      orderStatus: "Pending",

      paymentStatus:
        paymentMethod === "COD"
          ? "Pending"
          : "Unpaid",

    }], { session });
  for (const item of cart.items) {

      await Product.updateOne(
        {
          _id: item.productId._id,
          "variants.size": item.size,
        },
        {
          $inc: {
            "variants.$.stock": -item.quantity,
          },
        },
        { session }
      );

    }

    cart.items = [];

    await cart.save({ session });

    await session.commitTransaction();

    return {

      success: true,

      orderId: order[0]._id,

      message: "Order placed successfully",

    };

  }
  catch (error) {

    await session.abortTransaction();

    throw error;

  }
  finally {

    session.endSession();

  }

}