import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./DriverPages.css";
import DriverNavbar from "../../components/Driver/DriverNavbar.jsx";

const statusTextMap = {
  assigned: "Đã nhận",
  delivering: "Đang giao",
  delivered: "Hoàn thành",
  failed: "Thất bại"
};

const statusPillClass = (status) => {
  if (status === "delivered") return "pill--success";
  if (status === "delivering") return "pill--warning";
  if (status === "failed") return "pill--warning";
  return "pill--muted";
};

const formatCurrency = (value = 0) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const formatPercent = (value = 0) =>
  `${Number(value || 0).toFixed(1)}%`;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN", { hour12: false }) : "—";

const DriverRevenue = () => {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [dailyTotals, setDailyTotals] = useState([]);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("driverToken");
    if (!token) {
      setError("Vui lòng đăng nhập tài xế để xem doanh thu.");
      setSummary(null);
      setOrders([]);
      setDailyTotals([]);
      setLoading(false);
      return;
    }

    const fetchRevenue = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("http://localhost:4000/api/driver/revenue", {
          headers: { token },
          params: { month }
        });

        if (!res.data.success) {
          throw new Error(res.data.message || "Request failed");
        }

        const payload = res.data.data || {};
        setSummary(payload.summary || null);
        setOrders(payload.orders || []);
        setDailyTotals(payload.dailyTotals || []);
      } catch (err) {
        console.error("Failed to fetch driver revenue:", err);
        setError("Không thể tải dữ liệu doanh thu. Vui lòng thử lại sau.");
        setSummary(null);
        setOrders([]);
        setDailyTotals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [month]);

  const summaryCards = useMemo(() => {
    if (!summary) {
      return [
        { label: "Thu nhập tháng", value: "0 VND", trend: "Chưa có dữ liệu" },
        { label: "Tổng đơn nhận", value: "0 đơn", trend: "—" },
        { label: "Tỉ lệ hoàn thành", value: "0%", trend: "—" }
      ];
    }

    return [
      {
        label: "Thu nhập tháng",
        value: formatCurrency(summary.totalEarnings),
        trend: `${summary.completedOrders || 0} đơn hoàn thành`
      },
      {
        label: "Tổng đơn nhận",
        value: `${summary.totalOrders || 0} đơn`,
        trend: `${summary.inProgressOrders || 0} đơn đang xử lý`
      },
      {
        label: "Tỉ lệ hoàn thành",
        value: formatPercent(summary.completionRate),
        trend: `Giá trị TB: ${formatCurrency(summary.averageOrderValue)}`
      }
    ];
  }, [summary]);

  const filteredOrders = useMemo(() => {
    if (paymentFilter === "cash") {
      return orders.filter((order) => order.paymentMethod === "COD");
    }
    if (paymentFilter === "cashless") {
      return orders.filter((order) => order.paymentMethod && order.paymentMethod !== "COD");
    }
    return orders;
  }, [orders, paymentFilter]);

  const heroMonth = summary?.month || month;

  return (
    <div className="driver-page">
      <div className="driver-page__wrapper">
        <DriverNavbar active="revenue" />

        <div className="driver-hero">
          <div className="driver-hero__content">
            <h2>Doanh thu tháng {heroMonth}</h2>
            <p>Dữ liệu doanh thu đồng bộ với trạng thái đơn trong phần theo dõi đơn hàng.</p>
            <div className="driver-hero__meta">
              <span>Tổng đơn: {summary?.totalOrders ?? 0}</span>
              <span>Hoàn thành: {summary?.completedOrders ?? 0}</span>
            </div>
          </div>
        </div>

        {loading && (
          <p className="driver-feedback driver-feedback--info">
            Đang tải dữ liệu doanh thu...
          </p>
        )}
        {error && (
          <p className="driver-feedback driver-feedback--error">
            {error}
          </p>
        )}

        <section className="driver-page__section">
          <h3 className="driver-page__title">Tổng quan thu nhập</h3>
          <p className="driver-page__subtitle">
            Số liệu được tính từ các đơn mà bạn nhận và cập nhật trạng thái hoàn thành.
          </p>

          <div className="driver-grid driver-grid--three">
            {summaryCards.map((item) => (
              <div key={item.label} className="driver-card">
                <span className="driver-card__label">{item.label}</span>
                <span className="driver-card__value">{item.value}</span>
                <span className="driver-card__trend">{item.trend}</span>
              </div>
            ))}
          </div>

          <div className="chart-placeholder">
            {dailyTotals.length === 0 ? (
              <>Chưa có đơn hoàn thành trong tháng này.</>
            ) : (
              <div className="chart-placeholder__list">
                {dailyTotals.map((item) => (
                  <div key={item.date} className="chart-placeholder__item">
                    <span>{item.date}</span>
                    <strong>{formatCurrency(item.earnings)}</strong>
                    <span>{item.orders} đơn</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="driver-page__section">
          <h3 className="driver-page__title">Lịch sử đơn hàng</h3>
          <p className="driver-page__subtitle">
            Toàn bộ đơn mà bạn nhận sẽ hiển thị tại đây để theo dõi doanh thu chi tiết.
          </p>

          <div className="filter-row">
            <label>
              <span>Chọn tháng</span>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option value="all">Tất cả đơn</option>
              <option value="cash">Thanh toán tiền mặt (COD)</option>
              <option value="cashless">Thanh toán online</option>
            </select>
          </div>

          <table className="revenue-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Thu nhập</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Hoàn thành lúc</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="5">Chưa có đơn phù hợp với bộ lọc này.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.driverOrderId}>
                    <td>{order.orderId || order.driverOrderId}</td>
                    <td>{formatCurrency(order.amount)}</td>
                    <td>
                      <span className={`pill ${statusPillClass(order.status)}`}>
                        {statusTextMap[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      {order.paymentMethod} ·{" "}
                      {order.paymentStatus === "paid" ? "Đã thanh toán" : "Chờ thanh toán"}
                    </td>
                    <td>{formatDateTime(order.completedAt || order.receivedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default DriverRevenue;
