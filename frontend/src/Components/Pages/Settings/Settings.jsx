import React, { useState, useEffect } from 'react';
import ProfileSettings from './ProfileSettings/ProfileSettings';
import SettingsGeneral from './SettingsGeneral';
import SettingsPeople from './SettingsPeople';
import SettingsCalendar from './SettingsCalendar';
import { fetchAccountSettings, getAccountSettings, updateAccountSettings } from '../../../api/api';
import { CloseIcon } from '../../../assets/icons/IconRegistry';
import { getUserProfile } from '../../../api/api';

const popupStyle = {
  position: 'absolute',
  width: '715px',
  height: '499px',
  top: '167px',
  left: '415px',
  background: '#FFFFFF',
  opacity: 1,
  borderWidth: '0px 0px 0px 0px',
  borderStyle: 'solid',
  borderColor: '#EAEAEA',
  boxSizing: 'border-box',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
};

function Settings({ centered = false, onClose }) {
  const [twoFactor, setTwoFactor] = useState(false);
  const [emailNotif, setEmailNotif] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSidebar, setActiveSidebar] = useState('Profile');
  const [user, setUser] = useState(null);

  useEffect(() => {
  getUserProfile()
    .then(data => setUser(data))
    .catch(err => console.error(err));
  const sessionLoaded = sessionStorage.getItem('settings_loaded');
  if (!sessionLoaded) {
    getAccountSettings()
  .then(res => {
    const data = res.data; // extract actual data
    const emailVal = data.email_notifications_account ?? true;
    const twoFaVal = data.two_fa ?? false;
    setTwoFactor(twoFaVal);
    setEmailNotif(emailVal);
    localStorage.setItem('email_notifications', JSON.stringify(emailVal));
    window.dispatchEvent(new Event('storage'));
    sessionStorage.setItem('settings_loaded', 'true');
  })
      .catch(err => console.error(err));
  } else {
    const emailVal = JSON.parse(localStorage.getItem('email_notifications') ?? 'true');
    setEmailNotif(emailVal);
  }
}, []);

  const resolvedPopupStyle = centered
    ? { ...popupStyle, position: 'relative', top: 'auto', left: 'auto' }
    : popupStyle;

  return (
    <div style={resolvedPopupStyle}>
      <div className='relative w-full h-[60px] border-b-[1px] border-[#EAEAEA]'>
        <div
          className="absolute top-0 left-0 right-0 h-[100px] pointer-events-none"
          style={{ background: ` linear-gradient( to bottom, rgba(185,160,255,0.54) 0%, rgba(78,115,255,0.26) 40%, rgba(255,255,255,0) 100% )`, }} />
        <h1 className='inter-bold text-[18px] text-[#03081B] px-[25px] pt-[25px]'>Settings</h1>
        <button onClick={onClose} className="absolute top-[18px] right-[18px] w-[32px] h-[32px] flex items-center justify-center cursor-pointer" > <CloseIcon size={24} /> </button>
      </div>
      <div className='flex-grow flex flex-row overflow-auto'>
        {/* Left Sidebar */}
        <div className='w-[240px] h-full flex flex-col border-r-[1px] border-[#EAEAEA] gap-[20px] pl-[30px] py-[25px]'>
          <div className='flex flex-row items-center gap-[10px] w-[190px] h-[40px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[15px] py-[10px] bg-white'>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.83333 9.83333L12.5 12.5M11.1667 5.83333C11.1667 4.41885 10.6048 3.06229 9.60457 2.0621C8.60438 1.0619 7.24782 0.5 5.83333 0.5C4.41885 0.5 3.06229 1.0619 2.0621 2.0621C1.0619 3.06229 0.5 4.41885 0.5 5.83333C0.5 7.24782 1.0619 8.60438 2.0621 9.60457C3.06229 10.6048 4.41885 11.1667 5.83333 11.1667C7.24782 11.1667 8.60438 10.6048 9.60457 9.60457C10.6048 8.60438 11.1667 7.24782 11.1667 5.83333Z" stroke="#70707C" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search settings"
              className="inter-regular text-[14px]  bg-transparent outline-none w-full"
            />
          </div>
          <div className='flex flex-col w-[88px] h-full gap-[10px]'>
            {/* Account */}
            <div
              className={`flex flex-row items-center gap-[12px] cursor-pointer ${activeSidebar === 'Account' ? 'bg-[#6A37F5] rounded-[9px] w-[190px] h-[44px] px-[15px] py-[10px]' : 'w-[190px] h-[44px] px-[15px] py-[10px]'} `}
              onClick={() => setActiveSidebar('Account')}
            >
              <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.83333 3.16667C7.83333 3.87391 7.55238 4.55219 7.05229 5.05229C6.55219 5.55238 5.87391 5.83333 5.16667 5.83333C4.45942 5.83333 3.78115 5.55238 3.28105 5.05229C2.78095 4.55219 2.5 3.87391 2.5 3.16667C2.5 2.45942 2.78095 1.78115 3.28105 1.28105C3.78115 0.780951 4.45942 0.5 5.16667 0.5C5.87391 0.5 6.55219 0.780951 7.05229 1.28105C7.55238 1.78115 7.83333 2.45942 7.83333 3.16667Z" stroke={activeSidebar === 'Account' ? 'white' : '#70707C'}/>
                <path d="M6.5 7.83301H3.83333C2.94928 7.83301 2.10143 8.1842 1.47631 8.80932C0.851189 9.43444 0.5 10.2823 0.5 11.1663C0.5 11.52 0.640476 11.8591 0.890524 12.1092C1.14057 12.3592 1.47971 12.4997 1.83333 12.4997H8.5C8.85362 12.4997 9.19276 12.3592 9.44281 12.1092C9.69286 11.8591 9.83333 11.52 9.83333 11.1663C9.83333 10.2823 9.48214 9.43444 8.85702 8.80932C8.2319 8.1842 7.38406 7.83301 6.5 7.83301Z" stroke={activeSidebar === 'Account' ? 'white' : '#70707C'} strokeLinejoin="round"/>
              </svg>
              <span className={`inter-regular text-[14px] ${activeSidebar === 'Account' ? 'text-white' : 'text-[#70707C]'}`}>Account</span>
            </div>
            {/* General */}
            <div
              className={`flex flex-row items-center gap-[12px] cursor-pointer ${activeSidebar === 'General' ? 'bg-[#6A37F5] rounded-[9px] w-[190px] h-[44px] px-[15px] py-[10px]' : 'w-[190px] h-[44px] px-[15px] py-[10px]'} `}
              onClick={() => setActiveSidebar('General')}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.0384 2.08907C9.64507 2.08907 9.44774 2.08907 9.2684 2.0224L9.1944 1.99174C9.0204 1.91174 8.88107 1.77307 8.6024 1.4944C7.96107 0.853069 7.6404 0.532402 7.2464 0.502402C7.19312 0.499199 7.13969 0.499199 7.0864 0.502402C6.6924 0.532402 6.37174 0.853069 5.7304 1.4944C5.45174 1.77307 5.3124 1.9124 5.1384 1.99174L5.06507 2.0224C4.88507 2.08907 4.6884 2.08907 4.2944 2.08907H4.22107C3.2164 2.08907 2.71374 2.08907 2.40107 2.40107C2.0884 2.71307 2.08907 3.2164 2.08907 4.22107V4.2944C2.08907 4.68774 2.08907 4.88507 2.0224 5.0644C2.01262 5.08974 2.0024 5.1144 1.99174 5.1384C1.91174 5.3124 1.77307 5.45174 1.4944 5.7304C0.853069 6.37174 0.532402 6.6924 0.502402 7.0864C0.499199 7.13969 0.499199 7.19312 0.502402 7.2464C0.532402 7.6404 0.853069 7.96107 1.4944 8.6024C1.77307 8.88107 1.9124 9.0204 1.99174 9.1944C2.00285 9.2184 2.01307 9.24285 2.0224 9.26774C2.08907 9.44774 2.08907 9.6444 2.08907 10.0384V10.1117C2.08907 11.1164 2.08907 11.6191 2.40107 11.9317C2.71307 12.2444 3.2164 12.2437 4.22107 12.2437H4.2944C4.68774 12.2437 4.88507 12.2437 5.0644 12.3104C5.08974 12.3197 5.1144 12.33 5.1384 12.3411C5.3124 12.4211 5.45174 12.5597 5.7304 12.8384C6.37174 13.4797 6.6924 13.8004 7.0864 13.8304C7.13974 13.8344 7.19307 13.8344 7.2464 13.8304C7.6404 13.8004 7.96107 13.4797 8.6024 12.8384C8.88107 12.5597 9.0204 12.4211 9.1944 12.3411C9.2184 12.33 9.24285 12.3197 9.26774 12.3104C9.44774 12.2437 9.6444 12.2437 10.0384 12.2437H10.1117C11.1164 12.2437 11.6191 12.2437 11.9317 11.9317C12.2444 11.6197 12.2437 11.1164 12.2437 10.1117V10.0384C12.2437 9.64507 12.2437 9.44774 12.3104 9.2684C12.3197 9.24307 12.33 9.2184 12.3411 9.1944C12.4211 9.0204 12.5597 8.88107 12.8384 8.6024C13.4797 7.96107 13.8004 7.6404 13.8304 7.2464C13.8344 7.19307 13.8344 7.13974 13.8304 7.0864C13.8004 6.6924 13.4797 6.37174 12.8384 5.7304C12.5597 5.45174 12.4211 5.3124 12.3411 5.1384L12.3104 5.06507C12.2437 4.88507 12.2437 4.6884 12.2437 4.2944V4.22107C12.2437 3.2164 12.2437 2.71374 11.9317 2.40107C11.6197 2.0884 11.1164 2.08907 10.1117 2.08907H10.0384Z" stroke={activeSidebar === 'General' ? 'white' : '#70707C'}/>
                <path d="M9.49967 7.16536C9.49967 7.47178 9.43932 7.7752 9.32206 8.05829C9.2048 8.34139 9.03293 8.59861 8.81626 8.81528C8.59959 9.03195 8.34236 9.20382 8.05927 9.32108C7.77618 9.43834 7.47276 9.4987 7.16634 9.4987C6.85992 9.4987 6.55651 9.43834 6.27341 9.32108C5.99032 9.20382 5.7331 9.03195 5.51643 8.81528C5.29976 8.59861 5.12788 8.34139 5.01062 8.05829C4.89336 7.7752 4.83301 7.47178 4.83301 7.16536C4.83301 6.54653 5.07884 5.95303 5.51643 5.51545C5.95401 5.07786 6.5475 4.83203 7.16634 4.83203C7.78518 4.83203 8.37867 5.07786 8.81626 5.51545C9.25384 5.95303 9.49967 6.54653 9.49967 7.16536Z" stroke={activeSidebar === 'General' ? 'white' : '#70707C'}/>
              </svg>
              <span className={`inter-regular text-[14px] ${activeSidebar === 'General' ? 'text-white' : 'text-[#70707C]'}`}>General</span>
            </div>
            {/* People */}
            <div
              className={`flex flex-row items-center gap-[12px] cursor-pointer ${activeSidebar === 'People' ? 'bg-[#6A37F5] rounded-[9px] w-[190px] h-[44px] px-[15px] py-[10px]' : 'w-[190px] h-[44px] px-[15px] py-[10px]'} `}
              onClick={() => setActiveSidebar('People')}
            >
              <svg width="15" height="12" viewBox="0 0 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9.83333 0.5V3.16667M3.83333 0.5V3.16667M0.5 5.83333H12.5M7.16667 1.83333H5.83333C3.31933 1.83333 2.062 1.83333 1.28133 2.61467C0.500667 3.396 0.5 4.65267 0.5 7.16667V8.5C0.5 11.014 0.5 12.2713 1.28133 13.052C2.06267 13.8327 3.31933 13.8333 5.83333 13.8333H7.16667C9.68067 13.8333 10.938 13.8333 11.7187 13.052C12.4993 12.2707 12.5 11.014 12.5 8.5V7.16667C12.5 4.65267 12.5 3.39533 11.7187 2.61467C10.9373 1.834 9.68067 1.83333 7.16667 1.83333Z"
                  stroke={activeSidebar === 'People' ? 'white' : '#70707C'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={`inter-regular text-[14px] ${activeSidebar === 'People' ? 'text-white' : 'text-[#70707C]'}`}>People</span>
            </div>
            {/* Calendar */}
            <div
              className={`flex flex-row items-center gap-[12px] cursor-pointer ${activeSidebar === 'Calendar' ? 'bg-[#6A37F5] rounded-[9px] w-[190px] h-[44px] px-[15px] py-[10px]' : 'w-[190px] h-[44px] px-[15px] py-[10px]'} `}
              onClick={() => setActiveSidebar('Calendar')}
            >
              <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.16667 0.5V3.16667M3.83333 0.5V3.16667M0.5 5.83333H12.5M7.16667 1.83333H5.83333C3.31933 1.83333 2.062 1.83333 1.28133 2.61467C0.500667 3.396 0.5 4.65267 0.5 7.16667V8.5C0.5 11.014 0.5 12.2713 1.28133 13.052C2.06267 13.8327 3.31933 13.8333 5.83333 13.8333H7.16667C9.68067 13.8333 10.938 13.8333 11.7187 13.052C12.4993 12.2707 12.5 11.014 12.5 8.5V7.16667C12.5 4.65267 12.5 3.39533 11.7187 2.61467C10.9373 1.834 9.68067 1.83333 7.16667 1.83333Z" stroke={activeSidebar === 'Calendar' ? 'white' : '#70707C'} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={`inter-regular text-[14px] ${activeSidebar === 'Calendar' ? 'text-white' : 'text-[#70707C]'}`}>Calendar</span>
            </div>
            {/* Profile Settings */}
            <div
              className={`flex flex-row items-center gap-[12px] cursor-pointer ${activeSidebar === 'Profile' ? 'bg-[#6A37F5] rounded-[9px] w-[190px] h-[44px] px-[15px] py-[10px]' : 'w-[190px] h-[44px] px-[15px] py-[10px]'} `}
              onClick={() => setActiveSidebar('Profile')}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6.33333 0C5.36087 0 4.42824 0.386309 3.74061 1.07394C3.05297 1.76158 2.66667 2.69421 2.66667 3.66667C2.66667 4.63913 3.05297 5.57176 3.74061 6.25939C4.42824 6.94703 5.36087 7.33333 6.33333 7.33333C7.30579 7.33333 8.23842 6.94703 8.92606 6.25939C9.61369 5.57176 10 4.63913 10 3.66667C10 2.69421 9.61369 1.76158 8.92606 1.07394C8.23842 0.386309 7.30579 0 6.33333 0ZM11.6667 7.16667V8.084C12.1433 8.20667 12.568 8.45733 12.9027 8.79867L13.6973 8.33933L14.364 9.494L13.57 9.95267C13.6998 10.4198 13.6998 10.9135 13.57 11.3807L14.364 11.8393L13.6973 12.994L12.9027 12.5347C12.5633 12.8808 12.136 13.1279 11.6667 13.2493V14.1667H10.3333V13.2493C9.86403 13.1279 9.43672 12.8808 9.09733 12.5347L8.302 12.994L7.63533 11.8393L8.43 11.3807C8.30018 10.9135 8.30018 10.4198 8.43 9.95267L7.63533 9.494L8.302 8.33933L9.09733 8.798C9.4368 8.45211 9.86411 8.20526 10.3333 8.084V7.16667H11.6667ZM9.83267 10.022C9.72348 10.2193 9.66614 10.4411 9.666 10.6667C9.666 10.9 9.72667 11.12 9.83267 11.3113L9.85667 11.3533C9.97513 11.5508 10.1427 11.7142 10.3431 11.8276C10.5434 11.9411 10.7697 12.0007 11 12.0007C11.2302 12.0007 11.4566 11.9411 11.6569 11.8276C11.8573 11.7142 12.0249 11.5508 12.1433 11.3533L12.1673 11.3113C12.2733 11.12 12.3333 10.9007 12.3333 10.6667C12.3333 10.4333 12.2733 10.2133 12.1673 10.022L12.1427 9.98C12.0242 9.78271 11.8566 9.61946 11.6563 9.50611C11.456 9.39277 11.2298 9.3332 10.9997 9.3332C10.7695 9.3332 10.5433 9.39277 10.343 9.50611C10.1427 9.61946 9.97517 9.78271 9.85667 9.98L9.83267 10.022ZM7.37467 8C6.80503 8.77227 6.49843 9.70704 6.5 10.6667C6.49843 11.6263 6.80503 12.5611 7.37467 13.3333H0V12C0 10.9391 0.421427 9.92172 1.17157 9.17157C1.92172 8.42143 2.93913 8 4 8H7.37467Z"
                  fill={activeSidebar === 'Profile' ? 'white' : '#70707C'}
                />
              </svg>
              <span className={`inter-regular text-[14px] ${activeSidebar === 'Profile' ? 'text-white' : 'text-[#70707C]'}`}>Profile Settings</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {activeSidebar === 'Account' && (
          <div className='flex-grow flex flex-col h-full gap-[42px] px-[20px] py-[10px]'>
            <h1 className='inter-bold text-[18px] text-[black]'>Account Settings</h1>
            <div className='flex flex-col w-full h-[296px] gap-[20px]'>
              <div className='w-full flex flex-col h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
                <h2 className='inter-medium text-[12px] text-[black]'>Email Address</h2>
                <span className='inter-regular text-[12px] text-[#70707C]'>
                  {user ? user.email : 'Loading...'}
                </span>
              </div>
              <div className='w-full flex flex-col h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
                <h2 className='inter-medium text-[12px] text-[black]'>User Name</h2>
                <span className='inter-regular text-[12px] text-[#70707C]'>
                  {user ? user.username : 'Loading...'}
                </span>
              </div>
              <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
                <div className='flex flex-col gap-[5px]'>
                  <h2 className='inter-medium text-[12px] text-[black]'>Two-factor authentication</h2>
                  <span className='inter-regular text-[12px] text-[#70707C]'>Add an extra layer of security</span>
                </div>
                <button
                  className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${
                    twoFactor ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'
                  }`}
                  onClick={() => {
                    const newValue = !twoFactor;
                    setTwoFactor(newValue);
                    updateAccountSettings({ two_fa: newValue })
                      .catch(err => console.error(err));
                  }}
                  aria-pressed={twoFactor}
                  type="button"
                >
                  <div
                    className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                      twoFactor ? 'bg-white' : 'bg-[#6A37F5]'
                    }`}
                    style={{
                      transform: twoFactor ? 'translateX(19px)' : 'translateX(0)',
                    }}
                  ></div>
                </button>
              </div>
              <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
                <div className='flex flex-col gap-[5px]'>
                  <h2 className='inter-medium text-[12px] text-[black]'>Email notification</h2>
                  <span className='inter-regular text-[12px] text-[#70707C]'>Receive email updates about your account</span>
                </div>
                <button
                  className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] cursor-pointer transition-colors duration-200 ${
                    emailNotif ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'
                  }`}
                  onClick={() => {
                    const newValue = !emailNotif;
                    setEmailNotif(newValue);
                    localStorage.setItem('email_notifications', JSON.stringify(newValue));
                    window.dispatchEvent(new Event('storage'));
                    updateAccountSettings({ email_notifications_account: newValue })
                      .then(res => console.log('✅ Saved to backend:', res))
                      .catch(err => console.error('❌ Failed to save:', err));
                  }}
                  aria-pressed={emailNotif}
                  type="button"
                >
                  <div
                    className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                      emailNotif ? 'bg-white' : 'bg-[#6A37F5]'
                    }`}
                    style={{
                      transform: emailNotif ? 'translateX(19px)' : 'translateX(0)',
                    }}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        )}
        {activeSidebar === 'General' && (
          <SettingsGeneral />
        )}
        {activeSidebar === 'People' && (
          <SettingsPeople />
        )}
        {activeSidebar === 'Calendar' && (
          <SettingsCalendar />
        )}
        {/*  Profile Settings  */}
        {activeSidebar === 'Profile' && <ProfileSettings />}
      </div>
    </div>
  );
}

export default Settings;