import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import "./DriverLogin.css";

const DriverLogin = () => {
  const { url, setDriverToken } = useContext(StoreContext); // dùng driverToken riêng
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // thêm tên tài xế khi đăng ký
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(url + "/api/driver/login", { email, password });
      if (res.data.success) {
        localStorage.setItem("driverToken", res.data.token);
        setDriverToken(res.data.token);
        navigate("/driver/tracking");
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Đăng nhập thất bại.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(url + "/api/driver/register", { name, email, password });
      if (res.data.success) {
        localStorage.setItem("driverToken", res.data.token);
        setDriverToken(res.data.token);
        navigate("/driver/tracking");
      } else {
        setError(res.data.message);
      }
    } catch {
      setError("Đăng ký thất bại.");
    }
  };

  return (
    <div className="driver-login">
      <h2>{isRegister ? "Đăng ký tài xế" : "Đăng nhập tài xế"}</h2>
      <form onSubmit={isRegister ? handleRegister : handleLogin}>
        {isRegister && (
          <input
            type="text"
            placeholder="Tên tài xế"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isRegister ? "Đăng ký" : "Đăng nhập"}</button>
        {error && <p className="error">{error}</p>}
      </form>
      <p>
        {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
        <span className="toggle-link" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Đăng nhập" : "Đăng ký"}
        </span>
      </p>
    </div>
  );
};

export default DriverLogin;
