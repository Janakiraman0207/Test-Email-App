import React, { useState, useEffect, useCallback } from 'react';
import image1 from '../../../../assets/images/image1.png';
import image2 from '../../../../assets/images/image2.png';
import image3 from '../../../../assets/images/image3.png';
import profileimg from '../../../../assets/images/profileimg.png';
import profileimg1 from '../../../../assets/images/profileimg1.png';
import profileimg2 from '../../../../assets/images/profileimg2.png';
// Import the API call for day listing
import { listEventsForDay } from '../../../../api/api';
import {
  AddParticipantIcon,
  RemoveAttendeeIcon,
  MoreIcon,
  LocationIcon,
  CalendarDropdownIcon,
  PrevMonthIcon,
  NextMonthIcon
} from '../../../../assets/icons/Icons';

export const FindTiming = () => {
  // Use current date as default instead of hardcoded 2025 date
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [requiredAttendees, setRequiredAttendees] = useState([profileimg, profileimg1, profileimg2]);
  const [optionalAttendees, setOptionalAttendees] = useState([profileimg, profileimg1, profileimg2]);
  const [showRequiredDropdown, setShowRequiredDropdown] = useState(false);
  const [showOptionalDropdown, setShowOptionalDropdown] = useState(false);
  
  // State for dynamic event schedule
  const [dayEvents, setDayEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- API Integration: Fetch Availability ---
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await listEventsForDay(dateStr); // [cite: 123, 188]
      if (res && res.data) {
        setDayEvents(res.data);
      }
    } catch (err) {
      console.error("Error fetching day availability:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Helper: Calculate top/height for schedule visualization [cite: 60-68]
  const getEventStyle = (startISO, endISO) => {
    const start = new Date(startISO);
    const end = new Date(endISO);
    const top = start.getHours() * 60 + start.getMinutes();
    const height = (end.getHours() * 60 + end.getMinutes()) - top;
    return { top: `${top}px`, height: `${height > 20 ? height : 20}px` };
  };

  // Static list for local state management
  const allParticipants = [
    { id: 1, image: profileimg, name: 'User 1' },
    { id: 2, image: profileimg1, name: 'User 2' },
    { id: 3, image: profileimg2, name: 'User 3' },
    { id: 4, image: image1, name: 'User 4' },
    { id: 5, image: image2, name: 'User 5' },
    { id: 6, image: image3, name: 'User 6' },
  ];

  const formatDateDisplay = (date) => {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day));
    return days;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
  };

  const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const addRequiredAttendee = (participantImage) => {
    if (!requiredAttendees.includes(participantImage)) setRequiredAttendees([...requiredAttendees, participantImage]);
    setShowRequiredDropdown(false);
  };

  const removeRequiredAttendee = (participantImage) => setRequiredAttendees(requiredAttendees.filter(p => p !== participantImage));

  const addOptionalAttendee = (participantImage) => {
    if (!optionalAttendees.includes(participantImage)) setOptionalAttendees([...optionalAttendees, participantImage]);
    setShowOptionalDropdown(false);
  };

  const removeOptionalAttendee = (participantImage) => setOptionalAttendees(optionalAttendees.filter(p => p !== participantImage));

  const availableRequiredParticipants = allParticipants.filter(p => !requiredAttendees.includes(p.image));
  const availableOptionalParticipants = allParticipants.filter(p => !optionalAttendees.includes(p.image));

  const isToday = (date) => date && date.toDateString() === new Date().toDateString();
  const isSelected = (date) => date && date.toDateString() === selectedDate.toDateString();

  const monthYear = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);

  return (
    <div className='flex flex-row w-[816px] h-[568px] gap-[16px]'>
      {/* Left Panel */}
      <div className='flex flex-col w-[400px] h-[500px] gap-[20px]'>
        {/* Required Attendance */}
        <div className='relative flex flex-col w-[400px] h-[115px] gap-[10px]'>
          <span className='inter-regular text-[11px] tracking-[0.02em] '>Required attendance</span>
          <div className='w-[400px] h-[92px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[12px] py-[11px]'>
            <div className='flex flex-col w-[376px] h-[64px] gap-[24px]'>
              <div 
                className='flex flex-row items-center w-[123px] h-[20px] gap-[8px] cursor-pointer hover:opacity-70 transition-opacity'
                onClick={() => setShowRequiredDropdown(!showRequiredDropdown)}
              >
                <CalendarDropdownIcon />
                <span className='inter-regular text-[10px] text-[#040B2363]'>Add participant(s)</span>
              </div>
              <div className='flex flex-row justify-between w-[376px] h-[20px]'>
                <div className='flex flex-row h-[20px] gap-[6px] flex-wrap'>
                  {requiredAttendees.map((attendee, index) => (
                    <div key={index} className='relative group'>
                      <img src={attendee} alt='Attendee' className='w-[20px] h-[20px] rounded-full cursor-pointer hover:opacity-70' onClick={() => removeRequiredAttendee(attendee)} />
                      <div className='absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none'>
                        <RemoveAttendeeIcon />
                      </div>
                    </div>
                  ))}
                </div>
                <div className='flex items-center w-[20px] h-[20px]'><MoreIcon /></div>
              </div>
            </div>
          </div>
          {showRequiredDropdown && availableRequiredParticipants.length > 0 && (
            <div className='absolute top-[45px] left-0 z-50 bg-white rounded-[8px] border border-[#EAEAEA] shadow-lg w-[200px] max-h-[200px] overflow-y-auto'>
              {availableRequiredParticipants.map((p) => (
                <div key={p.id} className='flex items-center gap-[8px] px-4 py-2 hover:bg-[#F3F3F3] cursor-pointer' onClick={() => addRequiredAttendee(p.image)}>
                  <img src={p.image} className='w-[24px] h-[24px] rounded-full' />
                  <span className='inter-regular text-[10px]'>{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Optional Attendance */}
        <div className='relative flex flex-col w-[400px] h-[115px] gap-[10px]'>
          <span className='inter-regular text-[11px] tracking-[0.02em] '>Optional attendance</span>
          <div className='w-[400px] h-[92px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[12px] py-[11px]'>
            <div className='flex flex-col w-[376px] h-[64px] gap-[24px]'>
              <div 
                className='flex flex-row items-center w-[123px] h-[20px] gap-[8px] cursor-pointer hover:opacity-70 transition-opacity'
                onClick={() => setShowOptionalDropdown(!showOptionalDropdown)}
              >
                <CalendarDropdownIcon />
                <span className='inter-regular text-[10px] text-[#040B2363]'>Add participant(s)</span>
              </div>
              <div className='flex flex-row justify-between w-[376px] h-[20px]'>
                <div className='flex flex-row h-[20px] gap-[6px] flex-wrap'>
                  {optionalAttendees.map((attendee, index) => (
                    <div key={index} className='relative group'>
                      <img src={attendee} alt='Attendee' className='w-[20px] h-[20px] rounded-full cursor-pointer hover:opacity-70' onClick={() => removeOptionalAttendee(attendee)} />
                      <div className='absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none'>
                        <RemoveAttendeeIcon />
                      </div>
                    </div>
                  ))}
                </div>
                <div className='flex items-center w-[20px] h-[20px]'><MoreIcon /></div>
              </div>
            </div>
          </div>
          {showOptionalDropdown && availableOptionalParticipants.length > 0 && (
            <div className='absolute top-[45px] left-0 z-50 bg-white rounded-[8px] border border-[#EAEAEA] shadow-lg w-[200px] max-h-[200px] overflow-y-auto'>
              {availableOptionalParticipants.map((p) => (
                <div key={p.id} className='flex items-center gap-[8px] px-4 py-2 hover:bg-[#F3F3F3] cursor-pointer' onClick={() => addOptionalAttendee(p.image)}>
                  <img src={p.image} className='w-[24px] h-[24px] rounded-full' />
                  <span className='inter-regular text-[10px]'>{p.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location input */}
        <div className='flex flex-col w-[400px] h-[65px] gap-[10px]'>
          <span className='inter-regular text-[11px] tracking-[0.02em]'>Location</span>
          <div className='flex flex-row items-center w-[400px] h-[42px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[12px] py-[11px] gap-[8px]'>
            <div className='w-[20px] h-[20px] flex items-center justify-center'><LocationIcon /></div>
            <span className='inter-regular text-[10px] text-[#040B2363]' >Add meeting room or location</span>  
          </div>
        </div>
      </div>

      {/* Right Panel for Find Timing */}
      <div className='flex flex-col w-[400px] h-[568px] rounded-[8px] bg-[#F7F7F7] mt-[-130px] border-[1px] border-[#EAEAEA] gap-[16px] overflow-hidden'>
         <div className='relative flex items-center w-[400px] h-[42px] rounded-tl-[8px] rounded-tr-[8px] bg-[#040B23] shrink-0'>
            <div 
              className='w-full h-[17px] gap-[12px] px-[10px] flex items-center cursor-pointer justify-between'
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            >
                <span className='inter-bold text-[12px] tracking-[0.07em] text-[white]'>{formatDateDisplay(selectedDate)}</span>
                <div className={`w-[14px] h-[14px] flex items-center justify-center transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`}><CalendarDropdownIcon /></div>
            </div>

            {isCalendarOpen && (
              <div className='absolute top-[42px] left-0 w-[320px] bg-white rounded-[8px] shadow-lg border-[1px] border-[#EAEAEA] z-50 p-[16px]'>
                <div className='flex items-center justify-between mb-[16px]'>
                  <button onClick={handlePrevMonth} className='w-[24px] h-[24px] flex items-center justify-center hover:bg-[#F7F7F7] rounded-[4px]'><PrevMonthIcon /></button>
                  <span className='inter-semibold text-[13px] text-[#040B23]'>{monthYear}</span>
                  <button onClick={handleNextMonth} className='w-[24px] h-[24px] flex items-center justify-center hover:bg-[#F7F7F7] rounded-[4px]'><NextMonthIcon /></button>
                </div>
                <div className='grid grid-cols-7 gap-[4px] mb-[8px]'>{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (<div key={day} className='flex items-center justify-center h-[32px]'><span className='inter-medium text-[10px] text-[#040B2380]'>{day}</span></div>))}</div>
                <div className='grid grid-cols-7 gap-[4px]'>
                  {daysInMonth.map((date, index) => (
                    <div key={index} className='flex items-center justify-center'>
                      {date ? (
                        <button onClick={() => handleDateClick(date)} className={`w-[36px] h-[36px] flex items-center justify-center rounded-[6px] transition-all ${isSelected(date) ? 'bg-[#040B23] text-white' : isToday(date) ? 'bg-[#F0F0F0] font-semibold' : 'hover:bg-[#F7F7F7]'}`}>
                          <span className='inter-regular text-[12px]'>{date.getDate()}</span>
                        </button>
                      ) : <div className='w-[36px] h-[36px]'></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
         </div>
         
         <div className='flex flex-row w-full h-full overflow-y-auto relative'>
            {loading && <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center inter-medium text-[10px]">Updating...</div>}
            
            <div className='w-[80px] shrink-0'>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className='h-[60px] flex items-center justify-center pt-1 border-r border-[#EAEAEA]'>
                  <span className='inter-regular text-[10px] text-[#040B23] tracking-[0.07em]'>
                    {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                  </span>
                </div>
              ))}
            </div>

            <div className='flex-1 relative bg-white'>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className='h-[60px] border-b border-[#F0F0F0]'></div>
              ))}
              
              {/* Dynamic Availability/Busy Blocks from API */}
              {dayEvents.map(event => {
                const style = getEventStyle(event.start_datetime, event.end_datetime);
                return (
                  <div 
                    key={event.id}
                    className="absolute left-0 right-0 mx-2 bg-[#040B23]/10 border-l-[3px] border-[#040B23] rounded-sm pointer-events-none"
                    style={{ top: style.top, height: style.height }}
                  >
                    <span className="inter-bold text-[9px] px-2 text-[#040B23] opacity-60">Busy</span>
                  </div>
                );
              })}
            </div>
         </div>
      </div>
    </div>
  );
};