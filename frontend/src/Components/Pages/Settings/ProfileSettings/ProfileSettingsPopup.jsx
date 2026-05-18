import React, { useState } from "react";
import { CloseIcon } from "../../../../assets/icons/IconRegistry";

const countryCodeLengths = {
  "+91": 10,
  "+1": 10,
  "+44": 10,
  "+61": 9,
  "+81": 10,
  "+86": 11,
  "+49": 11,
  "+33": 9,
  "+971": 9
};

const ProfileSettingsPopup = ({
  showFullNamePopup,
  showDisplayNamePopup,
  setShowFullNamePopup,
  setShowDisplayNamePopup,
  showPhonePopup,
  showDOBPopup,
  showLanguagePopup,
  showDateFormatPopup,
  firstName,
  lastName,
  displayName,
  phoneNumber,
  selectedDate,
  selectedMonth,
  selectedYear,
  language,
  dateFormat,
  handleUpdate,
  handleUpdateDisplayName,
  handleUpdatePhone,
  handleUpdateDOB,
  handleUpdateLanguage,
  handleUpdateDateFormat,
  setFirstName,
  setLastName,
  setDisplayName,
  setPhoneNumber,
  setSelectedDate,
  setSelectedMonth,
  setSelectedYear,
  setLanguage,
  setDateFormat,
  showOTPPopup,
  setShowOTPPopup,
  setShowPhonePopup,
  setShowDOBPopup,
  setShowLanguagePopup,
  setShowDateFormatPopup,
  otpValue,
  setOtpValue,
  handleVerifyOTP,
  handleResendOTP
}) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");

  // Phone input block with flag svg, dropdown arrow, country code select, and phone input
  const PhoneInputBlock = (
    <div className="relative flex flex-row items-center gap-[6px]" style={{ minWidth: 230 }}>
      {/* Flag SVG */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 13.5C0 14.0304 0.210714 14.5391 0.585786 14.9142C0.960859 15.2893 1.46957 15.5 2 15.5H16C16.5304 15.5 17.0391 15.2893 17.4142 14.9142C17.7893 14.5391 18 14.0304 18 13.5V11H0V13.5Z" fill="#138808"/>
          <path d="M18 7V4.5C18 3.96957 17.7893 3.46086 17.4142 3.08579C17.0391 2.71071 16.5304 2.5 16 2.5H2C1.46957 2.5 0.960859 2.71071 0.585786 3.08579C0.210714 3.46086 0 3.96957 0 4.5L0 7H18Z" fill="#FF9933"/>
          <path d="M0 6.83398H18V11.1675H0V6.83398Z" fill="#F7F7F7"/>
          <path d="M9 11C10.1046 11 11 10.1046 11 9C11 7.89543 10.1046 7 9 7C7.89543 7 7 7.89543 7 9C7 10.1046 7.89543 11 9 11Z" fill="#000080"/>
          <path d="M9 10.6875C9.93198 10.6875 10.6875 9.93198 10.6875 9C10.6875 8.06802 9.93198 7.3125 9 7.3125C8.06802 7.3125 7.3125 8.06802 7.3125 9C7.3125 9.93198 8.06802 10.6875 9 10.6875Z" fill="#F7F7F7"/>
          <path d="M9.0499 8.37539L8.9999 8.70039L8.9499 8.37539L8.9999 7.40039L9.0499 8.37539ZM8.5859 7.45489L8.7899 8.40939L8.9224 8.71039L8.8864 8.38389L8.5859 7.45489ZM8.1999 7.61489L8.6439 8.48389L8.8499 8.74039L8.7309 8.43389L8.1999 7.61489ZM7.8684 7.86889L8.5224 8.59389L8.7879 8.78839L8.5934 8.52289L7.8684 7.86889ZM7.6144 8.20039L8.4334 8.73139L8.7399 8.85039L8.4834 8.64439L7.6144 8.20039ZM7.4544 8.58639L8.3834 8.88689L8.7099 8.92289L8.4089 8.79039L7.4544 8.58639ZM7.3999 9.00039L8.3749 9.05039L8.6999 9.00039L8.3749 8.95039L7.3999 9.00039ZM7.4544 9.41439L8.4089 9.21039L8.7099 9.07789L8.3834 9.11389L7.4544 9.41439ZM7.6144 9.80039L8.4834 9.35639L8.7399 9.15039L8.4334 9.26939L7.6144 9.80039ZM7.8684 10.1319L8.5934 9.47789L8.7879 9.21239L8.5224 9.40689L7.8684 10.1319ZM8.1999 10.3859L8.7309 9.56689L8.8499 9.26039L8.6439 9.51689L8.1999 10.3859ZM8.5859 10.5459L8.8864 9.61689L8.9224 9.29039L8.7899 9.59139L8.5859 10.5459ZM8.9999 10.6004L9.0499 9.62539L8.9999 9.30039L8.9499 9.62539L8.9999 10.6004ZM9.4139 10.5459L9.2099 9.59139L9.0774 9.29039L9.1134 9.61689L9.4139 10.5459ZM9.7999 10.3859L9.3559 9.51689L9.1499 9.26039L9.2689 9.56689L9.7999 10.3859ZM10.1314 10.1319L9.4774 9.40689L9.2119 9.21239L9.4064 9.47789L10.1314 10.1319ZM10.3854 9.80039L9.5664 9.26939L9.2599 9.15039L9.5164 9.35639L10.3854 9.80039ZM10.5454 9.41439L9.6164 9.11389L9.2899 9.07789L9.5909 9.21039L10.5454 9.41439ZM10.5999 9.00039L9.6249 8.95039L9.2999 9.00039L9.6249 9.05039L10.5999 9.00039ZM10.5454 8.58639L9.5909 8.79039L9.2899 8.92289L9.6164 8.88689L10.5454 8.58639ZM10.3854 8.20039L9.5164 8.64439L9.2599 8.85039L9.5664 8.73139L10.3854 8.20039ZM10.1314 7.86889L9.4064 8.52289L9.2119 8.78839L9.4774 8.59389L10.1314 7.86889ZM9.7999 7.61489L9.2689 8.43389L9.1499 8.74039L9.3559 8.48389L9.7999 7.61489ZM9.4139 7.45489L9.1134 8.38389L9.0774 8.71039L9.2099 8.40939L9.4139 7.45489Z" fill="#6666B3"/>
          <path d="M8.78018 7.42949C8.8354 7.42949 8.88018 7.38472 8.88018 7.32949C8.88018 7.27426 8.8354 7.22949 8.78018 7.22949C8.72495 7.22949 8.68018 7.27426 8.68018 7.32949C8.68018 7.38472 8.72495 7.42949 8.78018 7.42949Z" fill="#000080"/>
          <path d="M8.35488 7.54375C8.41011 7.54375 8.45488 7.49898 8.45488 7.44375C8.45488 7.38852 8.41011 7.34375 8.35488 7.34375C8.29965 7.34375 8.25488 7.38852 8.25488 7.44375C8.25488 7.49898 8.29965 7.54375 8.35488 7.54375Z" fill="#000080"/>
          <path d="M7.97402 7.76348C8.02925 7.76348 8.07402 7.7187 8.07402 7.66348C8.07402 7.60825 8.02925 7.56348 7.97402 7.56348C7.91879 7.56348 7.87402 7.60825 7.87402 7.66348C7.87402 7.7187 7.91879 7.76348 7.97402 7.76348Z" fill="#000080"/>
          <path d="M7.66299 8.07402C7.71822 8.07402 7.76299 8.02925 7.76299 7.97402C7.76299 7.91879 7.71822 7.87402 7.66299 7.87402C7.60776 7.87402 7.56299 7.91879 7.56299 7.97402C7.56299 8.02925 7.60776 8.07402 7.66299 8.07402Z" fill="#000080"/>
          <path d="M7.44326 8.45488C7.49849 8.45488 7.54326 8.41011 7.54326 8.35488C7.54326 8.29965 7.49849 8.25488 7.44326 8.25488C7.38803 8.25488 7.34326 8.29965 7.34326 8.35488C7.34326 8.41011 7.38803 8.45488 7.44326 8.45488Z" fill="#000080"/>
          <path d="M7.32949 8.87969C7.38472 8.87969 7.42949 8.83492 7.42949 8.77969C7.42949 8.72446 7.38472 8.67969 7.32949 8.67969C7.27426 8.67969 7.22949 8.72446 7.22949 8.77969C7.22949 8.83492 7.27426 8.87969 7.32949 8.87969Z" fill="#000080"/>
          <path d="M7.32949 9.32012C7.38472 9.32012 7.42949 9.27535 7.42949 9.22012C7.42949 9.16489 7.38472 9.12012 7.32949 9.12012C7.27426 9.12012 7.22949 9.16489 7.22949 9.22012C7.22949 9.27535 7.27426 9.32012 7.32949 9.32012Z" fill="#000080"/>
          <path d="M7.44326 9.74492C7.49849 9.74492 7.54326 9.70015 7.54326 9.64492C7.54326 9.58969 7.49849 9.54492 7.44326 9.54492C7.38803 9.54492 7.34326 9.58969 7.34326 9.64492C7.34326 9.70015 7.38803 9.74492 7.44326 9.74492Z" fill="#000080"/>
          <path d="M7.66299 10.1258C7.71822 10.1258 7.76299 10.081 7.76299 10.0258C7.76299 9.97055 7.71822 9.92578 7.66299 9.92578C7.60776 9.92578 7.56299 9.97055 7.56299 10.0258C7.56299 10.081 7.60776 10.1258 7.66299 10.1258Z" fill="#000080"/>
          <path d="M7.97402 10.4373C8.02925 10.4373 8.07402 10.3925 8.07402 10.3373C8.07402 10.2821 8.02925 10.2373 7.97402 10.2373C7.91879 10.2373 7.87402 10.2821 7.87402 10.3373C7.87402 10.3925 7.91879 10.4373 7.97402 10.4373Z" fill="#000080"/>
          <path d="M8.35488 10.6561C8.41011 10.6561 8.45488 10.6113 8.45488 10.5561C8.45488 10.5008 8.41011 10.4561 8.35488 10.4561C8.29965 10.4561 8.25488 10.5008 8.25488 10.5561C8.25488 10.6113 8.29965 10.6561 8.35488 10.6561Z" fill="#000080"/>
          <path d="M8.78018 10.7703C8.8354 10.7703 8.88018 10.7255 8.88018 10.6703C8.88018 10.6151 8.8354 10.5703 8.78018 10.5703C8.72495 10.5703 8.68018 10.6151 8.68018 10.6703C8.68018 10.7255 8.72495 10.7703 8.78018 10.7703Z" fill="#000080"/>
          <path d="M9.22012 10.7703C9.27535 10.7703 9.32012 10.7255 9.32012 10.6703C9.32012 10.6151 9.27535 10.5703 9.22012 10.5703C9.16489 10.5703 9.12012 10.6151 9.12012 10.6703C9.12012 10.7255 9.16489 10.7703 9.22012 10.7703Z" fill="#000080"/>
          <path d="M9.64492 10.6561C9.70015 10.6561 9.74492 10.6113 9.74492 10.5561C9.74492 10.5008 9.70015 10.4561 9.64492 10.4561C9.58969 10.4561 9.54492 10.5008 9.54492 10.5561C9.54492 10.6113 9.58969 10.6561 9.64492 10.6561Z" fill="#000080"/>
          <path d="M10.0258 10.4373C10.081 10.4373 10.1258 10.3925 10.1258 10.3373C10.1258 10.2821 10.081 10.2373 10.0258 10.2373C9.97055 10.2373 9.92578 10.2821 9.92578 10.3373C9.92578 10.3925 9.97055 10.4373 10.0258 10.4373Z" fill="#000080"/>
          <path d="M10.3368 10.1258C10.392 10.1258 10.4368 10.081 10.4368 10.0258C10.4368 9.97055 10.392 9.92578 10.3368 9.92578C10.2816 9.92578 10.2368 9.97055 10.2368 10.0258C10.2368 10.081 10.2816 10.1258 10.3368 10.1258Z" fill="#000080"/>
          <path d="M10.5565 9.74492C10.6118 9.74492 10.6565 9.70015 10.6565 9.64492C10.6565 9.58969 10.6118 9.54492 10.5565 9.54492C10.5013 9.54492 10.4565 9.58969 10.4565 9.64492C10.4565 9.70015 10.5013 9.74492 10.5565 9.74492Z" fill="#000080"/>
          <path d="M10.6703 9.32012C10.7255 9.32012 10.7703 9.27535 10.7703 9.22012C10.7703 9.16489 10.7255 9.12012 10.6703 9.12012C10.6151 9.12012 10.5703 9.16489 10.5703 9.22012C10.5703 9.27535 10.6151 9.32012 10.6703 9.32012Z" fill="#000080"/>
          <path d="M10.6703 8.87969C10.7255 8.87969 10.7703 8.83492 10.7703 8.77969C10.7703 8.72446 10.7255 8.67969 10.6703 8.67969C10.6151 8.67969 10.5703 8.72446 10.5703 8.77969C10.5703 8.83492 10.6151 8.87969 10.6703 8.87969Z" fill="#000080"/>
          <path d="M10.5565 8.45488C10.6118 8.45488 10.6565 8.41011 10.6565 8.35488C10.6565 8.29965 10.6118 8.25488 10.5565 8.25488C10.5013 8.25488 10.4565 8.29965 10.4565 8.35488C10.4565 8.41011 10.5013 8.45488 10.5565 8.45488Z" fill="#000080"/>
          <path d="M10.3368 8.07402C10.392 8.07402 10.4368 8.02925 10.4368 7.97402C10.4368 7.91879 10.392 7.87402 10.3368 7.87402C10.2816 7.87402 10.2368 7.91879 10.2368 7.97402C10.2368 8.02925 10.2816 8.07402 10.3368 8.07402Z" fill="#000080"/>
          <path d="M10.0258 7.76348C10.081 7.76348 10.1258 7.7187 10.1258 7.66348C10.1258 7.60825 10.081 7.56348 10.0258 7.56348C9.97055 7.56348 9.92578 7.60825 9.92578 7.66348C9.92578 7.7187 9.97055 7.76348 10.0258 7.76348Z" fill="#000080"/>
          <path d="M9.64492 7.54375C9.70015 7.54375 9.74492 7.49898 9.74492 7.44375C9.74492 7.38852 9.70015 7.34375 9.64492 7.34375C9.58969 7.34375 9.54492 7.38852 9.54492 7.44375C9.54492 7.49898 9.58969 7.54375 9.64492 7.54375Z" fill="#000080"/>
          <path d="M9.22012 7.42949C9.27535 7.42949 9.32012 7.38472 9.32012 7.32949C9.32012 7.27426 9.27535 7.22949 9.22012 7.22949C9.16489 7.22949 9.12012 7.27426 9.12012 7.32949C9.12012 7.38472 9.16489 7.42949 9.22012 7.42949Z" fill="#000080"/>
          <path d="M8.9998 9.4498C9.24833 9.4498 9.4498 9.24833 9.4498 8.9998C9.4498 8.75128 9.24833 8.5498 8.9998 8.5498C8.75128 8.5498 8.5498 8.75128 8.5498 8.9998C8.5498 9.24833 8.75128 9.4498 8.9998 9.4498Z" fill="#000080"/>
        </svg>
      </div>
      {/* Dropdown Arrow SVG */}
      <div className="absolute left-[22px] top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.8335 1L3.91683 3.5L1.00016 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <select
        value={selectedCountryCode}
        onChange={e => setSelectedCountryCode(e.target.value)}
        className="w-[70px] h-[18px] appearance-none bg-transparent border-none text-black inter-regular text-[14px] cursor-pointer focus:outline-none pl-[38px]"
        style={{ background: "none" }}
      >
        <option value="+91">+91</option>
        <option value="+1">+1</option>
        <option value="+44">+44</option>
        <option value="+61">+61</option>
        <option value="+81">+81</option>
        <option value="+86">+86</option>
        <option value="+49">+49</option>
        <option value="+33">+33</option>
        <option value="+971">+971</option>
      </select>
      <input
        type="text"
        className='inter-regular text-[14px] text-black bg-transparent border border-[#00000033] rounded-[6px] px-[8px] h-[22px]'
        value={phoneNumber}
        onChange={e => {
          const maxLen = countryCodeLengths[selectedCountryCode] || 15;
          setPhoneNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, maxLen));
        }}
        style={{ width: '150px', marginLeft: '8px' }}
      />
    </div>
  );

  return (
    <>
      {/* Full Name Popup */}
      {showFullNamePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-50">
          <div className="bg-white relative" style={{ width: 530, height: 265, borderRadius: 20, opacity: 1, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <button onClick={() => setShowFullNamePopup(false)} className="absolute top-[10px] right-[10px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer" >
              <CloseIcon size={24} />
            </button>
            <div className='flex flex-col justify-center gap-[30px] w-[506px] h-full mx-auto'>
              <span className='inter-semibold text-[24px] text-black'>Update Profile</span>
              <div className='flex flex-row w-[506px] h-[76px] gap-[30px]'>
                <div className='w-[238px] h-[69px] gap-[3px]'>
                  <span className='inter-regular text-[18px] text-black'>First Name</span>
                  <input
                    type="text"
                    className='w-[238px] h-[44px] rounded-[6px] border border-[#00000033] bg-[#F5F5F5] px-[10px] text-black'
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                </div>
                <div className='w-[238px] h-[69px] gap-[3px]'>
                  <span className='inter-regular text-[18px] text-black'>Last Name</span>
                  <input
                    type="text"
                    className='w-[238px] h-[44px] rounded-[6px] border border-[#00000033] bg-[#F5F5F5] px-[10px] text-black'
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button className="absolute w-[83px] h-[39px] top-[214px] left-[437px] rounded-[6px] p-[10px] bg-[#6231A5] text-white opacity-100 border-none cursor-pointer" onClick={handleUpdate}>
              Update
            </button>
          </div>
        </div>
      )}

      {/* Display Name Popup */}
      {showDisplayNamePopup && (
        <div className="fixed inset-0 flex items-center justify-center  bg-black/40 backdrop-blur-[1px] z-50">
          <div className="bg-white relative" style={{ width: 530, height: 265, borderRadius: 20, opacity: 1, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <button onClick={() => setShowDisplayNamePopup(false)} className="absolute top-[10px] right-[10px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer" >
              <CloseIcon size={24} />
            </button>
            <div className='flex flex-col justify-center gap-[30px] w-[506px] h-full mx-auto'>
              <span className='inter-semibold text-[24px] text-black'>Update Profile</span>
              <div className='flex flex-row w-[506px] h-[76px] gap-[30px]'>
                <div className='w-[238px] h-[69px] gap-[3px]'>
                  <span className='inter-regular text-[18px] text-black'>Display Name</span>
                  <input
                    type="text"
                    className='w-[238px] h-[44px] rounded-[6px] border border-[#00000033] bg-[#F5F5F5] px-[10px] text-black'
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button className="absolute w-[83px] h-[39px] top-[214px] left-[437px] rounded-[6px] p-[10px] bg-[#6231A5] text-white opacity-100 border-none cursor-pointer" onClick={handleUpdateDisplayName}>
              Update
            </button>
          </div>
        </div>
      )}

      {/* Phone Number Popup */}
      {showPhonePopup && !showOTPPopup && (
        <div className="fixed inset-0 flex items-center justify-center  bg-black/40 backdrop-blur-[1px] z-50">
          <div className="bg-white relative" style={{ width: 530, height: 265, borderRadius: 20, opacity: 1, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <button onClick={() => setShowPhonePopup(false)} className="absolute top-[10px] right-[10px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer" >
              <CloseIcon size={24} />
            </button>
            <div className='flex flex-col justify-center gap-[30px] w-[506px] h-full mx-auto'>
              <span className='inter-semibold text-[24px] text-black'>Update Profile</span>
              <div className='flex flex-row w-[506px] h-[76px] gap-[30px]'>
                <div className='w-[238px] h-[69px] gap-[3px]'>
                  <span className='inter-regular text-[18px] text-black'>Update new phone Number</span>
                  <input
                    className="w-[302px] h-[44px] rounded-[6px] bg-[#F5F5F5] border-[1px] border-[#00000033] text-black inter-regular text-[14px] px-[10px] py-[12px]"
                    type="text"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </div>
              </div>
            </div>
            <button 
              className="absolute w-[100px] h-[39px] top-[214px] left-[420px] rounded-[6px] p-[10px] bg-[#6231A5] text-white opacity-100 border-none cursor-pointer" 
              onClick={handleUpdatePhone}
            >
              Send OTP
            </button>
          </div>
        </div>
      )}

      {/* OTP Verification Popup */}
      {showOTPPopup && (
        <div className="fixed inset-0 flex items-center justify-center  bg-black/40 backdrop-blur-[1px] z-50">
          <div 
            className="bg-white relative flex flex-col"
            style={{ 
              width: 535, 
              height: 389, 
              borderRadius: 40, 
              opacity: 1, 
              padding: '20px 20px',
              background: '#FFFFFF',
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
            }}
          >
            <button onClick={() => { setShowOTPPopup(false); setShowPhonePopup(false); }} className="absolute top-[15px] right-[15px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer" >
              <CloseIcon size={24} />
            </button>
            <div className='flex flex-col items-center w-[495px] h-[344px] gap-[42px]'>
              <div className='flex flex-col items-end w-[495px] h-[272px] gap-[4px]'>
                <div className='flex flex-col items-center justify-center w-full h-[248px] gap-[14px]'>
                  <div className='flex flex-col items-center justify-between w-[495px] h-[142px] gap-[43px]'>
                    <span className='inter-semibold text-[24px] text-black'>Verify Phone</span>
                    <div className='flex flex-row w-full h-[70px] gap-[8px]'>
                      <div className='w-[70px] h-[70px] flex items-center justify-center'>
                        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M23.833 50.625H37.1663V44.375H23.833V50.625Z" fill="black"/>
                          <path d="M17.1667 10C15.3986 10 13.7029 10.6585 12.4526 11.8306C11.2024 13.0027 10.5 14.5924 10.5 16.25V53.75C10.5 55.4076 11.2024 56.9973 12.4526 58.1694C13.7029 59.3415 15.3986 60 17.1667 60H43.8333C45.6014 60 47.2971 59.3415 48.5474 58.1694C49.7976 56.9973 50.5 55.4076 50.5 53.75V16.25C50.5 14.5924 49.7976 13.0027 48.5474 11.8306C47.2971 10.6585 45.6014 10 43.8333 10H17.1667ZM28.8333 19.375H32.1667C33.3369 19.375 34.4865 19.0862 35.4999 18.5376C36.5133 17.9891 37.3549 17.2001 37.94 16.25H43.8333V53.75H17.1667V16.25H23.06C23.6451 17.2001 24.4867 17.9891 25.5001 18.5376C26.5135 19.0862 27.6631 19.375 28.8333 19.375Z" fill="black"/>
                          <rect x="34.5" y="15" width="30" height="30" rx="15" fill="white"/>
                          <path d="M49.5 16.875C41.2148 16.875 34.5 22.3301 34.5 29.0625C34.5 31.9688 35.7539 34.6289 37.8398 36.7207C37.1074 39.6738 34.6582 42.3047 34.6289 42.334C34.5 42.4688 34.4648 42.668 34.541 42.8438C34.6172 43.0195 34.7812 43.125 34.9688 43.125C38.8535 43.125 41.7656 41.2617 43.207 40.1133C45.123 40.834 47.25 41.25 49.5 41.25C57.7852 41.25 64.5 35.7949 64.5 29.0625C64.5 22.3301 57.7852 16.875 49.5 16.875ZM42.0117 32.8125H41.2969C41.0391 32.8125 40.8281 32.6016 40.8281 32.3438V31.4062C40.8281 31.1484 41.0391 30.9375 41.2969 30.9375H42.0176C42.3691 30.9375 42.627 30.7324 42.627 30.5508C42.627 30.4746 42.5801 30.3926 42.5039 30.3281L41.2207 29.2266C40.7227 28.8047 40.4414 28.2012 40.4414 27.5801C40.4414 26.332 41.5547 25.3184 42.9258 25.3184H43.6406C43.8984 25.3184 44.1094 25.5293 44.1094 25.7871V26.7246C44.1094 26.9824 43.8984 27.1934 43.6406 27.1934H42.9199C42.5684 27.1934 42.3105 27.3984 42.3105 27.5801C42.3105 27.6562 42.3574 27.7383 42.4336 27.8027L43.7168 28.9043C44.2148 29.3262 44.4961 29.9297 44.4961 30.5508C44.502 31.7988 43.3828 32.8125 42.0117 32.8125ZM53.25 32.3438C53.25 32.6016 53.0391 32.8125 52.7812 32.8125H51.8438C51.5859 32.8125 51.375 32.6016 51.375 32.3438V28.3477L49.9219 31.6172C49.752 31.9629 49.2539 31.9629 49.084 31.6172L47.625 28.3477V32.3438C47.625 32.6016 47.4141 32.8125 47.1562 32.8125H46.2188C45.9609 32.8125 45.75 32.6016 45.75 32.3438V26.25C45.75 25.7344 46.1719 25.3125 46.6875 25.3125H47.625C47.9824 25.3125 48.3047 25.5117 48.4629 25.8281L49.5 27.9023L50.5371 25.8281C50.6953 25.5117 51.0234 25.3125 51.375 25.3125H52.3125C52.8281 25.3125 53.25 25.7344 53.25 26.25V32.3438ZM56.0801 32.8125H55.3594C55.1016 32.8125 54.8906 32.6016 54.8906 32.3438V31.4062C54.8906 31.1484 55.1016 30.9375 55.3594 30.9375H56.0801C56.4316 30.9375 56.6895 30.7324 56.6895 30.5508C56.6895 30.4746 56.6426 30.3926 56.5664 30.3281L55.2832 29.2266C54.7852 28.8047 54.5039 28.2012 54.5039 27.5801C54.5039 26.332 55.6172 25.3184 56.9883 25.3184H57.7031C57.9609 25.3184 58.1719 25.5293 58.1719 25.7871V26.7246C58.1719 26.9824 57.9609 27.1934 57.7031 27.1934H56.9824C56.6309 27.1934 56.373 27.3984 56.373 27.5801C56.373 27.6562 56.4199 27.7383 56.4961 27.8027L57.7793 28.9043C58.2773 29.3262 58.5586 29.9297 58.5586 30.5508C58.5645 31.7988 57.4512 32.8125 56.0801 32.8125Z" fill="black"/>
                        </svg>
                      </div>
                      <span className='inter-regular text-[14px] text-[black]'>We have sent you an SMS with a code. Please enter it to verify your Phone Number. Please be Informed that SMS delivery may take a minute or more.</span>
                    </div>
                  </div>
                  <div className='flex flex-col w-[400px] h-[92px] px-[34px] gap-[10px]'>
                    {PhoneInputBlock}
                    <div className='flex flex-col w-[332px] h-[64px]'>
                      <div className='w-[332px] h-[37px] gap-[10px] flex items-center'>
                        <span className='inter-regular text-[14px] text-black'>Enter Code</span>
                      </div>
                      <div className='w-full h-[30px] bg-[#F5F5F5] rounded-[6px] px-[10px] py-[3px] border-[1px] border-[#00000033] flex items-center'>
                        <input 
                          type="text"
                          placeholder="Enter OTP"
                          className='inter-regular text-[12px] text-black bg-transparent border-none outline-none w-full'
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                          maxLength={6}
                        />
                      </div>
                    </div>
                    <div className='w-[64px] h-[64px]'></div>
                  </div>
                </div>
                <div className='flex flex-row w-[301px] h-[20px] gap-[4px]'>
                  <span className='inter-regular text-[14px] text-black'>Not Recevied an SMS yet then click</span>
                  <button 
                    className='w-[61px] h-[20px] rounded-[6px] bg-[#6A37F5] flex items-center justify-center'
                    onClick={handleResendOTP}
                  >
                    <span className='andika-regular text-[12px] text-white'>Resend</span>
                  </button>
                </div>
              </div>
              <button 
                className='w-[150px] h-[30px] rounded-[6px] bg-[#6231A5] flex items-center justify-center'
                onClick={() => handleVerifyOTP(otpValue)}
              >
                <span className='inter-regular text-[18px] text-white'>Update</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Of Birth Popup */}
      {showDOBPopup && (
        <div className="fixed inset-0 flex items-center justify-center  bg-black/40 backdrop-blur-[1px] z-50">
          <div className="bg-white relative" style={{ width: 530, height: 265, borderRadius: 20, opacity: 1, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <button onClick={() => setShowDOBPopup(false)} className="absolute top-[10px] right-[10px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer" >
              <CloseIcon size={24} />
            </button>
            <div className='flex flex-col justify-center gap-[30px] w-[506px] h-full mx-auto'>
              <span className='inter-semibold text-[24px] text-black'>Update Profile</span>
              <div className='flex flex-col w-[506px] h-[76px] gap-[0px]'>
                <span className='inter-regular text-[18px] text-black'>Date Of Birth</span>
                <div className='flex flex-row w-[462px] h-[31px] mx-[20px] gap-[35px]'>
                  <div className='relative flex items-center justify-center w-[130px] h-[31px] rounded-[6px] border-[1px] border-[#00000033] bg-[#F5F5F5]'>
                    <select
                      className='inter-regular text-[12px] text-black bg-[#F5F5F5] w-full h-full outline-none border-none rounded-[6px] text-center appearance-none pr-[24px]'
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                    >
                      <option value="">Date</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className='relative flex items-center justify-center w-[130px] h-[31px] rounded-[6px] border-[1px] border-[#00000033] bg-[#F5F5F5]'>
                    <select
                      className='inter-regular text-[12px] text-black bg-[#F5F5F5] w-full h-full outline-none border-none rounded-[6px] text-center appearance-none pr-[24px]'
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                    >
                      <option value="">Month</option>
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month, idx) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div className='relative flex items-center justify-center w-[130px] h-[31px] rounded-[6px] border-[1px] border-[#00000033] bg-[#F5F5F5]'>
                    <select
                      className='inter-regular text-[12px] text-black bg-[#F5F5F5] w-full h-full outline-none border-none rounded-[6px] text-center appearance-none pr-[24px]'
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 47 }, (_, i) => {
                        const year = 1980 + i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <button className="absolute w-[83px] h-[39px] top-[214px] left-[437px] rounded-[6px] p-[10px] bg-[#6231A5] text-white opacity-100 border-none cursor-pointer" onClick={handleUpdateDOB}>
              Update
            </button>
          </div>
        </div>
      )}

      {/* Language Popup */}
      {showLanguagePopup && (
        <div className="fixed inset-0 flex items-center justify-center  bg-black/40 backdrop-blur-[1px] z-50">
          <div className="bg-white relative" style={{ width: 530, height: 265, borderRadius: 20, opacity: 1, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <button onClick={() => setShowLanguagePopup(false)} className="absolute top-[10px] right-[10px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer" >
              <CloseIcon size={24} />
            </button>
            <div className='flex flex-col justify-center gap-[30px] w-[506px] h-full mx-auto'>
              <span className='inter-semibold text-[24px] text-black'>Update Profile</span>
              <div className='flex flex-row w-[506px] h-[76px] gap-[30px]'>
                <div className='w-[238px] h-[69px] gap-[3px]'>
                  <span className='inter-regular text-[18px] text-black'>Display Language</span>
                  <select
                    className='w-[238px] h-[44px] rounded-[6px] border border-[#00000033] bg-[#F5F5F5] px-[10px] text-black'
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='%23000000'%3E%3Ccircle cx='12' cy='12' r='2' fill='black'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat, repeat',
                      backgroundPosition: 'left 10px center, right 8px center',
                      backgroundSize: '8px, 12px',
                      paddingLeft: '28px'
                    }}
                  >
                    <option value="">Select Language</option>
                    <option value="Acoli">&bull; Acoli</option>
                    <option value="Afrikaans">&bull; Afrikaans</option>
                    <option value="Akan">&bull; Akan</option>
                    <option value="Aymara">&bull; Aymara</option>
                    <option value="azərbaycan">&bull; azərbaycan</option>
                    <option value="Balinese">&bull; Balinese</option>
                    <option value="Basa Sunda">&bull; Basa Sunda</option>
                    <option value="Bork, bork, bork!">&bull; Bork, bork, bork!</option>
                    <option value="bosanski">&bull; bosanski</option>
                    <option value="brezhoneg">&bull; brezhoneg</option>
                    <option value="català">&bull; català</option>
                    <option value="Cebuano">&bull; Cebuano</option>
                    <option value="Čeština">&bull; Čeština</option>
                    <option value="chiShona">&bull; chiShona</option>
                    <option value="Corsican">&bull; Corsican</option>
                    <option value="Créole haïtien">&bull; Créole haïtien</option>
                    <option value="Cymraeg">&bull; Cymraeg</option>
                    <option value="Dansk">&bull; Dansk</option>
                    <option value="Deutsch">&bull; Deutsch</option>
                    <option value="Èdè Yorùbá">&bull; Èdè Yorùbá</option>
                    <option value="Eesti">&bull; Eesti</option>
                    <option value="English (US)">&bull; English (US)</option>
                    <option value="Español">&bull; Español</option>
                    <option value="Esperanto">&bull; Esperanto</option>
                    <option value="Euskara">&bull; Euskara</option>
                    <option value="eʋegbe">&bull; eʋegbe</option>
                    <option value="Ewmew Fudd">&bull; Ewmew Fudd</option>
                    <option value="Filipino">&bull; Filipino</option>
                    <option value="føroyskt">&bull; føroyskt</option>
                    <option value="Français">&bull; Français</option>
                    <option value="Frysk">&bull; Frysk</option>
                    <option value="Gã">&bull; Gã</option>
                    <option value="Gaeilge">&bull; Gaeilge</option>
                    <option value="Gàidhlig">&bull; Gàidhlig</option>
                    <option value="Galego">&bull; Galego</option>
                    <option value="Hausa">&bull; Hausa</option>
                    <option value="Hrvatski">&bull; Hrvatski</option>
                    <option value="ʻŌlelo Hawaiʻi">&bull; ʻŌlelo Hawaiʻi</option>
                    <option value="Ichibemba">&bull; Ichibemba</option>
                    <option value="Igbo">&bull; Igbo</option>
                    <option value="Ikinyarwanda">&bull; Ikinyarwanda</option>
                    <option value="Ikirundi">&bull; Ikirundi</option>
                    <option value="Indonesia">&bull; Indonesia</option>
                    <option value="Interlingua">&bull; Interlingua</option>
                    <option value="IsiXhosa">&bull; IsiXhosa</option>
                    <option value="isiZulu">&bull; isiZulu</option>
                    <option value="íslenska">&bull; íslenska</option>
                    <option value="Italiano">&bull; Italiano</option>
                    <option value="Jawa">&bull; Jawa</option>
                    <option value="Kiswahili">&bull; Kiswahili</option>
                    <option value="Klingon">&bull; Klingon</option>
                    <option value="Kongo">&bull; Kongo</option>
                    <option value="kreol morisien">&bull; kreol morisien</option>
                    <option value="Krio">&bull; Krio</option>
                    <option value="kurdî [kurmancî]">&bull; kurdî [kurmancî]</option>
                    <option value="Latin">&bull; Latin</option>
                    <option value="latviešu">&bull; latviešu</option>
                    <option value="lea fakatonga">&bull; lea fakatonga</option>
                    <option value="lietuvių">&bull; lietuvių</option>
                    <option value="lingála">&bull; lingála</option>
                    <option value="Lozi">&bull; Lozi</option>
                    <option value="Luba-Lulua">&bull; Luba-Lulua</option>
                    <option value="Luganda">&bull; Luganda</option>
                    <option value="magyar">&bull; magyar</option>
                    <option value="Malagasy">&bull; Malagasy</option>
                    <option value="Malti">&bull; Malti</option>
                    <option value="Māori">&bull; Māori</option>
                    <option value="Melayu">&bull; Melayu</option>
                    <option value="Naijíriá Píjin">&bull; Naijíriá Píjin</option>
                    <option value="Nederlands">&bull; Nederlands</option>
                    <option value="Norsk">&bull; Norsk</option>
                    <option value="norsk nynorsk">&bull; norsk nynorsk</option>
                    <option value="Nyanja">&bull; Nyanja</option>
                    <option value="Oʻzbek">&bull; Oʻzbek</option>
                    <option value="occitan">&bull; occitan</option>
                    <option value="Oromoo">&bull; Oromoo</option>
                    <option value="Pirate">&bull; Pirate</option>
                    <option value="Polski">&bull; Polski</option>
                    <option value="Português">&bull; Português</option>
                    <option value="română">&bull; română</option>
                    <option value="rumantsch">&bull; rumantsch</option>
                    <option value="Runasimi">&bull; Runasimi</option>
                    <option value="Runyankore">&bull; Runyankore</option>
                    <option value="Seselwa Creole French">&bull; Seselwa Creole French</option>
                    <option value="Sesotho">&bull; Sesotho</option>
                    <option value="Sesotho sa Leboa">&bull; Sesotho sa Leboa</option>
                    <option value="Setswana">&bull; Setswana</option>
                    <option value="shqip">&bull; shqip</option>
                    <option value="Slovenčina">&bull; Slovenčina</option>
                    <option value="Slovenščina">&bull; Slovenščina</option>
                    <option value="Soomaali">&bull; Soomaali</option>
                    <option value="srpski (latinica)">&bull; srpski (latinica)</option>
                    <option value="Suomi">&bull; Suomi</option>
                    <option value="Svenska">&bull; Svenska</option>
                    <option value="Tiếng Việt">&bull; Tiếng Việt</option>
                    <option value="Tumbuka">&bull; Tumbuka</option>
                    <option value="Türkçe">&bull; Türkçe</option>
                    <option value="türkmen dili">&bull; türkmen dili</option>
                    <option value="Wolof">&bull; Wolof</option>
                    <option value="Ελληνικά">&bull; Ελληνικά</option>
                    <option value="Български">&bull; Български</option>
                    <option value="Русский">&bull; Русский</option>
                    <option value="Српски">&bull; Српски</option>
                    <option value="Українська">&bull; Українська</option>
                    <option value="монгол">&bull; монгол</option>
                    <option value="татар">&bull; татар</option>
                    <option value="тоҷикӣ">&bull; тоҷикӣ</option>
                    <option value="ქართული">&bull; ქართული</option>
                    <option value="Հայերեն">&bull; Հայերեն</option>
                    <option value="‫iei̱dish‬‎">&bull; עברית</option>
                    <option value="‫עברית‬‎">&bull; ‫עברית‬‎</option>
                    <option value="‫ئۇيغۇرچە‬‎">&bull; ‫ئۇيغۇرچە‬‎</option>
                    <option value="ትግርኛ">&bull; ትግርኛ</option>
                    <option value="አማርኛ">&bull; አማርኛ</option>
                    <option value="नेपाली">&bull; नेपाली</option>
                    <option value="भोजपुरी">&bull; भोजपुरी</option>
                    <option value="मराठी">&bull; मराठी</option>
                    <option value="संस्कृत भाषा">&bull; संस्कृत भाषा</option>
                    <option value="हिन्दी">&bull; हिन्दी</option>
                    <option value="অসমীয়া">&bull; অসমীয়া</option>
                    <option value="বাংলা">&bull; বাংলা</option>
                    <option value="ਪੰਜਾਬੀ">&bull; ਪੰਜਾਬੀ</option>
                    <option value="ગુજરાતી">&bull; ગુજરાતી</option>
                    <option value="ଓଡ଼ିଆ">&bull; ଓଡ଼ିଆ</option>
                    <option value="தமிழ்">&bull; தமிழ்</option>
                    <option value="తెలుగు">&bull; తెలుగు</option>
                    <option value="ಕನ್ನಡ">&bull; ಕನ್ನಡ</option>
                    <option value="മലയാളം">&bull; മലയാളം</option>
                    <option value="සිංහල">&bull; සිංහල</option>
                    <option value="Thai">&bull; ไทย</option>
                    <option value="ລາວ">&bull; ລາວ</option>
                    <option value="မြန်မာ">&bull; မြန်မာ</option>
                    <option value="ខ្មែរ">&bull; ខ្មែរ</option>
                    <option value="ᏣᎳᎩ">&bull; ᏣᎳᎩ</option>
                    <option value="한국어">&bull; 한국어</option>
                    <option value="日本語">&bull; 日本語</option>
                    <option value="简体中文">&bull; 简体中文</option>
                    <option value="粵語">&bull; 粵語</option>
                    <option value="0|\\/|G |-|4xx0|2 !!!!111">&bull; 0|\\/|G |-|4xx0|2 !!!!111</option>
                  </select>
                </div>
              </div>
            </div>
            <button className="absolute w-[83px] h-[39px] top-[214px] left-[437px] rounded-[6px] p-[10px] bg-[#6231A5] text-white opacity-100 border-none cursor-pointer" onClick={handleUpdateLanguage}>
              Update
            </button>
          </div>
        </div>
      )}

      {/* Date Format Popup */}
      {showDateFormatPopup && (
        <div className="fixed inset-0 flex items-center justify-center  bg-black/40 backdrop-blur-[1px] z-50">
          <div
            className="bg-white relative"
            style={{
              width: 530,
              height: 265,
              borderRadius: 20,
              opacity: 1,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
            }}
          >
            <button onClick={() => setShowDateFormatPopup(false)} className="absolute top-[10px] right-[10px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer" >
              <CloseIcon size={24} />
            </button>
            <div className='flex flex-col justify-center gap-[30px] w-[506px] h-full mx-auto'>
              <span className='inter-semibold text-[24px] text-black'>Update Profile</span>
              <div className='flex flex-row w-[506px] h-[76px] gap-[30px]'>
                <div className='w-[238px] h-[69px] gap-[3px]'>
                  <span className='inter-regular text-[18px] text-black'>Date Format</span>
                  <select
                    className='w-[238px] h-[44px] rounded-[6px] border border-[#00000033] bg-[#F5F5F5] px-[10px] text-black'
                    value={dateFormat}
                    onChange={e => setDateFormat(e.target.value)}
                  >
                    <option value="">Select Format</option>
                    <option value="M, DD, YYYY">M, DD, YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              className="absolute w-[83px] h-[39px] top-[214px] left-[437px] rounded-[6px] p-[10px] bg-[#6231A5] text-white opacity-100 border-none cursor-pointer"
              onClick={handleUpdateDateFormat}
            >
              Update
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSettingsPopup;