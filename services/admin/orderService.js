import mongoose from "mongoose";
import Order from "../../models/orderModel.js";

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

export const getOrders = async (page, limit, { search = "", status = "", sort } = {}) => {

  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 10;
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

  if (search.trim()) {

    const regex = new RegExp(search.trim(), "i");

    match.$or = [
      { orderId: regex },
      { "user.firstName": regex },
      { "user.lastName": regex },
      { "user.email": regex },
      { "address.name": regex },
    ];
  }

  if (Object.keys(match).length) {
    pipeline.push({ $match: match });
  }

  let sortOption = { createdAt: -1 };

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
      sortOption = { createdAt: -1 };
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

  const totalOrders = result[0].total[0]?.count || 0;
  const totalPages = Math.ceil(totalOrders / perPage);

  return {
    orders,
    totalOrders,
    totalPages,
    currentPage,
    search,
    status,
    sort,
  };
};

export const getOrderDetails = async (id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Order Id");
  }

  const order = await Order.findById(id)
    .populate("userId", "firstName lastName email phone")
    .populate("items.productId", "productName")
    .populate("items.variantId")
    .lean();

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};

export const changeOrderStatus = async (id, status) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Order Id");
  }

  if (!ORDER_STATUSES.includes(status)) {
    throw new Error("Invalid Order Status");
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new Error("Order not found");
  }

  order.orderStatus = status;

  if (["Delivered", "Cancelled"].includes(status)) {

    order.items.forEach(item => {

      if (!["Cancelled", "Returned", "Return Requested"].includes(item.status)) {
        item.status = status;
      }

    });

  }

  await order.save();

  return order;
};

export { ORDER_STATUSES };