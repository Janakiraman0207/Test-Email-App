import React, { useState,useRef,useEffect } from 'react';
import image1 from '../../../../assets/images/image1.png';
import image2 from '../../../../assets/images/image2.png';
import image3 from '../../../../assets/images/image3.png';
import profileimg from '../../../../assets/images/profileimg.png';
import profileimg1 from '../../../../assets/images/profileimg1.png';
import profileimg2 from '../../../../assets/images/profileimg2.png';
import { NewEvents1 } from './NewEvents1';
import SuccessPopUp from './SuccessPopUp';
// Import the createEvent API call
import { createEvent } from '../../../../api/api';
import {
  Closeicon,
  VideoIcon,
  Smallicons,
  Calendaricons,
  DropdownIcon,
  ClockIcon,
  ArrowsIcon,
  ParticipantIcon,
  ThreedotIcon,
  Locationicon,
  DescriptionIcon
} from '../../../../assets/icons/Icons';
import { CloseIcon } from '../../../../assets/icons/IconRegistry';

export const NewEvents = ({ showEventModal, handleCloseModal, onEventCreated, currentDate, selectedSlotTime }) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedDate, setSelectedDate] = useState(currentDate || new Date());
  // const [showDatePicker, setShowDatePicker] = useState(false);
  const [fromTime, setFromTime] = useState('09:00');
  const [toTime, setToTime] = useState('10:00');
  // const [showFromTimeDropdown, setShowFromTimeDropdown] = useState(false);
  // const [showToTimeDropdown, setShowToTimeDropdown] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      // setShowFromTimeDropdown(false);
      // setShowToTimeDropdown(false);
      // setShowParticipantDropdown(false);
      // setShowDatePicker(false);
      setActiveDropdown(null);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

useEffect(() => {
  if (selectedSlotTime) {
    setFromTime(selectedSlotTime);
    const [h, m] = selectedSlotTime.split(':');
    const nextHour = (parseInt(h) + 1) % 24;

    setToTime(`${nextHour.toString().padStart(2, "0")}:${m}`);
  }
}, [selectedSlotTime]);

  // All available participants from your static list
  const allParticipants = [
    { id: 1, image: profileimg, name: 'User 1' },
    { id: 2, image: profileimg1, name: 'User 2' },
    { id: 3, image: profileimg2, name: 'User 3' },
    { id: 4, image: image1, name: 'User 4' },
    { id: 5, image: image2, name: 'User 5' },
    { id: 6, image: image3, name: 'User 6' },
  ];
      // Track participants by their full objects to access IDs for API and images for UI
  const [participants, setParticipants] = useState([allParticipants[0], allParticipants[1], allParticipants[2]]);
  // const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);

const resetForm = () => {
  setEventTitle('');
  setDescription('');
  setLocation('');
  setFromTime('09:00');
  setToTime('10:00');
  setSelectedDate(currentDate || new Date());
  setParticipants([allParticipants[0], allParticipants[1], allParticipants[2]]);
};

  // Helper: Combine Date and Time into a single ISO string for the backend [cite: 45-46, 226]
  const combineDateAndTime = (dateObj, timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const combined = new Date(dateObj);
    combined.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return combined.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventTitle) return alert("Please enter a title");

    setLoading(true);

    // Construct the payload matching the EventCreate schema [cite: 38-54]
    const payload = {
      title: eventTitle,
      description: description,
      start_datetime: combineDateAndTime(selectedDate, fromTime),
      end_datetime: combineDateAndTime(selectedDate, toTime),
      is_all_day: false, // Defaulting to false as per simple flow
      location: location,
      url: null, 
      attendees: participants.map(p => p.id), // Send array of IDs [cite: 50, 148]
      color: "blue",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Use local timezone [cite: 227]
      reminders: [15] // Default 15-minute reminder
    };

    try {
      // API call: the second parameter is create_meeting_link (optional)
      // Here we default it to false unless you want a toggle for Jitsi [cite: 88, 183]
      await createEvent(payload, true);

      // UI Feedback
      setShowSuccess(true);
      
      // Clear form
      setEventTitle('');
      setDescription('');
      setLocation('');
      setParticipants([allParticipants[0], allParticipants[1], allParticipants[2]]);

      // Refresh the main calendar list and close modal
      setTimeout(() => {
        setShowSuccess(false);
        if (onEventCreated) onEventCreated(); 
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error("Error creating event:", error);
      
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedOptions = () => {
    setShowAdvancedOptions(true);
  };

  const handleCloseAdvancedOptions = () => {
    setShowAdvancedOptions(false);
    handleCloseModal();
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // setShowDatePicker(false);
    setActiveDropdown(null);
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        times.push(`${hourStr}:${minuteStr}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const formatTime12Hour = (time24) => {
    const [hour, minute] = time24.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  const addParticipant = (participant) => {
    if (!participants.find(p => p.id === participant.id)) {
      setParticipants([...participants, participant]);
    }
    // setShowParticipantDropdown(false);
    setActiveDropdown(null);
  };

  const removeParticipant = (participantId) => {
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  const availableParticipants = allParticipants.filter(
    p => !participants.find(selected => selected.id === p.id)
  );

  if (!showEventModal) return null;

  return (
    <>
      {showSuccess && <SuccessPopUp />}

      <div 
        className='fixed inset-0 bg-opacity-20 z-20'
        onClick={()=>{resetForm();handleCloseModal();}}
      ></div>
      
      {!showAdvancedOptions && (
        <div 
          className='fixed z-50 bg-white rounded-[20px] shadow-2xl'
          style={{
            width: '460px',
            height: '637px',
            top: '98px',
            left: '500px'
          }}
        >
          <div className='flex items-center justify-between px-6 py-4'>
            <h2 className='inter-bold text-[18px] text-[#040B23]'>Create Event</h2>
            <button 
              onClick={()=>{resetForm();handleCloseModal();}}
              className='w-[24px] h-[24px] flex items-center justify-center hover:bg-[#F3F3F3] rounded-full transition-colors'
            >
              <Closeicon />
            </button>
          </div>

          <div className='px-6 py-4 overflow-y-auto' style={{ height: '541px' }}>
            <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
              <div className='flex flex-row w-[400px] h-[42px] gap-[10px]'>
                  <div className='flex items-center justify-center w-[42px] h-[42px] rounded-[12.15px] bg-[#03081B]'>
                      <VideoIcon />
                  </div>
                  <input 
                    type='text' 
                    placeholder='Title here'
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className='flex-1 px-3 py-2 bg-white border border-[#EAEAEA] rounded-[6px] inter-regular text-[10px] focus:outline-none focus:border-[#040B23]'
                    disabled={loading}
                  />
              </div>

              <div className='flex justify-between w-[400px] h-[13px]'>
                  <span className='inter-regular text-[11px] tracking-[0.02em] '>Date & Time</span>
                  <div className='flex flex-row items-center w-[64px] h-[13px] gap-[10px]'>
                      <Smallicons />
                      <span className='inter-regular text-[11px] tracking-[0.02em]'>All days</span>
                  </div>
              </div>

              <div className='relative'>
                <div 
                  className='w-[400px] h-[42px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[12px] py-[11px] gap-[10px] cursor-pointer hover:border-[#040B23] transition-colors'
                  onClick={(e) =>{e.stopPropagation(); setActiveDropdown(activeDropdown === "date" ? null : "date");}}
                >
                  <div className='flex flex-row justify-between w-[374px] h-[20px] '>
                      <div className='flex flex-row items-center w-[144px] h-[20px] gap-[8px]'>
                        <div className='w-[20px] h-[20px]'>
                          <Calendaricons />
                        </div>
                        <span className='inter-bold text-[10px] whitespace-nowrap'>{formatDate(selectedDate)}</span>
                      </div>
                      <div className='flex items-center justify-center w-[14px] h-[14px]'>
                        <DropdownIcon />
                      </div>
                  </div>
                </div>

                {activeDropdown === "date" && (
                  <div className='absolute top-[45px] left-0 z-50 bg-white rounded-[8px] border border-[#EAEAEA] shadow-lg p-4 w-[400px]' onClick={(e) => e.stopPropagation()}>
                    <input 
                      type='date'
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange(new Date(e.target.value))}
                      className='w-full px-3 py-2 border border-[#EAEAEA] rounded-[6px] inter-regular text-[12px] focus:outline-none focus:border-[#040B23]'
                    />
                  </div>
                )}
              </div>

              <div className='flex flex-row items-center w-[400px] h-[42px] gap-[6px]'>
                  <div className='relative w-[184px]'>
                    <div 
                      className='w-[184px] h-[42px] rounded-[8px] border-[1px] border-[#EAEAEA] gap-[10px] px-[12px] py-[11px] cursor-pointer hover:border-[#040B23] transition-colors'
                      onClick={(e) =>{e.stopPropagation(); setActiveDropdown(activeDropdown === "fromTime" ? null : "fromTime");}}
                    >
                        <div className='flex flex-row justify-between w-[158px] h-[20px] gap-[21px]'>
                          <div className='flex items-center w-[123px] h-[20px] gap-[8px]'>
                             <ClockIcon />
                             <span className='inter-bold text-[10px]'>{formatTime12Hour(fromTime)}</span>
                          </div>
                          <div className='flex items-center justify-center mt-[3px] w-[14px] h-[14px]'>
                            <DropdownIcon />
                          </div>
                        </div>
                    </div>
                    {activeDropdown === "fromTime" && (
                      <div className='absolute top-[45px] left-0 z-50 bg-white rounded-[8px] border border-[#EAEAEA] shadow-lg w-[184px] max-h-[200px] overflow-y-auto'>
                        {timeOptions.map((time) => (
                          <div
                            key={time}
                            className='px-4 py-2 hover:bg-[#F3F3F3] cursor-pointer inter-regular text-[10px]'
                            onClick={(e) => {
                               e.stopPropagation(); setFromTime(time);
                              // setShowFromTimeDropdown(false);
                              setActiveDropdown(null);
                            }}
                          >
                            {formatTime12Hour(time)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className='flex items-center w-[20px] h-[20px]'>
                      <ArrowsIcon />
                  </div>

                  <div className='relative w-[184px]'>
                    <div 
                      className='w-[184px] h-[42px] rounded-[8px] border-[1px] border-[#EAEAEA] gap-[10px] px-[12px] py-[11px] cursor-pointer hover:border-[#040B23] transition-colors'
                      onClick={(e) =>{e.stopPropagation(); setActiveDropdown(activeDropdown === "toTime" ? null : "toTime")}}
                    >
                        <div className='flex flex-row justify-between w-[158px] h-[20px] gap-[21px]'>
                             <span className='inter-bold text-[10px]'>{formatTime12Hour(toTime)}</span>
                          <div className='flex items-center justify-center mt-[3px] w-[14px] h-[14px]'>
                            <DropdownIcon />
                          </div>
                        </div>
                    </div>
                    {activeDropdown === "toTime" && (
                      <div className='absolute top-[45px] left-0 z-50 bg-white rounded-[8px] border border-[#EAEAEA] shadow-lg w-[184px] max-h-[200px] overflow-y-auto'>
                        {timeOptions.map((time) => (
                          <div
                            key={time}
                            className='px-4 py-2 hover:bg-[#F3F3F3] cursor-pointer inter-regular text-[10px]'
                            onClick={() => {
                              setToTime(time);
                              // setShowToTimeDropdown(false);
                              setActiveDropdown(null);
                            }}
                          >
                            {formatTime12Hour(time)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
              </div>

              <div className='relative flex flex-col w-[400px] h-[111px] gap-[10px]'>
                  <span className='inter-regular text-[11px] tracking-[0.02em] '>Participants</span>
                  <div className='w-[400px] h-[88px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[12px] py-[11px]'>
                      <div className='flex flex-col w-[376px] h-[64px] gap-[24px]'>
                         <div 
                           className='flex flex-row items-center w-[123px] h-[20px] gap-[8px] cursor-pointer hover:opacity-70 transition-opacity'
                           onClick={(e) =>{ e.stopPropagation(); setActiveDropdown(activeDropdown === "participants" ? null : "participants");}}
                         >
                            <ParticipantIcon />
                            <span className='inter-regular text-[10px] text-[#040B2363]'>Add participant(s)</span>
                         </div>

                         <div className='flex flex-row justify-between w-[376px] h-[20px]'>
                           <div className='flex flex-row h-[20px] gap-[6px] flex-wrap'>
                              {participants.map((participant) => (
                                <div key={participant.id} className='relative group'>
                                  <img 
                                    src={participant.image} 
                                    alt={participant.name} 
                                    className='w-[20px] h-[20px] rounded-full cursor-pointer hover:opacity-70 transition-opacity'
                                    onClick={() => removeParticipant(participant.id)}
                                  />
                                  <div className='absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                                    <CloseIcon width={10} height={10} stroke="white" strokeWidth={2.5} />
                                  </div>
                                </div>
                              ))}
                           </div>
                           <div className='flex items-center w-[20px] h-[20px]'>
                              <ThreedotIcon />
                           </div>
                         </div>
                      </div>
                  </div>

                  {activeDropdown === "participants" && availableParticipants.length > 0 && (
                    <div className='absolute top-[45px] left-0 z-50 bg-white rounded-[8px] border border-[#EAEAEA] shadow-lg w-[200px] max-h-[200px] overflow-y-auto'>
                      {availableParticipants.map((participant) => (
                        <div
                          key={participant.id}
                          className='flex items-center gap-[8px] px-4 py-2 hover:bg-[#F3F3F3] cursor-pointer'
                          onClick={() => addParticipant(participant)}
                        >
                          <img src={participant.image} alt={participant.name} className='w-[24px] h-[24px] rounded-full' />
                          <span className='inter-regular text-[10px]'>{participant.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div className='flex flex-col w-[400px] h-[70px] gap-[10px]'>
                <span className='inter-regular text-[11px] tracking-[0.02em]'>Location</span>
                <div className='w-[400px] h-[42px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[12px] py-[11px]'>
                  <div className='flex flex-row items-center w-[376px] h-[20px] gap-[8px]'>
                    <Locationicon />
                    <input 
                      type='text' 
                      placeholder='Add meeting room or location'
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className='flex-1 inter-regular text-[10px] text-[#040B2363] focus:outline-none border-none'
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className='flex flex-col w-[400px] h-[65px] gap-[10px]'>
                 <span className='inter-regular text-[11px] tracking-[0.02em]'>Description</span>
                  <div className='w-[400px] h-[42px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[12px] py-[11px]'>
                  <div className='flex flex-row items-start w-[376px] h-[20px] gap-[8px]'>
                    {description === '' && (
                     <DescriptionIcon />
                    )}
                    <textarea
                     placeholder='Add a description'
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     rows={1}
                     className='flex-1 inter-regular text-[10px] text-[black] focus:outline-none border-none resize-none'
                     disabled={loading}
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className='flex flex-row items-center justify-between w-[400px] h-[42px] mt-[10px]'>
                  <button 
                    type='submit' 
                    className='flex items-center justify-center w-[105px] h-[42px] rounded-[8px] bg-[#6231A5] text-[14px] text-white inter-semibold disabled:opacity-50'
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    type='button'
                    onClick={handleAdvancedOptions}
                    className='inter-semibold text-[14px] text-[#6231A5] cursor-pointer hover:underline'
                  >
                    Advanced option
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NewEvents1 
        showAdvancedOptions={showAdvancedOptions}
        handleCloseAdvancedOptions={handleCloseAdvancedOptions}
        eventData={{
          eventTitle,
          fromTime,
          toTime,
          selectedDate,
          location,
          description,
          participants
        }}
      />
    </>
  );
};