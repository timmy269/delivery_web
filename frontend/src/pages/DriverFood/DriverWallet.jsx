import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./DriverPages.css";
import DriverNavbar from "../../components/Driver/DriverNavbar.jsx";

const formatCurrency = (value = 0) =>
  `${Number(value || 0).toLocaleString("vi-VN")} VND`;

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN", { hour12: false }) : "—";

const typeTextMap = {
  income: "Thu nhập",
  withdraw: "Rút tiền",
  refund: "Hoàn tiền",
  transfer: "Nạp tiền vào ví"
};

const typePillClass = (type) => {
  if (type === "income" || type === "transfer") return "pill--success";
  if (type === "withdraw") return "pill--warning";
  if (type === "refund") return "pill--info";
  return "pill--muted";
};

// ===== MAIN COMPONENT =====
const DriverWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [revenueData, setRevenueData] = useState(null); // THÊM: lấy dữ liệu từ Revenue
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE || "http://localhost:4000";
    return base.replace(/\/$/, "");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("driverToken");
    
    if (!token) {
      setError("Vui lòng đăng nhập tài xế để xem thông tin ví.");
      setWallet(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      setLoading(true);
      setError("");
      try {
        // 1. Lấy thông tin ví
        const walletRes = await axios.get(`${API_BASE}/api/driver/wallet`, {
          headers: { token },
          timeout: 10000
        });

        if (!walletRes.data.success) {
          throw new Error(walletRes.data.message || "Request failed");
        }

        const payload = walletRes.data.data || {};
        setWallet({
          balance: payload.balance || 0,
          linked: payload.linked || false
        });
        setTransactions(payload.transactions || []);

        // 2. Lấy dữ liệu thu nhập THỰC TẾ từ Revenue API
        try {
          const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
          const revenueRes = await axios.get(`${API_BASE}/api/driver/revenue`, {
            headers: { token },
            params: { month: currentMonth },
            timeout: 10000
          });
          
          if (revenueRes.data.success) {
            setRevenueData(revenueRes.data.data || {});
          }
        } catch (revenueErr) {
          console.warn("Không thể lấy dữ liệu revenue:", revenueErr);
          // Không xử lý lỗi ở đây vì không bắt buộc
        }

      } catch (err) {
        console.error("Failed to fetch driver wallet:", err);
        
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("driverToken");
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        } else {
          setError("Không thể tải dữ liệu ví. Vui lòng thử lại sau.");
        }
        
        setWallet(null);
        setTransactions([]);
        setRevenueData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [API_BASE]);

  const summaryCards = useMemo(() => {
    if (!wallet) {
      return [
        { label: "Số dư hiện tại", value: "0 VND", trend: "Chưa có dữ liệu" },
        { label: "Tổng thu nhập", value: "0 VND", trend: "0 giao dịch" },
        { label: "Tổng rút tiền", value: "0 VND", trend: "0 giao dịch" },
        { label: "Tổng giao dịch", value: "0 giao dịch", trend: "—" }
      ];
    }

    // CÁCH 1: Lấy từ Revenue (ƯU TIÊN) - số tiền THỰC TẾ từ đơn hàng
    let totalActualEarnings = 0;
    let incomeTransactionCount = 0;
    
    if (revenueData?.summary) {
      totalActualEarnings = revenueData.summary.totalEarnings || 0;
      incomeTransactionCount = revenueData.summary.completedOrders || 0;
    } 
    // CÁCH 2: Fallback - tính từ transactions (có thể bị 0)
    else {
      totalActualEarnings = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + Math.max(Number(t.amount || 0), 0), 0);
      
      incomeTransactionCount = transactions.filter(t => t.type === "income").length;
    }

    // Số dư hiện tại trong ví (có thể rút)
    const currentBalance = wallet.balance || 0;
    
    // Tổng rút tiền
    const totalWithdraw = Math.abs(
      transactions
        .filter(t => t.type === "withdraw")
        .reduce((sum, t) => sum + Math.min(Number(t.amount || 0), 0), 0)
    );
    
    const withdrawCount = transactions.filter(t => t.type === 'withdraw').length;
    const totalTx = transactions.length;

    return [
      {
        label: "Số dư hiện tại",
        value: formatCurrency(currentBalance),
        trend: wallet.linked ? "Có thể rút tiền" : "Chưa liên kết NH",
        description: "Tiền có sẵn trong ví"
      },
      {
        label: "Tổng thu nhập",
        value: formatCurrency(totalActualEarnings),
        trend: `${incomeTransactionCount} đơn hàng`,
        description: revenueData?.summary 
          ? `Thực nhập từ ${revenueData.summary.totalOrders || 0} đơn` 
          : "Từ tất cả đơn hàng"
      },
      {
        label: "Tổng rút tiền",
        value: formatCurrency(totalWithdraw),
        trend: `${withdrawCount} giao dịch`,
        description: "Đã chuyển về ngân hàng"
      },
      {
        label: "Tổng giao dịch",
        value: `${totalTx} giao dịch`,
        trend: `Cập nhật: ${new Date().toLocaleDateString("vi-VN")}`,
        description: "Tất cả giao dịch trong ví"
      }
    ];
  }, [wallet, transactions, revenueData]);

  const filteredTransactions = useMemo(() => {
    // Nếu transactions có amount = 0, hiển thị tất cả nhưng thêm warning
    return transactions.filter(tx => {
      if (typeFilter === "all") return true;
      if (typeFilter === "income") return tx.type === "income";
      if (typeFilter === "withdraw") return tx.type === "withdraw";
      if (typeFilter === "refund") return tx.type === "refund";
      return false;
    });
  }, [transactions, typeFilter]);

  const getAmountDisplay = (type, amount, orderId) => {
    const numAmount = Number(amount || 0);
    const absAmount = Math.abs(numAmount);
    
    if (numAmount === 0 && type === "income" && orderId) {
      // Cố gắng lấy số tiền thực từ revenue data
      if (revenueData?.orders) {
        const realOrder = revenueData.orders.find(o => 
          o.orderId === orderId || o._id === orderId
        );
        if (realOrder?.amount) {
          return `+${formatCurrency(realOrder.amount)}`;
        }
      }
      return `+0 VND (chờ cập nhật)`;
    }
    
    if (type === "income" || type === "transfer") {
      return `+${formatCurrency(absAmount)}`;
    } else if (type === "withdraw") {
      return `-${formatCurrency(absAmount)}`;
    } else if (type === "refund") {
      return `${numAmount >= 0 ? '+' : '-'}${formatCurrency(absAmount)}`;
    }
    return formatCurrency(absAmount);
  };

  const getAmountClass = (type, amount) => {
    const numAmount = Number(amount || 0);
    
    if (numAmount === 0 && type === "income") return "text-muted";
    if (type === "income" || type === "transfer") return "text-success";
    if (type === "withdraw") return "text-warning";
    if (type === "refund") {
      return numAmount >= 0 ? "text-success" : "text-warning";
    }
    return "";
  };

  const renderActualEarningsInfo = () => {
    if (!revenueData?.summary) return null;
    const { summary } = revenueData;
    const pendingAmount = (summary.totalEarnings || 0) - (wallet?.balance || 0);
  };

  return (
    <div className="driver-page">
      <div className="driver-page__wrapper">
        <DriverNavbar active="wallet" />

        <div className="driver-hero">
          <div className="driver-hero__content">
            <h2>Ví Tài Xế</h2>
            <p>Quản lý số dư, thu nhập và lịch sử giao dịch rút tiền.</p>
            <div className="driver-hero__meta">
              <span>Số dư: {formatCurrency(wallet?.balance || 0)}</span>
              <span>Giao dịch: {transactions.length}</span>
              <span>{wallet?.linked ? "Đã liên kết NH" : "Chưa liên kết NH"}</span>
            </div>
          </div>
        </div>

        {loading && (
          <p className="driver-feedback driver-feedback--info">
            Đang tải dữ liệu ví...
          </p>
        )}
        
        {error && (
          <p className="driver-feedback driver-feedback--error">
            {error}
          </p>
        )}

        {/* BALANCE OVERVIEW SECTION */}
        <section className="driver-page__section">
          <h3 className="driver-page__title">Tổng quan ví</h3>
          <p className="driver-page__subtitle">
            Số dư được cập nhật sau khi đơn hàng hoàn thành và đã xử lý.
          </p>

          <div className="driver-grid driver-grid--four">
            {summaryCards.map((item) => (
              <div key={item.label} className="driver-card">
                <span className="driver-card__label">{item.label}</span>
                <span className="driver-card__value">{item.value}</span>
                <span className="driver-card__trend">{item.trend}</span>
                {item.description && (
                  <span className="driver-card__description">{item.description}</span>
                )}
              </div>
            ))}
          </div>

          {/* THÔNG TIN THU NHẬP THỰC TẾ */}
          {renderActualEarningsInfo()}

          {/* BANK LINK STATUS */}
          <div className="bank-status">
            <div className="bank-status__content">
              <h4>Trạng thái liên kết ngân hàng</h4>
              <p>
                {wallet?.linked 
                  ? "Tài khoản ngân hàng của bạn đã được liên kết. Bạn có thể rút tiền về tài khoản bất kỳ lúc nào."
                  : "Bạn chưa liên kết tài khoản ngân hàng. Vui lòng liên kết để có thể rút tiền về tài khoản cá nhân."
                }
              </p>
            </div>
            <button className="btn btn--primary">
              {wallet?.linked ? "Quản lý liên kết" : "Liên kết ngay"}
            </button>
          </div>
        </section>

        {/* TRANSACTIONS HISTORY SECTION */}
        <section className="driver-page__section">
          <h3 className="driver-page__title">Lịch sử giao dịch</h3>
          <p className="driver-page__subtitle">
            {transactions.some(t => t.type === "income" && t.amount === 0) ? (
              <span className="text-warning">
                ⚠ Một số giao dịch đang chờ cập nhật số tiền thực tế từ đơn hàng.
              </span>
            ) : (
              "Toàn bộ giao dịch thu nhập và rút tiền sẽ hiển thị tại đây."
            )}
          </p>

          <div className="filter-row">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tất cả giao dịch</option>
              <option value="income">Thu nhập đơn hàng</option>
              <option value="withdraw">Rút tiền</option>
              <option value="refund">Hoàn tiền</option>
            </select>
          </div>

          <table className="revenue-table">
            <thead>
              <tr>
                <th>Loại giao dịch</th>
                <th>Số tiền</th>
                <th>Mã đơn hàng</th>
                <th>Ghi chú</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    {loading 
                      ? "Đang tải giao dịch..." 
                      : "Chưa có giao dịch phù hợp với bộ lọc này."
                    }
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx._id || tx.id}>
                    <td>
                      <span className={`pill ${typePillClass(tx.type)}`}>
                        {typeTextMap[tx.type] || tx.type}
                      </span>
                    </td>
                    <td>
                      <span className={getAmountClass(tx.type, tx.amount)}>
                        {getAmountDisplay(tx.type, tx.amount, tx.orderId)}
                      </span>
                    </td>
                    <td>{tx.orderId || "—"}</td>
                    <td>{tx.note || "—"}</td>
                    <td>{formatDateTime(tx.createdAt)}</td>
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

export default DriverWallet;