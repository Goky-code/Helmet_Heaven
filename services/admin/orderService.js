import mongoose from "mongoose";
import Order from "../../models/orderModel.js";
import PDFDocument from "pdfkit"
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

const ADMIN_STATUS_TRANSITIONS = {
 "Pending": ["Processing", "Cancelled"],
  "Processing": ["Shipped", "Cancelled"],
  "Shipped": ["Out For Delivery"],
  "Out For Delivery": ["Delivered"],
 "Delivered": [],
  "Cancelled": [],
  "Return Requested": ["Returned"],
  "Returned": []
} 

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

  const match = {} 

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

  const activeItems = order.items.filter(
    item =>
      item.status !== "Cancelled" &&
      item.status !== "Returned"
  );

  // Active products subtotal
  const subtotal = activeItems.reduce(
    (sum, item) => {
      return sum + Number(item.totalPrice || 0);
    },
    0
  );

  // Tax - 8%
  const tax = Number((subtotal * 0.08).toFixed(2));

  // Shipping
  const shipping = activeItems.length > 0
    ? Number(order.shipping || 0)
    : 0;

  // Discount
  const discount = Number(order.discount || 0);

  // Prevent discount from making total negative
  const total = Math.max(
    0,
    Number(
      (subtotal + shipping + tax - discount).toFixed(2)
    )
  );

  // -----------------------------------------
  // SEND CALCULATED VALUES TO EJS
  // -----------------------------------------

  order.calculatedSummary = {
    subtotal,
    shipping,
    tax,
    discount,
    total
  };


  return order;
}

export const calculateOrderStatus = (items) => {

  if (!items || items.length === 0) {
        return "Pending";
    }

     const activeItems = items.filter(
        item => item.status !== "Cancelled"
    )

     if (activeItems.length === 0) {
        return "Cancelled";
    }


  const statuses = activeItems.map(item => item.status);

  if (statuses.every(status => status === "Returned")) {
    return "Returned";
  }

  if (statuses.some(status => status === "Return Requested")) {
    return "Return Requested";
  }

  if (
    statuses.every(status =>status===
      "Delivered"
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

  return "Pending"
}

export const recalculateOrderTotals=(order)=>{
  const activeItems=order.items.filter(item=>item.status!=="Cancelled"&&item.status!=="Returned")
  const subTotal=activeItems.reduce((sum,item)=>sum+Number(item.totalPrice||0),0)
  const tax=Number((subTotal*0.08).toFixed(2))
  const shipping=Number(order.shipping||0)
  const discount=Number(order.discount||0)

  const grandTotal=Number((subTotal+shipping+tax-discount).toFixed(2))
  order.subTotal=subTotal
  order.tax=tax
  order.grandTotal=grandTotal

  return order
}

const calculateItemRefundAmount=(order,item)=>{
  const activeItems=order.items.filter(existingItem=>existingItem.status!=="Cancelled"&&existingItem.status!=="Returned")
  const activeSubtotal=activeItems.reduce((sum,existingItem)=>sum+Number(existingItem.totalPrice||0),0)
  const orderTax=Number(order.tax||0)
  const itemPrice = Number(item.totalPrice || 0)

  if (activeSubtotal <= 0) {
    return Number(itemPrice.toFixed(2));
  }

  const itemTax = Number(
    (
      (itemPrice / activeSubtotal) *
      orderTax
    ).toFixed(2)
  )

  const refundAmount = Number(
    (itemPrice + itemTax).toFixed(2)
  )

  return refundAmount
}


export { ORDER_STATUSES };

export const updateOrderStatus=async(orderId,status)=>{

  if(!mongoose.Types.ObjectId.isValid(orderId)){
    throw new Error("Invalid Order Id")
  }

     if (!ORDER_STATUSES.includes(status)) {
        throw new Error("Invalid Order Status");
    }
  
  const order=await Order.findById(orderId)

  if(!order){
    throw new Error("order not found")
  }

  const allowedStatuses=ADMIN_STATUS_TRANSITIONS[order.orderStatus]||[]

  if(!allowedStatuses.includes(status)){
    throw new Error(`Cannot change order status from "${currentStatus}" to "${status}"`)
  }

  if(status==="Cancelled"){
    for(const item of order.items){
      if(item.status==="Cancelled"||item.status==="Returned"){
        continue
      }
      if(order.paymentMethod === "Wallet" &&
        order.paymentStatus === "Paid"){

          const refundAmount= calculateItemRefundAmount(order, item)

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

 else if (status==="Returned"){
      for(const item of order.items){
        if(item.status==="Cancelled"){
          continue
        }
        if(item.status!=="Return Requested"){
          continue
        }
        if(item.refundStatus!=="Completed"){
         const refundAmount= calculateItemRefundAmount(order, item)

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
        item.refundStatus = "Completed"
        }
     
      item.status = "Returned"
      item.returnedAt = new Date()
     
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
  else{

 for(const item of order.items){

  if(item.status==="Cancelled"){
    continue
  }

  if(item.status==="Return Requested"||item.status==="Returned"){
    continue
  }
    item.status=status
  }
}

order.orderStatus=calculateOrderStatus(order.items)

if(status==="Cancelled"){
  recalculateOrderTotals(order)
}
await order.save()

return order

}

export const changeOrderItemStatus = async (orderId, itemId, status) => {

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid Order Id");
  }
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    throw new Error("Invalid Item Id");
  }

  //   const allowedAdminStatuses = [
  //   "Pending",
  //   "Processing",
  //   "Shipped",
  //   "Out For Delivery",
  //   "Delivered",
  //   "Cancelled"
  // ]

  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid Item Status");
  }

  const order = await Order.findById(orderId);

 
  if (!order) {
    throw new Error("order not found");
  }

  const item = order.items.id(itemId);
  if (!item) {
    throw new Error("order item not found");
  }

   const allowedNextStatuses=ADMIN_STATUS_TRANSITIONS[item.status]||[]

  if(!allowedNextStatuses.includes(status)){
    throw  new Error(
            `Cannot change item status from "${item.status}" to "${status}"` )
  }


  if(status==="Cancelled"){

      

    await Product.updateOne(
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

    if(order.paymentMethod==="Wallet"&& order.paymentStatus==="Paid"){
      const refundAmount= calculateItemRefundAmount(order, item)
        
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

   
  }

  
   else if(status==="Returned"){
    
    const refundAmount= calculateItemRefundAmount(order, item)

    if(!refundAmount||refundAmount<=0){
      throw new Error("Invalid refund amount")
    }
      if (item.refundStatus !== "Completed") {
    await walletService.refundToWallet({
      userId:order.userId,
      amount:refundAmount,
      orderId:order._id.toString(),
      itemId: item._id.toString(),
      productName:item.productName,
    })

    
    item.refundStatus="Completed"
  }
    item.status="Returned"
    item.returnedAt=new Date()

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

   } else{

  item.status = status
 
}


order.orderStatus = calculateOrderStatus(order.items)


  await order.save();

return order
}

