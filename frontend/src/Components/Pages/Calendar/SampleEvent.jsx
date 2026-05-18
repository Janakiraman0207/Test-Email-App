import React from 'react';
import image1 from '../../../assets/images/image1.png';
import image2 from '../../../assets/images/image2.png';
import image3 from '../../../assets/images/image3.png';

export const SampleEvent = ({ dayIndex, events = [], currentDate, onEventClick }) => {
  // Helper: Calculate event position and height from backend ISO datetimes [cite: 64-65]
  const calculateEventStyle = (startISO, endISO) => {
    const startDate = new Date(startISO);
    const endDate = new Date(endISO);
    
    // Calculate minutes from start of the day (00:00)
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
    
    // 60px height per hour = 1px per minute
    const durationMinutes = endMinutes - startMinutes;
    
    return {
      top: `${startMinutes}px`,
      height: `${durationMinutes > 30 ? durationMinutes : 30}px` // Minimum height for visibility
    };
  };

  // Helper: Get the start of the week (Sunday) for the current date
  const getWeekStart = (date) => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Helper: Get the date for the specific day in the week grid
  const getDayDate = (dayIndex) => {
    const weekStart = getWeekStart(currentDate);
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    return dayDate;
  };

  // Filter backend events for this specific day grid [cite: 126-127]
  const dayDate = getDayDate(dayIndex);
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start_datetime);
    return eventDate.toDateString() === dayDate.toDateString();
  });

  // Color schemes for dynamic events
  const colorSchemes = [
    { bg: '#FFEDED', accent: '#F07062' },
    { bg: '#EBEAFF', accent: '#6C63FF' },
    { bg: '#EBF6F2', accent: '#348163' },
    { bg: '#FFF4E6', accent: '#FF9800' },
    { bg: '#E8F5E9', accent: '#4CAF50' },
  ];

  // Map backend color names to your existing accent colors [cite: 51, 74]
  const getColorScheme = (eventColor, index) => {
    if (eventColor === 'red') return colorSchemes[0];
    if (eventColor === 'blue') return colorSchemes[1];
    if (eventColor === 'green') return colorSchemes[2];
    // Default to cycling through schemes if color is unknown
    return colorSchemes[index % colorSchemes.length];
  };

  return (
    <>
      {dayEvents.map((event, index) => {
        const style = calculateEventStyle(event.start_datetime, event.end_datetime);
        const colorScheme = getColorScheme(event.color, index);
        
        return (
          <div 
            key={event.id}
            className='absolute cursor-pointer hover:brightness-95 transition-all'
            onClick={() => {
              // SCENARIO: If a meeting link exists, launch it immediately
              if (event.url) {
                window.open(event.url, '_blank'); // Opens the Jitsi session
              } else {
                // Otherwise, proceed to show standard details
                // console.log("Viewing event details for:", event.id);
              }
            }}
            style={{
              top: style.top,
              left: '8px',
              width: 'calc(100% - 16px)', 
              minWidth: '100px',
              maxWidth: '150px',
              height: style.height,
              borderRadius: '4px',
              background: colorScheme.bg,
              display: 'flex',
              flexDirection: 'row',
              overflow: 'hidden',
              zIndex: 10
            }}
          >
            {/* Vertical accent line */}
            <div 
              style={{
                width: '3.88px',
                height: '100%',
                background: colorScheme.accent,
                borderTopLeftRadius: '4px',
                borderBottomLeftRadius: '4px'
              }}
            />
            
            {/* Event Content */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '6px 8px',
                flex: 1,
                overflow: 'hidden'
              }}
            >
              <div className='flex justify-between items-center w-full'>
                <span 
                  className='inter-bold text-[11px] tracking-[0.05em] truncate' 
                  style={{ color: colorScheme.accent, flex: 1 }}
                >
                  {event.title || 'Untitled Event'}
                </span>

               
              </div>
              
              {/* Show time range if height permits */}
              {parseInt(style.height) > 40 && (
                <span className='inter-regular text-[9px] text-[#040B23]/60'>
                  {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}

              {/* Participant List (Integration point for real attendees later) */}
              <div className='flex flex-row h-[12px] mt-auto pb-1'>
                <img src={image1} alt="Participant" className='w-[11.63px] h-[12px] border-[0.5px] border-[#FAFAFA] rounded-full'/>
                <img src={image2} alt="" className='w-[11.63px] h-[12px] border-[0.5px] border-[#FAFAFA] rounded-full -ml-[3px]'/>
                <img src={image3} alt="" className='w-[11.63px] h-[12px] border-[0.5px] border-[#FAFAFA] rounded-full -ml-[3px]'/>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};