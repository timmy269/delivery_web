import React, { useState, useEffect } from "react";
import axios from "axios";
import "./DriverPages.css";
import DriverNavbar from "../../components/Driver/DriverNavbar.jsx";
import { useNavigate } from "react-router-dom";

const statusTextMap = {
  pending: "Chờ nhận",
  assigned: "Đã nhận đơn",
  delivering: "Đang giao",
  delivered: "Đã hoàn tất",
  "Food Processing": "Đang xử lý"
};

const DriverTracking = () => {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ type: "", message: "" });
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);

  // ✅ Lấy đơn đã nhận
  const fetchAssignedOrders = async () => {
    try {
      const token = localStorage.getItem("driverToken");
      const res = await axios.get("http://localhost:4000/api/driver/orders", {
        headers: { token }
      });
      setAssignedOrders(res.data.data);
    } catch (err) {
      console.error("Lỗi khi lấy đơn đã nhận:", err);
    }
  };

  // ✅ Lấy đơn chưa nhận
  const fetchUnassignedOrders = async () => {
    try {
      const token = localStorage.getItem("driverToken");
      const res = await axios.get("http://localhost:4000/api/driver/orders/unassigned", {
        headers: { token }
      });
      setUnassignedOrders(res.data.data);
    } catch (err) {
      console.error("Lỗi khi lấy đơn chưa nhận:", err);
    }
  };

  useEffect(() => {
    fetchAssignedOrders();
    fetchUnassignedOrders();
  }, []);

  // ✅ Cập nhật trạng thái đơn
  const updateOrderStatus = async (id, newStatus, message) => {
    try {
      const token = localStorage.getItem("driverToken");
      await axios.put(`http://localhost:4000/api/driver/order/${id}/status`, {
        status: newStatus
      }, { headers: { token } });

      await fetchAssignedOrders();
      setToast({ type: "success", message });
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      setToast({ type: "error", message: "Không thể cập nhật đơn hàng." });
    }
  };

  // ✅ Nhận đơn mới
  const assignOrder = async (orderId) => {
    try {
      const token = localStorage.getItem("driverToken");
      await axios.put(`http://localhost:4000/api/driver/order/${orderId}/assign`, {}, {
        headers: { token }
      });

      await fetchAssignedOrders();
      await fetchUnassignedOrders();
      setToast({ type: "success", message: `Đã nhận đơn ${orderId}` });
    } catch (err) {
      console.error("Lỗi khi nhận đơn:", err);
      setToast({ type: "error", message: "Không thể nhận đơn." });
    }
  };

  return (
    <div className="driver-page">
      <div className="driver-page__wrapper">
        <DriverNavbar active="tracking" />
        <div className="driver-hero">
          <div className="driver-hero__content">
            <h2>Danh sách đơn hàng</h2>
            <p>Chọn đơn để nhận và cập nhật trạng thái giao hàng.</p>
            <div className="driver-hero__meta">
              <span>Đã nhận: {assignedOrders.length} đơn</span>
              <span>Chưa nhận: {unassignedOrders.length} đơn</span>
            </div>
          </div>
        </div>

        {/* ✅ Đơn chưa nhận */}
        <section className="driver-page__section">
          <h3>Đơn chưa nhận</h3>
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Địa chỉ</th>
                <th>Thu nhập</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {unassignedOrders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td>{order.address?.firstName} {order.address?.lastName}</td>
                  <td>{order.address?.street}, {order.address?.city}</td>
                  <td>{order.amount?.toLocaleString()} VND</td>
                  <td>
                    <button
                      className="driver-button"
                      onClick={() => assignOrder(order._id)}
                    >
                      Nhận đơn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ✅ Đơn đã nhận */}
        <section className="driver-page__section">
          <h3>Đơn đã nhận</h3>
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Địa chỉ</th>
                <th>Thu nhập</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {assignedOrders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td>{order.address?.firstName} {order.address?.lastName}</td>
                  <td>{order.address?.street}, {order.address?.city}</td>
                  <td>{order.amount?.toLocaleString()} VND</td>
                  <td>
                    <span className={`pill pill--${
                      order.status === "delivered" ? "success" :
                      order.status === "assigned" ? "warning" : "muted"
                    }`}>
                      {statusTextMap[order.status] || order.status}
                    </span>
                  </td>
                  <td>
                    {order.status === "assigned" && (
                      <button
                        className="driver-button"
                        onClick={() =>
                          updateOrderStatus(order._id, "delivering", `Đã bắt đầu giao đơn ${order._id}`)
                        }
                      >
                        Bắt đầu giao
                      </button>
                    )}
                    {order.status === "delivering" && (
                      <button
                        className="driver-button"
                        onClick={() =>
                          updateOrderStatus(order._id, "delivered", `Đã hoàn tất đơn ${order._id}`)
                        }
                      >
                        Hoàn tất
                      </button>
                    )}
                    {order.status === "delivered" && <span>✔ Hoàn tất</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {toast.message && (
          <p className={`driver-feedback driver-feedback--${toast.type}`}>
            {toast.message}
          </p>
        )}

        <button
          className="tracking-card__exit"
          onClick={() => {
            localStorage.removeItem("driverToken");
            navigate("/driver");
          }}
        >
          Thoát
        </button>
      </div>
    </div>
  );
};

export default DriverTracking;
