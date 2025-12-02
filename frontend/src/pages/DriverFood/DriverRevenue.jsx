import React, { useMemo, useState } from "react";
import "./DriverPages.css";
import DriverNavbar from "../../components/Driver/DriverNavbar.jsx";

const DriverRevenue = () => {
  const [month, setMonth] = useState("2025-11");

  const summary = useMemo(
    () => [
      {
        label: "Thu nhập tháng",
        value: "5,2 triệu",
        trend: "+8% so với tháng trước",
      },
      {
        label: "Đơn hoàn thành",
        value: "34 đơn",
        trend: "Tỷ lệ thành công 98%",
      },
      {
        label: "Thời gian online",
        value: "86 giờ",
        trend: "Trung bình 4h/ngày",
      },
    ],
    []
  );

  const orders = useMemo(
    () => [
      { id: "DH-2846", earning: 68000, distance: "5.2 km", status: "Hoàn thành", method: "MoMo" },
      { id: "DH-2838", earning: 52000, distance: "3.0 km", status: "Hoàn thành", method: "Tiền mặt" },
      { id: "DH-2831", earning: 74000, distance: "7.4 km", status: "Hoàn thành", method: "ZaloPay" },
      { id: "DH-2828", earning: 33000, distance: "1.2 km", status: "Hoàn thành", method: "MoMo" },
      { id: "DH-2822", earning: 25000, distance: "0.8 km", status: "Chờ xác nhận", method: "Tiền mặt" },
    ],
    []
  );

  return (
    <div className="driver-page">
      <div className="driver-page__wrapper">
        <DriverNavbar active="revenue" />

        <div className="driver-hero">
          <div className="driver-hero__content">
            <h2>Doanh thu tháng {month}</h2>
            <p>Theo dõi thu nhập, thời gian online và hiệu suất từng đơn hàng.</p>
            <div className="driver-hero__meta">
              <span>Mục tiêu: 7.000.000 VND</span>
              <span>Hoàn thành 68%</span>
            </div>
          </div>
        </div>

        <section className="driver-page__section">
          <h3 className="driver-page__title">Tổng quan thu nhập</h3>
          <p className="driver-page__subtitle">Số liệu minh họa, sẽ cập nhật realtime khi có API.</p>

          <div className="driver-grid driver-grid--three">
            {summary.map((item) => (
              <div key={item.label} className="driver-card">
                <span className="driver-card__label">{item.label}</span>
                <span className="driver-card__value">{item.value}</span>
                <span className="driver-card__trend">{item.trend}</span>
              </div>
            ))}
          </div>

          <div className="chart-placeholder">
            Biểu đồ thu nhập theo ngày .
          </div>
        </section>

        <section className="driver-page__section">
          <h3 className="driver-page__title">Lịch sử đơn hàng</h3>
          <p className="driver-page__subtitle">Lọc theo tháng hoặc phương thức thanh toán để so sánh dễ dàng.</p>

          <div className="filter-row">
            <label>
              <span>Chọn tháng</span>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
            <select defaultValue="all">
              <option value="all">Tất cả đơn</option>
              <option value="cash">Thanh toán tiền mặt</option>
              <option value="cashless">Thanh toán online</option>
            </select>
          </div>

          <table className="revenue-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Thu nhập</th>
                <th>Quãng đường</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.earning.toLocaleString()} VND</td>
                  <td>{item.distance}</td>
                  <td>
                    <span className={`pill ${item.status === "Hoàn thành" ? "pill--success" : "pill--warning"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default DriverRevenue;
