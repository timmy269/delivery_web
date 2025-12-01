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
    <div className="StyleDetailProduct">
      <div className="detail_product">

        {/* Left images */}
        <div className="content__left">
          <img
            src={`http://localhost:4000/images/${food.image}`}
            alt={food.name}
          />
        </div>

        {/* Right content */}
        <div className="content__right">
          <div className="content__right__content">
            <h1 className="title">{food.name}</h1>

            {/* 🌟 Star rating (fake UI demo) */}
            <div className="star">
              <span>⭐ ⭐ ⭐ ⭐ ⭐</span>
              <span className="text">(120 đánh giá)</span>
            </div>

            <p className="detail">{food.description}</p>
            <h2 className="price">{food.price.toLocaleString()} VND</h2>


            {/* Quantity */}
            <div className="quatity">
              <p>Số lượng:</p>
              <div className="quatity__number">
                <div className="set" onClick={() => setQuantity(prev => Math.max(1, prev - 1))}>-</div>
                <span>{quantity}</span>
                <div className="set" onClick={() => setQuantity(prev => prev + 1)}>+</div>
              </div>
            </div>

            {/* Trạng thái hàng */}
            <div className="status">
              <span>Tình trạng: ✔️ Còn hàng</span>
            </div>

            {/* Buttons */}
            <div className="button__add">
              <button
                className="flex_button button__add__cart"
                onClick={handleAddToCart}
              >
                <span>Thêm vào giỏ hàng</span>
              </button>

              {/* ❤️ Like button */}
              <button className="flex_button button__add__like">
                <span className="icon_like">❤️</span>
                <span>Yêu thích</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FoodDetail;
