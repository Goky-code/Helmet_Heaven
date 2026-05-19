import express from 'express'
import upload from '../middlewares/multer.js'
import{loadProducts,loadAddProduct,addProduct,loadEditProduct,editProduct,deleteProduct} from "../controllers/productController.js"
const router = express.Router()

router.get('/products',loadProducts)
router.get("/add-product",loadAddProduct)
router.post('/add-product',upload.array('productImages',10),addProduct)

router.get('/edit-product/:id',loadEditProduct)

router.post('/edit-product/:id',upload.array('productImages',10),editProduct)

router.patch("/delete-product/:id", deleteProduct);

export default router;
    