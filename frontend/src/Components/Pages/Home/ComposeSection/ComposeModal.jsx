import React, { useState, useRef, useEffect } from "react";
import {
  sendMail,
  getDraftMails,
  saveDraft,
  updateDraft,
  getDraftById,
  publishDraft,
  getSentMails,
  searchChatUsers,
  deleteMail,
} from "../../../../api/api";
import { EmailEditor } from "./EmailEditor";
import "./ComposeModalMessageInput.css";
import { AttachmentSection } from "./AttachmentsSection/AttachmentSection";
import { CloseIcon, ComposeModalExpandIcon } from "../../../../assets/icons/IconRegistry";

// Email Chip Component with user details
const EmailChip = ({ email, userData, onRemove }) => {
  // Get first name and last name from userData
  const firstName = userData?.first_name || "";
  const lastName = userData?.last_name || "";

  // Construct display name from first and last name, or fallback to formatted email
  const displayName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : email.split("@")[0].replace(/[._-]/g, " ");

  const userEmail = userData?.email || email;

  return (
    <div className="inline-flex items-center justify-center bg-[#EDECFF] h-[15px] rounded-[2px] px-3 py-1 m-1 text-sm group relative">
      <span className="text-[#000000] mr-2 text-[12px] inter-regular">
        {displayName}
      </span>
      <button
        onClick={() => onRemove(email)}
        className="text-[#000000] hover:text-[#4a25b5] focus:outline-none font-bold"
      >
        <CloseIcon />
      </button>
    </div>
  );
};

// Email Input with Chips Component
const EmailInputWithChips = ({
  value,
  onChange,
  placeholder,
  name,
  onBlur,
  currentUser,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [emails, setEmails] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [userDetails, setUserDetails] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // ADD: Read contact suggestions preference from localStorage
const [contactSuggestionsEnabled, setContactSuggestionsEnabled] = useState(
  () => JSON.parse(localStorage.getItem('contact_suggestions') ?? 'true')
);

// ADD: Listen for changes when user toggles in Settings
useEffect(() => {
  const handleStorageChange = () => {
    setContactSuggestionsEnabled(
      JSON.parse(localStorage.getItem('contact_suggestions') ?? 'true')
    );
  };
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
  // Parse initial value into emails array
  useEffect(() => {
    if (value) {
      const emailList = value
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email);
      setEmails(emailList);
      // Fetch user details for each email
      emailList.forEach((email) => {
        if (!userDetails[email]) {
          fetchUserByEmail(email);
        }
      });
    } else {
      setEmails([]);
    }
  }, [value]);

  // Fetch user details by email from API
  const fetchUserByEmail = async (email) => {
    try {
      setIsLoading(true);
      const response = await searchChatUsers(email);
      console.log("User search response for", email, ":", response);

      if (response && Array.isArray(response) && response.length > 0) {
        // Find the user with matching email
        const user = response.find(
          (u) => u.email.toLowerCase() === email.toLowerCase(),
        );

        if (user) {
          console.log("Found user:", user);
          setUserDetails((prev) => ({
            ...prev,
            [email]: {
              id: user.id,
              email: user.email,
              first_name: user.first_name || "",
              last_name: user.last_name || "",
              profile_image: user.profile_image || user.avatar || null,
            },
          }));
        } else {
          // Fallback to formatted email if user not found
          setUserDetails((prev) => ({
            ...prev,
            [email]: {
              email: email,
              first_name: email.split("@")[0].replace(/[._-]/g, " "),
              last_name: "",
            },
          }));
        }
      } else {
        // Fallback to formatted email if no results
        setUserDetails((prev) => ({
          ...prev,
          [email]: {
            email: email,
            first_name: email.split("@")[0].replace(/[._-]/g, " "),
            last_name: "",
          },
        }));
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      // Fallback to formatted email on error
      setUserDetails((prev) => ({
        ...prev,
        [email]: {
          email: email,
          first_name: email.split("@")[0].replace(/[._-]/g, " "),
          last_name: "",
        },
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Search for users as user types
  const searchUsers = async (query) => {
    if (!contactSuggestionsEnabled) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await searchChatUsers(query);
      console.log("Search suggestions:", response);

      if (response && Array.isArray(response)) {
        // Filter out only the current user, allow adding same email multiple times
        const filtered = response.filter(
          (user) => user.email !== currentUser?.email,
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // UPDATED
const handleInputChange = (e) => {
  const value = e.target.value;
  setInputValue(value);
  if (value.trim() && contactSuggestionsEnabled) {
    searchUsers(value);
  } else {
    setSuggestions([]);
    setShowSuggestions(false);
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addEmail();
    } else if (e.key === "," && inputValue.trim()) {
      e.preventDefault();
      addEmail();
    } else if (e.key === " " && inputValue.trim()) {
      e.preventDefault();
      addEmail();
    } else if (
      e.key === "Backspace" &&
      inputValue === "" &&
      emails.length > 0
    ) {
      // Remove last email on backspace when input is empty
      const lastEmail = emails[emails.length - 1];
      const newEmails = emails.slice(0, -1);
      setEmails(newEmails);

      // Clean up user details for removed email if no more instances
      if (!newEmails.includes(lastEmail)) {
        setUserDetails((prev) => {
          const newDetails = { ...prev };
          delete newDetails[lastEmail];
          return newDetails;
        });
      }

      onChange({
        target: {
          name,
          value: newEmails.join(", "),
        },
      });
    }
  };

  const addEmail = async (emailToAdd = null) => {
    const trimmedEmail = (emailToAdd || inputValue.trim()).toLowerCase();

    if (trimmedEmail && isValidEmail(trimmedEmail)) {
      // REMOVED: The duplicate email check to allow adding the same email multiple times
      // Now we allow adding the same email multiple times

      const newEmails = [...emails, trimmedEmail];
      setEmails(newEmails);
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);

      // Fetch user details for the new email
      await fetchUserByEmail(trimmedEmail);

      onChange({
        target: {
          name,
          value: newEmails.join(", "),
        },
      });
    }
  };

  const handleSuggestionClick = (user) => {
    // Store the email before clearing input
    const emailToAdd = user.email;

    // Clear input and close suggestions immediately
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);

    // Add the email
    addEmail(emailToAdd);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(document.activeElement)
      ) {
        setShowSuggestions(false);
      }
    }, 200);

    if (inputValue && isValidEmail(inputValue)) {
      addEmail();
    }
    if (onBlur) onBlur();
  };

  const removeEmail = (emailToRemove) => {
    // Remove only the selected instance, not all occurrences
    const index = emails.lastIndexOf(emailToRemove);
    if (index !== -1) {
      const newEmails = [...emails];
      newEmails.splice(index, 1);
      setEmails(newEmails);

      // Only clean up user details if this was the last occurrence
      if (!newEmails.includes(emailToRemove)) {
        setUserDetails((prev) => {
          const newDetails = { ...prev };
          delete newDetails[emailToRemove];
          return newDetails;
        });
      }

      onChange({
        target: {
          name,
          value: newEmails.join(", "),
        },
      });
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div className="relative w-full">
      <div
        className={`flex flex-wrap items-center gap-1 min-h-[30px] px-[14px] border ${
          isFocused ? "border-[#6A37F5]" : "border-[#EAEAEA]"
        } rounded-[8px] text-[12px] focus-within:border-[#6A37F5] bg-white`}
      >
        {emails.map((email, index) => (
          <EmailChip
            key={`${email}-${index}`}
            email={email}
            userData={userDetails[email]}
            onRemove={removeEmail}
          />
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={emails.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none border-none p-0 text-[12px] bg-transparent"
          name={name}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="ml-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6A37F5]"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionRef}
          className="absolute z-50 w-full mt-1 bg-white border border-[#EAEAEA] rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((user) => {
            const displayName =
              `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
              user.email.split("@")[0].replace(/[._-]/g, " ");
            return (
              <div
                key={user.id || user.email}
                className="px-3 py-2 hover:bg-[#F6F3FF] cursor-pointer flex items-center gap-2"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur event from firing
                }}
                onClick={() => handleSuggestionClick(user)}
              >
                <img
                  src={
                    user.profile_image || user.avatar || "/default-avatar.png"
                  }
                  alt={displayName}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = "/default-avatar.png";
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium">{displayName}</span>
                  <span className="text-[10px] text-gray-500">
                    {user.email}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ComposeModal = ({
  isOpen,
  onClose,
  onSendSuccess,
  onDeleteSuccess,
  draftData = null,
  currentUser,
  dots,
  setDots,
}) => {
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCCBCC, setShowCCBCC] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [draftId, setDraftId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editorKey, setEditorKey] = useState(Date.now());
  const [showSendPopup, setShowSendPopup] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("08:00:00");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const quillRef = useRef(null);
  const isCCBCCVisible = isExpanded || showCCBCC;

  useEffect(() => {
    if (!isOpen) return;
    if (draftData) {
      // Parse draft data - convert stored arrays to comma-separated strings
      const toEmails = draftData.receiver_email
        ? Array.isArray(draftData.receiver_email)
          ? draftData.receiver_email.join(", ")
          : draftData.receiver_email
        : "";

      const ccEmails = draftData.cc
        ? Array.isArray(draftData.cc)
          ? draftData.cc.join(", ")
          : draftData.cc
        : "";

      const bccEmails = draftData.bcc
        ? Array.isArray(draftData.bcc)
          ? draftData.bcc.join(", ")
          : draftData.bcc
        : "";

      setFormData({
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject: draftData.subject || "",
        body: draftData.body || "",
      });

      setDraftId(draftData.id);
    } else {
      // Fresh compose
      setFormData({
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        body: "",
      });
      setDraftId(null);
      setAttachments([]);
      setError("");
      setShowCCBCC(false);
      setIsExpanded(false);
      setShowDiscardConfirm(false);
      setEditorKey(Date.now());
    }
  }, [draftData, isOpen]);

  useEffect(() => {
    if (!draftId) return;

    const timeout = setTimeout(() => {
      updateDraft(draftId, buildDraftPayload());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [formData, draftId]);

  // useEffect(() => {
  //   const handleClickOutside = () => {
  //     setShowSendPopup(false);
  //     setShowSchedulePopup(false);
  //   };

  //   if (showSendPopup || showSchedulePopup) {
  //     window.addEventListener("click", handleClickOutside);
  //   }

  //   return () => {
  //     window.removeEventListener("click", handleClickOutside);
  //   };
  // }, [showSendPopup, showSchedulePopup]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper function to parse comma-separated emails into array
  const parseEmails = (emailString) => {
    if (!emailString || !emailString.trim()) return [];

    return emailString
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  };

  // Validate multiple emails
  const validateEmails = (emailString) => {
    if (!emailString || !emailString.trim()) return true;

    const emails = parseEmails(emailString);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emails.every((email) => emailRegex.test(email));
  };

  const handleAttachmentClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept =
      "image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar";
    input.click();

    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      const newAttachments = files.map((file) => ({
        id: Date.now() + Math.random(),
        file,
        url: null,
        name: file.name,
        size: file.size,
        uploading: true,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
      // simulate upload completion
      newAttachments.forEach((fileObj) => {
        setTimeout(() => {
          setAttachments((prev) =>
            prev.map((att) =>
              att.id === fileObj.id ? { ...att, uploading: false } : att,
            ),
          );
        }, 2000); // simulate 2s upload
      });
    };
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => {
      const removed = prev.find((att) => att.id === id);
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((attachment) => attachment.id !== id);
    });
  };

  const buildDraftPayload = () => {
    return {
      to: formData.to
        ? formData.to
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
      cc: formData.cc
        ? formData.cc
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
      bcc: formData.bcc
        ? formData.bcc
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
      subject: formData.subject,
      body: formData.body,
    };
  };

  const sanitizeEmailBody = (body) => {
    if (!body) return "";

    let cleanBody = body;

    // Replace <mark>
    cleanBody = cleanBody
      .replace(/<mark>/g, '<span style="background-color:#ffff00;">')
      .replace(/<\/mark>/g, "</span>");

    // Convert rgb to hex
    cleanBody = cleanBody.replace(
      /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g,
      (match, r, g, b) => {
        return (
          "#" +
          [r, g, b]
            .map((x) => parseInt(x).toString(16).padStart(2, "0"))
            .join("")
        );
      },
    );

    return cleanBody;
  };

  const buildEmailPayload = (bodyOverride = null) => {
    return {
      to: formData.to
        ? formData.to
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
      cc: formData.cc
        ? formData.cc
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
      bcc: formData.bcc
        ? formData.bcc
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
      subject: formData.subject,
      body: bodyOverride ?? formData.body,
    };
  };

  const handleSend = async () => {
    if (!formData.to.trim()) {
      setError("Recipient (To) is required");
      return;
    }

    // Validate email formats
    if (!validateEmails(formData.to)) {
      setError("Invalid email format in To field.");
      return;
    }

    if (formData.cc && !validateEmails(formData.cc)) {
      setError("Invalid email format in CC field.");
      return;
    }

    if (formData.bcc && !validateEmails(formData.bcc)) {
      setError("Invalid email format in BCC field.");
      return;
    }

    setIsLoading(true);
    setError("");

    // Sanitize email-safe HTML
    let cleanBody = formData.body || "";
    cleanBody = cleanBody
      .replace(/<mark>/g, '<span style="background-color:#ffff00;">')
      .replace(/<\/mark>/g, "</span>");

    // Convert rgb() to hex
    cleanBody = cleanBody.replace(
      /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g,
      (match, r, g, b) => {
        return (
          "#" +
          [r, g, b]
            .map((x) => parseInt(x).toString(16).padStart(2, "0"))
            .join("")
        );
      },
    );
    try {
      const mailPayload = {
        ...buildDraftPayload(),
        body: cleanBody,
      };

      if (draftId) {
        await updateDraft(draftId, mailPayload);
        await publishDraft(draftId);
      } else {
        const mailData = new FormData();
        formData.to.split(",").forEach((email) => {
          mailData.append("to", email.trim());
        });
        mailData.append("subject", formData.subject);
        mailData.append("body", cleanBody);

        attachments.forEach((att) => {
          mailData.append("files", att.file);
        });

        if (scheduledDateTime) {
          mailData.append("schedule_at", scheduledDateTime.toISOString());
        }

        await sendMail(mailData);
        onSendSuccess?.(!!scheduledDateTime);
      }

      // Clean up object URLs
      attachments.forEach((att) => {
        if (att.previewUrl) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });

      setFormData({
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        body: "",
      });

      setAttachments([]);
      setDraftId(null);
      setError("");
      onSendSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to send email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    const hasContent =
      formData.to ||
      formData.cc ||
      formData.bcc ||
      formData.subject ||
      formData.body ||
      attachments.length > 0;

    if (hasContent) {
      const mailData = buildDraftPayload();

      try {
        if (draftId) {
          await updateDraft(draftId, mailData);
        } else {
          const response = await saveDraft(mailData);
          setDraftId(response.data.id);
        }
      } catch (err) {
        console.error("Draft save failed", err);
      }
    }

    // Clean up object URLs
    attachments.forEach((att) => {
      if (att.previewUrl) {
        URL.revokeObjectURL(att.previewUrl);
      }
    });

    onClose();
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(true);
  };

  const confirmDiscard = async () => {
    try {
      if (draftId) {
        await deleteMail(draftId);
        if (onDeleteSuccess) {
          onDeleteSuccess(draftId);
        }
      }

      // Clean up object URLs
      attachments.forEach((att) => {
        if (att.previewUrl) {
          URL.revokeObjectURL(att.previewUrl);
        }
      });

      // Reset all states
      setFormData({
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        body: "",
      });
      setAttachments([]);
      setDraftId(null);
      setError("");
      setShowCCBCC(false);
      setIsExpanded(false);
      setShowDiscardConfirm(false);
      setEditorKey(Date.now());

      // Close modal
      onClose();
    } catch (err) {
      console.error("Failed to delete", err);
      setToastMessage("👉 Failed to delete message. Please try again.");
      setShowDiscardConfirm(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";

    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    setSelectedDate(newDate);
  };

  const formatSelectedDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const modalHeight = isExpanded
    ? "h-full"
    : isCCBCCVisible
      ? "h-[613px]"
      : "h-[529px]";

  return (
    <div
      className={`fixed inset-0 bg-[#00000029] z-50 ${isExpanded ? "flex justify-end" : "flex items-center justify-center"}`}
      onClick={() => {
        setShowSendPopup(false);
        setShowSchedulePopup(false);
        handleClose();
      }}
    >
      <div
        className={`bg-white overflow-visible transition-all duration-300 ${
          isExpanded
            ? "fixed w-[783px] h-full rounded-tl-[12px] rounded-bl-[12px]"
            : `w-[583px] ${modalHeight} rounded-[17.24px]`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0" />
        <div className="relative z-10 flex flex-col h-full overflow-visible">
          <div className="h-[79px] text-black p-4 flex justify-between items-center flex-shrink-0">
            <div
              className="absolute top-0 left-0 right-0 h-[120px] pointer-events-none"
              style={{
                background: `
            linear-gradient(
        to bottom,
        rgba(185,160,255,0.54) 0%,
        rgba(78,115,255,0.26) 40%,
        rgba(255,255,255,0) 100%
      )`,
              }}
            />
            <h2 className="w-[138px] h-[24px] inter-bold text-[20px] leading-[100%] tracking-[0]">
              New Message
            </h2>
            <div className="flex items-center gap-[22px]">
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-black hover:text-gray-700 w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                <ComposeModalExpandIcon />
              </button>
              <button
                onClick={handleClose}
                className="text-black hover:text-gray-700 text-xl w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                <CloseIcon size={20}/>
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide">
            {/* <div className="p-5 flex flex-col flex-1 overflow-hidden"> */}
            <div className="space-y-[16px]">
              {/* <div className="flex-1 overflow-y-auto pr-2 min-h-0"> */}
              <div>
                <div
                  className={`${isExpanded ? "flex items-center gap-5" : ""}`}
                >
                  <div
                    className={`${isExpanded ? "w-[20px]" : ""} flex items-center justify-between mb-[8px] ${isExpanded ? "mb-0" : ""}`}
                  >
                    <label
                      className={`text-[#000000] text-[12px] ${isExpanded ? "inter-bold" : "inter-regular"} mt-[2px] whitespace-nowrap`}
                    >
                      To
                    </label>

                    {!isExpanded && (
                      <div className="flex items-center gap-[8px]">
                        <span className="text-[12px] text-[#000000] inter-medium">
                          Show CC & BCC
                        </span>
                        <button
                          className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${
                            showCCBCC ? "bg-[#6A37F5]" : "bg-[#EDECFF]"
                          }`}
                          onClick={() => setShowCCBCC((prev) => !prev)}
                          aria-pressed={showCCBCC}
                          type="button"
                        >
                          <div
                            className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                              showCCBCC ? "bg-white" : "bg-[#6A37F5]"
                            }`}
                            style={{
                              transform: showCCBCC
                                ? "translateX(19px)"
                                : "translateX(0)",
                            }}
                          ></div>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={`${isExpanded ? "flex-1" : "w-full"}`}>
                    <EmailInputWithChips
                      name="to"
                      value={formData.to}
                      onChange={handleChange}
                      placeholder="Recipients"
                      currentUser={currentUser}
                    />
                  </div>
                </div>
              </div>

              {isCCBCCVisible && (
                <>
                  <div>
                    <div
                      className={`${isExpanded ? "flex items-center gap-5" : ""}`}
                    >
                      {isExpanded && (
                        <div className="w-[20px]">
                          <label className="text-[#000000] text-[12px] inter-bold mt-[2px] whitespace-nowrap">
                            CC
                          </label>
                        </div>
                      )}
                      <div className={`${isExpanded ? "flex-1" : "w-full"}`}>
                        <EmailInputWithChips
                          name="cc"
                          value={formData.cc}
                          onChange={handleChange}
                          placeholder="CC"
                          currentUser={currentUser}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div
                      className={`${isExpanded ? "flex items-center gap-5" : ""}`}
                    >
                      {isExpanded && (
                        <div className="w-[20px]">
                          <label className="text-[#000000] text-[12px] inter-bold mt-[2px] whitespace-nowrap">
                            BCC
                          </label>
                        </div>
                      )}
                      <div className={`${isExpanded ? "flex-1" : "w-full"}`}>
                        <EmailInputWithChips
                          name="bcc"
                          value={formData.bcc}
                          onChange={handleChange}
                          placeholder="BCC"
                          currentUser={currentUser}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-[20px]">
              {!isExpanded && (
                <label className="block text-[#000000] text-[12px] mb-[8px] inter-regular">
                  Subject
                </label>
              )}
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Your subject"
                className="w-full max-w-[] h-[30px] text-[10px] inter-regular px-[14px] border border-[#EAEAEA] rounded-[8px] inter-regular text-[12px] focus:outline-none focus:border-[#6A37F5]"
              />
            </div>

            <div
              className={`mt-[20px] flex flex-col  ${isExpanded ? "flex-1 min-h-0" : ""}`}
            >
              <label className="block text-[#000000] text-[12px] mb-[8px] inter-regular">
                Message
              </label>
              <div
                className={`bg-[#FEFDFD] border border-[#C6C6C6] rounded-[8px] flex flex-col overflow-hidden
                  ${isExpanded ? "w-[723px] h-[433px]" : "w-[523px] h-[156px]"}
                  `}
              >
                <EmailEditor
                  key={editorKey}
                  value={formData.body}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, body: val }))
                  }
                  handleAttachmentClick={handleAttachmentClick}
                  attachments={attachments}
                  handleRemoveAttachment={handleRemoveAttachment}
                  formatFileSize={formatFileSize}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  expanded={isExpanded}
                />
                <AttachmentSection
                  attachments={attachments}
                  formatFileSize={formatFileSize}
                  handleRemoveAttachment={handleRemoveAttachment}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  dots={dots}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
                {error}
              </div>
            )}
          </div>

          <div className="pl-6 flex justify-between items-center pb-4 pt-4 flex-shrink-0">
            <button
              className="flex space-x-3 w-[78px] h-[32px] rounded-[16px] bg-[#EBEBEB] flex items-center justify-center cursor-pointer hover:bg-[#dbdbdb] transition-colors"
              onClick={handleDiscard}
            >
              <span className="inter-regular text-[12px]">Discard</span>
            </button>
            <div className="flex space-x-3 mr-6">
              <div className="relative">
                {/* Popup */}
                {showSendPopup && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[42px] right-0 w-[150px] h-[32px] bg-white rounded-[8px] shadow-[0px_0px_12px_0px_#767676] z-50 flex items-center px-[12px]"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSendPopup(false);
                        setShowSchedulePopup(true);
                      }}
                      className="flex flex-row gap-[5px] text-[12px] inter-regular text-[#000000] whitespace-nowrap hover:bg-[#F6F3FF] rounded-[8px] w-full justify-center cursor-pointer"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4.66699 5.66797L6.62833 6.82797C7.77166 7.50397 8.22833 7.50397 9.37233 6.82797L11.3337 5.66797"
                          stroke="black"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M1.3442 8.98438C1.38753 11.0277 1.40953 12.0497 2.16353 12.8064C2.91753 13.5637 3.96687 13.5897 6.0662 13.6424C7.35953 13.6757 8.64087 13.6757 9.9342 13.6424C12.0335 13.5897 13.0829 13.5637 13.8369 12.8064C14.5909 12.0497 14.6129 11.0277 14.6569 8.98438C14.6702 8.32705 14.6702 7.67372 14.6569 7.01638C14.6129 4.97305 14.5909 3.95105 13.8369 3.19438C13.0829 2.43705 12.0335 2.41105 9.9342 2.35838C8.64507 2.32585 7.35533 2.32585 6.0662 2.35838C3.96687 2.41105 2.91753 2.43705 2.16353 3.19438C1.40953 3.95105 1.38753 4.97305 1.34353 7.01638C1.3295 7.67231 1.33017 8.32846 1.3442 8.98438Z"
                          stroke="black"
                          stroke-linejoin="round"
                        />
                      </svg>
                      Schedule Message
                    </button>
                  </div>
                )}

                {/* Schedule Popup */}
                {showSchedulePopup && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-[100px] right-[90px] z-[9999] w-[271px] h-[206px] rounded-[22px] bg-white shadow-[0px_0px_12px_0px_#B6B6B6] p-[18px] flex flex-col"
                  >
                    <div className="flex flex-row items-center gap-[5px] mb-[14px]">
                      <svg
                        width="19"
                        height="17"
                        viewBox="0 0 19 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5.16699 5.16602L7.61866 6.61602C9.04783 7.46102 9.61866 7.46102 11.0487 6.61602L13.5003 5.16602"
                          stroke="black"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <path
                          d="M1.0135 9.313C1.06767 11.8672 1.09517 13.1447 2.03767 14.0905C2.98017 15.0372 4.29184 15.0697 6.916 15.1355C8.53267 15.1772 10.1343 15.1772 11.751 15.1355C14.3752 15.0697 15.6868 15.0372 16.6293 14.0905C17.5718 13.1447 17.5993 11.8672 17.6543 9.313C17.671 8.49133 17.671 7.67466 17.6543 6.853C17.5993 4.29883 17.5718 3.02133 16.6293 2.0755C15.6868 1.12883 14.3752 1.09633 11.751 1.0305C10.1396 0.989834 8.52741 0.989834 6.916 1.0305C4.29184 1.09633 2.98017 1.12883 2.03767 2.0755C1.09517 3.02133 1.06767 4.29883 1.01267 6.853C0.995126 7.6729 0.995959 8.49309 1.0135 9.313Z"
                          stroke="black"
                          stroke-width="2"
                          stroke-linejoin="round"
                        />
                      </svg>

                      <span className="text-[16px] inter-semibold text-[#000000]">
                        Schedule Message
                      </span>

                      <button
                        onClick={() => setShowSchedulePopup(false)}
                        className="text-[16px] text-[#767676] cursor-pointer"
                      >
                        ×
                      </button>
                    </div>

                    <div className="flex flex-col gap-[10px] border-b-[2px] border-[#D6D6D6] pb-[14px]">
                      <button className="flex flex-row items-center justify-between h-[20px] rounded-[12px] hover:bg-[#F6F3FF] px-[0px] cursor-pointer">
                        <span className="text-[14px] inter-regular text-left">
                          Tomorrow Morning
                        </span>
                        <span className="text-[14px] inter-regular text-left">
                          17 Mar,8.00
                        </span>
                      </button>

                      <button className="flex flex-row items-center justify-between h-[20px] rounded-[12px] hover:bg-[#F6F3FF] px-[0px] cursor-pointer">
                        <span className="text-[14px] inter-regular text-left">
                          Tomorrow Afternoon
                        </span>
                        <span className="text-[14px] inter-regular text-left">
                          17 Mar,13.00
                        </span>
                      </button>

                      <button className="flex flex-row items-center justify-between h-[20px] rounded-[12px] hover:bg-[#F6F3FF] px-[0px] cursor-pointer">
                        <span className="text-[14px] inter-regular text-left">
                          Tomorrow Evening
                        </span>
                        <span className="text-[14px] inter-regular text-left">
                          17 Mar,18.00
                        </span>
                      </button>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDatePicker(true);
                      }}
                      className="flex flex-row mt-[5px] gap-[8px] items-center hover:bg-[#D9D9D9] cursor-pointer rounded-[8px] px-[5px] py-[6px] transition-colors duration-200"
                    >
                      <div className="w-[18px] h-[18px] flex items-center justify-center mt-[0px]">
                        <svg
                          width="15"
                          height="16"
                          viewBox="0 0 15 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.25 0.5V3.5M4.25 0.5V3.5M0.5 6.5H14M8 2H6.5C3.67175 2 2.25725 2 1.379 2.879C0.50075 3.758 0.5 5.17175 0.5 8V9.5C0.5 12.3283 0.5 13.7428 1.379 14.621C2.258 15.4993 3.67175 15.5 6.5 15.5H8C10.8282 15.5 12.2427 15.5 13.121 14.621C13.9992 13.742 14 12.3283 14 9.5V8C14 5.17175 14 3.75725 13.121 2.879C12.242 2.00075 10.8282 2 8 2Z"
                            stroke="#2A1E17"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M7.24651 9.5H7.25251M7.24651 12.5H7.25251M10.2428 9.5H10.2495M4.24951 9.5H4.25626M4.24951 12.5H4.25626"
                            stroke="#2A1E17"
                            stroke-width="1.33333"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </div>
                      <span className="text-[16px] inter-medium mt-[0px]">
                        Select date and time
                      </span>
                    </div>
                  </div>
                )}

                {/* Date Picker Popup */}
                {showDatePicker && (
                  <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-[rgba(0,0,0,0.25)] backdrop-blur-[2px]"
                    onClick={() => setShowDatePicker(false)}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-[583px] h-[366px] bg-white rounded-[22px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-[24px] py-[18px]">
                        <span className="text-[20px] inter-bold text-[#03081B]">
                          Select date and time
                        </span>

                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-[#767676] text-[22px] cursor-pointer"
                        >
                          ×
                        </button>
                      </div>

                      {/* Body */}
                      <div className="flex flex-row flex-1 px-[24px] gap-[24px]">
                        {/* Calendar Section */}
                        <div className="w-[240px] h-[200px] flex flex-col">
                          <div className="flex items-center justify-between mb-[18px]">
                            <span className="text-[12px] inter-bold text-[#040B23]">
                              {monthNames[currentMonth.getMonth()]}{" "}
                              {currentMonth.getFullYear()}
                            </span>

                            <div className="flex flex-row w-[65px] items-center justify-between">
                              <button
                                onClick={handlePrevMonth}
                                className="w-[28px] h-[28px] rounded-full hover:bg-[#F5F5F5] flex items-center justify-center cursor-pointer"
                              >
                                ‹
                              </button>
                              <button
                                onClick={handleNextMonth}
                                className="w-[28px] h-[28px] rounded-full hover:bg-[#F5F5F5] flex items-center justify-center cursor-pointer"
                              >
                                ›
                              </button>
                            </div>
                          </div>

                          {/* Week Days */}
                          <div className="grid grid-cols-7 gap-x-[2px] gap-y-[6px] mb-[8px]">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(
                              (day) => (
                                <div
                                  key={day}
                                  className="text-center text-[12px] inter-medium text-[#767676]"
                                >
                                  {day}
                                </div>
                              ),
                            )}
                          </div>

                          {/* Calendar Dates */}
                          <div className="grid grid-cols-7 gap-x-[6px] gap-y-[2px]">
                            {/* Previous Month Dates */}
                            {Array.from({ length: firstDayOfMonth }).map(
                              (_, index) => {
                                const prevMonthDays = new Date(
                                  currentMonth.getFullYear(),
                                  currentMonth.getMonth(),
                                  0,
                                ).getDate();

                                const day =
                                  prevMonthDays - firstDayOfMonth + index + 1;

                                return (
                                  <div
                                    key={`prev-${index}`}
                                    className="w-[28px] h-[24px] flex items-center justify-center text-[11px] text-[#CACACA]"
                                  >
                                    {day}
                                  </div>
                                );
                              },
                            )}

                            {Array.from({ length: daysInMonth }).map(
                              (_, index) => {
                                const day = index + 1;

                                const isSelected =
                                  selectedDate.getDate() === day &&
                                  selectedDate.getMonth() ===
                                    currentMonth.getMonth() &&
                                  selectedDate.getFullYear() ===
                                    currentMonth.getFullYear();

                                return (
                                  <button
                                    key={index}
                                    onClick={() => handleDateSelect(day)}
                                    className={`w-[28px] h-[24px] rounded-[6px] text-[11px] transition-colors cursor-pointer ${
                                      isSelected
                                        ? "bg-[#6A37F5] text-white"
                                        : "hover:bg-[#EAEAEA]"
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>

                        {/* Time Section */}
                        <div className="w-[150px] flex flex-col gap-[18px]">
                          <div className="flex flex-col gap-[8px]">
                            <label className="text-[12px] inter-medium text-[#767676]">
                              Date & Time
                            </label>

                            <div className="flex flex-row w-[259px] h-[42px] border border-[#EAEAEA] gap-[8px] rounded-[8px] px-[12px] flex items-center">
                              <div className="w-[20px] h-[20px] flex items-center justify-center">
                                <svg
                                  width="17"
                                  height="18"
                                  viewBox="0 0 17 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M11.4583 0.625V3.95833M4.79167 0.625V3.95833M0.625 7.29167H15.625M8.95833 2.29167H7.29167C4.14917 2.29167 2.5775 2.29167 1.60167 3.26833C0.625833 4.245 0.625 5.81583 0.625 8.95833V10.625C0.625 13.7675 0.625 15.3392 1.60167 16.315C2.57833 17.2908 4.14917 17.2917 7.29167 17.2917H8.95833C12.1008 17.2917 13.6725 17.2917 14.6483 16.315C15.6242 15.3383 15.625 13.7675 15.625 10.625V8.95833C15.625 5.81583 15.625 4.24417 14.6483 3.26833C13.6717 2.2925 12.1008 2.29167 8.95833 2.29167Z"
                                    stroke="#040B23"
                                    stroke-width="1.25"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  />
                                </svg>
                              </div>
                              <span className="inter-bold text-[10px] text-[#040B23]">
                                {formatSelectedDate(selectedDate)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-[8px]">
                            <label className="text-[12px] inter-medium text-[#767676]">
                              Select a time
                            </label>

                            <div className="relative w-[259px] h-[42px]">
                              {/* Left Clock Icon */}
                              <div className="absolute left-[12px] top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M8.95833 17.2917C13.5607 17.2917 17.2917 13.5607 17.2917 8.95833C17.2917 4.35596 13.5607 0.625 8.95833 0.625C4.35596 0.625 0.625 4.35596 0.625 8.95833C0.625 13.5607 4.35596 17.2917 8.95833 17.2917Z"
                                    stroke="black"
                                    strokeWidth="1.25"
                                  />
                                  <path
                                    d="M8.95874 5.625V8.95833L10.6254 10.625"
                                    stroke="black"
                                    strokeWidth="1.25"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>

                              {/* Custom Dropdown Arrow */}
                              <div className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] flex items-center justify-center pointer-events-none">
                                <svg
                                  width="8"
                                  height="5"
                                  viewBox="0 0 8 5"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M7.4375 0.4375C7.4375 0.4375 4.85975 3.9375 3.9375 3.9375C3.01525 3.9375 0.4375 0.4375 0.4375 0.4375"
                                    stroke="black"
                                    strokeWidth="0.875"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>

                              {/* Time Input */}
                              <input
                                type="time"
                                step="1"
                                value={selectedTime}
                                onChange={(e) =>
                                  setSelectedTime(e.target.value)
                                }
                                className="w-full h-full border border-[#EAEAEA] rounded-[8px] pl-[42px] pr-[34px] text-[10px] inter-bold outline-none focus:border-[#6A37F5] bg-white cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-end gap-[12px] px-[24px] py-[18px] mt-[-40px]">
                        <button
                          onClick={() => {
                            const [hours, minutes] = selectedTime.split(":");

                            const scheduled = new Date(selectedDate);

                            scheduled.setHours(Number(hours));
                            scheduled.setMinutes(Number(minutes));

                            setScheduledDateTime(scheduled);

                            console.log("Scheduled DateTime:", scheduled);

                            setShowDatePicker(false);
                            setShowSchedulePopup(false);
                          }}
                          className="px-[18px] py-[8px] rounded-[16px] bg-[#6A37F5] text-white text-[13px] inter-medium hover:bg-[#5b2cd0] transition-colors cursor-pointer"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="px-[18px] py-[8px] rounded-[10px] text-[#6A37F5] text-[13px] inter-medium hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Send Button */}
                <button
                  disabled={isLoading}
                  className="flex flex-row inter-regular px-4 py-2 gap-[8px] bg-[#6A37F5] text-white rounded-[20px] text-[12px] cursor-pointer hover:bg-[#5a2ed5] transition-colors disabled:bg-[#b9a6f5] disabled:cursor-not-allowed"
                >
                  {/* Send Text */}
                  <span onClick={handleSend}>
                    {isLoading ? "Sending..." : "Send"}
                  </span>

                  {/* Arrow Button */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSendPopup((prev) => !prev);
                    }}
                    className="w-[20px] h-[20px] rounded-full flex items-center justify-center bg-white cursor-pointer"
                  >
                    <svg
                      width="6"
                      height="4"
                      viewBox="0 0 6 4"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5.10417 2.77083C5.10417 2.77083 3.38528 0.4375 2.77083 0.4375C2.15639 0.4375 0.4375 2.77083 0.4375 2.77083"
                        stroke="#6A37F5"
                        strokeWidth="0.875"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Discard Confirmation Modal */}
        {showDiscardConfirm && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.4)] backdrop-blur-[2px]"
            onClick={() => setShowDiscardConfirm(false)}
          >
            <div
              className="bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-[24px] w-[350px] flex flex-col gap-[16px] animate-[slideUp_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="inter-semibold text-[16px] text-[#040B23]">
                Confirm Deletion
              </h3>
              <p className="inter-regular text-[13px] text-[#555]">
                {" "}
                Are you sure you want to permanently delete this message?
              </p>
              <div className="flex justify-end items-center gap-[12px] mt-[8px]">
                <button
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-[16px] py-[8px] rounded-[6px] inter-medium text-[13px] text-[#767676] bg-transparent hover:bg-[#F5F5F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDiscard}
                  className="px-[16px] py-[8px] rounded-[6px] bg-[#FF4D4D] inter-medium text-[13px] text-white shadow-[0_2px_8px_rgba(255,77,77,0.3)] hover:bg-[#e60000] transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-[20px] left-1/2 transform -translate-x-1/2 z-[110] px-[16px] py-[10px] bg-[#FF4D4D] text-white text-[12px] inter-regular rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-between whitespace-nowrap animate-[slideUp_0.3s_ease-out]">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};
