import mongoose from "mongoose";
import Order from "../../models/orderModel.js";
import PDFDocument from "pdfkit";
import * as walletService from "../user/walletService.js"
import Product from "../../models/productModel.js";

const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
];

export const getOrders = async (page, limit, { search = "", status = "", sort="" } = {}) => {

  search = String(search || "").trim();
  status = String(status || "").trim();
  sort = String(sort || "").trim();


  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 5;
  const skip = (currentPage - 1) * perPage;

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  const match = {};

  if (status && ORDER_STATUSES.includes(status)) {
    match.orderStatus = status;
  }
if (search) {

  const regex = new RegExp(search, "i");

    match.$or = [
      { orderId: regex },
      { "user.firstName": regex },
      { "user.lastName": regex },
      { "user.email": regex },
      { "address.name": regex },
    ];
  }

  if (Object.keys(match).length>0) {
    pipeline.push({ $match: match });
  }

 
  let sortOption = {createdAt: -1 };

  switch (sort) {

    case "oldest":
      sortOption = { createdAt: 1 };
      break;

    case "amountHigh":
      sortOption = { grandTotal: -1 };
      break;

    case "amountLow":
      sortOption = { grandTotal: 1 };
      break;

    default:
      sortOption = {createdAt: -1 };
  }

  pipeline.push({ $sort: sortOption });

  pipeline.push({
    $facet: {
      orders: [
        { $skip: skip },
        { $limit: perPage },
      ],
      total: [
        { $count: "count" },
      ],
    },
  });

  const result = await Order.aggregate(pipeline);

  const orders = result[0].orders.map(order => ({
    ...order,
    userId: order.user || null,
  }));

  const totalOrders = result[0].total[0]?.count || 0
  const totalPages = Math.ceil(totalOrders / perPage)

  return {
    orders,
    totalOrders,
    totalPages,
    currentPage,
    search,
    status,
    sort,
  }
}

export const getOrderDetails = async (id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Order Id");
  }

  const order = await Order.findById(id)
    .populate("userId", "firstName lastName email phone")
    .populate("items.productId", "productName")
    
    .lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

export const calculateOrderStatus = (items) => {

  const statuses = items.map(item => item.status);

 
  if (statuses.every(status => status === "Cancelled")) {
    return "Cancelled";
  }
  if (statuses.every(status => status === "Returned")) {
    return "Returned";
  }

  if (statuses.some(status => status === "Return Requested")) {
    return "Return Requested";
  }

  if (
    statuses.every(status =>
      ["Delivered", "Cancelled", "Returned"].includes(status)
    )
  ) {
    return "Delivered"
  }

  if (statuses.some(status => status === "Out For Delivery")) {
    return "Out For Delivery";
  }

  if (statuses.some(status => status === "Shipped")) {
    return "Shipped";
  }

  if (statuses.some(status => status === "Processing")) {
    return "Processing";
  }

  return "Pending";
};

export { ORDER_STATUSES };

export const updateOrderStatus=async(orderId,status)=>{

  if(!mongoose.Types.ObjectId.isValid(orderId)){
    throw new Error("Invalid Order Id")
  }
  
  if(!ORDER_STATUSES.includes(status)){
    throw new Error("Invalid Item Status")
  }

  const order=await Order.findById(orderId)

  if(!order){
    throw new Error("order not found")
  }

  if(status==="Cancelled"){
    for(const item of order.items){
      if(item.status==="Cancelled"){
        continue
      }
      if(order.paymentMethod === "Wallet" &&
        order.paymentStatus === "Paid"){

          const refundAmount=Number(item.totalPrice)

          if(!refundAmount||refundAmount<=0){
            throw new Error(`Invalid refund amount for ${item.productName}`)
          }
        

        await walletService.refundToWallet({
          userId: order.userId,
          amount: refundAmount,
          orderId: order._id.toString(),
          itemId: item._id.toString(),
          productName: item.productName,
        })
        item.refundStatus="Completed"
    }
     item.status = "Cancelled"
      item.cancelledAt = new Date()
     
      await Product.updateOne(
        {
          _id:item.productId,
          "variants.size":item.size,
        },
        {
          $inc:{
            "variants.$.stock":item.quantity,
          },
        }
      )
  }
}

 else if(status==="Returned"){
    for(const item of order.items){

      if(item.refundStatus==="Completed"){
        item.status="Returned"

        if(!item.returnedAt){
          item.returnedAt=new Date()
        }
        continue
      }
      const refundAmount=Number(item.totalPrice)

      if(!refundAmount||refundAmount<=0){
        throw new Error(`Invalid refund Amount for ${item.productName}`)
      }

      await walletService.refundToWallet({
        userId:order.userId,
        amount:refundAmount,
        orderId:order._id.toString(),
        itemId:item._id.toString(),
        productName:item.productName,
      })
      item.status = "Returned"
      item.returnedAt = new Date()
      item.refundStatus = "Completed"

      await Product.updateOne(
        {
          _id:item.productId,
          "variants.size":item.size,
        },
        {
          $inc:{
            "variants.$.stock":item.quantity,
          },
        }
      )
    }
  }else{

 order.items.forEach(item => {
    item.status = status;
   
  })
}

order.orderStatus=calculateOrderStatus(order.items)
await order.save()

return order

}

export const changeOrderItemStatus = async (orderId, itemId, status) => {

   console.log("🔥 changeOrderItemStatus CALLED");
  console.log("orderId:", orderId);
  console.log("itemId:", itemId);
  console.log("status:", status);
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid Order Id");
  }
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new Error("Invalid Item Id");
  }
  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid Item Status");
  }

  const order = await Order.findById(orderId);

  console.log("ORDER FOUND:", order?._id);
console.log("PAYMENT METHOD:", order?.paymentMethod);
console.log("PAYMENT STATUS:", order?.paymentStatus);
  if (!order) {
    throw new Error("order not found");
  }

  const item = order.items.id(itemId);
  if (!item) {
    throw new Error("order item not found");
  }

  if(status==="Cancelled"){

       if(item.status === "Cancelled"){
        throw new Error("This product is already cancelled")
    }

    console.log("========== STOCK RESTORE ==========");
    console.log("PRODUCT ID:", item.productId);
    console.log("SIZE:", item.size);
    console.log("QUANTITY:", item.quantity);

    const result = await Product.updateOne(
        {
            _id: item.productId,
            "variants.size": item.size
        },
        {
            $inc: {
                "variants.$.stock": item.quantity
            }
        }
    );

    console.log("STOCK UPDATE RESULT:", result);
    console.log("===================================");

    if(order.paymentMethod==="Wallet"&& order.paymentStatus==="Paid"){
      const refundAmount=Number(item.totalPrice)
        
      if(!refundAmount||refundAmount<=0){
        throw new Error("Invalid refund amount")
      }
      await walletService.refundToWallet({
        userId:order.userId,
        amount:refundAmount,
        orderId:order._id.toString(),
        itemId:item._id.toString(),
        productName:item.productName,
      })

       console.log("REFUND COMPLETED");
      item.refundStatus='Completed'
    }
    item.status="Cancelled"
    item.cancelledAt=new Date()

    await Product.updateOne({
      _id:item.productId,
      "variants.size":item.size
    },
    {
      $inc:{
        "variants.$.stock":item.quantity
      }
    }
  )
  }

  else if(status==="Returned"){

    if(item.refundStatus==='Completed'){
      item.status="Returned"

      if(!item.returnedAt){
        item.returnedAt=new Date()
      }
      order.orderStatus=calculateOrderStatus(order.items)
      await order.save()
      return order
    }
    const refundAmount=Number(item.totalPrice)

    if(!refundAmount||refundAmount<=0){
      throw new Error("Invalid refund amount")
    }
    await walletService.refundToWallet({
      userId:order.userId,
      amount:refundAmount,
      orderId:order._id.toString(),
      itemId: item._id.toString(),
      productName:item.productName,
    })

    item.status="Returned"
    item.returnedAt=new Date()
    item.refundStatus="Completed"

    await Product.updateOne(
      {
        _id:item.productId,
        "variants.size":item.size
      },
      {
        $inc:{
          "variants.$.stock":item.quantity
        }
      }
    )

  }else{

  item.status = status
  if (status === "Cancelled") {
    item.cancelledAt = new Date();
  }
}


order.orderStatus = calculateOrderStatus(order.items);
  await order.save();

  return order
}

export const delivery=async(orderId)=>{
  const product=await Order.findById(orderId)

  if(ORDER_STATUSES.includes("Delivery")){
    
  }
}