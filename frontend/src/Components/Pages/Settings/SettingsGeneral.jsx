import React, { useState, useRef, useEffect } from 'react';
import { fetchGeneralSettings } from '../../../api/api'; 

const languageOptions = [
  'English (US)',
  'English (UK)',
  'Spanish',
  'French',
  'German',
];

const timeZoneOptions = [
  'GMT +5:30',
  'GMT +0:00',
  'GMT -5:00',
  'GMT +1:00',
  'GMT +8:00',
];

const SettingsGeneral = () => {
  const [desktopNotif, setDesktopNotif] = useState(false);
  const [soundNotif, setSoundNotif] = useState(false);
  const [language, setLanguage] = useState('English (US)');
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  const [timeZone, setTimeZone] = useState('GMT +5:30');
  const [tzOpen, setTzOpen] = useState(false);
  const tzRef = useRef(null);

  // Fetch general settings on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetchGeneralSettings(token)
      .then(data => {
        if (data.language) setLanguage(data.language);
        if (data.timezone) setTimeZone(data.timezone);
        if (typeof data.desktop_notification === 'boolean') setDesktopNotif(data.desktop_notification);
        if (typeof data.sound_notification === 'boolean') setSoundNotif(data.sound_notification);
      })
      .catch(err => console.error(err));
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
      if (tzRef.current && !tzRef.current.contains(event.target)) {
        setTzOpen(false);
      }
    }
    if (langOpen || tzOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [langOpen, tzOpen]);

  return (
    <div className='flex-grow flex flex-col h-full gap-[42px] px-[20px] py-[10px]'>
      <h1 className='inter-bold text-[18px] text-[black]'>General Setting</h1>
      <div className='flex flex-col w-full h-[296px] gap-[20px]'>
        {/* Language Dropdown */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Language</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Choose your preferred language</span>
          </div>
          <div
            className='relative flex flex-row items-center justify-center w-[117px] h-[32px] text-[black] rounded-[12px] bg-[#EDECFF] gap-[10px] px-[10px] cursor-pointer select-none'
            onClick={() => setLangOpen((prev) => !prev)}
            ref={langRef}
          >
            <span className='inter-regular text-[12px]'>{language}</span>
            <svg width="9" height="5" viewBox="0 0 9 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.5 0.5C8.5 0.5 5.554 4.5 4.5 4.5C3.446 4.5 0.5 0.5 0.5 0.5" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {langOpen && (
              <div className="absolute top-[36px] left-0 w-full bg-white rounded-[8px] shadow z-10 border border-[#EAEAEA]">
                {languageOptions.map((option) => (
                  <div
                    key={option}
                    className={`px-[10px] py-[6px] text-[12px] inter-regular hover:bg-[#EDECFF] cursor-pointer ${option === language ? 'text-[#6A37F5]' : 'text-[#03081B]'}`}
                    onClick={e => {
                      e.stopPropagation();
                      setLanguage(option);
                      setLangOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Time Zone Dropdown */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Time Zone</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Set your local time zone</span>
          </div>
          <div
            className='relative flex flex-row items-center justify-center text-[black] w-[117px] h-[32px] rounded-[12px] bg-[#EDECFF] gap-[10px] px-[10px] cursor-pointer select-none'
            onClick={() => setTzOpen((prev) => !prev)}
            ref={tzRef}
          >
            <span className='inter-regular text-[12px]'>{timeZone}</span>
            <svg width="9" height="5" viewBox="0 0 9 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.5 0.5C8.5 0.5 5.554 4.5 4.5 4.5C3.446 4.5 0.5 0.5 0.5 0.5" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {tzOpen && (
              <div className="absolute top-[36px] left-0 w-full bg-white rounded-[8px] shadow z-10 border border-[#EAEAEA]">
                {timeZoneOptions.map((option) => (
                  <div
                    key={option}
                    className={`px-[10px] py-[6px] text-[12px] inter-regular hover:bg-[#EDECFF] cursor-pointer ${option === timeZone ? 'text-[#6A37F5]' : 'text-[#03081B]'}`}
                    onClick={e => {
                      e.stopPropagation();
                      setTimeZone(option);
                      setTzOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Desktop Notification */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Desktop Notification</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Show notifications on your desktop</span>
          </div>
          <button
            className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${
              desktopNotif ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'
            }`}
            onClick={() => setDesktopNotif((prev) => !prev)}
            aria-pressed={desktopNotif}
            type="button"
          >
            <div
              className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                desktopNotif ? 'bg-white' : 'bg-[#6A37F5]'
              }`}
              style={{
                transform: desktopNotif ? 'translateX(19px)' : 'translateX(0)',
              }}
            ></div>
          </button>
        </div>
        {/* Sound Notification */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Sound Notification</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Play sound for new messages</span>
          </div>
          <button
            className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${
              soundNotif ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'
            }`}
            onClick={() => setSoundNotif((prev) => !prev)}
            aria-pressed={soundNotif}
            type="button"
          >
            <div
              className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                soundNotif ? 'bg-white' : 'bg-[#6A37F5]'
              }`}
              style={{
                transform: soundNotif ? 'translateX(19px)' : 'translateX(0)',
              }}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsGeneral;