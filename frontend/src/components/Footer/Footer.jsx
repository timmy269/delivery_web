import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <p>Chúng tôi cam kết mang đến những trải nghiệm ẩm thực tuyệt vời với các món ăn ngon miệng được chế biến từ những nguyên liệu tươi ngon nhất. Đội ngũ chuyên môn của chúng tôi luôn sẵn sàng phục vụ bạn với dịch vụ tốt nhất.
          </p>
          <div className="footer-social-icons">
            <img src={assets.facebook_icon} alt="" />
            <img src={assets.twitter_icon} alt="" />
            <img src={assets.linkedin_icon} alt="" />
          </div>
        </div>
        <div className="footer-content-center">
          <h3>Liên kết nhanh</h3>
          <ul>
            <li>Trang chủ</li> 
            <li>Thực đơn</li>
            <li>Giao hàng</li>
            <li>Chính sách bảo mật</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>LIÊN HỆ CHÚNG TÔI</h2>
          <ul>
            <li>+84-123-456-789</li>
            <li>contact@Timmy.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className='footer-copyright'>&copy; 2025 Timmy. Bản quyền đã được bảo lưu.</p>
    </div>
  )
}

export default Footer
