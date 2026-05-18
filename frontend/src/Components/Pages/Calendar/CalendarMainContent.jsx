import React, { useState, useRef, useEffect } from 'react';
import { NewEvents } from './NewEvents/NewEvents';
import { SampleEvent } from './SampleEvent';
// Integration: Endpoints are now primarily handled by the Parent, 
// but createMeeting remains here for quick actions.
import { createMeeting } from '../../../api/api'; 

import {
  CalendarLeftArrowIcon,
  CalendarRightArrowIcon,
  CalendarDropdownBlackIcon,
  CalendarDropdownWhiteIcon
} from '../../../assets/icons/Icons1';

// Integration: Added 'events', 'onEventCreated', and 'loading' to props
export const CalendarMainContent = ({ currentDate, setCurrentDate, events, onEventCreated, loading }) => {
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState(null);
  const scrollContainerRef = useRef(null);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const scrollPosition = currentHour * 60; // 60px per hour
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Utility: Get week days dynamically
  const getWeekDays = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay()); // Sunday
    
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      days.push({
        name: dayNames[i],
        date: day.getDate()
      });
    }
    return days;
  };

  // Utility: Range Display Helpers
  const getWeekRange = (date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { day: 'numeric' })} - ${end.toLocaleDateString('en-US', { day: 'numeric' })} ${end.toLocaleDateString('en-US', { month: 'long' })}, ${end.getFullYear()}`;
  };

  const getDayRange = (date) => date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const getMonthRange = (date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(currentDate.getDate() - 1);
    else if (viewMode === 'week') newDate.setDate(currentDate.getDate() - 7);
    else if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') newDate.setDate(currentDate.getDate() + 1);
    else if (viewMode === 'week') newDate.setDate(currentDate.getDate() + 7);
    else if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  const getDisplayRange = () => {
    if (viewMode === 'day') return getDayRange(currentDate);
    if (viewMode === 'week') return getWeekRange(currentDate);
    return getMonthRange(currentDate);
  };

  // Integration: Handle Instant Meeting creation [cite: 155-161, 192]
  const handleCreateMeeting = async () => {
    const quickMeetingPayload = {
      title: "Quick Meeting",
      start_datetime: new Date().toISOString(),
      end_datetime: new Date(Date.now() + 30 * 60000).toISOString(), 
      is_all_day: false,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      attendees: [],
      reminders: [10]
    };

    try {
      const res = await createMeeting(quickMeetingPayload);
      if (res.data.url) {
        window.open(res.data.url, '_blank'); // Open Jitsi link [cite: 211-212]
        if (onEventCreated) onEventCreated(); // Refresh Parent data
      }
    } catch (err) {
      console.error("Failed to create meeting", err);
    }
  };

  const handleNewEvent = () => setShowEventModal(true);
  const handleCloseModal = () => { setSelectedSlotTime(null);setShowEventModal(false);}
  const handleDateDropdown = () => setShowDateDropdown(!showDateDropdown);

  const weekDays = getWeekDays(currentDate);

  // Add this inside your CalendarMainContent component
const handleEventClick = (event) => {
  if (event.url) {
    // SCENARIO: Meeting exists. Open Jitsi in a new tab
    window.open(event.url, '_blank');
  } else {
    // SCENARIO: Standard event. Open the Detail Modal (next step)
    // console.log("Opening details for event:", event.id);
    // setSelectedEvent(event);
    // setShowDetailModal(true);
  }
};

const handleGridClick = (e, dayIndex, hourIndex) => {
  const minutes = e.nativeEvent.offsetY > 30 ? "30" : "00";

  const hour = hourIndex.toString().padStart(2, "0");
  const time = `${hour}:${minutes}`;

  setSelectedSlotTime(time);
  setShowEventModal(true);
};

  return (
    <div className='flex flex-col w-full h-full gap-[10px]'> 
      {/* Top bar with navigation and controls */}
      <div className="flex items-center w-full h-[64px] border-b border-[#E2E2E2]">
        <div className='flex flex-row items-center justify-between w-[1100px] h-[32px] gap-[97px]'>
          <div className='flex flex-row items-center w-[321px] h-[17px] gap-[14px]'>
            <button 
              onClick={handleToday}
              className='inter-bold text-[14px] tracking-[0.07em] hover:text-[#040B23] transition-colors cursor-pointer'
            >
              Today
            </button>
            <div className='flex flex-row items-center justify-between w-[35px] h-[14px] px-[2px] gap-[7px]'>
              <button onClick={handlePrevious} className='hover:opacity-70 transition-opacity'>
                <CalendarLeftArrowIcon />
              </button>
              <button onClick={handleNext} className='hover:opacity-70 transition-opacity'>
                <CalendarRightArrowIcon />
              </button>
            </div>
            <span className='inter-bold text-[14px] tracking-[0.07em]'>{getDisplayRange()}</span>
            <div className='relative'>
              <button 
                onClick={handleDateDropdown}
                className='w-[14px] h-[14px] flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity'
              >
                <CalendarDropdownBlackIcon />
              </button>
              {showDateDropdown && (
                <div className='absolute top-[20px] left-0 w-[200px] bg-white border border-[#EAEAEA] rounded-[6px] shadow-lg z-10 p-3'>
                  <input 
                    type="date" 
                    value={currentDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      setCurrentDate(new Date(e.target.value));
                      setShowDateDropdown(false);
                    }}
                    className='w-full px-2 py-1 text-[12px] border border-[#EAEAEA] rounded-[4px] inter-regular'
                  />
                </div>
              )}
            </div>
          </div>
          <div className='flex flex-row w-[561px] h-[32px] gap-[14px]'>
            <div className='flex flex-row w-[200px] h-[32px] rounded-[6px] items-center py-[1px] px-[10px] gap-[30px] bg-[#F3F3F3]'>
              <button 
                onClick={() => setViewMode('day')}
                className={`flex items-center justify-center ${viewMode === 'day' ? 'w-[72px] h-[30px] rounded-[3px] bg-[#040B23] text-[white]' : 'text-[#040B23]'} inter-medium text-[12px] tracking-[0.07em] hover:opacity-90 transition-all`}
              >
                Day
              </button>
              <button 
                onClick={() => setViewMode('week')}
                className={`flex items-center justify-center ${viewMode === 'week' ? 'w-[72px] h-[30px] rounded-[3px] bg-[#040B23] text-[white]' : 'text-[#040B23]'} text-[12px] inter-medium hover:opacity-90 transition-all`}
              >
                Week
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`flex items-center justify-center ${viewMode === 'month' ? 'w-[72px] h-[30px] rounded-[3px] bg-[#040B23] text-[white]' : 'text-[#040B23]'} inter-medium text-[12px] tracking-[0.07em] hover:opacity-90 transition-all`}
              >
                Month
              </button>
            </div>
            <button 
              onClick={handleCreateMeeting}
              className='flex items-center justify-center w-[117px] h-[32px] rounded-[4px] border-[1px] border-[#040B23] text-[12px] text-[#040B23] inter-medium hover:bg-[#040B23] hover:text-white transition-colors'
            >
              Create Meeting
            </button>
            <button 
              onClick={handleNewEvent}
              className='flex flex-row items-center justify-center w-[158px] h-[32px] rounded-[6px] gap-[18px] bg-[#040B23] inter-regular text-[12px] tracking-[0.07em] text-[white] hover:bg-[#0a1136] transition-colors'
            >
              <span>New Event</span>
              <div className='w-[1px] h-[30.5px] bg-[#2C3144]'></div>
              <CalendarDropdownWhiteIcon />
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar grid content */}
      <div className='flex flex-col w-full h-[595px] rounded-[4px] border border-[#EAEAEA] bg-white overflow-hidden'>
        {/* Header with days */}
        <div className='flex items-center w-full h-[50px] bg-[#F1F2F3] border-b border-[#EAEAEA]'>
          <div className='w-[80px] h-full'></div>
          <div className='flex flex-row flex-1'>
            {weekDays.map((day, index) => (
              <div key={index} className='flex items-center justify-center flex-1 h-full'>
                <span className='inter-bold text-[12px] tracking-[0.07em]'>
                  {day.name} {day.date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Time slots and grid */}
        <div ref={scrollContainerRef} className='flex flex-1 h-full overflow-y-auto relative'>
          {/* Integration: Showing global loading state from Parent */}
          {loading && (
            <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center inter-medium text-[12px]">
              Loading events...
            </div>
          )}
          
          {/* Time column */}
          <div className='w-[80px] h-[1450px] border-r border-[#EAEAEA] bg-white sticky left-0 z-20'>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className='h-[60px] flex items-center justify-center pt-1'>
                <span className='inter-regular text-[12px] text-[#040B23] tracking-[0.07em]'>
                  {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className='flex flex-1 h-[1450px]'>
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <div key={dayIndex} className={`flex-1 relative ${dayIndex < 6 ? 'border-r border-[#EAEAEA]' : ''}`}>
                {Array.from({ length: 24 }, (_, hourIndex) => (
                  <div
                    key={hourIndex}
                    className='h-[60px] hover:bg-[#F9F9F9] cursor-pointer transition-colors border-b border-[#F0F0F0]/30'
                    onClick={(e) => handleGridClick(e, dayIndex, hourIndex)}
                  >
                  </div>
                ))}
                
                {/* Passing dynamic events from Parent to the SampleEvent renderer */}
                <SampleEvent 
                  dayIndex={dayIndex} 
                  events={events} 
                  currentDate={currentDate} 
                  onEventClick={handleEventClick} // <--- Add this prop
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Event Modal Component */}
      <NewEvents 
        showEventModal={showEventModal}
        handleCloseModal={handleCloseModal}
        onEventCreated={onEventCreated} // Re-fetch Parent data after new event is added [cite: 203, 249]
        currentDate={currentDate}
        selectedSlotTime={selectedSlotTime}
      />
    </div>
  );
};