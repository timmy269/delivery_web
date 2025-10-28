import foodModel from "../models/foodModel.js";

// add food item
const addFood = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);
  try {
    const image_filename = req.file ? req.file.filename : null;

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: image_filename
    });

  const savedFood = await food.save();
  // return saved document so frontend can know filename / id
  res.json({ success: true, message: "Food added successfully!", food: savedFood });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export { addFood };
