import Brand from "../models/brandModels.js";

export const getBrands=async(search,page,limit)=>{
    const skip=(page-1)*limit

    const searchQuery={
        isDeleted:false,
        name:{$regex:search,$options:"i"},
    }

    const totalBrands=await Brand.countDocuments(searchQuery)
    const totalPages=Math.ceil(totalBrands/limit)

    const brands=await Brand.find(searchQuery)
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit)

   return{
    brands,
    currentPage:page,
    totalPages,
    totalBrands,
    search,
    limit,
   }
}

export const createBrand=async({name,description,isListed})=>{
    if(!name||!name.trim()){
        throw new Error("Brand name is required")
    }
    const existingBrand=await Brand.findOne({
        name:{$regex:new RegExp(`^${name}$`,"i")},
        isDeleted:false,
    })
    if(existingBrand){
        throw new Error("Brand already Exists")
    }
     const brand=new Brand({
    name:name.trim(),
    description:description?.trim(),
    isListed,
    })
    await brand.save()

   return brand
}

export const getBrandById=async(id)=>{
    return await Brand.findById(id)
}

export const updateBrand=async(
    id,{name,description,isListed})=>{

        if(!name||!name.trim()){
            throw new Error("Brand name is required")
        }
        console.log("Editing ID:", id);
console.log("New Name:", name);

        const existingBrand=await Brand.findOne({
            _id:{$ne:id},
            name:{ $regex: new RegExp(`^${name.trim()}$`, "i")},
            isDeleted: false,
        })
        console.log("Existing Brand:", existingBrand);
        if(existingBrand){
            throw new Error("Brand already Exists")
        }
        return await Brand.findByIdAndUpdate(
            id,{
                name:name.trim(),
                description:description?.trim(),
                isListed,
            },
            {new:true}
        )
    }

 export const removeBrand=async(id)=>{
    return await Brand.findByIdAndUpdate(
        id,
        {isDeleted:true},
        {new:true}
    )
 }   

export const toggleBrandStatus=async(id)=>{
    const brand=await Brand .findById(id)

    if(!brand){
        throw new Error("Brand not found")
    }
        brand.isListed=!brand.isListed

        await brand.save()

        return brand

    
}