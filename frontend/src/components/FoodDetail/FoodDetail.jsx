import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./FoodDetail.css";
import { StoreContext } from "../../context/StoreContext";

const FoodDetail = () => {
  const { id } = useParams();
  const [food, setFood] = useState(null);
  const [quantity, setQuantity] = useState(1); // state số lượng
  const { addToCart } = useContext(StoreContext);

  // Lấy dữ liệu món ăn từ backend
  useEffect(() => {
    const fetchFood = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/food/${id}`);
        setFood(res.data.data);
      } catch (err) {
        console.error("Error fetching food:", err);
      }
    };
    fetchFood();
  }, [id]);

  if (!food) return <p>Đang tải...</p>;

  // Hàm xử lý thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (quantity < 1) return;
    addToCart(food._id, quantity);
    alert(`Đã thêm ${quantity} ${food.name} vào giỏ hàng!`);
  };

  return (
    <div className="food-detail-container">
      <div className="food-detail-wrapper">
        {/* Hình ảnh món ăn */}
        <div className="food-image-section">
          <img
            src={`http://localhost:4000/images/${food.image}`}
            alt={food.name}
            className="detail-img"
          />
        </div>

        {/* Thông tin món ăn */}
        <div className="food-info-section">
          <h1 className="food-name">{food.name}</h1>
          <p className="food-description">{food.description}</p>
          <h2 className="food-price">{food.price.toLocaleString()} VND</h2>

          {/* Bộ chọn số lượng */}
          <div className="quantity-selector">
            <label>Số lượng:</label>
            <div className="quantity-buttons">
              <button
                className="qty-btn minus"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              >
                −
              </button>
              <span className="qty-display">{quantity}</span>
              <button
                className="qty-btn plus"
                onClick={() => setQuantity((prev) => prev + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Nút thêm vào giỏ hàng */}
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            🛒 Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;