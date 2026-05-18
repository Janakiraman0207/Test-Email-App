import React from "react";

export const CustomInput = ({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  icon,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-white text-sm font-medium">{label}</label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </span>
        )}

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full h-[48px] bg-transparent border border-[#6C7A89] rounded-lg px-4
            ${icon ? "pl-10" : ""}
            text-white placeholder-gray-400 focus:outline-none focus:border-white`}
          {...props}
        />
      </div>

      {error && (
        <p
          className={`text-red-400 text-xs flex items-center gap-1 transition-all duration-300 ${
            error ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          }`}
        >
          {error}
        </p>
      )}
    </div>
  );
};

{
  /* <CustomInput
  label="Username"
  placeholder="Enter username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  error={usernameError}
  icon={<UserIcon />}
/>

<CustomInput
  label="Email"
  placeholder="Enter your email"
/>

<CustomInput 
  label="Password"
  type="password"
  placeholder="Enter password"
/> */
}
