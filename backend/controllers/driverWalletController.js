// backend/controllers/driverWalletController.js
import DriverOrder from "../models/driverOrderModel.js";
import DriverTransaction from "../models/driverTransactionModel.js";
import Driver from "../models/driverModel.js";


export const getWalletFromOrders = async (req, res) => {
  try {
    const driverId = req.userId;
    if (!driverId) return res.status(401).json({ success: false, message: "Not Authorized! Login Again" });

    // 1. Lấy đơn hàng đã giao (delivered) của tài xế
    const deliveredOrders = await DriverOrder.find({ 
      driverId, 
      status: "delivered" 
    }).populate("orderId").lean();

    // 2. Tạo transactions từ delivered orders
    const incomeTxs = deliveredOrders.map(order => {
      const payout = order.orderId?.driverPayout || 
                    order.orderId?.payout || 
                    order.orderId?.total || 
                    0;
      
      return {
        _id: order._id,
        type: "income",
        amount: Number(payout),
        orderId: order.orderId?._id || order.orderId,
        status: "completed",
        note: `Thu nhập từ đơn ${order.orderId?._id || order.orderId}`,
        createdAt: order.completedAt || order.receivedAt || new Date()
      };
    });

    // 3. Lấy giao dịch rút tiền từ DriverTransaction
    let withdrawTxs = [];
    try {
      withdrawTxs = await DriverTransaction.find({ 
        driverId, 
        type: "withdraw" 
      }).sort({ createdAt: -1 }).lean();
      
      withdrawTxs = withdrawTxs.map(tx => ({
        ...tx,
        amount: Math.abs(Number(tx.amount || 0)) // withdraw amount là số dương
      }));
    } catch (err) {
      console.warn("Không thể lấy giao dịch rút tiền:", err.message);
      withdrawTxs = [];
    }

    // 4. Kết hợp và sắp xếp tất cả giao dịch
    const allTxs = [...incomeTxs, ...withdrawTxs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 5. Tính toán tổng
    const totalIncome = incomeTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalWithdraw = withdrawTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const computedBalance = totalIncome - totalWithdraw;

    // 6. Lấy thông tin driver
    const driver = await Driver.findById(driverId).lean().catch(() => null);
    const balance = Number(driver?.balance ?? computedBalance);
    const linked = Boolean(driver?.bankAccountNumber && driver?.bankName);

    // 7. Trả về response
    return res.json({
      success: true,
      data: {
        balance,
        linked,
        transactions: allTxs,
        summary: {
          totalIncome,
          totalWithdraw,
          totalTransactions: allTxs.length,
          computedBalance
        }
      }
    });
  } catch (err) {
    console.error("[getWalletFromOrders] Error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi khi lấy dữ liệu ví",
      error: err.message 
    });
  }
};

/**
 * Public dev-only version: GET /api/driver/wallet/public/:driverId
 */
export const getWalletFromOrdersPublic = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    if (!driverId) return res.status(400).json({ success: false, message: "Missing driverId" });

    // 1. Lấy đơn hàng đã giao (delivered) của tài xế
    const deliveredOrders = await DriverOrder.find({ 
      driverId, 
      status: "delivered" 
    }).populate("orderId").lean();

    // 2. Tạo transactions từ delivered orders
    const incomeTxs = deliveredOrders.map(order => {
      const payout = order.orderId?.driverPayout || 
                    order.orderId?.payout || 
                    order.orderId?.total || 
                    0;
      
      return {
        _id: order._id,
        type: "income",
        amount: Number(payout),
        orderId: order.orderId?._id || order.orderId,
        status: "completed",
        note: `Thu nhập từ đơn ${order.orderId?._id || order.orderId}`,
        createdAt: order.completedAt || order.receivedAt || new Date()
      };
    });

    // 3. Lấy giao dịch rút tiền từ DriverTransaction
    let withdrawTxs = [];
    try {
      withdrawTxs = await DriverTransaction.find({ 
        driverId, 
        type: "withdraw" 
      }).sort({ createdAt: -1 }).lean();
      
      withdrawTxs = withdrawTxs.map(tx => ({
        ...tx,
        amount: Math.abs(Number(tx.amount || 0)) // withdraw amount là số dương
      }));
    } catch (err) {
      console.warn("Không thể lấy giao dịch rút tiền:", err.message);
      withdrawTxs = [];
    }

    // 4. Kết hợp và sắp xếp tất cả giao dịch
    const allTxs = [...incomeTxs, ...withdrawTxs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 5. Tính toán tổng
    const totalIncome = incomeTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalWithdraw = withdrawTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const computedBalance = totalIncome - totalWithdraw;

    // 6. Lấy thông tin driver
    const driver = await Driver.findById(driverId).lean().catch(() => null);
    const balance = Number(driver?.balance ?? computedBalance);
    const linked = Boolean(driver?.bankAccountNumber && driver?.bankName);

    // 7. Trả về response
    return res.json({
      success: true,
      data: {
        balance,
        linked,
        transactions: allTxs,
        summary: {
          totalIncome,
          totalWithdraw,
          totalTransactions: allTxs.length,
          computedBalance
        }
      }
    });
  } catch (err) {
    console.error("[getWalletFromOrdersPublic] Error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Lỗi khi lấy dữ liệu ví",
      error: err.message 
    });
  }
};