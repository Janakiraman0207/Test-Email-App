import React, { useState, useRef, useEffect } from 'react';
// Import the API helpers from your api.js file
import { getCalendarSettings, updateCalendarSettings } from '../../../api/api';

// Allowed types defined in settings.py
const weekOptions = ['Sunday', 'Monday']; 
const viewOptions = ['Day', 'Week', 'Month'];

const SettingsCalendar = () => {
  const [loading, setLoading] = useState(true);
  
  const [startWeek, setStartWeek] = useState('Sunday');
  const [weekOpen, setWeekOpen] = useState(false);
  const weekRef = useRef(null);

  const [defaultView, setDefaultView] = useState('Week');
  const [viewOpen, setViewOpen] = useState(false);
  const viewRef = useRef(null);

  const [showWeekends, setShowWeekends] = useState(true);
  const [showDeclined, setShowDeclined] = useState(false);

  // 1. Fetch settings from backend on mount
  useEffect(() => {
    const fetchCalendarSettings = async () => {
      try {
        const response = await getCalendarSettings();
        const data = response.data;
        
        setStartWeek(data.start_week_on);
        setDefaultView(data.default_view);
        setShowWeekends(data.show_weekends);
        setShowDeclined(data.show_declined_events);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch calendar settings:", err);
        setLoading(false);
      }
    };
    fetchCalendarSettings();
  }, []);

  // 2. Real-time API update handler
  const handleUpdate = async (patchData) => {
    try {
      await updateCalendarSettings(patchData);
    } catch (err) {
      console.error("Failed to update calendar settings:", err);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (weekRef.current && !weekRef.current.contains(event.target)) setWeekOpen(false);
      if (viewRef.current && !viewRef.current.contains(event.target)) setViewOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return null;

  return (
    <div className='flex-grow flex flex-col h-full gap-[42px] px-[20px] py-[10px]'>
      <h1 className='inter-bold text-[18px] text-[black]'>Calendar Settings</h1>
      <div className='flex flex-col w-full h-[296px] gap-[20px]'>

        {/* Week Dropdown */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Start week on</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Choose which day your week starts</span>
          </div>
          <div
            className='relative flex flex-row items-center justify-center text-[black] w-[117px] h-[32px] rounded-[12px] bg-[#EDECFF] gap-[10px] px-[10px] cursor-pointer select-none'
            onClick={() => setWeekOpen((prev) => !prev)}
            ref={weekRef}
          >
            <span className='inter-regular text-[12px]'>{startWeek}</span>
            <svg width="9" height="5" viewBox="0 0 9 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.5 0.5C8.5 0.5 5.554 4.5 4.5 4.5C3.446 4.5 0.5 0.5 0.5 0.5" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {weekOpen && (
              <div className="absolute top-[36px] left-0 w-full bg-white rounded-[8px] shadow z-20 border border-[#EAEAEA]">
                {weekOptions.map((option) => (
                  <div
                    key={option}
                    className={`px-[10px] py-[6px] text-[12px] inter-regular hover:bg-[#EDECFF] cursor-pointer ${option === startWeek ? 'text-[#6A37F5]' : 'text-[#03081B]'}`}
                    onClick={e => {
                      e.stopPropagation();
                      setStartWeek(option);
                      setWeekOpen(false);
                      handleUpdate({ start_week_on: option }); // Update backend
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Default view Dropdown */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Default view</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Set your preferred calendar view</span>
          </div>
          <div
            className='relative flex flex-row items-center justify-center text-[black] w-[117px] h-[32px] rounded-[12px] bg-[#EDECFF] gap-[10px] px-[10px] cursor-pointer select-none'
            onClick={() => setViewOpen((prev) => !prev)}
            ref={viewRef}
          >
            <span className='inter-regular text-[12px]'>{defaultView}</span>
            <svg width="9" height="5" viewBox="0 0 9 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.5 0.5C8.5 0.5 5.554 4.5 4.5 4.5C3.446 4.5 0.5 0.5 0.5 0.5" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {viewOpen && (
              <div className="absolute top-[36px] left-0 w-full bg-white rounded-[8px] shadow z-20 border border-[#EAEAEA]">
                {viewOptions.map((option) => (
                  <div
                    key={option}
                    className={`px-[10px] py-[6px] text-[12px] inter-regular hover:bg-[#EDECFF] cursor-pointer ${option === defaultView ? 'text-[#6A37F5]' : 'text-[#03081B]'}`}
                    onClick={e => {
                      e.stopPropagation();
                      setDefaultView(option);
                      setViewOpen(false);
                      handleUpdate({ default_view: option }); // Update backend
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Show weekends toggle */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Show weekends</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Display saturday and sunday in calendar</span>
          </div>
          <button
            className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${showWeekends ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'}`}
            onClick={() => {
                const newVal = !showWeekends;
                setShowWeekends(newVal);
                handleUpdate({ show_weekends: newVal }); // Update backend
            }}
            type="button"
          >
            <div className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${showWeekends ? 'bg-white' : 'bg-[#6A37F5]'}`}
              style={{ transform: showWeekends ? 'translateX(19px)' : 'translateX(0)' }}></div>
          </button>
        </div>

        {/* Show declined events toggle */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Show declined events</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Display events you’ve declined in calendar</span>
          </div>
          <button
            className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${showDeclined ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'}`}
            onClick={() => {
                const newVal = !showDeclined;
                setShowDeclined(newVal);
                handleUpdate({ show_declined_events: newVal }); // Update backend
            }}
            type="button"
          >
            <div className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${showDeclined ? 'bg-white' : 'bg-[#6A37F5]'}`}
              style={{ transform: showDeclined ? 'translateX(19px)' : 'translateX(0)' }}></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsCalendar;