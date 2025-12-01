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

    const [search, setSearch] = useState("")

    const handleSearch = (e) => {
        if (e.key == "Enter" && search.trim() != "") {
            navigate(`/search?keyword=${search}`);
            setSearch("");
        }
    }
    return (
        <div className="navbar">
            <Link to='/'><img src={assets.logo} alt="logo" className="logo" /></Link>
            <ul className="navbar-menu">
                <Link to='/' onClick={() => setMenu("home")} className={menu == "home" ? "active" : ""}>Trang chủ</Link>
                <a href='#explore-menu' onClick={() => setMenu("menu")} className={menu == "menu" ? "active" : ""}>menu</a>
                <a href='#' onClick={() => setMenu("mobile-app")} className={menu == "mobile-app" ? "active" : ""}>mobile-app</a>
                <a href='#footer' onClick={() => setMenu("contact-us")} className={menu == "contact-us" ? "active" : ""}>Liên hệ</a>
                <Link to='/driver' onClick={() => setMenu("driver")} className={menu == "driver" ? "active" : ""}>Tài xế</Link>
            </ul>
            <div className="navbar-right">
                <div className="navbar-search">
                    <input
                        type="text"
                        placeholder="Tìm món ăn..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                    <img src={assets.search_icon} alt="search" onClick={() => search && navigate(`/search?keyword=${search}`)} />
                </div>

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
    );
};

export default Navbar;
