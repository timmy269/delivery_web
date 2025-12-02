import React from "react";
import { Link } from "react-router-dom";

const driverLinks = [
  { key: "tracking", label: "Theo dõi đơn", to: "/driver/tracking" },
  { key: "revenue", label: "Doanh thu", to: "/driver/revenue" },
  { key: "wallet", label: "Ví tài xế", to: "/driver/wallet" },
];

const DriverNavbar = ({ active = "tracking"}) => {
  
  return (
    <nav className="driver-navbar">
      <div className="driver-navbar__brand">
        <h3>{name}</h3>
      </div>

      <div className="driver-navbar__links">
        {driverLinks.map((link) => (
          <Link key={link.key} to={link.to} className={active === link.key ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="driver-navbar__status">
        <span>Trạng thái</span>
        <strong>SẴN SÀNG</strong>
      </div>
    </nav>
  );
};

export default DriverNavbar;
