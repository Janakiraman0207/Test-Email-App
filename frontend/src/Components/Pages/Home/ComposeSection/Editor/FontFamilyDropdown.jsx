import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TextDropdownArrowIcon, TextIcon } from "../../../../../assets/icons/IconRegistry";

const FONT_FAMILIES = [
  "Arial",
  "Arial Black",
  "Comic Sans MS",
  "Courier New",
  "Georgia",
  "Helvetica",
  "Impact",
  "Inter",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Poppins",
  "Roboto",
  "'Open Sans'",
  "Lato",
  "Montserrat",
  "Playfair Display",
  "Nunito",
  "Ubuntu",
  "Raleway",
];

export const FontFamilyDropdown = ({
  editor,
  selectedFont,
  setSelectedFont,
  show,
  setShow,
}) => {
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
  });

  if (!editor) return null;

  const ref = useRef();
  const buttonRef = useRef();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const dropdown = document.querySelector(".font-dropdown");

      if (dropdown && !dropdown.contains(e.target)) {
        setShow(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!show) return;

    const handleScroll = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScroll, true); // 🔥 true is IMPORTANT

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;

    const handleResize = () => updatePosition();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [show]);

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    setDropdownPosition({
      top: rect.bottom + 5,
      left: rect.left,
    });
  };

  return (
    <div
      ref={ref}
      className="relative z-50 font-dropdown-wrapper"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        ref={buttonRef}
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          updatePosition();
          setShow((prev) => !prev);
        }}
        className="flex items-center gap-[6px] hover:bg-gray-200 p-1 rounded cursor-pointer w-[70px] flex-shrink-0"
      >
        <span
          className="text-[13px] truncate whitespace-nowrap overflow-hidden"
          style={{ fontFamily: selectedFont || "inherit" }}
        >
          {selectedFont || 
          // <TextIcon/>
          "Font"}
        </span>

        <span
          className={`transition-transform duration-300 ease-out ${
            show ? "rotate-180 scale-110" : "rotate-0 scale-100"
          }`}
        >
          <TextDropdownArrowIcon />
        </span>
      </button>

      {show &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 9999,
            }}
            ref={dropdownRef}
            className="font-dropdown-menu bg-white border rounded shadow-md w-[200px] max-h-[260px] overflow-y-auto"
          >
            {FONT_FAMILIES.map((font) => (
              <button
                key={font}
                onClick={(e) => {
                  e.stopPropagation();

                  editor
                    .chain()
                    .focus()
                    .setMark("textStyle", {})
                    .setFontFamily(font)
                    .run();

                  setSelectedFont(font);
                  setShow(false);
                }}
                style={{ fontFamily: font }}
                className="p-2 hover:bg-gray-100 text-left w-full"
              >
                {font}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};
