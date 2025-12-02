import React, { useContext } from 'react'
import './Cart.css'
import { StoreContext } from '../../context/StoreContext'
import { useNavigate } from 'react-router-dom';

const Cart = () => {

  const { cartItems, food_list, removeFromCart, getTotalCartAmount, url } = useContext(StoreContext);

  const navigate = useNavigate();

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item, index) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <div className="cart-item-image">
                    <img src={url + "/images/" + item.image} alt={item.name} />
                  </div>
                  <p className="cart-item-name">{item.name}</p>
                  <p className="cart-item-price">{item.price.toLocaleString()}VND</p>
                  <p className="cart-item-quantity">{cartItems[item._id]}</p>
                  <p className="cart-item-total">{(item.price * cartItems[item._id]).toLocaleString()}VND</p>
                  <button onClick={() => removeFromCart(item._id)} className='cross'>×</button>
                </div>
                <hr />
              </div>
            )
          }
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Tổng giá</h2>
          <div>
            <div className="cart-total-details">
              <p>Tổng phụ</p>
              <p>{getTotalCartAmount()}VND</p>
            </div>
            <div className="cart-total-details">
              <p>Phí vận chuyển</p>
              <p>{getTotalCartAmount() === 0 ? 0 : 20000}VND</p>
            </div>
            <div className="cart-total-details">
              <b>Tổng</b>
              <b>{getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 20000}VND</b>
            </div>
          </div>
          <button onClick={() => navigate('/order')}>TIẾN HÀNH THANH TOÁN</button>
        </div>
      </div>
    </div>
  )
}

export default Cart
