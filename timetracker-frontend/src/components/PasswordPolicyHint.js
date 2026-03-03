import React from "react";
import { PASSWORD_POLICY_POINTS } from "../utils/passwordPolicy";

const PasswordPolicyHint = () => (
  <div className="password-policy-box">
    <p className="password-policy-title">Password rules</p>
    <ul className="password-policy-list">
      {PASSWORD_POLICY_POINTS.map((rule) => (
        <li key={rule}>{rule}</li>
      ))}
    </ul>
  </div>
);

export default PasswordPolicyHint;
