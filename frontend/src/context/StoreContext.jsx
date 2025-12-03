import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE ||
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
    "http://localhost:4000";

const normalizeItem = (item) => {
    const id = item._id?.$oid || item._id || item.id?.toString?.() || String(item.id || "");
    const name = item.tenMon || item.name || item.title || "";
    const description = item.moTa || item.description || "";
    const price = item.gia || item.price || 0;
    const category = item.idLoai || item.category || "";
    let image = item.urlHinh || item.image || "";
    if (!image) {

    } else if (image.startsWith('http')) {

    } else if (image.startsWith('/uploads/')) {
        image = API_BASE.replace(/\/$/, '') + image;
    } else if (image.startsWith('/')) {

    } else {
        image = API_BASE.replace(/\/$/, '') + '/uploads/' + image;
    }
    return { _id: id, name, description, price, category, image };
};

const StoreContextProvider = (props) => {
    // --- Common ---
    const [food_list, setFoodList] = useState([]);
    const [cartItems, setCartItems] = useState({});

    const url = API_BASE;

    // --- User token & driver token ---
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [driverToken, setDriverToken] = useState(localStorage.getItem("driverToken") || "");

    // --- Promo code states ---
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [appliedFreeShip, setAppliedFreeShip] = useState(false);

    // Thêm món vào giỏ
    const addToCart = async (itemId, quantity = 1) => {
        setCartItems((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 0) + quantity,
        }));

        if (token) {
            await axios.post(
                url + "/api/cart/add",
                { itemId, quantity },
                { headers: { token } }
            );
        }
    };

    // Xóa món khỏi giỏ
    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] || 1) - 1
        }));

        if (token) {
            await axios.post(
                url + "/api/cart/remove",
                { itemId },
                { headers: { token } }
            );
        }
    };

    // Đồng bộ giỏ hàng từ backend
    const loadCartData = async (tokenValue) => {
        if (!tokenValue) return;
        const response = await axios.get(url + "/api/cart/get", { headers: { token: tokenValue } });
        setCartItems(response.data.cartData || {});
    };

    // Tính tổng tiền giỏ hàng
    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item);
                if (itemInfo) {
                    totalAmount += itemInfo.price * cartItems[item];
                }
            }
        }
        return totalAmount;
    };

    // Lấy danh sách món ăn
    const fetchFoodList = async () => {
        const response = await axios.get(url + "/api/food/list");
        setFoodList(response.data.data);
    };

    // === PROMO FUNCTIONS ===

    const applyPromo = async (code, totalAmount = null) => {
        try {
            const normalizedCode = (code || '').toString().toUpperCase().trim();
            if (!normalizedCode) return { success: false, message: 'Code required' };
            if (normalizedCode !== 'FREESHIP' && appliedPromo && normalizedCode !== (appliedPromo.code || '').toString().toUpperCase()) {
                return { success: false, message: 'Chỉ được áp dụng 1 mã giảm giá cho mỗi đơn hàng' };
            }
            if (appliedFreeShip && normalizedCode === 'FREESHIP') {
                return { success: false, message: 'Mã freeship đã được áp dụng' };
            }
            const subtotal = totalAmount != null ? totalAmount : getTotalCartAmount();
            const res = await fetch(`${API_BASE}/api/promo/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: normalizedCode, total: subtotal })
            });
            const body = await res.json();
            if (!res.ok || !body.success) {
                const msg = body && body.message ? body.message : 'Invalid promo code';
                return { success: false, message: msg };
            }
            const { discount, newTotal, promo, freeship } = body.data;
            if (promo && promo.type !== 'freeship' && appliedPromo && (appliedPromo.code || '').toString().toUpperCase() !== (promo.code || '').toString().toUpperCase()) {
                return { success: false, message: 'Chỉ được áp dụng 1 mã giảm giá cho mỗi đơn hàng' };
            }
            if (freeship || promo.type === 'freeship') {
                setAppliedFreeShip(true);
                return { success: true, discount: 0, newTotal, promo, freeship: true };
            }
            setAppliedPromo(promo);
            setDiscountAmount(Number(discount || 0));
            return { success: true, discount, newTotal };
        } catch (err) {
            console.error('applyPromo error', err);
            return { success: false, message: 'Network error' };
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setDiscountAmount(0);
    };

    const removeFreeShip = () => {
        setAppliedFreeShip(false);
    };

    const getTotalAfterDiscount = (shipping = 0) => {
        const subtotal = getTotalCartAmount();
        const subtotalAfterDiscount = Math.max(0, subtotal - Number(discountAmount || 0));
        const ship = appliedFreeShip ? 0 : Number(shipping || 0);
        return subtotalAfterDiscount + ship;
    };

    // DRIVER TOKEN 
    useEffect(() => {
        if (token) localStorage.setItem("token", token);
        else localStorage.removeItem("token");
    }, [token]);

    useEffect(() => {
        if (driverToken) localStorage.setItem("driverToken", driverToken);
        else localStorage.removeItem("driverToken");
    }, [driverToken]);


    useEffect(() => {
        async function loadData() {
            await fetchFoodList();

            if (token) {
                await loadCartData(token);
            }
        }
        loadData();
    }, []);

    const contextValue = {
        // Common
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        // User tokens
        token,
        setToken,
        // Driver tokens
        driverToken,
        setDriverToken,
        // Promo
        appliedPromo,
        discountAmount,
        appliedFreeShip,
        applyPromo,
        removePromo,
        removeFreeShip,
        getTotalAfterDiscount,
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;
