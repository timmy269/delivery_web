import mongoose from "mongoose";

export const connectDB = async () => {
  mongoose.connect('mongodb://localhost:27017//food-delivery')
  .then(() => console.log("Connect successful"))
  .catch(err => console.error(err));
}
