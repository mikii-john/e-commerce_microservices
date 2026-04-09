const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../backend');
const targetBaseDir = path.join(__dirname);

const copyFile = (sourceRelative, targetService, targetRelative) => {
  const sourcePath = path.join(sourceDir, sourceRelative);
  const targetPath = path.join(targetBaseDir, targetService, targetRelative);
  
  if (fs.existsSync(sourcePath)) {
    // ensure dir exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Copied ${sourceRelative} to ${targetService}/${targetRelative}`);
  } else {
    console.warn(`Source file not found: ${sourcePath}`);
  }
};

// User Service
['controllers/authController.js', 'controllers/adminController.js', 'controllers/staffController.js'].forEach(f => copyFile(f, 'user-service', f));
['routes/authRoutes.js', 'routes/adminRoutes.js', 'routes/staffRoutes.js'].forEach(f => copyFile(f, 'user-service', f));
['models/User.js'].forEach(f => copyFile(f, 'user-service', f));
['middleware/authMiddleware.js'].forEach(f => copyFile(f, 'user-service', f));
['.env'].forEach(f => copyFile(f, 'user-service', f));

// Product Service
['controllers/productController.js'].forEach(f => copyFile(f, 'product-service', f));
['routes/productRoutes.js'].forEach(f => copyFile(f, 'product-service', f));
['models/Product.js'].forEach(f => copyFile(f, 'product-service', f));
['middleware/authMiddleware.js'].forEach(f => copyFile(f, 'product-service', f));
['.env'].forEach(f => copyFile(f, 'product-service', f));

// Order Service
['controllers/orderController.js', 'controllers/disputeController.js'].forEach(f => copyFile(f, 'order-service', f));
['routes/orderRoutes.js', 'routes/disputeRoutes.js'].forEach(f => copyFile(f, 'order-service', f));
['models/Order.js', 'models/Dispute.js', 'models/Shipment.js'].forEach(f => copyFile(f, 'order-service', f));
['middleware/authMiddleware.js'].forEach(f => copyFile(f, 'order-service', f));
['.env'].forEach(f => copyFile(f, 'order-service', f));

// Payment Service
['controllers/paymentController.js'].forEach(f => copyFile(f, 'payment-service', f));
['routes/paymentRoutes.js'].forEach(f => copyFile(f, 'payment-service', f));
['models/Payment.js'].forEach(f => copyFile(f, 'payment-service', f));
['middleware/authMiddleware.js'].forEach(f => copyFile(f, 'payment-service', f));
['.env'].forEach(f => copyFile(f, 'payment-service', f));

console.log("Files copied successfully");
