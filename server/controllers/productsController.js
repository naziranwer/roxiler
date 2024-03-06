const axios = require('axios');
const Products = require('../models/productsModel');

exports.initializeDatabase = async (req, res) => {
  try {
    // Fetch data from third-party API
    const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
    const products = response.data; 

    // Initialize database with seed data
    await Products.insertMany(products);
    
    res.json({ message: 'Database initialized with seed data' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
};


exports.listTransactions = async (req, res) => {
  try {
    const { month, search = '', page = 1, perPage = 10 } = req.query;

    // Validate the format of the provided month
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      throw new Error('Invalid month format. Please provide a valid month in the format "YYYY-MM".');
    }

    // Query to find transactions for the given month
    const transactions = await Products.find({
      // Extract the year and month from dateOfSale and compare with the provided month
      'dateOfSale': {
        '$expr': {
          '$eq': [
            { '$dateToString': { 'format': '%Y-%m', 'date': '$dateOfSale' } },
            month
          ]
        }
      },
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { price: parseFloat(search) || 0 } // Parse search string to float
      ]
    })
    .skip((page - 1) * perPage)
    .limit(perPage);

    res.json(transactions);
  } catch (error) {
    console.error('Error listing transactions:', error);
    res.status(400).json({ error: 'Failed to list transactions' });
  }
}; 

exports.getStatistics = async (req, res) => {
    try {
      const { month } = req.query;
  
      const totalSaleAmount = await Products.aggregate([
        {
          $match: { dateOfSale: { $regex: new RegExp(month, 'i') } }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$price" }
          }
        }
      ]);
  
      const totalSoldItems = await Products.countDocuments({
        dateOfSale: { $regex: new RegExp(month, 'i') },
        sold: true
      });
  
      const totalNotSoldItems = await Products.countDocuments({
        dateOfSale: { $regex: new RegExp(month, 'i') },
        sold: false
      });
  
      res.json({
        totalSaleAmount: totalSaleAmount.length > 0 ? totalSaleAmount[0].totalAmount : 0,
        totalSoldItems,
        totalNotSoldItems
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  };



exports.getBarChartData = async (req, res) => {
    try {
      const { month } = req.query;
  
      const priceRanges = [
        { min: 0, max: 100 },
        { min: 101, max: 200 },
        // Add more price ranges as needed
      ];
  
      const barChartData = [];
  
      for (const range of priceRanges) {
        const count = await Products.countDocuments({
          dateOfSale: { $regex: new RegExp(month, 'i') },
          price: { $gte: range.min, $lte: range.max }
        });
  
        barChartData.push({
          priceRange: `${range.min} - ${range.max}`,
          count
        });
      }
  
      res.json(barChartData);
    } catch (error) {
      console.error('Error getting bar chart data:', error);
      res.status(500).json({ error: 'Failed to get bar chart data' });
    }
  };



exports.getPieChartData = async (req, res) => {
    try {
      const { month } = req.query;
  
      const uniqueCategories = await Products.distinct('category', {
        dateOfSale: { $regex: new RegExp(month, 'i') }
      });
  
      const pieChartData = [];
  
      for (const category of uniqueCategories) {
        const count = await Products.countDocuments({
          dateOfSale: { $regex: new RegExp(month, 'i') },
          category
        });
  
        pieChartData.push({
          category,
          count
        });
      }
  
      res.json(pieChartData);
    } catch (error) {
      console.error('Error getting pie chart data:', error);
      res.status(500).json({ error: 'Failed to get pie chart data' });
    }
  };

  
// productsController.js

exports.getCombinedData = async (req, res) => {
    try {
      const { month } = req.query;
  
      const statistics = await getStatistics(req, res);
      const barChartData = await getBarChartData(req, res);
      const pieChartData = await getPieChartData(req, res);
  
      res.json({
        statistics,
        barChartData,
        pieChartData
      });
    } catch (error) {
      console.error('Error getting combined data:', error);
      res.status(500).json({ error: 'Failed to get combined data' });
    }
  };
  
  
  
  
