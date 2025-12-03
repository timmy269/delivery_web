import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import cartRouter from "./routes/cartRouter.js"
import orderRouter from "./routes/orderRoute.js"
import promoRouter from "./routes/promoRoutes.js"
import driverRoutes from "./routes/driverRoutes.js";
import driverOrderRoutes from "./routes/driverOrderRoutes.js";
import driverWalletRoutes from "./routes/driverwalletRoutes.js";
import "dotenv/config.js"

// app config
const app = express();
const port = 4000;

// middleware
app.use(express.json());
app.use(cors());


//db connect
connectDB();

//api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/user", userRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)
app.use("/api/promo", promoRouter)
app.use("/api/driver", driverRoutes);
app.use("/api/driver", driverOrderRoutes);
app.use("/api/driver", driverWalletRoutes);


app.get("/", (req, res) => {
  res.send("API working");
})

app.listen(port, () => {
  console.log(`server chay tai http://localhost:${port}`);
})