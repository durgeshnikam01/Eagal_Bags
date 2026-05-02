import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import orderRoutes from "./routes/orderRoutes.js";

// load env first
dotenv.config();

const app = express();

// 🔥 CONNECT DATABASE
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// health route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "ERP Backend Running 🚀",
        status: "OK"
    });
});

// routes
app.use("/api/orders", orderRoutes);

// ❌ handle unknown routes (important for production)
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// ❌ global error handler
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
});

// server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});