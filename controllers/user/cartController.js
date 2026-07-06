import * as cartService from "../../services/user/cartService.js";

export const loadCart = async (req, res) => {
  
  try {
    const data=await cartService.getCart(req.session.user)

    res.render("user/product/cartPage",data)
    
  } catch (error) {
    console.log(error);
    res.redirect("/user/homepage");
  }
};

export const addToCart = async (req, res) => {
  
  try {
    const cartCount=await cartService.addItemToCart(
      req.session.user,
      req.params.id,
      req.body.size
    )
    res.json({
      success:true,
      message:"Added to Cart",
      cartCount,
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message:error.message, });
  }
}

export const updateCartQuantity = async (req, res) => {
  try {
     const result =
      await cartService.updateQuantity(
        req.session.user,
        req.body
      );

    res.json({
      success: true,
      quantity: result.quantity,
      message: result.message,
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });

  }

}

export const removeCartItem = async (req, res) => {
   try {

    const cartCount =
      await cartService.removeItem(
        req.session.user,
        req.body.productId,
        req.body.size
      );

    res.json({
      success: true,
      cartCount,
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });

  }

}

export const addAllToCart=async(req,res) => {

  try {

    await cartService.moveWishlistToCart(
      req.session.user
    );

    res.json({
      success: true,
      message: "All items moved to cart",
    });

  } catch (error) {

    console.log(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });

  }

}

export const getCartCount=async(req,res) => {

  try {

    const count =
      await cartService.getCartItemCount(
        req.session.user
      );

    res.json({
      success: true,
      count,
    });

  } catch (error) {

    console.log(error);

    res.json({
      success: false,
      count: 0,
    });

  }

}



