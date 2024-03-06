const express = require("express");
const app = express();
require("dotenv").config();
const productsRoutes=require('./routes/productsRoutes');


const PORT = process.env.PORT || 3000;
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/",productsRoutes);

require("./config/database").connect();





app.listen(PORT, () => {
  console.log(`Server is running at ${PORT} port`);
});
