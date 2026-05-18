import React, { useState, useEffect } from "react";
import image1 from "../../../../assets/images/image1.png";
import image2 from "../../../../assets/images/image2.png";
import image3 from "../../../../assets/images/image3.png";
import profileimg from "../../../../assets/images/profileimg.png";
import profileimg1 from "../../../../assets/images/profileimg1.png";
import profileimg2 from "../../../../assets/images/profileimg2.png";
import { FindTiming } from "./FindTiming";
import { createEvent } from "../../../../api/api"; // API Integration [cite: 181]
import {
  Closeicon,
  VideoIcon,
  Smallicons,
  Calendaricons,
  DropdownIcon,
  ClockIcon,
  RightarrowIcon,
  ArrowsIcon,
  AlarmIcon,
  Boldicon,
  Italicicon,
  ParticipantIcon,
  ThreedotIcon,
  Locationicon,
  DescriptionIcon,
  Underlineicon,
  Alignicon,
  LinkIcon,
  BulletIcon,
  CheckboxIcon,
} from "../../../../assets/icons/Icons";
import { CloseIcon } from "../../../../assets/icons/IconRegistry";
import { CategoryStatusColors } from "../../../../constants/CategoryStatusColors";
import { CategoryIcons } from "../../../../assets/icons/IconRegistry";

export const NewEvents1 = ({
  showAdvancedOptions,
  handleCloseAdvancedOptions,
  onEventCreated,
  eventData,
}) => {
  const [activeTab, setActiveTab] = useState("eventDetails");
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [fromTime, setFromTime] = useState("09:00 AM");
  const [toTime, setToTime] = useState("10:00 AM");
  const [isFromTimeOpen, setIsFromTimeOpen] = useState(false);
  const [isToTimeOpen, setIsToTimeOpen] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [notification, setNotification] = useState("15 minutes before");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [category, setCategory] = useState({ name: "Work", color: "red" }); // Mapped to backend colors [cite: 51]
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventData) return;

    setTitle(eventData.eventTitle || "");
    setLocation(eventData.location || "");
    setDescription(eventData.description || "");

    setSelectedDate(
      eventData.selectedDate ? new Date(eventData.selectedDate) : new Date(),
    );

    const formatTime = (time) => {
      if (!time) return "";
      const [h, m] = time.split(":");
      const hour = parseInt(h);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${m} ${ampm}`;
    };

    setFromTime(formatTime(eventData.fromTime));
    setToTime(formatTime(eventData.toTime));
  }, [eventData]);

  const allParticipants = [
    { id: 1, image: profileimg, name: "User 1" },
    { id: 2, image: profileimg1, name: "User 2" },
    { id: 3, image: profileimg2, name: "User 3" },
    { id: 4, image: image1, name: "User 4" },
    { id: 5, image: image2, name: "User 5" },
    { id: 6, image: image3, name: "User 6" },
  ];

  const [participants, setParticipants] = useState([
    allParticipants[0],
    allParticipants[1],
    allParticipants[2],
  ]);
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);

  // --- Helpers for API Data Mapping ---

  const combineDateAndTime = (dateObj, timeStr) => {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const combined = new Date(dateObj);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  };

  const mapNotificationToMinutes = (text) => {
    const mappings = {
      "5 minutes before": 5,
      "10 minutes before": 10,
      "15 minutes before": 15,
      "30 minutes before": 30,
      "1 hour before": 60,
      "2 hours before": 120,
      "1 day before": 1440,
      "1 week before": 10080,
    };
    return [mappings[text] || 15];
  };

  // --- API Submit Handler ---

  const handleSave = async () => {
    if (!title) return alert("Please enter a title");
    setLoading(true);

    const payload = {
      title,
      description,
      start_datetime: combineDateAndTime(selectedDate, fromTime),
      end_datetime: combineDateAndTime(selectedDate, toTime),
      is_all_day: allDay,
      location,
      url: null,
      attendees: participants.map((p) => p.id), // Send IDs to backend [cite: 50, 94]
      color: category.color || "blue",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reminders: mapNotificationToMinutes(notification), // Send minutes as list [cite: 54, 95]
    };

    try {
      await createEvent(payload, true);
      if (onEventCreated) onEventCreated(); // Refresh main calendar view
      handleCloseAdvancedOptions();
    } catch (error) {
      console.error("Advanced event creation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- UI Handlers ---

  const formatDateDisplay = (date) => {
    const dayName = date.toLocaleString("en-US", { weekday: "long" });
    const month = date.toLocaleString("en-US", { month: "long" });
    const day = date.getDate();
    return `${dayName}, ${month} ${day}`;
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
    for (let day = 1; day <= daysInMonth; day++)
      days.push(new Date(year, month, day));
    return days;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const hourStr = hour.toString().padStart(2, "0");
        const minuteStr = minute.toString().padStart(2, "0");
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        slots.push({
          value: `${hourStr}:${minuteStr}`,
          display: `${displayHour}:${minuteStr} ${period}`,
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const notificationOptions = [
    "5 minutes before",
    "10 minutes before",
    "15 minutes before",
    "30 minutes before",
    "1 hour before",
    "2 hours before",
    "1 day before",
    "1 week before",
  ];

  const categoryOptions = [
    { name: "Work", color: "red" },
    { name: "Personal", color: "blue" },
    { name: "Meeting", color: "green" },
    { name: "Important", color: "yellow" },
    { name: "Others", color: "purple" },
  ];

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setIsDateDropdownOpen(false);
  };

  const handlePrevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  const handleNextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  const handleYearChange = (year) => {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setIsYearDropdownOpen(false);
  };

  const addParticipant = (participant) => {
    if (!participants.find((p) => p.id === participant.id)) {
      setParticipants([...participants, participant]);
    }
    setShowParticipantDropdown(false);
  };

  const removeParticipant = (participantId) =>
    setParticipants(participants.filter((p) => p.id !== participantId));
  const availableParticipants = allParticipants.filter(
    (p) => !participants.find((sel) => sel.id === p.id),
  );

  const yearOptions = Array.from(
    { length: 21 },
    (_, i) => new Date().getFullYear() - 10 + i,
  );

  const isToday = (date) =>
    date && date.toDateString() === new Date().toDateString();
  const isSelected = (date) =>
    date && date.toDateString() === selectedDate.toDateString();

  if (!showAdvancedOptions) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-opacity-30 z-60"
        onClick={handleCloseAdvancedOptions}
      ></div>
      <div
        className="fixed z-[70] bg-white rounded-[20px] shadow-2xl overflow-hidden"
        style={{
          width: "868px",
          height: "758px",
          padding: "20px",
          top: "37px",
          left: "300px",
        }}
      >
        <div className="flex flex-col w-full h-full gap-[22px]">
          <div className="flex flex-row items-center justify-between w-full h-[27px]">
            <div className="flex flex-row w-[158px] h-[27px] gap-[12px]">
              <div
                className="flex flex-col gap-[3px] cursor-pointer"
                onClick={() => setActiveTab("eventDetails")}
              >
                <span
                  className={`${activeTab === "eventDetails" ? "inter-bold" : "inter-regular"} text-[11px] text-[#040B23]`}
                >
                  Event Details
                </span>
                {activeTab === "eventDetails" && (
                  <div className="w-[71px] h-[2px] bg-[#040B23]"></div>
                )}
              </div>
              <div
                className="flex flex-col gap-[3px] cursor-pointer"
                onClick={() => setActiveTab("findTimings")}
              >
                <span
                  className={`${activeTab === "findTimings" ? "inter-bold" : "inter-regular"} text-[11px]`}
                >
                  Find Timings
                </span>
                {activeTab === "findTimings" && (
                  <div className="w-[71px] h-[2px] bg-[#040B23]"></div>
                )}
              </div>
            </div>
            <div
              className="w-[24px] h-[24px] flex items-center justify-center cursor-pointer"
              onClick={handleCloseAdvancedOptions}
            >
              <Closeicon />
            </div>
          </div>

          <div className="flex items-center">
            <span className="inter-bold text-[18px]">Events</span>
          </div>

          <div className="flex flex-row w-full h-[630px] gap-[16px]">
            <div className="flex flex-col w-[400px] h-full gap-[20px]">
              {activeTab === "eventDetails" && (
                <div className="flex flex-row w-full h-[42px] gap-[10px]">
                  <div className="flex items-center justify-center w-[42px] h-[42px] rounded-[12.15px] bg-[#03081B]">
                    <VideoIcon />
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title here"
                    className="flex-1 inter-regular text-[10px] placeholder:text-[#909090] px-[10px] py-[11px] border border-[#EAEAEA] rounded-[8px]"
                  />
                </div>
              )}

              <div className="flex flex-col w-full h-[115px] gap-[5px]">
                <div className="flex flex-col w-full h-[65px] gap-[10px]">
                  <div className="flex flex-row justify-between w-full h-[13px]">
                    <span className="inter-regular text-[11px] tracking-[0.02em]">
                      Date & Time
                    </span>
                    <div
                      className="flex flex-row items-center justify-between w-[64px] h-[13px] cursor-pointer"
                      onClick={() => setAllDay(!allDay)}
                    >
                      <Smallicons />
                      <span className="inter-regular text-[11px] tracking-[0.02em]">
                        All days
                      </span>
                    </div>
                  </div>
                  <div className="relative w-full h-[42px] rounded-[8px] border-[1px] border-[#EAEAEA] px-[12px] py-[11px]">
                    <div
                      className="flex items-center justify-between w-full h-[20px] cursor-pointer"
                      onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                    >
                      <div className="flex flex-row w-full gap-[8px]">
                        <Calendaricons />
                        <span className="inter-bold text-[10px] whitespace-nowrap">
                          {formatDateDisplay(selectedDate)}
                        </span>
                      </div>
                      <div
                        className={`transition-transform ${isDateDropdownOpen ? "rotate-180" : ""}`}
                      >
                        <DropdownIcon />
                      </div>
                    </div>
                    {isDateDropdownOpen && (
                      <div className="absolute top-[44px] left-0 w-[320px] bg-white rounded-[8px] shadow-lg border border-[#EAEAEA] z-50 p-[16px]">
                        <div className="flex items-center justify-between mb-[16px]">
                          <button
                            onClick={handlePrevMonth}
                            className="hover:bg-[#F7F7F7] p-1 rounded"
                          >
                            <ClockIcon />
                          </button>
                          <div className="relative flex items-center gap-[8px]">
                            <span className="inter-semibold text-[13px]">
                              {currentMonth.toLocaleString("en-US", {
                                month: "long",
                              })}
                            </span>
                            <div
                              className="flex items-center gap-[4px] cursor-pointer"
                              onClick={() =>
                                setIsYearDropdownOpen(!isYearDropdownOpen)
                              }
                            >
                              <span className="inter-semibold text-[13px]">
                                {currentMonth.getFullYear()}
                              </span>
                              <DropdownIcon />
                            </div>
                            {isYearDropdownOpen && (
                              <div className="absolute top-[28px] right-0 w-[100px] max-h-[200px] bg-white rounded shadow-lg border border-[#EAEAEA] overflow-y-auto">
                                {yearOptions.map((y) => (
                                  <div
                                    key={y}
                                    onClick={() => handleYearChange(y)}
                                    className="px-3 py-1 text-[12px] hover:bg-[#F7F7F7] cursor-pointer"
                                  >
                                    {y}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={handleNextMonth}
                            className="hover:bg-[#F7F7F7] p-1 rounded"
                          >
                            <RightarrowIcon />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                            (d) => (
                              <div
                                key={d}
                                className="text-center text-[10px] text-[#040B2380]"
                              >
                                {d}
                              </div>
                            ),
                          )}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {getDaysInMonth(currentMonth).map((d, i) => (
                            <div key={i} className="flex justify-center">
                              {d ? (
                                <button
                                  onClick={() => handleDateClick(d)}
                                  className={`w-8 h-8 rounded text-[12px] ${isSelected(d) ? "bg-[#040B23] text-white" : isToday(d) ? "bg-[#F0F0F0]" : "hover:bg-[#F7F7F7]"}`}
                                >
                                  {d.getDate()}
                                </button>
                              ) : (
                                <div className="w-8 h-8"></div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row items-center w-full h-[42px] gap-[6px]">
                  <div className="relative w-[184px] h-[42px] rounded-[8px] border border-[#EAEAEA] px-[12px] py-[11px]">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setIsFromTimeOpen(!isFromTimeOpen)}
                    >
                      <div className="flex items-center gap-[8px]">
                        <ClockIcon />
                        <span className="text-[10px]">{fromTime}</span>
                      </div>
                      <div className={`${isFromTimeOpen ? "rotate-180" : ""}`}>
                        <DropdownIcon />
                      </div>
                    </div>
                    {isFromTimeOpen && (
                      <div className="absolute top-[44px] left-0 w-full max-h-[200px] bg-white rounded shadow-lg border border-[#EAEAEA] overflow-y-auto">
                        {timeSlots.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setFromTime(s.display);
                              setIsFromTimeOpen(false);
                            }}
                            className="px-3 py-2 text-[11px] hover:bg-[#F7F7F7] cursor-pointer"
                          >
                            {s.display}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <ArrowsIcon />
                  <div className="relative w-[184px] h-[42px] rounded-[8px] border border-[#EAEAEA] px-[12px] py-[11px]">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setIsToTimeOpen(!isToTimeOpen)}
                    >
                      <div className="flex items-center gap-[8px]">
                        <span className="text-[10px] ml-[28px]">{toTime}</span>
                      </div>
                      <div className={`${isToTimeOpen ? "rotate-180" : ""}`}>
                        <DropdownIcon />
                      </div>
                    </div>
                    {isToTimeOpen && (
                      <div className="absolute top-[44px] left-0 w-full max-h-[200px] bg-white rounded shadow-lg border border-[#EAEAEA] overflow-y-auto">
                        {timeSlots.map((s, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setToTime(s.display);
                              setIsToTimeOpen(false);
                            }}
                            className="px-3 py-2 text-[11px] hover:bg-[#F7F7F7] cursor-pointer"
                          >
                            {s.display}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {activeTab === "eventDetails" && (
                <>
                  <div className="flex flex-row w-full h-[65px] gap-[16px]">
                    <div className="flex flex-col flex-1 gap-[10px]">
                      <span className="inter-regular text-[11px]">
                        Notification
                      </span>
                      <div className="relative w-full h-[42px] rounded-[8px] border border-[#EAEAEA] px-[12px] py-[11px]">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() =>
                            setIsNotificationOpen(!isNotificationOpen)
                          }
                        >
                          <div className="flex items-center gap-[8px]">
                            <AlarmIcon />
                            <span className="text-[10px] text-[#040B2363]">
                              {notification}
                            </span>
                          </div>
                          <div
                            className={`${isNotificationOpen ? "rotate-180" : ""}`}
                          >
                            <DropdownIcon />
                          </div>
                        </div>
                        {isNotificationOpen && (
                          <div className="absolute top-[44px] left-0 w-full max-h-[200px] bg-white rounded shadow-lg border border-[#EAEAEA] overflow-y-auto">
                            {notificationOptions.map((o, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setNotification(o);
                                  setIsNotificationOpen(false);
                                }}
                                className="px-3 py-2 text-[11px] hover:bg-[#F7F7F7] cursor-pointer"
                              >
                                {o}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 gap-[10px]">
                      <span className="inter-regular text-[11px]">
                        Categories
                      </span>
                      <div className="relative w-full h-[42px] rounded-[8px] border border-[#EAEAEA] px-[12px] py-[11px]">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        >
                          <div className="flex items-center gap-[8px]">
                            <CategoryIcons
                              color={
                                CategoryStatusColors[
                                  category.name.toLowerCase()
                                ]
                              }
                            />
                            <span className="text-[10px] text-[#040B2363]">
                              {category.name}
                            </span>
                          </div>
                          <div
                            className={`${isCategoryOpen ? "rotate-180" : ""}`}
                          >
                            <DropdownIcon />
                          </div>
                        </div>
                        {isCategoryOpen && (
                          <div className="absolute top-[44px] left-0 w-full bg-white rounded shadow-lg border border-[#EAEAEA] overflow-hidden">
                            {categoryOptions.map((o, i) => (
                              <div
                                key={i}
                                onClick={() => {
                                  setCategory(o);
                                  setIsCategoryOpen(false);
                                }}
                                className="px-3 py-2 text-[11px] hover:bg-[#F7F7F7] flex items-center gap-2 cursor-pointer"
                              >
                                <CategoryIcons
                                  size={10}
                                  color={
                                    o.color === "red" ? "#D22A84" : "#2A84D2"
                                  }
                                />
                                {o.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col w-full h-[65px] gap-[10px]">
                    <span className="inter-regular text-[11px]">Location</span>
                    <div className="flex items-center w-full h-[42px] rounded-[8px] border border-[#EAEAEA] px-[12px] py-[11px] gap-[8px]">
                      <Locationicon />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Add meeting room or location"
                        className="flex-1 text-[10px] outline-none border-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col w-full gap-[10px]">
                    <span className="inter-regular text-[11px]">
                      Description
                    </span>
                    <div className="flex flex-col w-full h-[223px] rounded-[8px] border border-[#EAEAEA] overflow-hidden">
                      <div className="h-[24px] bg-[#F1F2F3] flex items-center px-4 gap-4">
                        <Boldicon />
                        <Italicicon />
                        <Underlineicon />
                        <Alignicon />
                        <LinkIcon />
                        <BulletIcon />
                      </div>
                      <div className="flex p-3 gap-2">
                        <DescriptionIcon />
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Add a description"
                          className="flex-1 h-[170px] text-[10px] outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {activeTab === "findTimings" && <FindTiming />}
            </div>

            {activeTab === "eventDetails" && (
              <div className="flex flex-col w-[400px] h-full gap-[20px]">
                <div className="relative flex flex-col w-full gap-[10px]">
                  <span className="inter-regular text-[11px]">
                    Participants
                  </span>
                  <div className="h-[88px] rounded-[8px] border border-[#EAEAEA] p-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer mb-4"
                      onClick={() =>
                        setShowParticipantDropdown(!showParticipantDropdown)
                      }
                    >
                      <ParticipantIcon />
                      <span className="text-[10px] text-[#040B2363]">
                        Add participant(s)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {participants.map((p) => (
                          <div key={p.id} className="relative group">
                            <img
                              src={p.image}
                              className="w-5 h-5 rounded-full cursor-pointer hover:opacity-70"
                              onClick={() => removeParticipant(p.id)}
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center pointer-events-none">
                              <CloseIcon
                                width={10}
                                height={10}
                                stroke="white"
                                strokeWidth={3}
                                strokeLinecap="butt"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <ThreedotIcon />
                    </div>
                    {showParticipantDropdown && (
                      <div className="absolute top-[45px] left-0 w-[200px] bg-white rounded border border-[#EAEAEA] shadow-lg max-h-[200px] overflow-y-auto z-[80]">
                        {availableParticipants.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => addParticipant(p)}
                            className="flex items-center gap-2 p-2 hover:bg-[#F3F3F3] cursor-pointer"
                          >
                            <img
                              src={p.image}
                              className="w-6 h-6 rounded-full"
                            />
                            <span className="text-[10px]">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-[10px]">
                  <span className="inter-regular text-[11px]">
                    Guest Permissions
                  </span>
                  <div className="flex flex-col gap-[10px]">
                    <div className="flex items-center gap-2">
                      <CheckboxIcon />
                      <span className="inter-semibold text-[12px]">
                        Modify event
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckboxIcon />
                      <span className="inter-semibold text-[12px]">
                        Invite others
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckboxIcon />
                      <span className="inter-semibold text-[12px]">
                        See guest list
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-5 right-5">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-[105px] h-[42px] bg-[#6231A5] rounded-[8px] text-white inter-semibold text-[14px] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
};