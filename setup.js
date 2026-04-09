const fs = require('fs');
const path = require('path');

const services = ['api-gateway', 'user-service', 'product-service', 'order-service', 'payment-service'];
const root = path.join(__dirname);

const commonDeps = {
  "cors": "^2.8.5",
  "dotenv": "^16.4.5",
  "express": "^4.19.2",
  "mongoose": "^8.3.0",
  "axios": "^1.6.8"
};

services.forEach(service => {
  const servicePath = path.join(root, service);
  
  if (!fs.existsSync(servicePath)) {
    fs.mkdirSync(servicePath);
  }

  const pkgJson = {
    name: service,
    version: "1.0.0",
    description: `${service} for E-commerce`,
    main: "server.js",
    scripts: {
      "start": "node server.js",
      "dev": "nodemon server.js"
    },
    dependencies: { ...commonDeps },
    devDependencies: {
      "nodemon": "^3.1.0"
    }
  };

  // adding specific dependencies
  if (service === 'api-gateway') {
    pkgJson.dependencies['http-proxy-middleware'] = "^3.0.0";
  }
  if (service === 'user-service') {
    pkgJson.dependencies['bcryptjs'] = "^2.4.3";
    pkgJson.dependencies['jsonwebtoken'] = "^9.0.2";
  }

  fs.writeFileSync(path.join(servicePath, 'package.json'), JSON.stringify(pkgJson, null, 2));

  // create basic folder structure
  const dirs = ['controllers', 'routes', 'models', 'config', 'middleware'];
  dirs.forEach(dir => {
    const dirPath = path.join(servicePath, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
  });

  // create empty app file to test
  fs.writeFileSync(path.join(servicePath, 'server.js'), `
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: '${service} is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`${service} running on port \${PORT}\`);
});
`);
});

console.log("Microservices basic structure created successfully.");
