import foodModel from "../models/foodModel.js";
import fs from 'fs'

const addFood = async (req, res) => {
    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        image: image_filename
    })

    try {
        await food.save();
        res.json({ success: true, message: "Food Added" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error" })
    }
}


const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods })
    } catch (error) {
        res.json({ success: false, message: "Error" })
    }
}

const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        fs.unlink(`uploads/${food.image}`, () => { })

        await foodModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Food Removed" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

const getFoodById = async (req, res) => {
    try {
        const foodId = req.params.id;
        const food = await foodModel
            .findById(foodId)
            .populate("category") 
            .exec();

        if (!food) {
            return res.status(404).json({ message: "Không tìm thấy món ăn" });
        }

        res.status(200).json({ success: true, data: food });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi server" });
    }
};

export { addFood, listFood, removeFood, getFoodById }