import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { FontFamily } from "@tiptap/extension-font-family";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  LinkIcon,
  UnLinkIcon,
  StrikeThroughIcon,
  // HighlighterIcon,
  // FontColorIcon,
} from "../../../../assets/icons/IconRegistry";
import {
  FontColorIcon,
  HighlighterIcon,
} from "../../../../assets/icons/Icons2";
import { DriveIcon } from "../../../../assets/icons/IconRegistry";
import { ColorPicker } from "./ColorPicker/ColorPicker";
import { FontFamilyDropdown } from "./Editor/FontFamilyDropdown";
import { createPortal } from "react-dom";
import { AttachmentSection } from "./AttachmentsSection/AttachmentSection";
import { useToolbarScrollHint } from "../../../../hooks/useToolbarScrollHint";
import { COLORS } from "../../../../constants/Colors";

export const EmailEditor = ({
  value,
  onChange,
  handleAttachmentClick,
  attachments = [],
  handleRemoveAttachment,
  formatFileSize,
  activeMenu,
  setActiveMenu,
  expanded = false,
  className = "",
}) => {
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [selectedFont, setSelectedFont] = useState("");
  const [currentTextColor, setCurrentTextColor] = useState("#000000");
  const [currentBgColor, setCurrentBgColor] = useState("#ffff00");
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [linkMenuPosition, setLinkMenuPosition] = useState({ top: 0, left: 0 });
  const [currentLink, setCurrentLink] = useState("");
  const [colorPosition, setColorPosition] = useState({ top: 0, left: 0 });
  const textColorBtnRef = useRef(null);
  const bgColorBtnRef = useRef(null);
  const colorPickerRef = useRef(null);
  const toolbarRef = useRef(null);
  useToolbarScrollHint(toolbarRef);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".color-picker")) return;

      if (
        e.target.closest("[data-color-btn='text']") ||
        e.target.closest("[data-color-btn='bg']")
      )
        return;

      setShowTextColor(false);
      setShowBgColor(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateTimeout = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: true,
        italic: true,
        strike: true,
        underline: false,
        link: false,
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily.configure({
        types: ["textStyle"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: null,
          rel: null,
        },
      }),
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value || "",

    onUpdate: ({ editor }) => {
      clearTimeout(updateTimeout.current);

      updateTimeout.current = setTimeout(() => {
        onChange(editor.getHTML());
      }, 150);
    },
  });

  useEffect(() => {
    if (!editor) return;

    const updateFont = () => {
      const font = editor.getAttributes("textStyle").fontFamily;
      setSelectedFont(font || "");
    };

    editor.on("selectionUpdate", updateFont);
    editor.on("transaction", updateFont);

    return () => {
      editor.off("selectionUpdate", updateFont);
      editor.off("transaction", updateFont);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;

    const handleClick = (event) => {
      if (event.target.closest(".link-menu")) return;
      if (event.target.closest(".font-dropdown")) return;
      if (event.target.closest(".attachment-menu")) return;

      const link = event.target.closest("a");

      if (!link) {
        setShowLinkMenu(false);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      editor.chain().focus().run();

      const rect = link.getBoundingClientRect();

      setLinkMenuPosition({
        top: rect.bottom + 6,
        left: rect.left,
      });

      setCurrentLink(link.getAttribute("href"));
      setShowLinkMenu(true);
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [editor]);

  useEffect(() => {
    if (!showTextColor && !showBgColor) return;

    const handleScroll = () => {
      if (showTextColor) updateColorPosition(textColorBtnRef);
      if (showBgColor) updateColorPosition(bgColorBtnRef);
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showTextColor, showBgColor]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest(".attachment-menu")) return;
      setActiveMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeMenu) return;

    const handleScroll = () => {
      const btn = document.querySelector(".attachment-active-btn");
      if (!btn) return;

      const rect = btn.getBoundingClientRect();

      const left = Math.min(rect.right - 130, window.innerWidth - 140);

      setMenuPosition({
        top: rect.bottom + 5,
        left,
      });
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [activeMenu]);

  useEffect(() => {
    if (!showLinkMenu) return;

    const handleScroll = () => {
      const link = document.querySelector("a[href='" + currentLink + "']");
      if (!link) return;

      const rect = link.getBoundingClientRect();

      setLinkMenuPosition({
        top: rect.bottom + 6,
        left: rect.left,
      });
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showLinkMenu, currentLink]);

  if (!editor) return null;

  const addImage = () => {
    const url = prompt("Enter Image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;

    if (from === to) return;

    const existing = editor.getAttributes("link").href || "";

    if (existing) {
      setLinkUrl(existing);
    } else {
      setLinkUrl("");
    }

    const start = editor.view.coordsAtPos(from);
    setPopupPosition({
      top: start.bottom + 8,
      left: start.left,
    });
    setShowLinkPopup(true);
  };

  const applyLink = () => {
    const formatUrl = (url) => {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "https://" + url;
      }
      return url;
    };
    if (!editor || !linkUrl) return;

    editor
      .chain()
      .focus()
      .setLink({ href: formatUrl(linkUrl) })
      .setTextSelection(editor.state.selection.to)
      .run();

    setShowLinkPopup(false);
    setLinkUrl("");
  };

  const unsetLink = (e) => {
    e.stopPropagation();
    if (!editor) return;

    editor.chain().focus().unsetLink().run();
    setShowLinkMenu(false);
  };

  const handlePreview = (attachment) => {
    let url = null;
    if (attachment.url) {
      url = attachment.url;
    } else if (attachment.file) {
      if (attachment.file.type.startsWith("image/")) {
        const url = URL.createObjectURL(attachment.file);

        const newWindow = window.open("");
        newWindow.document.write(`
    <html>
      <head><title>Image Preview</title></head>
      <body style="margin:0; background:black; display:flex; justify-content:center; align-items:center; height:100vh;">
        <img src="${url}" style="max-width:100%; max-height:100%;" />
      </body>
    </html>
   `);

        return;
      }
      if (attachment.file.type === "application/pdf") {
        const url = URL.createObjectURL(attachment.file);

        const newWindow = window.open("");
        newWindow.document.write(`
    <iframe src="${url}" width="100%" height="100%" style="border:none;"></iframe>
   `);

        return;
      }

      if (attachment.file.type === "application/pdf") {
        const url = URL.createObjectURL(attachment.file);
        window.open(url, "_blank");
        return;
      }

      alert("Preview not available before upload for this file type.");
      return;
    }

    if (!url) return;

    const ext = attachment.name.split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
      window.open(url, "_blank");
    } else if (ext === "pdf") {
      window.open(url, "_blank");
    } else if (["txt", "json"].includes(ext)) {
      window.open(url, "_blank");
    } else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)) {
      if (attachment.url) {
        const viewerUrl = `https://docs.google.com/gview?url=${attachment.url}&embedded=true`;
        window.open(viewerUrl, "_blank");
      } else {
        alert("Preview not available for this file. Please upload first.");
      }
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.click();
    }
  };

  const updateColorPosition = (ref) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    setColorPosition({
      top: rect.bottom + 5,
      left: rect.left,
    });
  };

  return (
    <div className="relative flex flex-col flex-1 w-full">
      <div
        ref={toolbarRef}
        className="flex items-center gap-[10px] h-[32px] px-3 flex-shrink-0 bg-[#F3F3F3] border-b border-[#EAEAEA] text-[13px] rounded-[8px] [&>button]:cursor-pointer overflow-x-auto scrollbar-hide scroll-smooth"
      >
        <FontFamilyDropdown
          editor={editor}
          selectedFont={selectedFont}
          setSelectedFont={setSelectedFont}
          show={showTextMenu}
          setShow={setShowTextMenu}
        />

        <div className="w-[1px] h-[16px] bg-[#DCDCDC] flex-shrink-0" />

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 hover:bg-gray-200 rounded ${editor.isActive("bold") ? "text-[#6A37F5]" : ""}`}
          type="button"
          title="Bold"
        >
          <BoldIcon />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 hover:bg-gray-200 rounded ${editor.isActive("italic") ? "text-[#6A37F5]" : ""}`}
          type="button"
          title="Italic"
        >
          <ItalicIcon />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 hover:bg-gray-200 rounded ${editor.isActive("underline") ? "text-[#6A37F5]" : ""}`}
          type="button"
          title="Underline"
        >
          <UnderlineIcon />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1 hover:bg-gray-200 rounded ${editor.isActive("strike") ? "text-[#6A37F5]" : ""}`}
          type="button"
          title="Strikethrough"
        >
          <StrikeThroughIcon />
        </button>
        <div className="relative flex items-center">
          <button
            type="button"
            data-color-btn="text"
            ref={textColorBtnRef}
            className="p-1 hover:bg-gray-200 rounded flex items-center justify-center cursor-pointer"
            onClick={() => {
              updateColorPosition(textColorBtnRef);
              setShowTextColor(!showTextColor);
              setShowBgColor(false);
            }}
          >
            <span className="flex items-center justify-center">
              <FontColorIcon color={currentTextColor} />
            </span>
          </button>

          {showTextColor &&
            createPortal(
              <div
                className="color-picker"
                style={{
                  position: "fixed",
                  top: colorPosition.top,
                  left: colorPosition.left,
                  zIndex: 9999,
                }}
              >
                <ColorPicker
                  type="text"
                  value={currentTextColor}
                  onSelect={(color) => {
                    if (!color) {
                      editor.chain().focus().unsetColor().run();
                      setCurrentTextColor("#000000");
                      return;
                    }
                    editor.chain().focus().setColor(color).run();
                    setCurrentTextColor(color);
                  }}
                />
              </div>,
              document.body,
            )}
        </div>
        <div className="relative flex items-center">
          <button
            type="button"
            data-color-btn="bg"
            ref={bgColorBtnRef}
            className="p-1 hover:bg-gray-200 rounded flex items-center justify-center cursor-pointer"
            onClick={() => {
              updateColorPosition(bgColorBtnRef);
              setShowBgColor(!showBgColor);
              setShowTextColor(false);
            }}
          >
            <span className="flex items-center justify-center">
              <HighlighterIcon color={currentBgColor} />
            </span>
          </button>

          {showBgColor &&
            createPortal(
              <div
                className="color-picker"
                style={{
                  position: "fixed",
                  top: colorPosition.top,
                  left: colorPosition.left,
                  zIndex: 9999,
                }}
              >
                <ColorPicker
                  type="highlight"
                  value={currentBgColor}
                  onSelect={(color) => {
                    if (!color) {
                      editor.chain().focus().unsetHighlight().run();
                      setCurrentBgColor(null);
                      return;
                    }
                    editor.chain().focus().setHighlight({ color }).run();
                    setCurrentBgColor(color);
                  }}
                />
              </div>,
              document.body,
            )}
        </div>
        <div className="w-[1px] h-[16px] bg-[#DCDCDC] flex-shrink-0" />
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-1 hover:bg-gray-200 rounded ${editor.isActive({ textAlign: "left" }) ? "text-[#6A37F5]" : ""}`}
          type="button"
          title="Align Left"
        >
          <AlignLeftIcon />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-1 hover:bg-gray-200 rounded ${editor.isActive({ textAlign: "center" }) ? "text-[#6A37F5]" : ""}`}
          type="button"
          title="Align Center"
        >
          <AlignCenterIcon />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-1 hover:bg-gray-200 rounded ${editor.isActive({ textAlign: "right" }) ? "text-[#6A37F5]" : ""}`}
          type="button"
          title="Align Right"
        >
          <AlignRightIcon />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`p-1 hover:bg-gray-200 rounded ${editor.isActive({ textAlign: "justify" }) ? "text-[#6A37F5]" : ""}`}
          type="button"
          title="Justify"
        >
          <AlignJustifyIcon />
        </button>

        <div className="w-[1px] h-[16px] bg-[#DCDCDC] flex-shrink-0" />

        <button
          onClick={handleAttachmentClick}
          type="button"
          className="p-1 hover:bg-gray-200 rounded"
          title="Add Attachment"
        >
          <LinkIcon />
        </button>

        <button
          onClick={setLink}
          type="button"
          className="p-1 hover:bg-gray-200 rounded"
          title="Add Link"
        >
          <UnLinkIcon />
        </button>
        <button
          type="button"
          className="p-1 hover:bg-gray-200 rounded"
          title="Attach from Drive"
        >
          {/* <DriveIcon stroke="black" /> */}
          <DriveIcon />
        </button>
      </div>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          <EditorContent
            editor={editor}
            onMouseDownCapture={(e) => {
              if (e.target.closest("a")) {
                e.preventDefault();
              }
            }}
            className="px-4 [&_.ProseMirror]:py-3 [&_.ProseMirror]:outline-none"
          />
        </div>
      </div>

      {showLinkMenu && (
        <div
          className="link-menu fixed bg-white shadow-lg rounded-md text-[12px] z-50 w-[150px] border border-[#EAEAEA]"
          onClick={(e) => e.stopPropagation()}
          style={{
            top: linkMenuPosition.top,
            left: linkMenuPosition.left,
          }}
          onMouseEnter={() => setShowLinkMenu(true)}
          onMouseLeave={() => setShowLinkMenu(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLinkUrl(currentLink);
              setShowLinkPopup(true);
              setShowLinkMenu(false);
            }}
            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            Edit link
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentLink) {
                window.open(currentLink, "_blank", "noopener,noreferrer");
              }
            }}
            className="block w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            Open link
          </button>

          <button
            onClick={(e) => unsetLink(e)}
            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500"
          >
            Remove link
          </button>
        </div>
      )}

      {showLinkPopup && (
        <div
          className="fixed bg-white shadow-xl rounded-lg p-3 z-50 w-[260px] border border-[#EAEAEA]"
          onClick={(e) => e.stopPropagation()}
          style={{
            top: popupPosition.top,
            left: popupPosition.left,
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="Enter / paste link here"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full border border-[#EAEAEA] rounded px-2 py-1 text-[12px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyLink();
              }
            }}
          />

          <div className="flex justify-end mt-2">
            <button
              onClick={applyLink}
              disabled={!linkUrl}
              className={`text-[12px] ${linkUrl ? "text-[#6A37F5] cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
