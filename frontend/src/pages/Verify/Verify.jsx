import React, { useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { StoreContext } from '../../Context/StoreContext';

const Verify = () => {

    // Lấy tham số đúng từ URL
    const [searchParams, setSearchParams] = useSearchParams();
    const resultCode = searchParams.get("resultCode"); // Lấy resultCode (0 là thành công)
    const orderId = searchParams.get("orderId");

    // Lấy url và token
    const { url, token } = useContext(StoreContext);
    const navigate = useNavigate();

    const verifyPayment = async () => {
        // Kiểm tra an toàn: Nếu không có orderId hoặc resultCode, thoát.
        if (!orderId || !resultCode) {
            console.error("Thiếu tham số MoMo.");
            return navigate("/");
        }

        try {
            // Gửi resultCode và orderId lên server (KÈM TOKEN)
            const response = await axios.post(
                url + "/api/order/verify",
                { resultCode, orderId },
                { headers: { token } } // PHẢI GỬI TOKEN LÊN
            );

            console.log("Phản hồi từ Backend (Verify):", response.data);

            if (response.data.success) {
                // Thành công: Chuyển hướng đến trang đơn hàng của tôi
                navigate("/myorders");
            } else {
                // Thất bại: Chuyển hướng về trang chủ
                navigate("/");
            }
        } catch (error) {
            console.error("LỖI XÁC NHẬN THANH TOÁN (AXIOS):", error);
            // Chuyển hướng về trang chủ nếu gặp lỗi mạng hoặc 401/500
            navigate("/");
        }
    }

    // GỌI HÀM KHI COMPONENT MOUNT VÀ KHI TOKEN/THAM SỐ ĐÃ SẴN SÀNG
    useEffect(() => {
        // Chỉ gọi hàm khi token, orderId và resultCode đều có giá trị
        if (token && orderId && resultCode) {
            verifyPayment();
        }
        // Thêm các dependency để useEffect chạy khi token được tải
    }, [token, orderId, resultCode]);

    return (
        <div className='verify'>
            <div className="spinner"></div>
        </div>
    );
}

export default Verify;