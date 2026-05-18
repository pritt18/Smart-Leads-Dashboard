import express, {
  Application,
  Request,
  Response,
} from "express";

import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db";

import authRoutes from "./routes/authRoutes";
import testRoutes from "./routes/testRoutes";
import leadRoutes from "./routes/leadRoutes";

dotenv.config();

connectDB();

const app: Application = express();

app.use(cors());

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("API Running Successfully");
});

app.use("/api/auth", authRoutes);

app.use("/api/test", testRoutes);

app.use("/api/leads", leadRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});