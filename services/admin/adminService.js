import passport from "passport"
import User from "../../models/userModels.js"
import Order from "../../models/orderModel.js";

const TZ = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

export const loginAdmin=async(email,password)=>{
    if(!email||!password){
        throw new Error("Email and password are required")
    }
    if(email!==process.env.ADMIN_EMAIL){
        throw new Error("Invalid email address")
    }
    if(password!==process.env.ADMIN_PASSWORD){
        throw new Error("Invalid password")
    }
    return true
}

export const getCustomers=async(page,limit,search,status,sort)=>{

    const skip=(page-1)*limit
    const conditions=[]

    if(status==="active"){
        conditions.push({isBlocked:false})
    }
    if(status==="blocked"){
        conditions.push({isBlocked:true})
    }
   
    if(search){
        conditions.push({
            $or:[
               {firstName:{$regex:search,$options:"i"}},
               {lastName:{$regex:search,$options:"i"}} ,
               {email:{$regex:search,$options:"i"}},
               {phone:{$regex:search,$options:"i"}},
            ],
        })
    }

    const filter=conditions.length>0?{$and:conditions}:{}
    const totalUsers=await User.countDocuments(filter)

    const users=await User.find(filter)
    .skip(skip)
    .limit(limit)
   .sort({isBlocked:1})

    const totalPages=Math.ceil(totalUsers/limit)

    return{
        users,
        currentPage:page,
        totalPages,
        totalUsers,
         status,
        search,
        sort,
    }
}

export const changeUserStatus=async(userId)=>{
    const user=await User.findById(userId)

    if(!user){
        throw new Error("user not found")
    }
    user.isBlocked=!user.isBlocked
    await user.save()

    return user
}

const normalizeOrder = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const names = items
    .map((i) => i.productName || i.name || i.title)
    .filter(Boolean);

  let itemsLabel = "—";
  if (names.length === 1) itemsLabel = names[0];
  if (names.length > 1) itemsLabel = `${names[0]} +${names.length - 1} more`;
  if (names.length === 0 && items.length > 0) itemsLabel = `${items.length} item(s)`;

  const user = order.userId || {};
  const customerName =
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email ||
    "Guest";

  return {
    id: order.orderId || String(order._id).slice(-6).toUpperCase(),
    items: itemsLabel,
    customer: customerName,
    status: order.orderStatus || "Pending",
    total: order.finalAmount ?? order.totalAmount ?? 0,
  };
};

const buildMonthly = (monthlySales) => {
  const labels = [];
  const values = [];

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  const curYear = Number(parts.find((p) => p.type === "year").value);
  const curMonth = Number(parts.find((p) => p.type === "month").value);

  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonth - 1 - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    const record = monthlySales.find(
      (r) => r._id.year === year && r._id.month === month
    );

    labels.push(d.toLocaleString("en-IN", { month: "short" }).toUpperCase());
    values.push(record?.revenue || 0);
  }
  return { labels, values };
}

const buildWeekly = (weeklySales) => {
  const labels = [];
  const values = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const key = d.toLocaleDateString("en-CA", { timeZone: TZ });
    const record = weeklySales.find((r) => r._id === key);

    labels.push(
      d.toLocaleDateString("en-IN", { weekday: "short", timeZone: TZ }).toUpperCase()
    );
    values.push(record?.revenue || 0);
  }
  return { labels, values };
}

export const getDashboardData=async()=>{

    const deliveredItems = [
    { $unwind: "$items" },
    { $match: { "items.status": "Delivered" } },
  ]

    const[
        totalOrders,
        newOrders,
        deliveredOrders,
         cancelledOrders,
         totalCustomers,
         recentOrdersRaw,
          monthlySales,
          weeklySales,
    ]=await Promise.all([
       Order.countDocuments(),
       Order.countDocuments({
         orderStatus:"Pending"
       }), 
       Order.countDocuments({
      orderStatus: "Delivered"
    }),

    Order.countDocuments({
      orderStatus: "Cancelled"
    }),
    User.countDocuments(),

    Order.find()
    .sort({createdAt:-1})
    .limit(5)
    .populate("userId", "firstName lastName email")
    .lean(),

     Order.aggregate([
      ...deliveredItems,
      {
        $group: {
          _id: {
            year: { $year: { date: "$createdAt", timezone: TZ } },
            month: { $month: { date: "$createdAt", timezone: TZ } },
          },
          revenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]),

   Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 8 * DAY_MS) } } },
      ...deliveredItems,
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: TZ },
          },
          revenue: { $sum: "$items.totalPrice" },
        },
      },
    ]),
  ])

  const totalSales=monthlySales.reduce((sum, r) => sum + (r.revenue || 0), 0)

 const month = buildMonthly(monthlySales);
  const week = buildWeekly(weeklySales);
 
  
  return {
    totalSales,
    totalOrders,
    newOrders,
    deliveredOrders,
    cancelledOrders,
    totalCustomers,
   recentOrders: recentOrdersRaw.map(normalizeOrder),
    monthLabels: month.labels,
    monthValues: month.values,
    weekLabels: week.labels,
    weekValues: week.values,
  }
}