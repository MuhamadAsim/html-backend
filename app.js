import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./utils/connect_db.js";
import emailRoutes from "./routes/emailRoutes.js";
import sendgridWebhook from "./routes/sendgridWebhook.js";
import authRoutes from "./routes/authRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());

// Increase request size limit to 3MB
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ limit: "3mb", extended: true }));

app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/sendgrid", sendgridWebhook);
app.use('/api/templates', templateRoutes);


// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;
