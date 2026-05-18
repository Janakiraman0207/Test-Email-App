import React, { useEffect, useRef } from "react";

/**
 * A reusable dropdown menu component for file actions.
 * * @param {boolean} isOpen - Controls whether the menu is visible.
 * @param {function} onClose - Callback function to close the menu (e.g., when clicking outside or selecting an item).
 * @param {Array} options - An array of objects defining menu items. Example: [{ label: "Rename", onClick: () => {}, className: "text-red-500" }]
 */
export const ActionMenu = ({ isOpen, onClose, options }) => {
  const menuRef = useRef(null);

  // Handle clicking outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If menu is open and click is outside the menu element
      if (isOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Attach listener when opened
    if (isOpen) {
      // Using mousedown for slightly faster response than click
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup listener when closed or unmounted
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Container styles matching the design (white box, shadow, rounded corners, positioned absolutely)
    <div
      ref={menuRef}
      // Note: 'top-[30px] right-[20px]' positions it relative to its nearest positioned parent container.
      className="absolute top-[30px] right-[20px] w-[160px] bg-white rounded-[8px] shadow-lg border-[1px] border-[#EAEAEA] py-[8px] z-50 flex flex-col"
      // Prevent clicks inside the menu from bubbling up
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((option, index) => (
        <button
          key={index}
          // Base item styles + optional dynamic styling (e.g., for red "Delete" text)
          className={`text-left w-full inter-regular text-[12px] px-[16px] py-[8px] hover:bg-[#F5F5F5] transition-colors duration-150 outline-none ${
            option.className || "text-[#333]"
          }`}
          onClick={() => {
            if (option.onClick) option.onClick();
            onClose(); // Auto-close menu after an action is clicked
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};