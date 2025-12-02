import React, { useMemo, useState } from "react";
import "./DriverPages.css";
import DriverNavbar from "../../components/Driver/DriverNavbar.jsx";

const formatTime = () =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

const DriverWallet = () => {
  const [balance, setBalance] = useState(1500000);
  const [linked, setLinked] = useState(false);
  const [withdraw, setWithdraw] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [transactions, setTransactions] = useState([
    { id: 3, label: "Nhận thu nhập đơn DH-2846", amount: "+68.000 VND", time: "12/11 09:50", status: "Hoàn tất" },
    { id: 2, label: "Rút về ngân hàng", amount: "-350.000 VND", time: "11/11 20:15", status: "Hoàn tất" },
    { id: 1, label: "Nhận thu nhập đơn DH-2819", amount: "+42.000 VND", time: "11/11 09:18", status: "Hoàn tất" },
  ]);

  const quickActions = useMemo(
    () => [
      {
        label: linked ? "Liên kết lại ngân hàng" : "Liên kết ngân hàng",
        action: () => {
          setLinked(true);
          setFeedback({ type: "success", message: "Đã liên kết ngân hàng thành công." });
        },
      },
      {
        label: "Nhận thu nhập ngay",
        action: () => {
          setBalance((prev) => prev + 200000);
          setTransactions((prev) => [
            { id: Date.now(), label: "Nhận thu nhập nhanh", amount: "+200.000 VND", time: formatTime(), status: "Hoàn tất" },
            ...prev,
          ]);
          setFeedback({ type: "success", message: "Đã cộng 200.000 VND vào ví." });
        },
      },
    ],
    [linked]
  );

  const handleWithdraw = () => {
    const amount = Number(withdraw);
    if (!linked) {
      setFeedback({ type: "warning", message: "Vui lòng liên kết ngân hàng trước khi rút tiền." });
      return;
    }
    if (!amount || amount <= 0) {
      setFeedback({ type: "error", message: "Số tiền không hợp lệ." });
      return;
    }
    if (amount > balance) {
      setFeedback({ type: "warning", message: "Số dư hiện có không đủ." });
      return;
    }
    setBalance((prev) => prev - amount);
    setWithdraw("");
    setTransactions((prev) => [
      { id: Date.now(), label: "Rút về ngân hàng", amount: `-${amount.toLocaleString()} VND`, time: formatTime(), status: "Đang xử lý" },
      ...prev,
    ]);
    setFeedback({ type: "info", message: "Đã tạo yêu cầu rút tiền. Vui lòng chờ xử lý." });
  };

  return (
    <div className="driver-page">
      <div className="driver-page__wrapper">
        <DriverNavbar active="wallet" />

        <div className="driver-hero">
          <div className="driver-hero__content">
            <h2>Ví tài xế</h2>
            <p>Theo dõi số dư, liên kết ngân hàng và rút tiền chỉ trong vài giây.</p>
            <div className="driver-hero__meta">
              <span>Thanh toán hằng ngày</span>
              <span>Hỗ trợ MoMo, ZaloPay</span>
            </div>
          </div>
        </div>

        <section className="driver-page__section">
          <h3 className="driver-page__title">Số dư hiện tại</h3>
          <p className="driver-page__subtitle">Thu nhập sẽ cộng ngay khi bạn hoàn tất đơn.</p>

          <div className="wallet-balance">
            <div>
              <div className="wallet-balance__amount">{balance.toLocaleString()} VND</div>
              <p className="driver-page__subtitle">Số dư khả dụng</p>
            </div>
            <div className="wallet-balance__badge">{linked ? "Đã liên kết ngân hàng" : "Chưa liên kết ngân hàng"}</div>
          </div>

          <div className="wallet-actions">
            {quickActions.map((item) => (
              <button key={item.label} onClick={item.action}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="withdraw-form">
            <input
              type="number"
              placeholder="Nhập số tiền muốn rút"
              value={withdraw}
              onChange={(e) => setWithdraw(e.target.value)}
            />
            <button onClick={handleWithdraw}>Xác nhận rút</button>
          </div>

          {feedback.message && (
            <p className={`driver-feedback driver-feedback--${feedback.type || "info"}`}>{feedback.message}</p>
          )}
        </section>

        <section className="driver-page__section">
          <h3 className="driver-page__title">Lịch sử giao dịch</h3>
          <div className="wallet-history">
            {transactions.map((item) => (
              <div key={item.id} className="wallet-history__item">
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.time}</p>
                </div>
                <div>
                  <strong>{item.amount}</strong>
                  <p>{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DriverWallet;
