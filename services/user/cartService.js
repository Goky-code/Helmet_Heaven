import Cart from "../../models/cartModel.js";
import Product from "../../models/productModel.js";
import Wishlist from "../../models/wishlistModel.js";

const isItemUnavailable=(product,size)=>{
  if(!product)
    return true
  if(product.isBlocked||product.isDeleted)
    return true
  if(!product.category||!product.category.isListed||product.category.isDeleted)
    return true
  if(!product.brand||!product.brand.isListed||product.category.isDeleted)
    return true

  const variant=product.variants.find(v=>v.size===size)
  if(!variant||variant.status!=="ACTIVE")
    return true

  return false
}


export const getCart=async(userId)=>{
    let cart=await Cart.findOne({userId})
   .populate({
      path: "items.productId",
      populate: [
        { path: "category" },
        { path: "brand" },
      ],
    })

    if(cart){
        const before=cart.items.length
        cart.items=cart.items.filter(item=>!!item.productId)

        if(before!==cart.items.length){
            await cart.save()
        }
    }
    const cartCount=cart?cart.items.reduce((sum,item)=>{
        const product=item.productId
        if(isItemUnavailable(product,item.size))
        return sum
      
        return sum+item.quantity
    },0) :0

    const wishlist=await Wishlist.findOne({userId})
    .populate({
      path: "products.productId",
      populate: [
        { path: "category" },
        { path: "brand" },
      ],
    })

    const wishlistCount=wishlist?wishlist.products.reduce((sum,item)=>{
       return isItemUnavailable(item.productId,item.size)?sum:sum+1
    },0):0

    return{
        cart:cart||{items:[]},
        cartCount,
        wishlistCount,
    }
}

export const addItemToCart = async (userId, productId, size, quantity = 1) => {
    if (!size) {
        throw new Error("please select a size");
    }

    const qty = parseInt(quantity);
    if (!qty || qty < 1) {
        throw new Error("Invalid quantity");
    }

    const product = await Product.findById(productId)
        .populate("category")
        .populate("brand");

    if (!product) throw new Error("Product not found");
    if (product.isBlocked || product.isDeleted) throw new Error("product unavailable");
    if (!product.category || !product.category.isListed || product.category.isDeleted) {
        throw new Error("product unavailable");
    }
    if (!product.brand || !product.brand.isListed || product.category.isDeleted) {
        throw new Error("product Unavailable");
    }

    const variant = product.variants.find(
        v => v.size === size && v.status === "ACTIVE"
    );
    if (!variant || variant.stock <= 0) {
        throw new Error("Out of stock");
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = new Cart({
            userId,
            items: [{ productId, size, quantity: qty }],  
        });
    } else {
        cart.items = cart.items.filter(item => item.size);
        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId && item.size === size
        );

        if (itemIndex > -1) {
            const currentQty = cart.items[itemIndex].quantity;
            const newQty = currentQty + qty;              

            if (newQty > 5) {
                throw new Error("Maximum 5 quantity allowed in cart");
            }
            if (newQty > variant.stock) {
                throw new Error("Stock limit exceeded");
            }

            cart.items[itemIndex].quantity = newQty;
        } else {
            if (qty > 5) {
                throw new Error("Maximum 5 quantity allowed in cart");
            }
            if (qty > variant.stock) {
                throw new Error("Stock limit exceeded");
            }
            cart.items.push({ productId, size, quantity: qty });
        }
    }

    await Wishlist.updateOne({ userId }, { $pull: { products: { productId } } })
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

  const product = await Product.findById(productId)
    .populate("category")
    .populate("brand");

  if (!product) {
    throw new Error("Product not found");
  }

  const item = cart.items.find(
    item =>
      item.productId.toString() === productId &&
      item.size === size
  )

  if (!item) {
    throw new Error("Item not found");
  }

   if (product.isBlocked || product.isDeleted || !product.category || !product.category.isListed || product.category.isDeleted ||
    !product.brand || !product.brand.isListed || product.brand.isDeleted
  ) {
    throw new Error("This product is no longer available");
  }

  const variant = product.variants.find(
    variant =>
      variant.size === size &&
      variant.status === "ACTIVE"
  );

  if (!variant || variant.status !== "ACTIVE") {
    throw new Error("This product is no longer available");
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
    .populate({ path: "products.productId", populate: [{ path: "category" }, { path: "brand" }] });

  if (!wishlist || wishlist.products.length === 0) {
    throw new Error("Wishlist is empty");
  }

  let cart = await Cart.findOne({ userId });
  if (!cart) cart = new Cart({ userId, items: [] });

  const remaining = [];  

  for (const item of wishlist.products) {
    const product = item.productId;
    const size = item.size;

    if (!product || !size) continue;
    if (isItemUnavailable(product, size)) {
      remaining.push(item);
      continue;
    }

    const variant = product.variants.find(v => v.size === size && v.status === "ACTIVE");

    if (!variant || variant.stock <= 0) {
      remaining.push(item);
      continue;
    }

    const existing = cart.items.find(
      ci => ci.productId.toString() === product._id.toString() && ci.size === size
    );

    if (existing) {
      const newQty = existing.quantity + 1;
      if (newQty <= 5 && newQty <= variant.stock) {
        existing.quantity = newQty;
      } else {
        remaining.push(item);
      }
    } else {
      cart.items.push({ productId: product._id, size, quantity: 1 });
    }
  }

  await cart.save();

  wishlist.products = remaining;  
  await wishlist.save();

  return true;
};

export const getCartItemCount = async (userId) => {

  if (!userId) {
    return 0;
  }

  const cart = await Cart.findOne({ userId })
    .populate({
      path: "items.productId",
      populate: [
        { path: "category" },
        { path: "brand" },
      ],
    })

  if (!cart) {
    return 0;
  }

  const count = cart.items.filter(item =>!isItemUnavailable(item.productId,item.size)).length;

  return count;
}