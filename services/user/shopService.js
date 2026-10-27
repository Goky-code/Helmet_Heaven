import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import Brand from "../../models/brandModels.js";
import Wishlist from "../../models/wishlistModel.js";

export const getShopProducts = async (query, userId) => {

  const {
    search = "",
    minPrice = "",
    maxPrice = "",
    sort = "",
    page = 1,
  } = query;

  const selectedCategories=[].concat(query.category||[])
  const selectedBrands=[].concat(query.brand||[])
  const selectedSizes=[].concat(query.size||[])

  const limit = 6;
  const currentPage = Math.max(1, Number(page));

  const dbFilter = {
    isDeleted: false,
  };

  if (search) {
    dbFilter.productName = {
      $regex: search,
      $options: "i",
    };
  }

  if (selectedCategories.length) {
    dbFilter.category = {$in:selectedCategories}
  }

  if (selectedBrands.length) {
    dbFilter.brand = {$in:selectedBrands}
  }

  const raw = await Product.find(dbFilter)
    .populate({
      path: "category",
      match: {
        isListed: true,
        isDeleted: false,
      },
    })
    .populate({
      path: "brand",
      match: {
        isListed: true,
        isDeleted: false,
      },
    })
    .lean();

  const minP = minPrice ? Number(minPrice) : null;
  const maxP = maxPrice ? Number(maxPrice) : null;

  const withVariant = raw.reduce((acc, product) => {

    if (!product.category || !product.brand) {
      return acc;
    }

    if (product.isBlocked||product.isDeleted){
      return acc
    }

    const activeVariants = product.variants.filter(
      variant => {

        if (variant.status !== "ACTIVE") {
          return false;
        }

       if(selectedSizes.length&!selectedSizes.includes(variant.size)){
                 return false;
        }

        if (minP && variant.price < minP) {
          return false;
        }

        if (maxP && variant.price > maxP) {
          return false;
        }

        return true;

      }
    );

    if (!activeVariants.length) {
      return acc;
    }
   
    const availableVariants=activeVariants.filter(v=>v.stock>0)
    
    const match =availableVariants.length>0
     ?availableVariants.sort((a,b)=>a.price-b.price)[0]
    : activeVariants.sort(
      (a, b) => a.price - b.price
    )[0];

    acc.push({
      product,
      variant: match,
      
    });

    return acc;

  }, []);

  withVariant.sort((a, b) => {

    switch (sort) {

      case "low-high":
        return a.variant.price - b.variant.price;

      case "high-low":
        return b.variant.price - a.variant.price;

      case "a-z":
        return a.product.productName.localeCompare(
          b.product.productName
        );

      case "z-a":
        return b.product.productName.localeCompare(
          a.product.productName
        );

      default:
        return (
          new Date(b.product.createdAt) -
          new Date(a.product.createdAt)
        );

    }

  });

  const totalPages = Math.ceil(
    withVariant.length / limit
  );

  const safePage = Math.min(
    currentPage,
    Math.max(1, totalPages)
  );

  const skip = (safePage - 1) * limit;

  const pageItems = withVariant.slice(
    skip,
    skip + limit
  );

  const products = pageItems.map(
    ({ product, variant }) => ({
      ...product,
      _activeVariant: variant,
     
    })
  );

  const [categories, brands] =
    await Promise.all([
      Category.find({
        isListed: true,
        isDeleted: false,
      }),
      Brand.find({
        isListed: true,
        isDeleted: false,
      }),
    ]);

  let wishlistedProductIds = [];

  if (userId) {

    const wishlist =
      await Wishlist.findOne({ userId }).lean();

    if (wishlist?.products?.length) {

      wishlistedProductIds = [
        ...new Set(
          wishlist.products.map(
            item => item.productId.toString()
          )
        ),
      ];

    }

  }
  

  return {
    products,
    categories,
    brands,
    currentPage: safePage,
    totalPages,
    search,
    selectedCategories,
    selectedBrands,
    selectedSizes,
    minPrice,
    maxPrice,
    sort,
    wishlistedProductIds,
  };

}