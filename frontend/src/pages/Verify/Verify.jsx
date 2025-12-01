import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const Verify = () => {
    const [searchParams] = useSearchParams();
    const resultCode = searchParams.get("resultCode");
    const orderId = searchParams.get("orderId");
    const navigate = useNavigate();

    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'failed'

    const verifyPayment = async () => {
        if (!orderId || !resultCode) {
            setStatus('failed');
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:4000/api/order/verify",
                {
                    resultCode,
                    orderId
                }
            );

            console.log("Response verify:", response.data);

            if (response.data.success) {
                setStatus('success');
            } else {
                setStatus('failed');
            }
        } catch (error) {
            console.error("Verify Error:", error);
            setStatus('failed');
        }
    };

    useEffect(() => {
        verifyPayment();
    }, []);

    return (
        <div style={styles.container}>
            {status === 'loading' && (
                <>
                    <div className="spinner" style={styles.spinner}></div>
                    <p>Đang xác nhận thanh toán, vui lòng đợi...</p>
                </>
            )}
            {status === 'success' && (
                <div style={{ ...styles.messageBox, ...styles.success }}>
                    <h2>Thanh toán thành công!</h2>
                    <p>Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.</p>
                    <button style={styles.button} onClick={() => navigate('/')}>
                        Về trang chủ
                    </button>
                </div>
            )}
            {status === 'failed' && (
                <div style={{ ...styles.messageBox, ...styles.failed }}>
                    <h2>❌ Thanh toán thất bại</h2>
                    <p>Đã xảy ra lỗi khi xác nhận thanh toán hoặc bạn đã hủy giao dịch.</p>
                    <button style={styles.button} onClick={() => navigate('/cart')}>
                        Quay lại giỏ hàng
                    </button>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: 400,
        margin: '100px auto',
        padding: 20,
        textAlign: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: '#333',
    },
    spinner: {
        margin: '0 auto 20px',
        border: '6px solid #f3f3f3',
        borderTop: '6px solid #3498db',
        borderRadius: '50%',
        width: 40,
        height: 40,
        animation: 'spin 1s linear infinite',
    },
    messageBox: {
        padding: 20,
        borderRadius: 8,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    },
    success: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
    },
    failed: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb',
    },
    button: {
        marginTop: 20,
        padding: '10px 20px',
        backgroundColor: '#3498db',
        color: '#fff',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
        fontSize: 16,
    }
};

// Thêm animation CSS cho spinner
const styleSheet = document.styleSheets[0];
const keyframes =
    `@keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default Verify;
