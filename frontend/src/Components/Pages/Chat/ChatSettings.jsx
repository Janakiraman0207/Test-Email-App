import React, { useState } from "react";

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <g transform="translate(1, -1.5)">
    <path d="M13.73 21a2 2 0 0 1-5.46 0" />
    </g>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <circle cx="12" cy="11" r="1"></circle>
    <path d="M12 12v2.5"></path>
  </svg>
);

const ChatBubbleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    <circle cx="8" cy="12" r="1.5" fill="#4A4A4A" stroke="none"></circle>
    <circle cx="12" cy="12" r="1.5" fill="#4A4A4A" stroke="none"></circle>
    <circle cx="16" cy="12" r="1.5" fill="#4A4A4A" stroke="none"></circle>
  </svg>
);

const AppearanceIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4A4A4A"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: "scaleX(-1)" }}
  >
    <g transform="translate(-1.5, 5) scale(0.8)">
      <path d="M21 5.4a2.25 2.25 0 0 0-3.18 0L4.5 18.72a2.25 2.25 0 0 0 3.18 3.18L21 8.58a2.25 2.25 0 0 0 0-3.18z" />
    </g>
    <g transform="translate(9 2) scale(1.25)">
      <path d="M0 0l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </g>
    <path d="M19 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
  </svg>
);

const Toggle = ({ on, onToggle }) => (
  <div
    onClick={onToggle}
    className={`relative flex-shrink-0 cursor-pointer mt-[1px] rounded-[12px] transition-colors duration-200 w-[29px] h-[16px] ${
      on ? "bg-[#040B23]" : "bg-[#040B23]/25"
    }`}
  >
    <div
      className={`absolute w-[14px] h-[14px] bg-white rounded-[12px] top-[1px] transition-all duration-200 ${
        on ? "right-[1px]" : "left-[1px]"
      }`}
    />
  </div>
);

const Row = ({ title, desc, on, onToggle }) => (
  <div className="flex justify-between items-start pl-[28px] mb-[14px]">
    <div>
      <p className="text-[12px] font-medium text-black leading-[15px]">{title}</p>
      <p className="text-[10px] font-light text-black leading-[12px] mt-[2px]">{desc}</p>
    </div>
    <Toggle on={on} onToggle={onToggle} />
  </div>
);

const Section = ({ icon, title, children, first }) => (
  <div className={`pt-[16px] ${!first ? "border-t border-[#E7E7E7] mt-[16px]" : ""}`}>
    <div className="flex items-center gap-[8px] mb-[14px]">
      <div className="w-[20px] h-[20px] flex-shrink-0 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[14px] font-bold text-black leading-[17px]">{title}</span>
    </div>
    {children}
  </div>
);

const ChatSettings = () => {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    messageSounds: true,
    emailNotifications: false,
    readReceipts: true,
    lastSeen: true,
    twoFactor: false,
    autoDownload: false,
    enterToSend: true,
    typingIndicators: true,
    darkMode: true,
    compactMode: false,
  });

  const toggle = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <style>{`
        .settings-scroll::-webkit-scrollbar { width: 3px; }
        .settings-scroll::-webkit-scrollbar-track { background: transparent; }
        .settings-scroll::-webkit-scrollbar-thumb {
          background: #898989;
          border-radius: 20px;
        }
      `}</style>

      <div
        className="settings-scroll w-full overflow-y-auto overflow-x-hidden pr-[4px] -mt-[30px] max-h-[calc(105vh-355px)]"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#898989 transparent",
        }}
      >
        <Section first icon={<BellIcon />} title="Notifications">
          <Row
            title="Push Notifications"
            desc="Receive push notifications"
            on={settings.pushNotifications}
            onToggle={() => toggle("pushNotifications")}
          />
          <Row
            title="Message Sounds"
            desc="Play sound for new messages"
            on={settings.messageSounds}
            onToggle={() => toggle("messageSounds")}
          />
          <Row
            title="Email Notifications"
            desc="Receive email updates"
            on={settings.emailNotifications}
            onToggle={() => toggle("emailNotifications")}
          />
        </Section>

        <Section icon={<ShieldIcon />} title="Privacy & Security">
          <Row
            title="Read Receipts"
            desc="Let others see when you read"
            on={settings.readReceipts}
            onToggle={() => toggle("readReceipts")}
          />
          <Row
            title="Last Seen"
            desc="Show when you were last active"
            on={settings.lastSeen}
            onToggle={() => toggle("lastSeen")}
          />
          <Row
            title="Two-Factor Authentication"
            desc="Extra security layer"
            on={settings.twoFactor}
            onToggle={() => toggle("twoFactor")}
          />
        </Section>

        <Section icon={<ChatBubbleIcon />} title="Chat Settings">
          <Row
            title="Auto - download Media"
            desc="Download images and videos"
            on={settings.autoDownload}
            onToggle={() => toggle("autoDownload")}
          />
          <Row
            title="Enter to Send"
            desc="Press Enter to send messages"
            on={settings.enterToSend}
            onToggle={() => toggle("enterToSend")}
          />
          <Row
            title="Typing Indicators"
            desc="Show when others are typing"
            on={settings.typingIndicators}
            onToggle={() => toggle("typingIndicators")}
          />
        </Section>

        <Section icon={<AppearanceIcon />} title="Appearance">
          <Row
            title="Dark mode"
            desc="Use dark mode"
            on={settings.darkMode}
            onToggle={() => toggle("darkMode")}
          />
          <Row
            title="Compact Mode"
            desc="Reduce spacing"
            on={settings.compactMode}
            onToggle={() => toggle("compactMode")}
          />
        </Section>
      </div>
    </>
  );
};
export default ChatSettings;