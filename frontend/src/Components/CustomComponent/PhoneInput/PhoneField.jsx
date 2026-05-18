import { useEffect, useState } from "react";
import { PhoneInput } from "react-international-phone";
import "react-international-phone/style.css"; //v4
import "./phone.css"; // base styles (modified as custom style)

export const PhoneField = ({
  value = "",
  onChange,
  inputClassName = "",
}) => {
  const [phone, setPhone] = useState(value || "");

  useEffect(() => {
    setPhone(value || "");
  }, [value]);

  return (
    <div className="phone-input">
      <PhoneInput
        defaultCountry="in"
        value={phone}
        onChange={(value, metadata) => {
          setPhone(value);
              const iso = metadata?.country?.iso2?.toUpperCase() || "IN";
          // const dialRaw = metadata?.country?.dialCode || "91";
          // const rawDial = metadata?.dialCode || "";
          // const dialCode = `+${dialRaw}`;
          const dialCode = metadata?.country?.dialCode ? `+${metadata.country.dialCode}`: "";
          const flag = `https://flagcdn.com/w20/${iso}.png`;
          onChange?.({
            fullPhone: value,
            dialCode,
            countryCode: iso,
            flag,
          });
        }}
        placeholder="Enter Phone Number..."
        inputClassName={`react-international-phone-input ${inputClassName}`}
      />
    </div>
  );
};
