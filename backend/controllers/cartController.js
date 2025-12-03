import userModel from "../models/userModel.js"

//add items to user cart
const addToCart = async (req, res) => {
  try {
    const { itemId, quantity = 1 } = req.body; 

    let userData = await userModel.findById(req.userId);
    let cartData = userData.cartData || {};

    if (!cartData[itemId]) {
      cartData[itemId] = quantity;
    } else {
      cartData[itemId] += quantity;
    }

    await userModel.findByIdAndUpdate(req.userId, { cartData });

    res.json({ success: true, message: "Added to cart" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};


//remove items from user cart
const removeFromCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.userId);
    let cartData = await userData.cartData;
    if (cartData[req.body.itemId] > 0) {
      cartData[req.body.itemId] -= 1;
    }
    await userModel.findByIdAndUpdate(req.userId, { cartData });
    res.json({ success: true, message: "Removed from cart" })
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" })

  }

}
// fetch user cart data
const getCart = async (req, res) => {
  try {
    let userData = await userModel.findById(req.userId);
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, cartData: userData.cartData })
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" })
  }
}
export { addToCart, removeFromCart, getCart }