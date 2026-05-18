import React, { useEffect, useRef, useState } from "react";
// import {
//   BellIcon,
//   SearchIcon,
//   SettingsIcon
// } from "../../../../assets/icons/IconRegistry";
import {
  BellIcon,
  SearchIcon,
  SettingsIcon,
} from "../../../../assets/icons/Icons";
import profileimg from "../../../../assets/images/profileimg.png";
import { getUserProfile } from "../../../../api/api";
import ProfileDropdown from "./ProfileDropdown";
import { ArrowIcon, StatusDotIcon } from "../../../../assets/icons/IconRegistry";
import Settings from "../../Settings/Settings";
import { useSelector } from "react-redux";
import { statusTextColor, STATUS_LIST } from "../../../../constants/StatusList";
import {StatusIcon} from "../../../../assets/icons/IconRegistry";


export const Navbar = () => {
  const [profile, setProfile] = useState({
    name: "",
    img: profileimg,
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileRef = useRef(null);
  const currentStatus = useSelector((state) => state.status.currentStatus);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // Fetch profile data from API
        const data = await getUserProfile();
        // console.log('Received profile data:', data);

        // Extract username from various possible fields
        let username = "User";
        if (data) {
          // Based on the response: {first_name: 'Priya56', last_name: 'priya'}
          // Combine first_name and last_name
          if (data.first_name && data.last_name) {
            username = `${data.first_name} ${data.last_name}`;
          } else if (data.first_name) {
            username = data.first_name;
          } else if (data.username) {
            username = data.username;
          } else if (data.name) {
            username = data.name;
          } else if (data.email) {
            // Use email prefix if no name is available
            username = data.email.split("@")[0];
          }
        }

        // Extract profile image from various possible fields
        let profileImage = profileimg;
        if (data) {
          profileImage =
            data.profile_picture ||
            data.avatar ||
            data.profile_image ||
            data.image ||
            data.photo_url ||
            data.profile_photo ||
            profileimg;
        }

        let email = "";
        if (data && data.email) {
          email = data.email;
        }

        // console.log('Setting profile name:', username);
        // console.log('Setting profile image:', profileImage);

        setProfile({
          name: username,
          img: profileImage,
          email: email,
        });
      } catch (error) {
        console.error("Error in Navbar profile fetch:", error);
        // Fallback to default values
        setProfile({
          name: "User",
          img: profileimg,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (!profileRef.current) return;
      if (profileRef.current.contains(e.target)) return;
      setDropdownOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const profileDropdownHandler = (e) => {
    e.stopPropagation();

    if (dropdownOpen) {
      setDropdownOpen(false);
    } else {
      setDropdownOpen(true);
    }
  };
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {showSettings && (
        <div
          className="fixed inset-0 bg-[#00000040] z-50 flex items-center justify-center"
          onClick={() => setShowSettings(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Settings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}
      <header className="w-full h-[67px] px-[42px] bg-[#040B23] flex items-center justify-between text-white">
        <div className="h-full flex items-center w-full">
          <div className="w-[100px]">
            <span className="krona-one-regular text-[#FFFFFF] text-[12px]">
              STACKLY
            </span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center h-[28px] w-[302px] rounded-[6px] ml-[20px] bg-white/10 border border-white/20 group">
              <div className="flex items-center justify-center px-[10px] gap-[8px]">
                <SearchIcon />
                <select
                  className="bg-transparent text-white/70 text-[13px] outline-none"
                  id="select"
                  name="select"
                >
                  <option>Mail</option>
                </select>
              </div>
              <div className="w-px h-4 bg-white/20 border-[#8D8D8D]" />
              <input
                type="text"
                placeholder="Search here"
                className="bg-transparent outline-none text-white/70 text-[13px] w-full placeholder:text-white/50 pl-[12px]"
              />
            </div>
          </div>
          <div className="w-[466px]" />
          <div className="flex items-center ml-[350px] gap-6">
            <BellIcon />
            <div
              onClick={() => setShowSettings(true)}
              className="cursor-pointer"
            >
              <SettingsIcon />
            </div>

            {/* User Profile Section */}
            <div className="relative" ref={profileRef}>
              <div
                className="flex items-center justify-center w-[179px] h-[44px] rounded-[22px] bg-[#1C1D3B] cursor-pointer"
                onClick={profileDropdownHandler}
              >
                {loading ? (
                  // Loading skeleton
                  <div className="flex flex-row items-center justify-between w-[159px] h-[28px] gap-[10px]">
                    <div className="flex flex-row w-[120px] h-[28px] gap-[5px]">
                      <div className="w-[28px] h-[28px] rounded-full bg-gray-700 animate-pulse"></div>
                      <div className="flex flex-col w-[84px] h-[28px] gap-1">
                        <div className="w-[84px] h-[15px] bg-gray-700 rounded animate-pulse"></div>
                        <div className="w-[33px] h-[10px] bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-[12px] h-[12px] flex items-center justify-center">
                      <ArrowIcon />
                    </div>
                  </div>
                ) : (
                  // Profile data
                  <div className="flex flex-row items-center justify-between w-[159px] h-[28px] gap-[10px]">
                    <div className="flex flex-row w-[120px] h-[28px] gap-[5px]">
                      <img
                        src={profile.img}
                        alt="Profile"
                        className="w-[28px] h-[28px] rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = profileimg;
                        }}
                      />
                      <div className="flex flex-col w-[84px] h-[28px] ">
                        <span
                          className="w-[84px] h-[15px] inter-bold text-[12px] truncate"
                          style={{ letterSpacing: "2%" }}
                          title={profile.name}
                        >
                          {profile.name}
                        </span>
                        {/* <div className="flex flex-row items-center justify-center w-[33px] h-[10px] gap-[5px] ">
                        <StatusDotIcon />
                        <span
                          className="w-[25px] h-[10px] text-[8px] inter-medium text-[#1EAF53]"
                          style={{ letterSpacing: "2%" }}
                        >
                          Active
                        </span>
                      </div> */}
                        <div className="flex flex-row items-center gap-[4px] mt-[1px]">
                          <div className="flex items-center justify-center shrink-0">
                            {/* {currentStatus?.navbarIcon} */}
                            <StatusIcon
                              status={currentStatus?.value}
                              size={4}
                              iconSize={2}
                            />
                          </div>

                          <span
                            className="text-[8px] inter-medium text-[#1EAF53] whitespace-nowrap"
                            style={{
                              color: statusTextColor[currentStatus?.value],
                              letterSpacing: "2%",
                            }}
                          >
                            {currentStatus?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-[12px] h-[12px] flex items-center justify-center">
                      <ArrowIcon direction={dropdownOpen ? "up" : "down"} />
                    </div>
                  </div>
                )}
              </div>
              {dropdownOpen && (
                <ProfileDropdown
                  profile={profile}
                  onClose={() => setDropdownOpen(false)}
                  openSettings={() => setShowSettings(true)}
                />
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
