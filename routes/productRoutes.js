import express from 'express'
import upload from '../middlewares/multer.js'
import{loadProducts,loadAddProduct,addProduct,loadEditProduct,editProduct,deleteProduct,addVariant,
  getVariants,
  deleteVariant,
  changeVariantStatus,updateVariant} from "../controllers/productController.js"
const router = express.Router()

router.get('/products',loadProducts)
router.get("/add-product",loadAddProduct)
router.post('/add-product',upload.array('images',10),addProduct)

router.get('/edit-product/:id',loadEditProduct)

router.post('/edit-product/:id',upload.array('images',10),editProduct)

router.patch("/delete-product/:id", deleteProduct);


router.get("/product/:id/variants", getVariants)
router.post("/product/:id/variant", addVariant)
router.delete("/product/:productId/variant/:variantId", deleteVariant)
router.patch("/product/:productId/variant/:variantId/status", changeVariantStatus)
router.put("/product/:productId/variant/:variantId", updateVariant);



export default router;
    