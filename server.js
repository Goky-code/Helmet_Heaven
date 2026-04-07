const app = require("./app");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB Connected");
    app.listen(3000, () => console.log("Server running"));
  })
  .catch(err => console.log(err));

  
  