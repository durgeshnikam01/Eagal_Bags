import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import qcRoutes from './routes/qcRoutes.js';
import dispatchRoutes from './routes/dispatchRoutes.js';
import salesRoutes from './routes/salesRoutes.js';

// Load env vars
dotenv.config();

// 🔥 DEBUG: Check if env is loaded
console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded ✅" : "NOT FOUND ❌");

// Connect to database
connectDB();

const app = express();

// ✅ MANUAL CORS HANDLING (Must be first)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }
  next();
});

// Other Middlewares
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ✅ ROOT TEST ROUTE
app.get('/', (req, res) => {
  res.send('Backend is running...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/qc', qcRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/sales', salesRoutes);

app.get('/api', (req, res) => {
  res.send('API is running...');
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 🔥 FIXED FOR RENDER / CLOUD
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
