import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Verify.css';
import axios from 'axios';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const navigate = useNavigate();

  // You can add logic here to verify the payment with your backend if needed

  return (
    <div className='verify'>
      <div className="spinner"></div>
      <div className="message">
        {success === "true" ? (
          <h2>Thanh toán thành công!</h2>
        ) : (
          <h2>Thanh toán thất bại.</h2>
        )}
        <p>Đơn hàng của bạn: {orderId}</p>
        <button onClick={() => navigate('/myorders')}>Xem đơn hàng</button>
      </div>
    </div>
  );
};

export default Verify;