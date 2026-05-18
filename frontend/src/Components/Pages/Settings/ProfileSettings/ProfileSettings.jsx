import React, { useEffect, useState } from 'react';
import ProfileSettingsPopup from './ProfileSettingsPopup';
import { getUserProfile, getMySettings, updateAllSettings, getProfile, updateProfile } from '../../../../api/api';

const ProfileSettings = () => {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [showFullNamePopup, setShowFullNamePopup] = useState(false);
  const [showDisplayNamePopup, setShowDisplayNamePopup] = useState(false);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [showDOBPopup, setShowDOBPopup] = useState(false);
  const [showLanguagePopup, setShowLanguagePopup] = useState(false);
  const [showDateFormatPopup, setShowDateFormatPopup] = useState(false);
  const [dateFormat, setDateFormat] = useState('');

  // OTP State
  const [showOTPPopup, setShowOTPPopup] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  const [settings, setSettings] = useState([]);
  const [userData, setUserData] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [language, setLanguage] = useState('');

  // Popup handlers
  const handleEditFullName = (idx) => {
    setSelectedIdx(idx);
    setShowFullNamePopup(true);
    const nameParts = (userData?.full_name || "").split(" ");
    setFirstName(nameParts[0] || "");
    setLastName(nameParts.slice(1).join(" ") || "");
  };

  const handleUpdate = async () => {
  try {
    await updateProfile({
      full_name: `${firstName} ${lastName}`
    });

    await fetchProfile();
    setShowFullNamePopup(false);
  } catch (err) {
    console.error(err);
  }
};

  const handleEditDisplayName = (idx) => {
  setSelectedIdx(idx);
  setShowDisplayNamePopup(true);

  const value = settings[idx].value || "";
  setDisplayName(value);
  };

  const handleUpdateDisplayName = async () => {
  try {
    await updateProfile({
      display_name: displayName
    });

    await fetchProfile();
    setShowDisplayNamePopup(false);

  } catch (err) {
    console.error(err);
  }
};

  const handleEditPhone = (idx) => {
    setSelectedIdx(idx);
    setShowPhonePopup(true);
    setPhoneNumber(userData?.phone_number || "");
    // Reset OTP state when opening phone popup
    setOtpValue('');
    setShowOTPPopup(false);
  };

  const handleUpdatePhone = () => {
    // Simulate sending OTP
    setTimeout(() => {
      // Show OTP popup after "sending" OTP
      setShowOTPPopup(true);
    }, 500);
  };

  const handleVerifyOTP = async (otp) => {
  if (otp && otp.length === 6) {

    await updateProfile({
      phone_number: phoneNumber
    });

    await fetchProfile();
    setShowPhonePopup(false);
    setShowOTPPopup(false);
  }
};

  const handleResendOTP = () => {
    // console.log('Resending OTP to:', phoneNumber);
    // Here you would resend the OTP
    alert('OTP resent successfully!');
  };

  const handleEditDOB = (idx) => {
    setSelectedIdx(idx);
    setShowDOBPopup(true);
    const value = settings[idx].value;

    const parts = value.split('-');
    if (parts.length === 3) {
      setSelectedYear(parts[0]);
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      setSelectedMonth(monthNames[parseInt(parts[1], 10) - 1] || '');
      setSelectedDate(String(parseInt(parts[2], 10)));
    } else {
      setSelectedDate('');
      setSelectedMonth('');
      setSelectedYear('');
    }
  };

  const handleUpdateDOB = async () => {

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthNum = String(monthNames.indexOf(selectedMonth) + 1).padStart(2, '0');
    const dayNum = String(selectedDate).padStart(2, '0');
    const dob = `${selectedYear}-${monthNum}-${dayNum}`;

  await updateProfile({
    date_of_birth: dob
  });

  await fetchProfile();
  setShowDOBPopup(false);
};

  const handleEditLanguage = (idx) => {
    setSelectedIdx(idx);
    setShowLanguagePopup(true);
    setLanguage(settings[idx].value);
  };

  const handleUpdateLanguage = async () => {
    await updateProfile({
      language: language
    });

    await fetchProfile();
    setShowLanguagePopup(false);
  };

  const handleEditDateFormat = (idx) => {
    setSelectedIdx(idx);
    setShowDateFormatPopup(true);
    setDateFormat(settings[idx].value);
  };

  const handleUpdateDateFormat = async () => {
    await fetchProfile();
    setShowDateFormatPopup(false);
  };

  const fetchProfile = async () => {
  try {
    const data = await getProfile(); 
    setUserData(data);
    setSettings([
  {
    label: "Full name",
    value: data.full_name || "",
  },
  {
    label: "Display name",
    value: data.display_name || "",
  },
  {
    label: "Email",
    value: data.email || "",
  },
  {
    label: "Phone number",
    value: data.phone_number || "",
  },
  {
    label: "Date Of Birth",
    value: data.date_of_birth || "",
  },
  {
    label: "Language",
    value: data.language || "",
  },
  {
    label: "Date Format",
    value: "",
  },
]);
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  fetchProfile();
}, []);
  return (
    <div className='flex-grow flex flex-col h-full gap-[10px] px-[20px] py-[20px]'>
      <h1 className='inter-bold text-[18px] text-[black]'>Account Settings</h1>
      <div className="w-[96] max-w-full mt-4 opacity-100 my-0" />
      <div className="w-full overflow-hidden mt-0">
        <table className="min-w-full table-fixed border-collapse">
          <tbody>
            {settings.map((row, idx) => (
              <tr key={idx} className="h-[40px] text-left border-t border-[#E5E5E5]">
                <td className="py-3 px-4 inter-regular text-[14px] text-black align-middle text-start whitespace-nowrap">
                  {row.label}
                </td>
                <td className="py-2 px-4 inter-regular text-[14px] text-black align-middle text-start whitespace-nowrap">
                  {row.value}
                </td>
                <td className="py-2 px-4 inter-regular text-[14px] text-black align-middle text-start whitespace-nowrap">
                  <div
                    className={`flex items-center justify-center w-[16px] h-[16px] rounded-[3px] cursor-pointer ${
                      row.label !== "Email" && selectedIdx === idx ? 'bg-[#6A37F5]' : ''
                    }`}
                    onClick={() => {
                      if (row.label === "Full name") handleEditFullName(idx);
                      else if (row.label === "Display name") handleEditDisplayName(idx);
                      else if (row.label === "Phone number") handleEditPhone(idx);
                      else if (row.label === "Date Of Birth") handleEditDOB(idx);
                      else if (row.label === "Language") handleEditLanguage(idx);
                      else if (row.label === "Date Format") handleEditDateFormat(idx);
                    }}
                  >
                    {row.label === "Full name" ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 2.5H1.5C1.23478 2.5 0.98043 2.60536 0.792893 2.79289C0.605357 2.98043 0.5 3.23478 0.5 3.5V8C0.5 8.26522 0.605357 8.51957 0.792893 8.70711C0.98043 8.89464 1.23478 9 1.5 9H6C6.26522 9 6.51957 8.89464 6.70711 8.70711C6.89464 8.51957 7 8.26522 7 8V7.5" stroke={selectedIdx === idx ? "white" : "black"} strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.5 1.50005L8 3.00005M8.6925 2.29255C8.88942 2.09563 9.00005 1.82855 9.00005 1.55005C9.00005 1.27156 8.88942 1.00448 8.6925 0.807554C8.49558 0.61063 8.22849 0.5 7.95 0.5C7.67151 0.5 7.40442 0.61063 7.2075 0.807554L3 5.00005V6.50005H4.5L8.6925 2.29255Z" stroke={selectedIdx === idx ? "white" : "black"} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : row.label === "Email" ? (
                      <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.3 4H6.7C7.14 4 7.5 4.36 7.5 4.8V8.3C7.5 8.96 6.96 9.5 6.3 9.5H1.7C1.04 9.5 0.5 8.96 0.5 8.3V4.8C0.5 4.36 0.86 4 1.3 4Z" fill="black" fillOpacity="0.16"/>
                        <path d="M2 4V2.5C2 1.395 2.895 0.5 4 0.5C5.105 0.5 6 1.395 6 2.5V4M4 6.5C4.13261 6.5 4.25979 6.44732 4.35355 6.35355C4.44732 6.25979 4.5 6.13261 4.5 6C4.5 5.86739 4.44732 5.74021 4.35355 5.64645C4.25979 5.55268 4.13261 5.5 4 5.5C3.86739 5.5 3.74021 5.55268 3.64645 5.64645C3.55268 5.74021 3.5 5.86739 3.5 6C3.5 6.13261 3.55268 6.25979 3.64645 6.35355C3.74021 6.44732 3.86739 6.5 4 6.5ZM4 6.5V8M1.3 4H6.7C7.14 4 7.5 4.36 7.5 4.8V8.3C7.5 8.96 6.96 9.5 6.3 9.5H1.7C1.04 9.5 0.5 8.96 0.5 8.3V4.8C0.5 4.36 0.86 4 1.3 4Z" stroke="black" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.9985 2.49805H1.499C1.23405 2.49805 0.979948 2.6033 0.7926 2.79065C0.605251 2.97799 0.5 3.23209 0.5 3.49704V7.99253C0.5 8.25748 0.605251 8.51158 0.7926 8.69893C0.979948 8.88628 1.23405 8.99153 1.499 8.99153H5.99449C6.25944 8.99153 6.51354 8.88628 6.70088 8.69893C6.88823 8.51158 6.99348 8.25748 6.99348 7.99253V7.49303" stroke={selectedIdx === idx ? "white" : "black"} strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.49405 1.49905L7.99255 2.99755M8.68435 2.29076C8.88108 2.09403 8.9916 1.82721 8.9916 1.549C8.9916 1.27079 8.88108 1.00397 8.68435 0.807245C8.48763 0.610519 8.22081 0.5 7.9426 0.5C7.66438 0.5 7.39757 0.610519 7.20084 0.807245L2.99756 4.99554V6.49404H4.49605L8.68435 2.29076Z" stroke={selectedIdx === idx ? "white" : "black"} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProfileSettingsPopup
        showFullNamePopup={showFullNamePopup}
        showDisplayNamePopup={showDisplayNamePopup}
        setShowFullNamePopup={setShowFullNamePopup}
        setShowDisplayNamePopup={setShowDisplayNamePopup}
        showPhonePopup={showPhonePopup}
        setShowPhonePopup={setShowPhonePopup}
        showDOBPopup={showDOBPopup}
        setShowDOBPopup={setShowDOBPopup}
        showLanguagePopup={showLanguagePopup}
        setShowLanguagePopup={setShowLanguagePopup}
        showDateFormatPopup={showDateFormatPopup}
        setShowDateFormatPopup={setShowDateFormatPopup}
        firstName={firstName}
        lastName={lastName}
        displayName={displayName}
        phoneNumber={phoneNumber}
        selectedDate={selectedDate}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        language={language}
        dateFormat={dateFormat}
        handleUpdate={handleUpdate}
        handleUpdateDisplayName={handleUpdateDisplayName}
        handleUpdatePhone={handleUpdatePhone}
        handleUpdateDOB={handleUpdateDOB}
        handleUpdateLanguage={handleUpdateLanguage}
        handleUpdateDateFormat={handleUpdateDateFormat}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setDisplayName={setDisplayName}
        setPhoneNumber={setPhoneNumber}
        setSelectedDate={setSelectedDate}
        setSelectedMonth={setSelectedMonth}
        setSelectedYear={setSelectedYear}
        setLanguage={setLanguage}
        setDateFormat={setDateFormat}
        // OTP Props
        showOTPPopup={showOTPPopup}
        setShowOTPPopup={setShowOTPPopup}
        otpValue={otpValue}
        setOtpValue={setOtpValue}
        handleVerifyOTP={handleVerifyOTP}
        handleResendOTP={handleResendOTP}
      />
    </div>
  );
};

export default ProfileSettings;