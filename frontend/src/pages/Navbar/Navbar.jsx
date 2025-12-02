import React, { useContext, useState } from "react";
import "./Navbar.css";
import { assets } from "@/assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
    const [menu, setMenu] = useState("menu");
    const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        setToken("");
        navigate("/");
    }

    const [search, setSearch] = useState("");
    const [showSearchBar, setShowSearchBar] = useState(false);

    const handleSearch = (e) => {
        if (e.key === "Enter" && search.trim() !== "") {
            navigate(`/search?keyword=${search}`);
            setSearch("");
            setShowSearchBar(false);
        }
    };

    const handleClickSearchIcon = () => {
        if (showSearchBar && search.trim() !== "") {
            navigate(`/search?keyword=${search}`);
            setSearch("");
            setShowSearchBar(false);
        } else {
            setShowSearchBar(prev => !prev);
        }
    };

    return (
        <>
            <div className="navbar">
                <Link to='/'><img src={assets.logo} alt="logo" className="logo" /></Link>
                <ul className="navbar-menu">
                    <Link to='/' onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>Trang chủ</Link>
                    <a href='#explore-menu' onClick={() => setMenu("menu")} className={menu === "menu" ? "active" : ""}>menu</a>
                    <a href='#app-download' onClick={() => setMenu("mobile-app")} className={menu === "mobile-app" ? "active" : ""}>Mobile-App</a>
                    <a href='#footer' onClick={() => setMenu("contact-us")} className={menu === "contact-us" ? "active" : ""}>Liên hệ</a>
                    <Link to='/driver' onClick={() => setMenu("driver")} className={menu === "driver" ? "active" : ""}>Tài xế</Link>
                </ul>
                <div className="navbar-right">
                    {/* Icon tìm kiếm nhỏ */}
                    <img
                        src={assets.search_icon}
                        alt="search icon"
                        className="search-icon-only"
                        onClick={handleClickSearchIcon}
                    />

                    <div className="navbar-search-icon">
                        <Link to='/cart'><img src={assets.basket_icon} alt="basket" /></Link>
                        <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
                    </div>
                    {!token
                        ? <button onClick={() => setShowLogin(true)}>Đăng nhập</button>
                        : <div className="navbar-profile">
                            <img src={assets.profile_icon} alt="" />
                            <ul className="nav-profile-dropdown">
                                <li onClick={() => navigate('/myorders')}><img src={assets.bag_icon} alt="" /><p>Đơn hàng</p></li>
                                <hr />
                                <li onClick={logout}><img src={assets.logout_icon} alt="" /><p>Đăng xuất</p></li>
                            </ul>
                        </div>
                    }
                </div>
            </div>

            {/* Thanh tìm kiếm hiện ra dưới navbar */}
            {showSearchBar && (
                <div className="search-bar-below-navbar">
                    <input
                        type="text"
                        placeholder="Tìm món ăn..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        autoFocus
                    />
                    <img
                        src={assets.search_icon}
                        alt="search"
                        onClick={() => search && navigate(`/search?keyword=${search}`)}
                        style={{ cursor: "pointer" }}
                    />
                    <button onClick={() => setShowSearchBar(false)}>Đóng</button>
                </div>
            )}
        </>
    );
};

export default Navbar;
