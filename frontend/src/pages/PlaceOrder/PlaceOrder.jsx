import React, { useContext, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const PlaceOrder = () => {

  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    url,
    appliedPromo,
    discountAmount,
    applyPromo,
    removePromo,
    getTotalAfterDiscount,
    removeFreeShip
  } = useContext(StoreContext);

  const subtotal = getTotalCartAmount();
  const shipping = subtotal === 0 ? 0 : 20000;
  const totalBeforePromo = subtotal === 0 ? 0 : subtotal + shipping;
  const total = getTotalAfterDiscount(shipping);

  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState(null);
  const [applying, setApplying] = useState(false);

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
  });

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (subtotal === 0) {
      alert("Giỏ hàng trống!");
      return;
    }

    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        orderItems.push({
          ...item,
          quantity: cartItems[item._id]
        });
      }
    });

    let orderData = {
      address: data,
      items: orderItems,
      amount: total
    };

    try {
      let response = await axios.post(url + "/api/order/place-momo", orderData, { headers: { token } });
      if (response.data.success) {
        window.location.replace(response.data.payUrl);
      } else {
        alert("Lỗi: " + response.data.message);
      }
    } catch (error) {
      alert("Đã xảy ra lỗi khi tạo thanh toán.");
    }
  };

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className='title'>Thông tin giao hàng</p>

        <div className="multi-fields">
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='Tên' />
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Họ' />
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email' />
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Đường' />

        <div className="multi-fields">
          <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='Thành phố' />
          <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='Tỉnh/Thành' />
        </div>

        <div className="multi-fields">
          <input required name='zipCode' onChange={onChangeHandler} value={data.zipCode} type="text" placeholder='Mã bưu điện' />
          <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Quốc gia' />
        </div>

        <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Số điện thoại' />
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Tổng giỏ hàng</h2>

          {/* Promo Section */}
          <div className="promo-section">
            <input
              className="promo-input"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Nhập mã khuyến mãi"
              disabled={applying}
            />

            <div className="promo-actions">
              <button
                type="button"
                className="promo-btn"
                onClick={async () => {
                  if (!promoCode) {
                    setPromoMessage({ type: 'error', text: 'Vui lòng nhập mã.' });
                    return;
                  }
                  setApplying(true);
                  const res = await applyPromo(promoCode, totalBeforePromo);
                  setApplying(false);

                  if (res?.success) {
                    setPromoMessage({
                      type: 'success',
                      text: res.discount > 0
                        ? `Áp dụng: -${Number(res.discount).toLocaleString()} VND`
                        : 'Áp dụng Freeship thành công'
                    });
                  } else {
                    setPromoMessage({ type: 'error', text: res?.message || 'Mã không hợp lệ' });
                  }
                }}
              >
                Áp dụng
              </button>

              <button
                type="button"
                className="promo-btn remove"
                onClick={() => {
                  removePromo();
                  removeFreeShip();
                  setPromoMessage({ type: 'info', text: 'Đã xóa mã khuyến mãi.' });
                  setPromoCode('');
                }}
                disabled={!appliedPromo && !discountAmount}
              >
                Xóa
              </button>
            </div>

            {promoMessage && (
              <div className={`promo-message ${promoMessage.type}`}>
                {promoMessage.text}
              </div>
            )}
          </div>

          {/* Totals */}
          <div>
            <div className="cart-total-details">
              <p>Tổng phụ</p>
              <p>{subtotal.toLocaleString()} VND</p>
            </div>

            <div className="cart-total-details">
              <p>Phí giao hàng</p>
              <p>{shipping.toLocaleString()} VND</p>
            </div>

            {Number(discountAmount) > 0 && (
              <div className="cart-total-details discount-line">
                <p>Giảm</p>
                <p>-{Number(discountAmount).toLocaleString()} VND</p>
              </div>
            )}

            <div className="cart-total-details">
              <b>Tổng cộng</b>
              <b>{Number(total).toLocaleString()} VND</b>
            </div>
          </div>

          <button type='submit'>Thanh toán</button>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder
