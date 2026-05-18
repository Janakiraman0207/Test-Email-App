import React, { useState } from "react";

const ChatWindow = ({ chat, currentUser }) => {
  const [messages, setMessages] = useState(chat.messages || []);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: input,
      sender: currentUser?.email || "me",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="p-4 border-b font-semibold">
        {chat.name}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded max-w-[70%] ${
              msg.sender === currentUser?.email
                ? "ml-auto bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="px-4 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </div>

    </div>
  );
};

export default ChatWindow;