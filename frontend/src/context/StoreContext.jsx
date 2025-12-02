import { createContext, useEffect, useState } from "react";
import axios from "axios"


export const StoreContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_BASE || (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) || "http://localhost:4000";

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


    const [cartItems, setCartItems] = useState({});
    const url = "http://localhost:4000";
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [driverToken, setDriverToken] = useState(localStorage.getItem("driverToken") || "");
    const [food_list, setFoodList] = useState([]);
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [appliedFreeShip, setAppliedFreeShip] = useState(false);

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


    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }))
        if (token) {
            await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } })
        }
    }


    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item)
                totalAmount += itemInfo.price * cartItems[item];
            }
        }
        return totalAmount;
    }

    const fetchFoodList = async () => {
        const response = await axios.get(url + "/api/food/list")
        setFoodList(response.data.data)
    }
    const loadCartData = async (token) => {
        const response = await axios.get(url + "/api/cart/get", { headers: { token } });
        setCartItems(response.data.cartData);
    }

    useEffect(() => {
        async function loadData() {
            await fetchFoodList();
            if (localStorage.getItem("token")) {
                setToken(localStorage.getItem("token"));
                await loadCartData(localStorage.getItem("token"));
            }
        }
        loadData();
    }, [])

    const applyPromo = async (code, totalAmount = null) => {
        try {
            const normalizedCode = (code || '').toString().toUpperCase().trim();
            if (!normalizedCode) return { success: false, message: 'Code required' };
            // If trying to apply a non-freeship promo while another discount promo exists, block it
            // BUT allow applying FREESHIP even if a discount promo is present
            if (normalizedCode !== 'FREESHIP' && appliedPromo && normalizedCode !== (appliedPromo.code || '').toString().toUpperCase()) {
                return { success: false, message: 'Chỉ được áp dụng 1 mã giảm giá cho mỗi đơn hàng' };
            }
            // If trying to apply freeship when already applied
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
            // If backend returned a non-freeship promo but we already have one applied, block it
            if (promo && promo.type !== 'freeship' && appliedPromo && (appliedPromo.code || '').toString().toUpperCase() !== (promo.code || '').toString().toUpperCase()) {
                return { success: false, message: 'Chỉ được áp dụng 1 mã giảm giá cho mỗi đơn hàng' };
            }
            if (freeship || promo.type === 'freeship') {
                // mark freeship applied but do not overwrite any existing discount promo
                setAppliedFreeShip(true);
                return { success: true, discount: 0, newTotal, promo, freeship: true };
            }
            // regular discount promo
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
        // discountAmount applies only to subtotal (items), not to shipping
        const subtotalAfterDiscount = Math.max(0, subtotal - Number(discountAmount || 0));
        const ship = appliedFreeShip ? 0 : Number(shipping || 0);
        return subtotalAfterDiscount + ship;
    };

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken,
        driverToken,
        setDriverToken,
        getTotalAfterDiscount,
        appliedPromo,
        discountAmount,
        applyPromo,
        removePromo,
        appliedFreeShip,
        removeFreeShip,

    }
    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;