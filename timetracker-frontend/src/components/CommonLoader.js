import React from "react";
import logo from "../assets/images/logo-o.png";
import "./css/CommonLoader.css";

const CommonLoader = ({ overlay = false, size = "md", label = "" }) => {
  const content = (
    <div className={`common-loader common-loader-${size}`}>
      <span className="common-loader-spin-wrap">
        <span className="common-loader-ring" />
        <img src={logo} alt="Loading" className="common-loader-logo" />
      </span>
      {label ? <span className="common-loader-label">{label}</span> : null}
    </div>
  );

  if (overlay) {
    return <div className="common-loader-overlay">{content}</div>;
  }

  return content;
};

export default CommonLoader;
