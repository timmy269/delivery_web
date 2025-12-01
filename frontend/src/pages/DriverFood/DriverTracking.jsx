import React, { useMemo, useState } from "react";
import "./DriverPages.css";
import DriverNavbar from "../../components/Driver/DriverNavbar";

const statusFlow = ["assigned", "picked", "delivering", "delivered"];

const statusTextMap = {
  assigned: "Đã nhận đơn",
  picked: "Đã lấy món",
  delivering: "Đang giao",
  delivered: "Đã hoàn tất",
};

const DriverTracking = () => {
  const [status, setStatus] = useState("delivering");
  const [toast, setToast] = useState({ type: "info", message: "" });

  const order = useMemo(
    () => ({
      id: "DH-2846",
      customer: "Nguyễn Văn A",
      address: "180 Điện Biên Phủ, Quận 3",
      restaurant: "Bún Chả Sài Gòn",
      distance: "5.2 km",
      earnings: 42000,
      eta: "10:04",
      note: "Khách muốn kiểm tra lại hộp giữ nhiệt.",
    }),
    []
  );

  const timelineSteps = useMemo(
    () => [
      { key: "assigned", time: "09:42", label: "Nhận đơn từ Bún Chả Sài Gòn" },
      { key: "picked", time: "09:50", label: "Đã lấy món tại nhà hàng" },
      { key: "delivering", time: "09:58", label: "Đang giao đến 180 Điện Biên Phủ" },
      { key: "delivered", time: "10:06", label: "Giao hàng & xác nhận thanh toán" },
    ],
    []
  );

  const activeIndex = statusFlow.indexOf(status);

  const getPill = (index) => {
    if (index < activeIndex) return { text: "Hoàn tất", className: "pill pill--muted" };
    if (index === activeIndex) return { text: "Đang thực hiện", className: "pill pill--success" };
    return { text: "Sắp diễn ra", className: "pill pill--warning" };
  };

  const handleAdvanceStatus = () => {
    const currentIndex = statusFlow.indexOf(status);
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      setStatus(nextStatus);
      setToast({ type: "success", message: `Đã chuyển sang "${statusTextMap[nextStatus]}".` });
    } else {
      setToast({ type: "info", message: "Đơn hàng đã hoàn tất." });
    }
  };

  const handleResetStatus = () => {
    if (status === statusFlow[0]) return;
    setStatus(statusFlow[0]);
    setToast({ type: "warning", message: 'Đã quay về bước "Nhận đơn từ nhà hàng".' });
  };

  const nextStatusKey =
    activeIndex < statusFlow.length - 1 ? statusFlow[activeIndex + 1] : statusFlow[activeIndex];

  return (
    <div className="driver-page">
      <div className="driver-page__wrapper">
        <DriverNavbar active="tracking" />

        <div className="driver-hero">
          <div className="driver-hero__content">
            <h2>Theo dõi lộ trình giao hàng</h2>
            <p>Cập nhật nhanh để khách hàng thấy trạng thái thực tế từng bước.</p>
            <div className="driver-hero__meta">
              <span>Đơn {order.id}</span>
              <span>Thu nhập {order.earnings.toLocaleString()} VND</span>
              <span>Dự kiến {order.eta}</span>
            </div>
          </div>
        </div>

        <section className="driver-page__section">
          <h3 className="driver-page__title">Thông tin đơn</h3>
          <p className="driver-page__subtitle">Dữ liệu minh họa, sẽ đồng bộ với API thật khi sẵn sàng.</p>

          <div className="tracking-card__details">
            <div className="driver-card">
              <span className="driver-card__label">Khách hàng</span>
              <span className="driver-card__value">{order.customer}</span>
              <small>{order.address}</small>
            </div>
            <div className="driver-card">
              <span className="driver-card__label">Nhà hàng</span>
              <span className="driver-card__value">{order.restaurant}</span>
              <small>Cách bạn {order.distance}</small>
            </div>
            <div className="driver-card">
              <span className="driver-card__label">Ghi chú</span>
              <span>{order.note}</span>
            </div>
          </div>

          <div className="tracking-card__map">
            Bản đồ thực tế sẽ hiển thị tại đây (Google Maps).
          </div>

          <div className="tracking-card__status">
            <div className="tracking-card__status-info">
              Trạng thái hiện tại: <strong>{statusTextMap[status]}</strong>
            </div>
            <button
              className="tracking-card__status-next"
              onClick={handleAdvanceStatus}
              disabled={status === "delivered"}
            >
              {status === "delivered"
                ? "Đơn đã hoàn tất"
                : `Chuyển sang "${statusTextMap[nextStatusKey]}"`}
            </button>
            <button
              type="button"
              className="tracking-card__status-reset"
              onClick={handleResetStatus}
              disabled={status === "assigned"}
            >
              Quay lại bước nhận đơn
            </button>
          </div>

          {toast.message && (
            <p className={`driver-feedback driver-feedback--${toast.type}`}>{toast.message}</p>
          )}

          <div className="tracking-timeline">
            {timelineSteps.map((step, index) => {
              const pill = getPill(index);
              return (
                <div key={step.key} className="tracking-timeline__item">
                  <div>
                    <strong>{step.time}</strong>
                    <p>{step.label}</p>
                  </div>
                  <span className={pill.className}>{pill.text}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DriverTracking;
