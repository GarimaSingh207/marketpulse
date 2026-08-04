import React from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export default function InputField({
  label,
  id,
  leftIcon,
  rightElement,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className="input-group">
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <div className="input-wrapper">
        {leftIcon && <div className="input-icon-left">{leftIcon}</div>}
        <input
          id={id}
          className={`input-field ${leftIcon ? "has-left-icon" : ""} ${
            rightElement ? "has-right-element" : ""
          } ${className}`}
          {...props}
        />
        {rightElement && <div className="input-element-right">{rightElement}</div>}
      </div>
    </div>
  );
}
