import React, { useContext, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';


const PlaceOrder = () => {

  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  })

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  const placeOrder = async (event) => {
    event.preventDefault();
    let orderItems = [];
    food_list.map((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = item;
        itemInfo["quantity"] = cartItems[item._id];
        orderItems.push(itemInfo);
      }
    })
    let orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + 20000
    }

    try {
      let response = await axios.post(url + "/api/order/place-momo", orderData, { headers: { token } })
      if (response.data.success) {
        window.location.replace(response.data.payUrl);
      } else {
        alert("Lỗi: " + response.data.message);
      }
    } catch (error) {
      alert("Đã xảy ra lỗi khi tạo thanh toán.");
    }
  }

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className='title'>Thông tin giao hàng</p>
        <div className="multi-fields">
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First Name' />
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last Name' />
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email' />
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street' />
        <div className="multi-fields">
          <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='City' />
          <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State' />
        </div>
        <div className="multi-fields">
          <input required name='zipCode' onChange={onChangeHandler} value={data.zipCode} type="text" placeholder='Zip code' />
          <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country' />
        </div>
        <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone Number' />
      </div>
      <div className="place-order-right">
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
          <button type='submit'>Thanh toán</button>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder
