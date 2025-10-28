import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"

// app config
const app = express();
const port = 4000;

//middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

//db connect
connectDB();

//api endpoints
app.use("/api/food", foodRouter);

app.get("/", (req, res) => {
  res.send("API working");
})

app.listen(port, () => {
  console.log(`server chay tai http://localhost:${port}`);
})