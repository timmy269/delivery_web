import React from 'react';
import './FoodItem.css';
import { assets } from '../../assets/assets';
import { useContext } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const FoodItem = ({ id, name, price, description, image }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const navigate = useNavigate(); 

  return (
    <div className='food-item'>
      <div className="food-item-image-container">
        <img className='food-item-image' src={url + "/images/" + image} alt='' />
        {!cartItems[id]
          ? <img className='add' onClick={() => addToCart(id)} src={assets.add_icon} />
          : <div className='food-item-counter'>
            <img onClick={() => removeFromCart(id)} src={assets.remove_icon_red} alt="" />
            <p>{cartItems[id]}</p>
            <img onClick={() => addToCart(id)} src={assets.add_icon_green} alt="" />
          </div>
        }
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <img src={assets.rating_stars} alt="" />
        </div>
        <p className='food-item-desc'>{description}</p>
        <p className='food-item-price'>{price} VND</p>
        <button
          className="detail-btn"
          onClick={() => navigate(`/food/${id}`)}
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  );
};

export default FoodItem;