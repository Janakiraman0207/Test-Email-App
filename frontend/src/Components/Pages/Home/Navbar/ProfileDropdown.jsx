import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Make sure to import useNavigate
import Settings from "../../Settings/Settings";
import {
  AvailableNowIcon,
  ArrowIcon,
  AppearAwayIcon,
  OfflineStatusIcon,
  OutOfOfficeIcon,
  AccountActivitiesIcon,
  LogoutIcon,
} from "../../../../assets/icons/IconRegistry";
import {
  updateUserStatus,
  getAccountActivities,
  logoutAllDevices,
  api,
} from "../../../../api/api";
import { useUpdateProfileStatusMutation } from "../../../../store/rtkapi/statusApi";
import { useDispatch,useSelector } from "react-redux";
import { setCurrentStatus } from "../../../../store/slices/statusSlice";
import {StatusIcon} from "../../../../assets/icons/IconRegistry";

const STATUS_LIST = [
  {
    label: "Available",
    value: "available",
    icon: <AvailableNowIcon />,
  },
  {
    label: "Busy",
    value: "busy",
    icon: <div className="w-[16px] h-[16px] rounded-full bg-red-500" />,
  },
  {
    label: "Do not Disturb",
    value: "dnd",
    icon: (
      <div className="w-[16px] h-[16px] rounded-full bg-red-500 flex items-center justify-center">
        <div className="w-[8px] border-t border-white"></div>
      </div>
    ),
  },
  {
    label: "Appear away",
    value: "away",
    icon: <AppearAwayIcon />,
  },
  {
    label: "Offline",
    value: "offline",
    icon: <OfflineStatusIcon />,
  },
  {
    label: "Out of office",
    value: "out_of_office",
    icon: <OutOfOfficeIcon />,
  },
];

const ProfileDropdown = ({ profile, onClose, openSettings }) => {
  const navigate = useNavigate(); // Make sure this is defined
  const [activeMenu, setActiveMenu] = useState(null);
  // const [currentStatus, setCurrentStatus] = useState(STATUS_LIST[0]);
  const [activities, setActivities] = useState([]);
  const dropdownRef = useRef(null);
  const settingsPopupRef = useRef(null);
  const availableDropdownRef = useRef(null);
  const activityModalRef = useRef(null);
  const [updateProfileStatus, { isLoading }] = useUpdateProfileStatusMutation();
  const dispatch=useDispatch();
  const currentStatus = useSelector((state)=>state.status.currentStatus);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose?.();
        setActiveMenu(null);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    let interval;

    if (activeMenu === "activity") {
      fetchActivities();
      interval = setInterval(() => {
        fetchActivities();
      }, 10000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeMenu]);

  const STATUS_MAP = {
    Available: "available",
    "Available now": "available_now",
    Busy: "busy",
    "Do not Disturb": "dnd",
    "Appear away": "away",
    Offline: "offline",
    "Out of office": "out_of_office",
  };

  const fetchActivities = async () => {
    try {
      const response = await getAccountActivities();

      setActivities((prev) => {
        const newData = response.data || [];

        if (JSON.stringify(prev) !== JSON.stringify(newData)) {
          return newData;
        }

        return prev;
      });
    } catch (error) {
      console.error("Failed to fetch activities", error);
    }
  };

  const handleAccountSettingsClick = () => {
    openSettings();
    onClose?.();
  };

  const handleLogoutClick = () => {
    // setActiveMenu(null);
    // if (onClose) onClose();
    // navigate("/");
    localStorage.setItem("force_logout", Date.now());
    delete api.defaults.headers.common["Authorization"];
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
    });
    setActiveMenu(null);
    if (onClose) onClose();
    window.location.href = "/";
  };

  const handleLogoutAllDevices = async () => {
    // Add your logout from all devices logic here
    // console.log("Logout from all devices clicked");
    try {
      localStorage.setItem("force_logout", Date.now());
      await logoutAllDevices();
      delete api.defaults.headers.common["Authorization"];
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
      });
      setActiveMenu(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout all devices failed", error);
    }
  };

  const handleStatusSelect = async (statusObj) => {
    dispatch(setCurrentStatus(statusObj));
    try {
      // const payload = { status: statusObj.value, message: "", duration: 0 };
      // await updateUserStatus(payload);
      // setActiveMenu(null);
      await updateProfileStatus({
        status:statusObj.value,message:"",duration:0,
      }).unwrap();
      setActiveMenu(null);
    } catch (error) {
      console.error("Failed to update status", error.response?.data || error);
    }
  };

  const availableNowHandler = () => {
    setActiveMenu((prev) => (prev === "available" ? null : "available"));
  };

  const accountActivityHandler = async () => {
    setActiveMenu((prev) => (prev === "activity" ? null : "activity"));
  };

  return (
    <>
      {/* Profile Dropdown */}
      <div
        ref={dropdownRef}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 mt-2 z-40 w-[250px] h-[226px] rounded-[32px] border border-[#D9D9D9] bg-white opacity-100 shadow-[0_7px_16px_0px_rgba(0,0,0,0.10),0_29px_29px_0px_rgba(0,0,0,0.09),0_65px_39px_0px_rgba(0,0,0,0.05),0_115px_46px_0px_rgba(0,0,0,0.01),0_180px_50px_0px_rgba(0,0,0,0)]"
      >
        <div className="p-4 text-black">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={profile.img}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="inter-medium text-[16px] leading-[20px]">
                {profile.name}
              </div>
              <div className="inter-medium text-[12px] leading-[20px]">
                {profile.email}
              </div>
            </div>
          </div>
          <hr style={{ borderColor: "#D9D9D9" }} />
          <div className="mt-4 gap-[0px] flex flex-col">
            {/* Available Status Dropdown */}
            <div className="flex items-center relative">
              <button
                className={`flex items-center justify-between text-left gap-[10px] py-2 px-3 rounded-[10px] w-full h-[34px] hover:w-full cursor-pointer ${activeMenu === "available" ? "bg-[#F4F4F4]" : "hover:bg-gray-100"}`}
                onClick={availableNowHandler}
              >
                <div className="flex flex-row items-center w-[120px] gap-[20px] whitespace-nowrap">
                  <div className="mr-2 w-[20px] h-[20px] flex items-center justify-center">
                    {/* <AvailableNowIcon /> */}
                    {/* {currentStatus.icon} */}
                    <StatusIcon
                      status={currentStatus?.value}
                      size={16}
                      iconSize={8}
                    />
                  </div>
                  <span className="inter-regular text-[12px]">
                    {currentStatus.label}
                  </span>
                </div>
                <div className="w-[12px] h-[12px] flex items-center justify-center">
                  <ArrowIcon
                    size={7}
                    direction={activeMenu === "available" ? "down" : "left"}
                  />
                </div>
              </button>
              {activeMenu === "available" && (
                <div
                  ref={availableDropdownRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 z-50 w-[191px] h-[220px] rounded-[32px] bg-white opacity-100"
                  style={{
                    boxShadow: `0px 6px 14px 0px #0000001A, 0px 25px 25px 0px #00000017, 0px 57px 34px 0px #0000000D, 0px 101px 40px 0px #00000003, 0px 158px 44px 0px #00000000`,
                  }}
                >
                  {/* <div className="flex flex-col w-full h-full p-5 gap-3 [&>button]:cursor-pointer">
                    <button
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Available")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center">
                        <AvailableNowIcon />
                      </div>
                      <span className="inter-regular text-[12px]">
                        Available
                      </span>
                    </button>
                    <button
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Busy")}
                    >
                      <div className="w-[20px] h-[20px]  flex items-center justify-center">
                        <div className="w-[16.67px] h-[16.67px] rounded-full bg-[#FC3737]"></div>
                      </div>
                      <span className="inter-regular text-[12px]">Busy</span>
                    </button>
                    <button
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Do not Disturb")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center">
                        <div className="w-[16.67px] h-[16.67px] rounded-full bg-[#FC3737] flex items-center justify-center">
                          <div className="w-[7px] h-0 border-t border-[1px] border-white opacity-100"></div>
                        </div>
                      </div>
                      <span className="inter-regular text-[12px]">
                        Do not Disturb
                      </span>
                    </button>
                    <button
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Appear away")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center">
                        <AppearAwayIcon />
                      </div>
                      <span className="inter-regular text-[12px]">
                        Appear away
                      </span>
                    </button>
                    <button
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Offline")}
                    >
                      <OfflineStatusIcon />
                      <span className="inter-regular text-[12px]">Offline</span>
                    </button>
                    <button
                      className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      onClick={() => handleStatusSelect("Out of office")}
                    >
                      <div className="w-[20px] h-[20px] flex items-center justify-center">
                        <OutOfOfficeIcon />
                      </div>
                      <span className="inter-regular text-[12px]">
                        Out of office
                      </span>
                    </button>
                  </div> */}
                  <div className="flex flex-col w-full h-full p-5 gap-3 [&>button]:cursor-pointer">
                    {STATUS_LIST.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => handleStatusSelect(status)}
                        className="flex flex-row items-center w-full h-[17px] px-[5px] py-[2px] gap-[25px] hover:bg-gray-100 rounded"
                      >
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          {status.icon}
                        </div>

                        <span className="inter-regular text-[12px]">
                          {status.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Account Activity Button */}
            <button
              className={`flex items-center justify-between text-left gap-[10px] py-2 px-3 rounded w-full h-[34px] hover:w-full ${activeMenu === "activity" ? "bg-[#C4C4C480]" : "hover:bg-gray-100"}`}
              onClick={accountActivityHandler}
            >
              <div className="flex flex-row items-center w-[140px] gap-[20px] whitespace-nowrap cursor-pointer">
                <div className="mr-2 w-[20px] h-[20px] flex items-center justify-center">
                  <AccountActivitiesIcon />
                </div>
                <span className="inter-regular text-[12px]">
                  Account Activities
                </span>
              </div>
              <div className="w-[12px] h-[12px] flex items-center justify-center">
                <ArrowIcon
                  size={7}
                  direction={activeMenu === "activity" ? "down" : "left"}
                />
              </div>
            </button>
            <hr className="border-t border-[#D9D9D9] mt-2" />
          </div>

          <div className="flex flex-row w-[218px] h-[32px] mt-3">
            <button
              className="w-[104px] h-[32px] rounded-[32px] bg-[#040B23] cursor-pointer"
              onClick={handleAccountSettingsClick}
            >
              <span className="inter-regular text-[12px] text-white">
                Settings
              </span>
            </button>
            <button
              className="w-[104px] h-[32px] flex items-center justify-center"
              onClick={handleLogoutClick}
            >
              <div className="flex flex-row w-[64px] h-[20px] gap-[10px] cursor-pointer">
                <div className="w-[16px] h-[16px] flex items-center justify-center">
                  <LogoutIcon />
                </div>
                <span className="inter-regular text-[12px] text-[#FC3737]">
                  Logout
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Account Activity Modal */}
      {activeMenu === "activity" && (
        <div
          ref={activityModalRef}
          className="fixed top-[350px] right-[40px] z-50"
          style={{ transform: "translate(-50%, -50%)" }}
          onClick={(e) => e.stopPropagation()} // Prevent click from closing
        >
          <div className="w-[714px] h-[499px] bg-white rounded-[20px] p-[20px] opacity-100 shadow-lg flex flex-col">
            <div className="flex flex-col w-full h-[63px] gap-[10px] px-[12px] py-[4px]">
              <span className="inter-bold text-[18px] text-black text-left">
                Activity Logs
              </span>
              <span className="inter-medium text-[12px] text-black text-left">
                Recent account login activities
              </span>
            </div>
            <div className="flex flex-col w-full h-full px-[10px] py-[10px] gap-[0px] items-center justify-center">
              <div className="w-[654px] h-[330px] gap-[5px] overflow-auto">
                <div className="overflow-hidden">
                  <table className="min-w-full table-fixed">
                    <thead>
                      <tr className="w-full h-[40px] bg-[#040B23]">
                        <th className="w-1/3 py-2 px-4 inter-regular text-[12px] text-white h-[19px] text-start">
                          Browser
                        </th>
                        <th className="w-1/3 py-2 px-4 inter-regular text-[12px] text-white h-[19px] text-start">
                          IP address
                        </th>
                        <th className="w-1/3 py-2 px-4 inter-regular text-[12px] text-white h-[19px] text-start">
                          Time
                        </th>
                        <th className="w-1/3 py-2 px-4 inter-regular text-[12px] text-white h-[19px] text-start">
                          Action
                        </th>
                      </tr>
                    </thead>
                    {/* <tbody>
                      {activityRows.map((row, idx) => (
                        <tr key={idx} className="h-[26px] text-left">
                          <td className="py-0 px-4 inter-regular text-[14px] text-black h-[40px] align-middle text-start whitespace-nowrap">
                            {row.browser}
                          </td>
                          <td className="py-0 px-4 inter-regular text-[14px] text-black h-[40px] align-middle text-start whitespace-nowrap">
                            {row.ip}
                          </td>
                          <td className="py-0 px-4 inter-regular text-[14px] text-black h-[40px] align-middle text-start whitespace-nowrap">
                            {row.time}
                          </td>
                          <td className="py-0 px-4 inter-regular text-[14px] text-black h-[40px] align-middle text-start whitespace-nowrap">
                            {row.Action}
                          </td>
                        </tr>
                      ))}
                    </tbody> */}
                    <tbody>
                      {activities.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-5">
                            No activities found
                          </td>
                        </tr>
                      ) : (
                        activities.map((item, idx) => (
                          <tr
                            key={idx}
                            className="h-[26px] text-left text-[#000000]"
                          >
                            <td className="py-0 px-4 text-[14px] inter-regular h-[40px] align-middle text-start whitespace-nowrap">
                              {String(item.device_details || "Unknown Device")}
                            </td>

                            <td className="py-0 px-4 text-[14px] inter-regular h-[40px] align-middle text-start whitespace-nowrap">
                              {String(item.ip_address || "-")}
                            </td>

                            <td className="py-0 px-4 text-[14px] inter-regular h-[40px] align-middle text-start whitespace-nowrap">
                              {item.timestamp
                                ? new Date(item.timestamp).toLocaleString()
                                : "-"}
                            </td>

                            <td className="py-0 px-4 text-[14px] inter-regular h-[40px] align-middle text-start whitespace-nowrap">
                              Logout
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <button
                className="w-[164px] h-[30px] rounded-[8px] bg-[#FFE5E5] mt-3 flex items-center justify-center"
                onClick={handleLogoutAllDevices}
              >
                <span className="inter-regular text-[12px] text-[#F70027] cursor-pointer">
                  Logout from all devices
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;
