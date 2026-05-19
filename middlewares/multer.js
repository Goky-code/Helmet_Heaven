import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "public/uploads/products");
  },

  filename: (req, file, cb) => {

    const uniqueName =
      uuidv4() + path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {

  const allowed = /jpg|jpeg|png|webp/;

  const isValid = allowed.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Only images allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter
});

export default upload;