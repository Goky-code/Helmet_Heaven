import Cart from "../../models/cartModel.js";
import Product from "../../models/productModel.js";
import Wishlist from "../../models/wishlistModel.js";

export const getCart=async(userId)=>{
    let cart=await Cart.findOne({userId})
    .populate("items.productId")

    if(cart){
        const before=cart.items.length
        cart.items=cart.items.filter(
            item=>item.productId!==null
        )
        if(before!==cart.items.length){
            await cart.save()
        }
    }
    const cartCount=cart?cart.items.reduce((sum,item)=>{
        const product=item.productId
        if(!product||product.isBlocked||product.isDeleted){
            return sum
        }
        return sum+item.quantity
    },0) :0

    const wishlist=await Wishlist.findOne({userId})
    .populate("products.productId")

    const wishlistCount=wishlist?wishlist.products.reduce((sum,item)=>{
        const product=item.productId

        if(!product||product.isBlocked||product.isDeleted){
            return sum
        }
        return sum+1
    },0):0

    return{
        cart:cart||{items:[]},
        cartCount,
        wishlistCount,
    }
}

export const addItemToCart=async(userId,productId,size)=>{
    if(!size){
        throw new Error("please select a size")
    }
    const product=await Product.findById(productId)

    if(!product){
        throw new Error("Product not found")
    }
    if(product.isBlocked||product.isDeleted){
        throw new Error("product unavailable")
    }
    const variant=product.variants.find(
        variant=>variant.size===size&&variant.status==="ACTIVE"
    )
    if(!variant||variant.stock<=0){
        throw new Error("Out of stock")
    }
    let cart=await Cart.findOne({userId})
    if(!cart){
        cart=new Cart({
            userId,
            items:[
                {
                productId,
                size,
                quantity:1,
            },
        ],
        })
    }else{
        cart.items=cart.items.filter(item=>item.size)
    const itemIndex = cart.items.findIndex(
      item =>
        item.productId.toString() === productId &&
        item.size === size
    );

    if (itemIndex > -1) {

      const currentQty =
        cart.items[itemIndex].quantity;

      if (currentQty >= 5) {
        throw new Error(
          "Maximum 5 quantity allowed"
        );
      }

      if (currentQty + 1 > variant.stock) {
        throw new Error(
          "Stock limit exceeded"
        );
      }

      cart.items[itemIndex].quantity++;

    } else {

      cart.items.push({
        productId,
        size,
        quantity: 1,
      });

    }

  }

  await Wishlist.updateOne(
    { userId },
    {
      $pull: {
        products: {
          productId,
        },
      },
    }
  );

  await cart.save()

  return cart.items.length
}

export const updateQuantity = async (
  userId,
  { productId, size, count }
) => {

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const item = cart.items.find(
    item =>
      item.productId.toString() === productId &&
      item.size === size
  );

  if (!item) {
    throw new Error("Item not found");
  }

  const variant = product.variants.find(
    variant =>
      variant.size === size &&
      variant.status === "ACTIVE"
  );

  if (!variant) {
    throw new Error("Variant not found");
  }

  const newQty = item.quantity + Number(count);

  if (variant.stock === 0) {
    return {
      quantity: 0,
      message: "This item is out of stock",
    };
  }

  if (newQty < 1) {
    throw new Error("Minimum quantity is 1");
  }

  if (newQty > 5) {
    throw new Error("Maximum quantity is 5");
  }

  if (
    Number(count) > 0 &&
    newQty > variant.stock
  ) {
    throw new Error(
      `Only ${variant.stock} item(s) in stock`
    );
  }

  item.quantity = newQty;

  await cart.save();

  return {
    quantity: item.quantity,
  };
};

export const removeItem = async (
  userId,
  productId,
  size
) => {

  await Cart.updateOne(
    { userId },
    {
      $pull: {
        items: {
          productId,
          size,
        },
      },
    }
  );

  const cart = await Cart.findOne({ userId });

  return cart
    ? cart.items.length
    : 0;
}

export const moveWishlistToCart = async (userId) => {

  const wishlist = await Wishlist.findOne({ userId })
    .populate("products.productId");

  if (!wishlist || wishlist.products.length === 0) {
    throw new Error("Wishlist is empty");
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({
      userId,
      items: [],
    });
  }

  for (const item of wishlist.products) {

    const product = item.productId;
    const size = item.size;

    if (!product || !size) continue;

    if (product.isBlocked || product.isDeleted) continue;

    const variant = product.variants.find(
      variant =>
        variant.size === size &&
        variant.status === "ACTIVE"
    );

    if (!variant || variant.stock <= 0) continue;

    const existing = cart.items.find(
      cartItem =>
        cartItem.productId.toString() ===
          product._id.toString() &&
        cartItem.size === size
    );

    if (existing) {

      const newQty = existing.quantity + 1;

      if (
        newQty <= 5 &&
        newQty <= variant.stock
      ) {
        existing.quantity = newQty;
      }

    } else {

      cart.items.push({
        productId: product._id,
        size,
        quantity: 1,
      });

    }

  }

  await cart.save();

  wishlist.products = [];

  await wishlist.save();

  return true;
};

export const getCartItemCount = async (userId) => {

  if (!userId) {
    return 0;
  }

  const cart = await Cart.findOne({ userId })
    .populate("items.productId");

  if (!cart) {
    return 0;
  }

  const count = cart.items.filter(item => {

    const product = item.productId;

    return (
      product &&
      !product.isBlocked &&
      !product.isDeleted
    );

  }).length;

  return count;
};