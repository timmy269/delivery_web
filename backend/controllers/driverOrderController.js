import DriverOrderModel from "../models/driverOrderModel.js";
import OrderModel from "../models/orderModel.js";
import DriverModel from "../models/driverModel.js";

const flattenDriverOrder = (driverOrderDoc) => {
  if (!driverOrderDoc) return null;

  const orderInfo =
    typeof driverOrderDoc.orderId?.toObject === "function"
      ? driverOrderDoc.orderId.toObject()
      : driverOrderDoc.orderId || {};

  return {
    ...orderInfo,
    _id: orderInfo._id || driverOrderDoc.orderId || driverOrderDoc._id,
    status: driverOrderDoc.status,
    driverOrderId: driverOrderDoc._id,
    driverAssignment: {
      status: driverOrderDoc.status,
      receivedAt: driverOrderDoc.receivedAt,
      completedAt: driverOrderDoc.completedAt,
      payoutRecorded: driverOrderDoc.payoutRecorded
    }
  };
};

export const getDriverOrders = async (req, res) => {
  try {
    const orders = await DriverOrderModel.find({ driverId: req.userId })
      .populate("orderId")
      .sort({ receivedAt: -1 });

    res.json({
      success: true,
      data: orders.map(flattenDriverOrder).filter(Boolean)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Không thể lấy danh sách đơn hàng." });
  }
};

export const getOrderDetail = async (req, res) => {
  try {
    const order = await DriverOrderModel.findOne({
      _id: req.params.id,
      driverId: req.userId
    }).populate("orderId");

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
    }
    res.json({ success: true, data: flattenDriverOrder(order) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi khi lấy chi tiết đơn hàng." });
  }
};

export const assignOrderToDriver = async (req, res) => {
  try {
    const orderRecord = await OrderModel.findById(req.params.id);
    if (!orderRecord) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
    }

    const existing = await DriverOrderModel.findOne({ orderId: req.params.id });
    if (existing) {
      return res.status(400).json({ success: false, message: "Đơn hàng đã có tài xế nhận." });
    }

    orderRecord.driver = req.userId;
    await orderRecord.save();

    const driverOrder = await DriverOrderModel.create({
      orderId: req.params.id,
      driverId: req.userId,
      status: "assigned"
    });

    const populated = await driverOrder.populate("orderId");

    res.json({
      success: true,
      message: "Nhận đơn thành công",
      data: flattenDriverOrder(populated)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi khi nhận đơn." });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatus = ["assigned", "delivering", "delivered", "failed"];

  if (!validStatus.includes(status)) {
    return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ." });
  }

  try {
    const driverOrder = await DriverOrderModel.findOne({
      driverId: req.userId,
      $or: [{ _id: req.params.id }, { orderId: req.params.id }]
    }).populate("orderId");

    if (!driverOrder) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
    }

    if (driverOrder.status === status) {
      return res.json({ success: true, message: "Trạng thái đã được cập nhật trước đó.", data: driverOrder });
    }

    driverOrder.status = status;
    const orderAmount = driverOrder.orderId?.amount || 0;

    if (status === "delivered") {
      driverOrder.completedAt = Date.now();

      if (!driverOrder.payoutRecorded && orderAmount > 0) {
        await DriverModel.findByIdAndUpdate(
          req.userId,
          { $inc: { totalEarnings: orderAmount } }
        );
        driverOrder.payoutRecorded = true;
      }
    } else {
      driverOrder.completedAt = undefined;

      if (driverOrder.payoutRecorded && orderAmount > 0) {
        await DriverModel.findByIdAndUpdate(
          req.userId,
          { $inc: { totalEarnings: -orderAmount } }
        );
      }
      driverOrder.payoutRecorded = false;
    }

    await driverOrder.save();

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: flattenDriverOrder(driverOrder)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái." });
  }
};

export const getUnassignedOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find({ driver: null }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Không thể lấy danh sách đơn trống." });
  }
};

const buildMonthRange = (month) => {
  if (!month) return null;

  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr);

  if (!year || !monthIndex) {
    return null;
  }

  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 1));
  return { start, end };
};

const getReferenceDate = (orderDoc) => {
  if (orderDoc.completedAt) return orderDoc.completedAt;
  if (orderDoc.receivedAt) return orderDoc.receivedAt;
  if (orderDoc.orderId?.date) return orderDoc.orderId.date;
  return orderDoc.orderId?.createdAt || null;
};

const normalizePaymentMethod = (orderInfo) => {
  if (orderInfo.paymentMethod) {
    return orderInfo.paymentMethod;
  }
  return orderInfo.payment ? "Online" : "COD";
};

export const getDriverRevenue = async (req, res) => {
  try {
    const { month } = req.query;
    const monthRange = buildMonthRange(month);

    const driverOrders = await DriverOrderModel.find({ driverId: req.userId })
      .populate({
        path: "orderId",
        select: "amount address payment paymentMethod createdAt date"
      })
      .sort({ completedAt: -1, receivedAt: -1 });

    const filteredOrders = monthRange
      ? driverOrders.filter((orderDoc) => {
          const referenceDate = getReferenceDate(orderDoc);
          if (!referenceDate) return false;
          return referenceDate >= monthRange.start && referenceDate < monthRange.end;
        })
      : driverOrders;

    const deliveredOrders = filteredOrders.filter((orderDoc) => orderDoc.status === "delivered");
    const totalEarnings = deliveredOrders.reduce(
      (sum, orderDoc) => sum + (orderDoc.orderId?.amount || 0),
      0
    );
    const completionRate =
      filteredOrders.length === 0
        ? 0
        : Number(((deliveredOrders.length / filteredOrders.length) * 100).toFixed(1));
    const averageOrderValue =
      deliveredOrders.length === 0
        ? 0
        : Math.round(totalEarnings / deliveredOrders.length);

    const orders = filteredOrders.map((orderDoc) => {
      const orderInfo = orderDoc.orderId || {};
      return {
        driverOrderId: orderDoc._id,
        orderId: orderInfo._id || null,
        amount: orderInfo.amount || 0,
        status: orderDoc.status,
        paymentMethod: normalizePaymentMethod(orderInfo),
        paymentStatus: orderInfo.payment ? "paid" : "pending",
        completedAt: orderDoc.completedAt || null,
        receivedAt: orderDoc.receivedAt || null,
        address: orderInfo.address || null
      };
    });

    const dailyTotalsMap = {};
    deliveredOrders.forEach((orderDoc) => {
      const referenceDate = orderDoc.completedAt || orderDoc.receivedAt;
      if (!referenceDate) return;
      const key = referenceDate.toISOString().slice(0, 10);
      if (!dailyTotalsMap[key]) {
        dailyTotalsMap[key] = { earnings: 0, orders: 0 };
      }
      dailyTotalsMap[key].earnings += orderDoc.orderId?.amount || 0;
      dailyTotalsMap[key].orders += 1;
    });

    const dailyTotals = Object.entries(dailyTotalsMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, stats]) => ({ date, ...stats }));

    res.json({
      success: true,
      data: {
        summary: {
          month: month || null,
          totalEarnings,
          completedOrders: deliveredOrders.length,
          totalOrders: filteredOrders.length,
          completionRate,
          averageOrderValue,
          inProgressOrders: filteredOrders.length - deliveredOrders.length
        },
        orders,
        dailyTotals
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Không thể tính doanh thu tài xế." });
  }
};
