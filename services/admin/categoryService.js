import Category from "../../models/categoryModel.js";

export const getCategories=async(search,page,limit)=>{
    const skip=(page-1)*limit

    const searchQuery={
        isDeleted:false,
        name:{$regex:search,$options:"i"}
    }

const totalCategories=await Category.countDocuments(searchQuery)
const totalPages=Math.ceil(totalCategories/limit)

const categories=await Category.find(searchQuery)
.sort({createdAt:-1})
.skip(skip)
.limit(limit)

return{
    categories,
    currentPage:page,
    totalPages,
    totalCategories,
    search,
    limit,
}
}

export const createCategory=async({name,description,isListed})=>{
    if(!name|| !name.trim()){
        throw new Error("Category name is required")
    }
    const existingCategory=await Category.findOne({
        name:{$regex:new RegExp(`^${name}$`,"i")},
    })
    if(existingCategory){
        throw new Error("Category already exists")
    }
   const category=new Category({
    name:name.trim(),
    description:description?.trim(),
    isListed,
   })

   await category.save()

   return category
}

export const getCategoryById=async(id)=>{
    return await Category.findById(id)
}

export const updateCategory=async(id,{name,description,isListed})=>{
    if(!name||!name.trim()){
        throw new Error("Category name is required")
    }
    const existingCategory=await Category.findOne({
        _id:{$ne:id},
        name:{$regex:new RegExp(`^${name}$`,"i")},
    })

    if(existingCategory){
        throw new Error("Category already Exists")
    }
    return await Category.findByIdAndUpdate(
        id,
        {name:name.trim(),
          description:description?.trim(),
          isListed,  
        },
        {new:true}
    )
}

export const removeCategory=async(id)=>{
    return await Category.findByIdAndUpdate(
        id,
        {isDeleted:true},
        {new:true}
    )
}

export const toggleCategoryStatus=async(id)=>{
    const category=await Category.findById(id)

    if(!category){
        throw new Error("category not found")
    }
    category.isListed=!category.isListed

    await category.save()

    return category
}