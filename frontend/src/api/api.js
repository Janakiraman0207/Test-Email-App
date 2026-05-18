import axios from "axios";

// const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = import.meta.env.VITE_API_BASE_URL || "/";
// const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
  withCredentials: true, // Important for CORS with credentials
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    // if (token && !config.url.includes("/auth/login") && !config.url.includes("/users/signup")) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    if (token && !config.url.startsWith("/auth")) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.params || config.data);
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    //console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.config) {
      // console.error(
      //   `API Error: ${error.config.method?.toUpperCase()} ${error.config.url}`,
      //   error.response?.data || error.message
      // );
    } else {
      // console.error("API Error (no config):", error.response?.data || error.message);
    }
    // GLOBAL 401 HANDLING (Token Expired / Invalid)
    if (error.response?.status === 401) {
      // console.log("Access token expired or invalid. Logging out...");
      // Remove stored token
      localStorage.removeItem("access_token");
      // Prevent infinite redirect loop
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }
    return Promise.reject(error);
  },
);

// Auth-related API calls
export const signUpUser = (payload) => {
  return api.post("/users/signup", payload);
};

export const loginUser = ({ email, password, otp }) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  if (otp) {
    formData.append("otp", otp);
  }

  return api.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const forgotPassword = ({ countryCode, mobile }) => {
  return api.post("/auth/forgot-password", {
    mobile_number: `${countryCode}${mobile}`.trim(),
  });
};

export const forgotUsername = ({ mobile }) => {
  return api.post("/auth/forgot-username", {
    phone_number: mobile.trim(),
  });
};

export const getInboxMails = () => api.get("/email/inbox");

export const getOutboxMails = () => api.get("/email/outbox");

export const sendMail = (mailData) => {
  return api.post(
    "/email/send",
    mailData,
    //   , {
    //   headers: {
    //     "Content-Type": "multipart/form-data",
    //   },
    // }
  );
};

export const getSentMails = () => api.get("/email/sent");

export const getDraftMails = () => api.get("/email/drafts");

export const saveDraft = (data) => {
  return api.post("/email/draft", data);
};

export const updateDraft = (id, data) => {
  return api.patch(`/email/draft/${id}`, data);
};

export const getDraftById = (id) => {
  return api.get(`/email/draft/${id}`);
};

export const publishDraft = (id) => {
  return api.post(`/email/${id}/publish`);
};

export const getStarredMails = () => api.get("/email/starred");

export const toggleStarMail = (id, value) =>
  api.patch(`/email/${id}`, { is_favorite: value });

export const getImportantMails = () => api.get("/email/important");

export const getSpamMails = () => api.get("/email/spam");

export const getArchivedMails = () => api.get("/email/archived");

export const archiveMail = (id) =>
  api.patch(`/email/${id}`, { is_archived: true });

export const unarchiveMail = (id) =>
  api.patch(`/email/${id}`, { is_archived: false });

export const toggleReadMail = (id, value = true) =>
  api.patch(`/email/${id}`, { is_read: value });

export const getTrashMails = () => api.get("/email/trash");
export const deleteMail = (id) => api.delete(`/email/${id}`);

export const restoreMail = (id) => api.post(`/email/${id}/restore`);

export const togglePinMail = (id, value) =>
  api.patch(`/email/${id}`, { is_important: value });

export const getUnreadMails = () => api.get("/email/unread");

// --- Calendar-related API calls ---
export const createEvent = (payload, create_meeting_link = false) =>
  api.post(`/events?create_meeting_link=${create_meeting_link}`, payload);
export const getEvent = (eventId) => api.get(`/events/${eventId}`);
export const updateEvent = (eventId, payload) =>
  api.patch(`/events/${eventId}`, payload);
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);
export const listEventsForDay = (dateStr) =>
  api.get("/events/day", { params: { date: dateStr } });
export const listEventsForWeek = (startDate) =>
  api.get("/events/week", { params: { start_date: startDate } });
export const listEventsForMonth = (year, month) =>
  api.get("/events/month", { params: { year, month } });
export const addAttendees = (eventId, userIds) =>
  api.post(`/events/${eventId}/attendees`, userIds);
export const respondEvent = (eventId, status) =>
  api.post(`/events/${eventId}/respond`, null, { params: { status } });
export const createMeeting = (payload) => api.post("/events/meeting", payload);
export const createSimpleReminder = (payload) =>
  api.post("/calendar/events", payload);

// --- Chat-related API functions ---

/**
 * Star/unstar a message
 * @param {string|number} messageId - ID of the message to star/unstar
 * @returns {Promise} - Response data with updated message status
 */
export const starMessage = async (messageId) => {
  try {
    // console.log("⭐ Toggling star for message:", messageId);
    const response = await api.post(`/chat/messages/${messageId}/star/`);
    // console.log("✅ Message star toggled successfully:", response.data);

    const resolvedStarredState =
      typeof response?.data?.is_starred === "boolean"
        ? response.data.is_starred
        : typeof response?.data?.is_saved === "boolean"
          ? response.data.is_saved
          : undefined;

    // Return the updated message data with the new is_starred status
    return {
      messageId: messageId,
      is_starred: resolvedStarredState,
      ...response.data,
    };
  } catch (error) {
    // console.error("❌ Error toggling star for message:", error);
    throw error;
  }
};

/**
 * Get starred messages for the current user
 * @returns {Promise} - Array of starred messages
 */
export const getStarredMessages = async () => {
  try {
    // console.log("⭐ Fetching starred messages");
    const response = await api.get("/chat/starred");
    //console.log("✅ Starred messages fetched:", response.data);
    return response.data;
  } catch (error) {
    //console.error("❌ Error fetching starred messages:", error);
    throw error;
  }
};

/**
 * Create a new chat room with another user
 * @param {string} userId - ID of the user to chat with
 * @param {string} userEmail - Email of the user to chat with
 * @returns {Promise} - Created room data
 */
export const createChatRoom = async (userId, userEmail, roomPayload = null) => {
  try {
    let payload = roomPayload;

    if (!payload) {
      payload = { participant_emails: [userEmail] };
    }

    // console.log('Sending payload:', payload);
    const response = await api.post("/chat/rooms", payload);
    // console.log('✅ Created chat room:', response.data);
    return response.data;
  } catch (error) {
    // console.error('❌ Error creating chat room:', error);
    throw error;
  }
};

/**
 * Search for chats by search term
 */
export const searchChats = async (searchTerm) => {
  try {
    const response = await api.get("/chat/search", {
      params: { q: searchTerm },
    });
    return response.data;
  } catch (error) {
    // console.error('Error searching chats:', error);
    throw error;
  }
};

/**
 * Search for users to chat with - uses the search-chat endpoint
 * @param {string} query - Search query (min 3 characters)
 * @returns {Promise} - Array of user objects with profile info
 */
export const searchChatUsers = async (query) => {
  try {
    const normalizedQuery = String(query ?? '').trim().replace(/\s+/g, ' ');
    if (normalizedQuery.length === 0) {
      return [];
    }
    // Allow any length if query looks like an email
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedQuery);
    if (!isEmail && normalizedQuery.length < 1) {
      return [];
    }
    const response = await api.get('/users/search-chat', {
      params: { q: normalizedQuery },
    });
    return response.data;
  } catch (error) {
    console.error("Error searching chat users:", error);
    return []; // Return empty array to prevent UI crashes
  }
};

/**
 * Get online status for a user
 * @param {string|number} userId - User ID or email
 * @returns {Promise} - Online status object with users array
 */
export const getOnlineStatus = async (userIdOrEmail) => {
  try {
    let userIdParam = null;

    if (
      typeof userIdOrEmail === "number" ||
      /^[0-9]+$/.test(String(userIdOrEmail))
    ) {
      userIdParam = String(userIdOrEmail);
    } else if (
      typeof userIdOrEmail === "string" &&
      userIdOrEmail.includes("@")
    ) {
      const users = await searchChatUsers(userIdOrEmail);
      const matchedUser = Array.isArray(users)
        ? users.find(
            (u) => u.email?.toLowerCase() === userIdOrEmail.toLowerCase(),
          )
        : null;

      if (matchedUser && matchedUser.id) {
        userIdParam = String(matchedUser.id);
      } else {
        // console.warn(
        //   "Unable to resolve online status user ID from email:",
        //   userIdOrEmail,
        // );
      }
    }

    if (!userIdParam) {
      // console.error(
      //   "Invalid user identifier for getOnlineStatus:",
      //   userIdOrEmail,
      // );
      return { is_online: false, last_seen: null };
    }

    const response = await api.get(`/chat/users/${userIdParam}/status`);
    return {
      is_online: response.data?.is_online ?? false,
      last_seen: response.data?.last_seen || null,
    };
  } catch (error) {
    // console.error("❌ Error fetching online status:", error);
    return { is_online: false, last_seen: null };
  }
};

/**
 * Get currently online chat users
 * @returns {Promise<Array>} - List of online users from /chat/online
 */
export const getChatOnlineUsers = async () => {
  try {
    const response = await api.get("/chat/online");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    // console.error("❌ Error fetching online users:", error);
    return [];
  }
};

/**
 * Add members to an existing chat room
 * @param {string|number} roomId - Room ID
 * @param {string[]} userEmails - Emails to add
 * @returns {Promise<Object>} - API response with added members
 */
export const addChatRoomMembers = async (roomId, userEmails) => {
  try {
    const response = await api.post(`/chat/rooms/${roomId}/members`, {
      user_emails: userEmails,
    });
    return response.data;
  } catch (error) {
    // console.error("❌ Error adding chat room members:", error);
    throw error;
  }
};

/**
 * Leave a group chat room as current user
 * @param {string|number} roomId - Room ID
 * @returns {Promise<Object>} - API response
 */
export const leaveChatRoom = async (roomId) => {
  try {
    const response = await api.post(`/chat/rooms/${roomId}/leave`);
    return response.data;
  } catch (error) {
    // console.error("❌ Error leaving chat room:", error);
    throw error;
  }
};

/**
 * Start a call in a specific room
 */
export const startCall = async (roomId) => {
  try {
    return await api.post(`/chat/rooms/${roomId}/call`);
  } catch (error) {
    // console.error('Error starting call:', error);
    throw error;
  }
};

/**
 * Get messages for a specific room - UPDATED with is_starred field
 * @param {string|number} roomId - ID of the room
 * @returns {Promise} - Array of messages with sender info and star status
 */
export const getRoomMessages = async (roomId) => {
  try {
    // console.log("📡 Fetching messages for room:", roomId);
    const response = await api.get(`/chat/rooms/${roomId}/messages`);
    // console.log("📥 Raw messages response:", response.data);

    // Handle different response structures
    let messages = [];

    if (Array.isArray(response.data)) {
      messages = response.data;
      // console.log(`✅ Received ${messages.length} messages as array`);
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      messages = response.data.data;
      // console.log(`✅ Received ${messages.length} messages from data property`);
    } else if (
      response.data?.messages &&
      Array.isArray(response.data.messages)
    ) {
      messages = response.data.messages;
      // console.log(
      //   `✅ Received ${messages.length} messages from messages property`,
      // );
    } else {
      // console.warn("Unexpected messages response format:", response.data);
      return [];
    }

    // Log first message structure to verify fields
    if (messages.length > 0) {
      // console.log("First message structure:", {
      //   id: messages[0].id,
      //   sender_email: messages[0].sender_email,
      //   sender_first_name: messages[0].sender_first_name,
      //   sender_last_name: messages[0].sender_last_name,
      //   content: messages[0].content?.substring(0, 50),
      //   is_starred: messages[0].is_starred, // Check if this field exists
      //   timestamp: messages[0].timestamp,
      // });

      // Check if all messages have is_starred field
      const messagesWithStar = messages.filter(
        (m) => m.is_starred !== undefined,
      ).length;
      // console.log(
      //   `📊 ${messagesWithStar} out of ${messages.length} messages have is_starred field`,
      // );
    }

    return messages;
  } catch (error) {
    // console.error("Error fetching room messages:", error);
    throw error;
  }
};

/**
 * Send message to room - Updated to return full sender info
 * @param {string|number} roomId - ID of the room
 * @param {Object} data - Message data with content
 * @returns {Promise} - Sent message data with sender info
 */
export const sendMessageToRoom = async (roomId, data) => {
  try {
    //console.log('Sending message to room:', roomId, 'Content:', data);

    if (!roomId) {
      throw new Error("Room ID is required");
    }

    // Get current user info from localStorage for fallback
    const currentUserEmail = localStorage.getItem("user_email") || "";
    const currentUserFirstName = localStorage.getItem("user_first_name") || "";
    const currentUserLastName = localStorage.getItem("user_last_name") || "";

    const response = await api.post(`/chat/rooms/${roomId}/message`, {
      content: data.content,
    });

    //console.log('✅ Message sent response:', response.data);

    // Return the full response data which includes sender info
    return {
      id: response.data.id,
      content: response.data.content,
      sender_email: response.data.sender_email || currentUserEmail,
      sender_first_name:
        response.data.sender_first_name || currentUserFirstName,
      sender_last_name: response.data.sender_last_name || currentUserLastName,
      timestamp: response.data.timestamp || new Date().toISOString(),
      room_id: roomId,
      is_starred: false, // New messages are not starred by default
      type: "new_message",
      link_url: response.data.link_url,
      link_title: response.data.link_title,
      link_description: response.data.link_description,
      link_image: response.data.link_image,
    };
  } catch (error) {
    //console.error('❌ Error sending message:');

    if (error.response) {
      // The request was made and the server responded with a status code
      //console.error('Status:', error.response.status);
      //console.error('Data:', error.response.data);
      //console.error('Headers:', error.response.headers);

      throw new Error(
        error.response.data.detail || `Server error: ${error.response.status}`,
      );
    } else if (error.request) {
      // console.error("No response received. Check if backend is running.");
      throw new Error(
        "Cannot connect to server. Please check your connection.",
      );
    } else {
      // console.error("Error setting up request:", error.message);
      throw error;
    }
  }
};

/**
 * Upload a file attachment to a chat room
 * @param {string|number} roomId - ID of the room
 * @param {File} file - File object to upload
 * @param {Function} onUploadProgress - Progress callback
 * @param {Object} options - Optional upload options
 * @returns {Promise} - Upload response with file URL
 */
export const uploadChatAttachment = async (
  roomId,
  file,
  content = '',
  onUploadProgress,
  options = {}
) => {
  try {
    const uploadFileName = (options.filename || file.name || 'attachment').toString().trim() || 'attachment';
    // console.log('📤 Uploading file to room:', roomId, 'File:', uploadFileName);
    
    const formData = new FormData();
    formData.append('file', file, uploadFileName);
    formData.append('content', content);

    const response = await api.post(`/chat/rooms/${roomId}/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onUploadProgress,
      signal: options.signal
    });

    // console.log("✅ File uploaded successfully:", response.data);

    // Return the response data which should include the URL and message info
    return {
      id: response.data.id,
      url: response.data.url,
      filename: response.data.filename || uploadFileName,
      content: response.data.content || `📎 ${uploadFileName}`,
      timestamp: response.data.timestamp || new Date().toISOString(),
      sender_email: response.data.sender_email,
      sender_first_name: response.data.sender_first_name || "",
      sender_last_name: response.data.sender_last_name || "",
      is_starred: false,
      link_url: response.data.link_url,
      link_title: response.data.link_title,
      link_description: response.data.link_description,
      link_image: response.data.link_image,
    };
  } catch (error) {
    // console.error("❌ Error uploading file:", error);

    if (error.response) {
      // console.error("Status:", error.response.status);
      // console.error("Data:", error.response.data);
      throw new Error(
        error.response.data.detail || `Upload failed: ${error.response.status}`,
      );
    } else if (error.request) {
      // The request was made but no response was received
      //console.error('No response received. Check if backend is running.');
      throw new Error(
        "Cannot connect to server. Please check your connection.",
      );
    } else {
      // Something happened in setting up the request
      //console.error('Error setting up request:', error.message);
      throw error;
    }
  }
};

/**
 * Send a message to a room - Alias for sendMessageToRoom
 */
export const sendMessage = sendMessageToRoom;

/**
 * Forward an existing message to another room
 * @param {string|number} messageId - Source message ID
 * @param {string|number} targetRoomId - Destination room ID
 * @returns {Promise<Object>} - API response
 */
export const forwardChatMessage = async (messageId, targetRoomId) => {
  try {
    const response = await api.post(`/chat/messages/${messageId}/forward`, {
      target_room_id: Number(targetRoomId),
    });
    return response.data;
  } catch (error) {
    // console.error("❌ Error forwarding message:", error);
    throw error;
  }
};

/**
 * Edit an existing chat message or rename an attachment file
 * @param {string|number} messageId - Message ID
 * @param {string} content - Updated message content (for text messages)
 * @param {string} fileName - New file name (for attachment messages)
 * @returns {Promise<Object>} - Updated message data
 */
export const editChatMessage = async (messageId, content, fileName = null) => {
  try {
    let payload;
    if (fileName !== null) {
      // This is a file rename operation
      payload = { file_name: fileName };
      // console.log('✏️ Renaming file for message:', messageId, 'to:', fileName);
    } else {
      // This is a text content edit operation
      payload = { content };
      // console.log('✏️ Editing message:', messageId, 'content:', content);
    }
    
    const response = await api.patch(`/chat/messages/${messageId}`, payload);
    // console.log('✅ Message edit successful:', response.data);
    return response.data;
  } catch (error) {
    // console.error("❌ Error editing message:", error);
    throw error;
  }
};

/**
 * Delete an existing chat message
 * @param {string|number} messageId - Message ID
 * @returns {Promise<void>}
 */
export const deleteChatMessage = async (messageId) => {
  try {
    await api.delete(`/chat/messages/${messageId}`);
  } catch (error) {
    // console.error("❌ Error deleting message:", error);
    throw error;
  }
};

/**
 * Get all chat rooms for the current user
 */
export const getChatRooms = async () => {
  try {
    const response = await api.get("/chat/rooms");
    return response.data;
  } catch (error) {
    //console.error('Error fetching chat rooms:', error);
    throw error;
  }
};

/**
 * Get all users
 */
export const getUsers = async () => {
  try {
    const response = await api.get("/users/");
    return response.data;
  } catch (error) {
    //console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get user profile
 */
export const getUserProfile = async () => {
  try {
    //console.log('Fetching user profile from:', API_URL + '/users/me');
    const token = localStorage.getItem("access_token");
    //console.log('Token exists:', !!token);

    const response = await api.get("/users/me", {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    //console.log('Profile API response:', response.data);

    // Store user info in localStorage for easy access
    if (response.data) {
      localStorage.setItem("user_id", response.data.id);
      localStorage.setItem("user_email", response.data.email);
      localStorage.setItem("user_first_name", response.data.first_name || "");
      localStorage.setItem("user_last_name", response.data.last_name || "");
      localStorage.setItem(
        "user_profile_image",
        response.data.profile_image || "",
      );
    }

    return response.data;
  } catch (error) {
 
    // if (response.data) {
    //   localStorage.setItem("user_id", response.data.id);
    //   localStorage.setItem("user_email", response.data.email);
    //   localStorage.setItem("user_first_name", response.data.first_name || "");
    //   localStorage.setItem("user_last_name", response.data.last_name || "");
    //   localStorage.setItem(
    //     "user_profile_image",
    //     response.data.profile_image || "",
    //   );
    // }

    throw error;
  }
};

// --- Settings-related API calls ---

export const getMySettings = () => api.get("/settings/me");
export const updateAllSettings = (payload) =>
  api.patch("/settings/me", payload);

export const getAccountSettings = () => api.get("/settings/me/account");
export const updateAccountSettings = (payload) =>
  api.patch("/settings/me/account", payload);

export const getGeneralSettings = () => api.get("/settings/me/general");
export const updateGeneralSettings = (payload) =>
  api.patch("/settings/me/general", payload);

export const getPeopleSettings = () => api.get("/settings/me/people");
export const updatePeopleSettings = (payload) =>
  api.patch("/settings/me/people", payload);

export const getCalendarSettings = () => api.get("/settings/me/calendar");
export const updateCalendarSettings = (payload) =>
  api.patch("/settings/me/calendar", payload);

export const fetchAccountSettings = async (token) => {
  const response = await api.get("/settings/me/account", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const fetchGeneralSettings = async (token) => {
  try {
    const response = await api.get("/settings/me/general", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    // console.error("Error fetching general settings:", error);
    throw error;
  }
};

export const fetchPeopleSettings = async (token) => {
  const response = await api.get("/settings/me/people", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updatePeopleSetting = async (key, value, token) => {
  const response = await api.patch(
    "/settings/me/people",
    { [key]: value },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};

/**
 * Search users by query string - Returns full user info
 */
export const searchUsers = async (query) => {
  try {
    const response = await api.get("/users/search", {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    // console.error("Error searching users:", error);
    throw error;
  }
};

// WebSocket connection for real-time status and messages
let statusSocket = null;
let messageSockets = new Map(); // Store multiple room connections
let statusCallbacks = new Set();

/**
 * Connect to status WebSocket for online/offline updates
 * @param {string|number} userId - Current user ID
 * @param {Function} onStatusUpdate - Callback for status updates
 * @returns {Function} - Cleanup function
 */
export const connectStatusWebSocket = (userId, onStatusUpdate) => {
  if (!userId) {
    // console.error("No userId provided for status WebSocket");
    return null;
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    // console.error("No access token found for status WebSocket connection");
    return null;
  }

  // Close existing socket if any
  if (statusSocket && statusSocket.readyState !== WebSocket.CLOSED) {
    statusSocket.close();
  }

  statusCallbacks.add(onStatusUpdate);

  // Create new connection
  const WS_BASE = import.meta.env.PROD
    ? `wss://${window.location.host}`
    : "ws://localhost:8000";

  // The correct format for this app: ws://localhost:8000/chat/ws/{user_id}?token={token}
  const wsUrl = `${WS_BASE}/chat/ws/${userId}?token=${token}`;
  // console.log("Connecting to status WebSocket:", wsUrl);

  statusSocket = new WebSocket(wsUrl);

  statusSocket.onopen = () => {
    // console.log("✅ Status WebSocket connected");
  };

  statusSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // console.log("Status WebSocket message:", data);
      statusCallbacks.forEach((callback) => callback(data));
    } catch (error) {
      // console.error("Error parsing status message:", error);
    }
  };

  statusSocket.onerror = (error) => {
    // console.error("❌ Status WebSocket error:", error);
  };

  statusSocket.onclose = (event) => {
    // console.log(
    //   "Status WebSocket disconnected, code:",
    //   event.code,
    //   "reason:",
    //   event.reason,
    // );
    // Attempt to reconnect after 5 seconds if not closed normally
    if (event.code !== 1000) {
      setTimeout(() => {
        // console.log("Attempting to reconnect status WebSocket...");
        connectStatusWebSocket(userId, onStatusUpdate);
      }, 5000);
    }
  };

  // Return cleanup function
  return () => {
    statusCallbacks.delete(onStatusUpdate);
    if (statusCallbacks.size === 0 && statusSocket) {
      statusSocket.close();
      statusSocket = null;
    }
  };
};

/**
 * Connect to chat WebSocket for real-time messages
 * @param {string|number} userId - Current user ID
 * @param {string|number} roomId - Chat room ID
 * @param {Function} onMessage - Callback for incoming messages
 * @returns {WebSocket} - WebSocket instance
 */
export const connectChatWebSocket = (userId, roomId, onMessage) => {
  if (!userId || !roomId) {
    // console.error("Missing userId or roomId for WebSocket connection");
    return null;
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    // console.error("No access token found for WebSocket connection");
    return null;
  }

  // Check if there's already a socket for this room
  const existingSocket = messageSockets.get(roomId);
  if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
    // console.log(`Using existing WebSocket for room ${roomId}`);
    return existingSocket;
  }

  // Close existing socket for this room if it exists and is not open
  if (existingSocket) {
    existingSocket.__manualClose = true;
    existingSocket.close();
  }

  const WS_BASE = import.meta.env.PROD
    ? `wss://${window.location.host}`
    : "ws://localhost:8000";

  // The correct format for this app: ws://localhost:8000/chat/ws/{room_id}/{user_id}?token={token}
  const wsUrl = `${WS_BASE}/chat/ws/${roomId}/${userId}?token=${token}`;
  // console.log("Connecting to chat WebSocket:", wsUrl);

  try {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // console.log(`✅ Chat WebSocket connected for room ${roomId}`);
      // Store the socket
      messageSockets.set(roomId, socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log(`WebSocket message for room ${roomId}:`, data);

        // Process different message types
        if (data.type === 'new_message' || data.type === 'MESSAGE_NEW' || (data.id && data.content && !data.type)) {
          // This is a new message
          const messageData = {
            id: data.id,
            content: data.content,
            fileName: data.filename,
            sender_email: data.sender_email,
            sender_first_name: data.sender_first_name || "",
            sender_last_name: data.sender_last_name || "",
            timestamp: data.timestamp,
            room_id: data.room_id || data.roomId || roomId,
            fromMe: data.sender_email === localStorage.getItem("user_email"),
            is_starred: data.is_starred || false,
            displayName:
              data.sender_email === localStorage.getItem("user_email")
                ? "You"
                : `${data.sender_first_name || ""} ${data.sender_last_name || ""}`.trim() ||
                  data.sender_email?.split("@")[0] ||
                  "User",
            formattedTime: new Date(data.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            reactions: data.reactions || [],
            is_forwarded: data.is_forwarded || false,
            parent_id: data.parent_id,
            parent_content: data.parent_content,
            parent_sender: data.parent_sender,
            attachment_url: data.attachment_url,
            link_url: data.link_url,
            link_title: data.link_title,
            link_description: data.link_description,
            link_image: data.link_image,
            isFile: !!data.attachment_url || data.content?.startsWith("📎"),
          };
          onMessage(messageData);
        } else if (data.type === 'MESSAGE_UPDATE' || data.type === 'message_update') {
          onMessage({ type: 'update', ...data });
        } else if (data.type === 'REACTION_UPDATE' || data.type === 'reaction_update') {
          onMessage({ type: 'reaction', ...data });
        } else if (data.type === 'MESSAGE_DELETE' || data.type === 'message_delete') {
          onMessage({ type: 'delete', ...data });
        } else if (data.type === 'typing') {
          onMessage({
            type: 'typing',
            user_id: data.user_id,
            room_id: data.room_id || data.roomId || roomId,
            is_typing: data.is_typing !== false,
            client_id: data.client_id,
            user_name: data.user_name,
            sender_email: data.sender_email
          });
        } else if (data.type === 'star_update') {
          onMessage({ 
            type: 'star_update', 
            message_id: data.message_id, 
            is_starred: data.is_starred 
          });
        } else if (data.type === "INCOMING_CALL") {
          onMessage({ type: "incoming_call", ...data });
        } else if (
          data.type === "CALL_STARTED" ||
          data.type === "CALL_ACCEPTED"
        ) {
          onMessage({ type: "call_started", ...data });
        } else if (
          data.type === "CALL_ENDED" ||
          data.type === "CALL_FINISHED"
        ) {
          onMessage({ type: "call_ended", ...data });
        } else if (data.type === "system_alert") {
          onMessage({ type: "system_alert", ...data });
        } else {
          // Default handling - just pass the data
          onMessage(data);
        }
      } catch (error) {
        // console.error("Error parsing WebSocket message:", error);
        console.error("Raw message:", event.data);
      }
    };

    socket.onerror = (error) => {
      // console.error(`❌ Chat WebSocket error for room ${roomId}:`, error);
    };

    socket.onclose = (event) => {
      // console.log(
      //   `Chat WebSocket disconnected for room ${roomId}`,
      //   "code:",
      //   event.code,
      //   "reason:",
      //   event.reason,
      // );
      // Remove from map
      messageSockets.delete(roomId);

      if (socket.__manualClose) {
        return;
      }

      // Try to reconnect after 5 seconds if not closed normally
      if (event.code !== 1000) {
        setTimeout(() => {
          // console.log(
          //   `Attempting to reconnect WebSocket for room ${roomId}...`,
          // );
          connectChatWebSocket(userId, roomId, onMessage);
        }, 5000);
      }
    };

    return socket;
  } catch (error) {
    // console.error("Error creating WebSocket:", error);
    return null;
  }
};

/**
 * Close WebSocket connection for a specific room
 * @param {string|number} roomId - Room ID to disconnect
 */
export const closeChatWebSocket = (roomId) => {
  const socket = messageSockets.get(roomId);
  if (socket) {
    socket.__manualClose = true;
    if (socket.readyState === WebSocket.OPEN) {
      socket.close(1000, "User left room");
    } else if (socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    messageSockets.delete(roomId);
    // console.log(`Closed WebSocket for room ${roomId}`);
  }
};

/**
 * Close all WebSocket connections
 */
export const closeAllWebSockets = () => {
  if (statusSocket && statusSocket.readyState === WebSocket.OPEN) {
    statusSocket.close(1000, "User logged out");
    statusSocket = null;
  }

  for (const [roomId, socket] of messageSockets) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close(1000, "User logged out");
    }
  }
  messageSockets.clear();
  statusCallbacks.clear();
  // console.log("All WebSocket connections closed");
};

/**
 * Send typing indicator via WebSocket
 * @param {WebSocket} socket - WebSocket instance
 * @param {string|number} roomId - Room ID
 * @param {string|number} userId - User ID
 */
export const sendTypingIndicator = (socket, roomId, userId) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "typing",
        user_id: userId,
        room_id: roomId,
      }),
    );
  }
};

/**
 * Send star update via WebSocket
 * @param {WebSocket} socket - WebSocket instance
 * @param {string|number} roomId - Room ID
 * @param {string|number} messageId - Message ID
 * @param {boolean} isStarred - Star status
 */
export const sendStarUpdate = (socket, roomId, messageId, isStarred) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "star_update",
        room_id: roomId,
        message_id: messageId,
        is_starred: isStarred,
      }),
    );
  }
};

// Chat service object - UPDATED with all functions
export const chatService = {
  searchChats,
  searchChatUsers,
  getOnlineStatus,
  getChatOnlineUsers,
  addChatRoomMembers,
  leaveChatRoom,
  startCall,
  getRoomMessages,
  getChatRooms,
  getUsers,
  createChatRoom,
  sendMessage: sendMessageToRoom,
  uploadChatAttachment,
  connectStatusWebSocket,
  connectChatWebSocket,
  closeChatWebSocket,
  closeAllWebSockets,
  sendTypingIndicator,
  sendMessageToRoom,
  forwardChatMessage,
  editChatMessage,
  deleteChatMessage,
  starMessage,
  getStarredMessages,
  sendStarUpdate,
};

// --- Drive-related API calls ---

export const uploadDriveFile = (formData) => {
  return api.post("/drive/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 1. FOR "MY FILES" TAB
export const getMyDriveFiles = () => api.get("/drive/my-files");

// 2. FOR "ALL FILES" TAB (DRIVE PAGE) -> Add this!
export const getAllDriveFiles = () => api.get("/drive/all-files");

// 3. FOR "SHARED WITH ME" TAB -> Add these!
export const getSharedWithMe = () => api.get("/drive/shared-with-me");
export const getSharedByMe = () => api.get("/drive/shared-by-me");

// 4. FOR SHARE POPUP MODAL -> Add these!
export const shareFile = (fileId, email, permission) =>
  api.post(
    `/drive/files/${fileId}/share?email=${encodeURIComponent(email)}&permission=${permission}`,
  );
export const getFileAccess = (fileId) =>
  api.get(`/drive/files/${fileId}/access`);
export const updateFileAccess = (fileId, userId, permission) =>
  api.put(`/drive/files/${fileId}/access/${userId}?permission=${permission}`);
export const removeFileAccess = (fileId, userId) =>
  api.delete(`/drive/files/${fileId}/access/${userId}`);

// New Endpoints for Favorites and Trash
export const toggleFavorite = (id) => api.patch(`/drive/${id}/favorite`);
export const getFavoriteFiles = () => api.get("/drive/favorites");
export const moveToTrash = (id) => api.delete(`/drive/${id}`);
export const getTrashFiles = () => api.get("/drive/trash");
export const restoreFile = (id) => api.patch(`/drive/${id}/restore`);
export const emptyTrash = () => api.delete("/drive/trash/empty");
export const deleteTrashFiles = (fileIds) =>
  api.delete("/drive/trash/delete-selected", {
    data: { file_ids: fileIds },
  });
export const getFileDetails = (fileId) => api.get(`/drive/files/${fileId}`);
export const downloadSecureFile = (fileId) =>
  api.get(`/drive/drive/download/${fileId}`, { responseType: "blob" });

export const getNotes = () => api.get("/notes/");
export const createNote = (data) => api.post("/notes/", data);
export const updateNote = (id, data) => api.patch(`/notes/${id}`, data);
export const deleteNote = (id) => api.delete(`/notes/${id}`);
export const browsePeople = () => {
  return api.get("/drive/browse/people");
};
//common api's
export const copyFileLink = (fileId) => {
  return api.post(`/drive/files/${fileId}/copy-link`);
};

export const renameFile = (fileId, newName) => {
  return api.patch(`/drive/files/${fileId}/rename`, {
    new_name: newName,
  });
};

export const updateUserStatus = (payload) => {
  return api.patch("/users/status", payload);
};

export const getAccountActivities = () => {
  return api.get("/profile/activity", {
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  },
});
};

export const logoutAllDevices = () => {
  return api.post("/api/sessions/logout-all");
};

export { api };

export const getTasks = (params) => api.get("/tasks/", { params });

export const createTask = (data) => api.post("/tasks/", data);

export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data);

export const deleteTask = (id) => api.delete(`/tasks/${id}`);

export const getPeople = () => api.get("/people/");

export const toggleFavourite = (id) =>
  api.post(`/people/${id}/toggle-favourite/`);

export const getOrganisationPeople = () =>
  api.get("/organisation/people");

export const createTaskFromEmail = (emailId) =>
  api.post(`/tasks/from-email/${emailId}`);

export const getProfile = async () => {
  const res = await api.get("/profile/");
  return res.data;
};

export const updateProfile = async (payload) => {
  const res = await api.patch("/profile/", payload);
  return res.data;
};