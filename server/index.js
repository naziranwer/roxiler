const express = require("express");
const app = express();
require("dotenv").config();
const Products = require("./models/productsModel");
const productsRoutes = require("./routes/productsRoutes");

const PORT = process.env.PORT || 3000;
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", productsRoutes);

require("./config/database").connect();

app.get("/pro", async (req, res) => {
  try {
    const allProducts = await Products.find();

    res.json(allProducts);
  } catch (error) {
    // Handle errors
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/products", async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    // Search parameter
    const search = req.query.search || "";

    // MongoDB query object to match search text on title, description, and price
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            // { price: { $regex: search, $options: 'i' } }
          ],
        }
      : {};

    // Fetch products based on search and pagination
    console.log("query parameter", query);
    const products = await Products.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    // Count total number of products for pagination
    const totalProducts = await Products.countDocuments(query);

    // Send response with products and pagination metadata
    res.json({
      products,
      pagination: {
        page,
        perPage,
        totalPages: Math.ceil(totalProducts / perPage),
        totalProducts,
      },
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.listen(PORT, () => {
  console.log(`Server is running at ${PORT} port`);
});
