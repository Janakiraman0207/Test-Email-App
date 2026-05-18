import React, { useEffect, useMemo, useState } from "react";
import { ChatRecentFileIcon } from "../../../assets/icons/Icons1";
import { api } from "../../../api/api";
import ChatSettings from "./ChatSettings";

function stringToDarkColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 25%)`;
}
// Pastel color generator (as in ChatHome/ChatMessageArea)
function stringToPastelColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 85%)`;
}
// Avatar fallback logic as in ChatHome/ChatMessageArea
function getDisplayImage(user) {
  return (
    user.avatar_url ||
    user.profile_image ||
    user.avatar ||
    user.profileImage ||
    null
  );
}

const ChatDetails = ({
  roomId,
  selectedChat,
  apiKey,
  activeTab,
  handleTabClick,
  files,
  photos,
  showAllPhotos,
  handleViewAllPhotos
}) => {
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profileImage: "",
    avatar_url: "",
    avatar: ""
  });

  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const isGroupChat = Boolean(selectedChat?.is_group || selectedChat?.isGroup);

  const getNameParts = (name) => {
    if (!name || typeof name !== "string") return { firstName: "", lastName: "" };
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(" ")
    };
  };

  const mapUserData = (details, fallbackChat = null) => {
    const isGroupChat = Boolean(fallbackChat?.is_group || fallbackChat?.isGroup);
    const fallbackGroupName = fallbackChat?.displayName || fallbackChat?.name || "Group";

    if (isGroupChat) {
      return {
        firstName: fallbackGroupName,
        lastName: "",
        email: "",
        profileImage: fallbackChat?.displayImage || ""
      };
    }

    const apiFirstName = details?.first_name || details?.firstName || "";
    const apiLastName = details?.last_name || details?.lastName || "";
    const fullName = details?.name || details?.full_name || details?.fullName || "";
    const nameParts = getNameParts(fullName);

    const fallbackFirstName =
      fallbackChat?.otherParticipantFirstName ||
      fallbackChat?.first_name ||
      fallbackChat?.firstName ||
      getNameParts(fallbackChat?.displayName || "").firstName ||
      "";
    const fallbackLastName =
      fallbackChat?.otherParticipantLastName ||
      fallbackChat?.last_name ||
      fallbackChat?.lastName ||
      getNameParts(fallbackChat?.displayName || "").lastName ||
      "";

    return {
      firstName: apiFirstName || nameParts.firstName || fallbackFirstName,
      lastName: apiLastName || nameParts.lastName || fallbackLastName,
      email:
        details?.email ||
        details?.user_email ||
        fallbackChat?.displayEmail ||
        fallbackChat?.email ||
        "",
      profileImage:
        details?.profile_image ||
        details?.profileImage ||
        fallbackChat?.displayImage ||
        ""
    };
  };

  const getInitial = (p) => {
    return (
      p?.first_name?.charAt(0) ||
      p?.firstName?.charAt(0) ||
      p?.name?.charAt(0) ||
      (p?.email ? p.email.charAt(0) : "") ||
      ""
    ).toUpperCase();
  };

  const getColorKey = (p) => {
  return (
    p?.email ||
    p?.user_email ||
    p?.id ||
    p?.user_id ||
    p?.first_name ||
    ""
  ).toString().toLowerCase();
  };

  const groupMembers = useMemo(() => {
  if (!isGroupChat || !selectedChat) return [];
  const members = [];
  const seen = new Set();
  const addMember = (p) => {
    if (!p) return;
    const key = (p?.email || p?.user_email || p?.id || p?.user_id || "").toString().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    members.push(p);
  };
  if (Array.isArray(selectedChat.participant_details) && selectedChat.participant_details.length > 0) {
    selectedChat.participant_details.forEach(addMember);
  } else if (Array.isArray(selectedChat.participants)) {
    selectedChat.participants.forEach((p) => {
      if (typeof p === "string") {
        addMember({ email: p });
      } else {
        addMember(p);
      }
    });
  }

  return members.slice(0, 4);
}, [isGroupChat, selectedChat]);

  const displayName = useMemo(() => {
    if (isGroupChat) {
      return user.firstName || selectedChat?.displayName || selectedChat?.name || "Group";
    }
    return `${user.firstName} ${user.lastName}`.trim() || "Unknown User";
  }, [isGroupChat, user.firstName, user.lastName, selectedChat]);

  const initials = useMemo(() => {
    if (isGroupChat) {
      const words = (displayName || "").trim().split(/\s+/).filter(Boolean);
      if (words.length === 0) return "?";
      if (words.length === 1) return words[0].charAt(0).toUpperCase();
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    const f = user.firstName?.trim()?.[0] || "";
    const l = user.lastName?.trim()?.[0] || "";
    return (f + l).toUpperCase() || "?";
  }, [isGroupChat, displayName, user.firstName, user.lastName]);

  useEffect(() => {
    if (!selectedChat) return;
    setUser((prev) => ({ ...prev, ...mapUserData(null, selectedChat) }));
    setAvatarLoadFailed(false);
  }, [selectedChat]);

  useEffect(() => {
    if (!roomId) return;
    if (selectedChat?.is_group || selectedChat?.isGroup) return;

    const controller = new AbortController();

    (async () => {
      try {
        const response = await api.get(`/chat/rooms/${roomId}/details`, {
          headers: apiKey ? { "x-api-key": apiKey } : undefined,
          signal: controller.signal
        });

        const data = response?.data || {};
        const details = data?.user || data;
        setUser(mapUserData(details, selectedChat));
        setAvatarLoadFailed(false);
      } catch (err) {
        const isCanceled =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED";

        if (!isCanceled) {
          console.error(err);
        }
      }
    })();

    return () => controller.abort();
  }, [roomId, apiKey, selectedChat]);

  const getMemberColorPair = (member, memberIdx, allMembers) => {
  const key = getColorKey(member);
  const allKeys = allMembers.map(m => getColorKey(m));
  const isFirstOccurrence = key && allKeys.indexOf(key) === memberIdx;

  if (isFirstOccurrence) {
    return { pastel: stringToPastelColor(key), dark: stringToDarkColor(key) };
  }
  const n = allMembers.length;
  const anchorKey = allKeys.find(k => k) || 'group';
  let h = 0;
  for (let i = 0; i < anchorKey.length; i++) {
    h = anchorKey.charCodeAt(i) + ((h << 5) - h);
  }
  const anchorHue = Math.abs(h) % 360;
  const hue = Math.round((anchorHue + (memberIdx / n) * 360)) % 360;
  return { pastel: `hsl(${hue}, 60%, 85%)`, dark: `hsl(${hue}, 60%, 25%)` };
};

  const renderGroupAvatar = () => {
if (groupMembers.length === 1) {
  return (
    <div
      className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-[24px] inter-bold"
      style={{
        background: stringToPastelColor(getColorKey(groupMembers[0])),
        color: stringToDarkColor(getColorKey(groupMembers[0]))
      }}
    >
      {getInitial(groupMembers[0])}
    </div>
  );
}

    if (groupMembers.length === 2) {
      return (
        <div className="w-[80px] h-[80px] flex rounded-full overflow-hidden">
          {groupMembers.slice(0, 2).map((p, idx) => (
            <div
              key={idx}
              className="flex-1 flex items-center justify-center"
              style={{
                background: stringToPastelColor(getColorKey(p)),
                color: stringToDarkColor(getColorKey(p))
              }}
            >
              {getInitial(p)}
            </div>
          ))}
        </div>
      );
    }

    if (groupMembers.length === 3) {
        const members3 = groupMembers.slice(0, 3);
        const c0 = getMemberColorPair(members3[0], 0, members3);
        return (
          <div className="w-[80px] h-[80px] flex rounded-full overflow-hidden">
            <div
              className="w-1/2 flex items-center justify-center"
              style={{ background: c0.pastel, color: c0.dark }}
            >
              {getInitial(groupMembers[0])}
            </div>
            <div className="w-1/2 flex flex-col">
              {[1, 2].map(i => {
                const ci = getMemberColorPair(members3[i], i, members3);
                return (
                  <div
                    key={i}
                    className="flex-1 flex items-center justify-center"
                    style={{ background: ci.pastel, color: ci.dark }}
                  >
                    {getInitial(groupMembers[i])}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

    const members4 = groupMembers.slice(0, 4);
    return (
      <div className="grid grid-cols-2 grid-rows-2 w-[80px] h-[80px] rounded-full overflow-hidden">
        {members4.map((p, idx) => {
          const c = getMemberColorPair(p, idx, members4);
          return (
            <div
              key={idx}
              className="flex items-center justify-center"
              style={{ background: c.pastel, color: c.dark }}
            >
              {getInitial(p)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-[282px] h-full pt-[40px] pr-[31px] pb-[24px] pl-[31px] gap-[10px] flex flex-col">
      <div className="flex flex-col items-center w-full h-full gap-[0px] flex-1">
        <div className="flex flex-col w-full gap-[20px]">
          <div className="flex flex-col items-center justify-center w-full h-[217px] gap-[10px]">
            <div className="flex items-center justify-center w-[100px] h-[100px]">
              {getDisplayImage(user) && !avatarLoadFailed ? (
                <img
                  src={getDisplayImage(user)}
                  alt={displayName}
                  className="w-[80px] h-[80px] rounded-[50%] object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : isGroupChat ? (
                renderGroupAvatar()
              ) : (
                <div
                  className="w-[80px] h-[80px] rounded-full flex items-center justify-center text-[24px] inter-bold"
                  style={{ background: stringToPastelColor(user.email || user.firstName || displayName || "user") }}
                >
                  <span style={{ color: stringToDarkColor(user.email || user.firstName || displayName || "user") }}>
                    {initials}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center justify-center w-[180px] min-h-[37px] gap-[6px] text-center">
              <span className="inter-bold text-[12px]">
                {displayName}
              </span>
              {!isGroupChat && user.email && (
                <span className="inter-regular text-[11px] text-[#909090] break-all leading-[1.2]">
                  {user.email}
                </span>
              )}
            </div>

            <div className="flex flex-row items-center w-[165px] h-[40px] px-[3px] rounded-[20px] mt-[20px] border border-[#D6D6D6]">

            <div
              className={`flex items-center justify-center w-[79.5px] h-[34px] rounded-[20px] cursor-pointer ${
                activeTab === "files" ? "bg-[#040B23] text-white" : "text-black"
              }`}
              onClick={() => handleTabClick("files")}
            >
              <span className="inter-medium text-[11px] leading-none">Files</span>
            </div>

            <div
              className={`flex items-center justify-center w-[79.5px] h-[34px] rounded-[20px] cursor-pointer ${
                activeTab === "settings" ? "bg-[#040B23] text-white" : "text-black"
              }`}
              onClick={(e) => {
                e.stopPropagation();  
                handleTabClick("settings");
              }}
            >
              <span className="inter-medium text-[11px] leading-none">Settings</span>
            </div>

          </div>
          </div>
          {activeTab === "settings" && (
            <div className="w-[calc(100%+62px)] -mx-[31px] h-[1px] bg-[#E7E7E7] mb-[16px]" />
          )}
          {/* Tab content */}
          {activeTab === "files" ? (
            <div className="flex flex-col w-full h-[111px] gap-[16px] mt-[25px] ">
              <span className="inter-bold text-[12px] tracking-[0.02em]">Recent files</span>
              {files.map((file, idx) => (
                <div key={idx} className="flex flex-row items-center w-[103px] h-[16px] px-[2px] gap-[10px]">
                  <ChatRecentFileIcon />
                  <span className="inter-regular text-[12px] tracking-[0.07em] text-[#5A5A5A]">
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <ChatSettings />
          )}

          {/* Photos */}
          {activeTab === "files" && (
          <div className="w-[220px] h-[165px] mt-[20px]">
            <span className="inter-bold text-[12px] tracking-[0.02em]">Photos</span>
            <div className="w-[220px] h-[165px] mt-[1px] grid grid-rows-3 grid-cols-3 gap-y-[7px] gap-x-[8px]">
              {(showAllPhotos ? photos : photos.slice(0, 5)).map((img, idx) => (
                <img key={idx} src={img} alt="" className="w-full h-full rounded-[9px]" />
              ))}
            </div>
          </div>
          )}
        </div>

        {!showAllPhotos && activeTab === "files" && (
          <button
            className="w-[60px] h-[24px] bg-[#040B230F] rounded-[20px] mt-[0px] border-[1px] border-[#E2E2E2] inter-medium text-[11px] text-[#040B23]"
            onClick={handleViewAllPhotos}
          >
            View all
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatDetails;