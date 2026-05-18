import { useEffect, useRef, useState } from "react";

const LabelAs = ({
  onClose,
  defaultLabelsVisibility,
  setDefaultLabelsVisibility,
  customLabels,
  setCustomLabels,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [view, setView] = useState("main");
  const [category, setCategory] = useState("Primary");
  const [newLabel, setNewLabel] = useState("");
  const [parentEnabled, setParentEnabled] = useState(false);
  const [parent, setParent] = useState("");
  const [editingLabel, setEditingLabel] = useState(null);

  const handleVisibilityChange = (labelName, visibilityMode) => {
    setDefaultLabelsVisibility((prev) => ({
      ...prev,
      [labelName]: visibilityMode,
    }));
  };

  // const handleCreate = () => {
  //   setNewLabel("");
  //   setParent("");
  //   setParentEnabled(false);
  //   onClose();
  // };

  const isSettings = view === "manage";

  // Add these state variables near the top of the component, after your existing useState hooks

  // const [customLabels, setCustomLabels] = useState([
  //   { name: "Events", parent: null },
  //   { name: "Meetings", parent: null },
  //   { name: "Promotions", parent: null },
  // ]);

  const [editLabelName, setEditLabelName] = useState("");

  // Update handleCreate function

  const handleCreate = () => {
    const trimmedLabel = newLabel.trim();

    if (!trimmedLabel) {
      alert("Please enter a label name.");
      return;
    }

    const labelExists = customLabels.some(
      (label) => label.name.toLowerCase() === trimmedLabel.toLowerCase(),
    );

    if (labelExists) {
      alert("Label already exists.");
      return;
    }

    const newLabelObject = {
      name: trimmedLabel,
      parent: parentEnabled && parent ? parent : null,
    };

    setCustomLabels((prev) => [...prev, newLabelObject]);

    setDefaultLabelsVisibility((prev) => ({
      ...prev,
      [trimmedLabel]: "show",
    }));

    setNewLabel("");
    setParent("");
    setParentEnabled(false);
    setIsDropdownOpen(false);
    onClose();
  };

  // Add these helper functions

  const handleRemoveLabel = (labelName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove "${labelName}"?`,
    );

    if (!confirmDelete) return;

    setCustomLabels((prev) => prev.filter((label) => label.name !== labelName));

    setDefaultLabelsVisibility((prev) => {
      const updated = { ...prev };
      delete updated[labelName];
      return updated;
    });
  };

  const handleOpenEdit = (labelName) => {
    setEditingLabel(labelName);
    setEditLabelName(labelName);
  };

  const handleUpdateLabel = () => {
    const trimmedName = editLabelName.trim();

    if (!trimmedName) {
      alert("Label name cannot be empty.");
      return;
    }

    const duplicateExists = customLabels.some(
      (label) =>
        label.name.toLowerCase() === trimmedName.toLowerCase() &&
        label.name !== editingLabel,
    );

    if (duplicateExists) {
      alert("A label with this name already exists.");
      return;
    }

    setCustomLabels((prev) =>
      prev.map((label) =>
        label.name === editingLabel ? { ...label, name: trimmedName } : label,
      ),
    );

    // Rename visibility key
    setDefaultLabelsVisibility((prev) => {
      const updated = { ...prev };

      if (updated[editingLabel] !== undefined) {
        updated[trimmedName] = updated[editingLabel];
        delete updated[editingLabel];
      }

      return updated;
    });

    setEditingLabel(null);
    setEditLabelName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-['Inter']">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={() => {
          setIsDropdownOpen(false);
          onClose();
        }}
      ></div>
      <div
        className={`relative bg-[#FFFFFF] shadow-[0px_124px_35px_rgba(0,0,0,0.25)] border border-[#E8E8E8] z-10 transition-all duration-300 ${
          isSettings
            ? "w-[1020px] h-auto rounded-[22px] px-[50px] py-[30px]"
            : view === "create"
              ? "w-[252px] h-[275px] rounded-[22px] p-[26px]"
              : "w-[250px] h-auto rounded-[16px] py-[20px] px-[15px]"
        }`}
      >
        {view === "main" && (
          <div className="relative w-full h-auto">
            <h2 className="text-[22px] font-normal text-[#000000] mb-[20px] pl-[10px]">
              {" "}
              Label As:{" "}
            </h2>
            <div className="pl-[30px] flex flex-col gap-[15px]">
              <div
                className="flex items-center gap-[16px] cursor-pointer"
                onClick={() => setCategory("Primary")}
              >
                <div className="w-[18px] h-[18px] bg-[#EAEAEA] rounded-[6px] border border-[#767676] flex items-center justify-center">
                  {category === "Primary" && (
                    <div className="w-[10px] h-[5px] border-b-[2px] border-l-[2px] border-[#000000] rotate-[-45deg] mb-[2px]" />
                  )}
                </div>
                <span className="text-[15px] text-[#000000]">Primary</span>
              </div>
              <div
                className="flex items-center gap-[16px] cursor-pointer"
                onClick={() => setCategory("Others")}
              >
                <div className="w-[18px] h-[18px] bg-[#EAEAEA] rounded-[6px] border border-[#767676] flex items-center justify-center">
                  {category === "Others" && (
                    <div className="w-[10px] h-[5px] border-b-[2px] border-l-[2px] border-[#000000] rotate-[-45deg] mb-[2px]" />
                  )}
                </div>
                <span className="text-[15px] text-[#000000]">Others</span>
              </div>
            </div>
            <div className="h-[2px] bg-[#E5E5E5] w-full my-[15px]" />
            {category === "Others" ? (
              <div className="flex justify-end pt-[2px] pb-[5px]">
                <button
                  className="bg-[#BDBDBD] text-black text-[15px] px-[22px] py-[6px] rounded-[24px] hover:bg-[#A9A9A9] transition cursor-pointer"
                  onClick={() => {}}
                >
                  {" "}
                  Apply{" "}
                </button>
              </div>
            ) : (
              <div className="w-full pl-[15px] pr-[10px] flex flex-col gap-[8px] pb-[5px]">
                <div
                  className="flex justify-between items-center cursor-pointer px-[10px] py-[6px] hover:bg-[#F2F2F2] rounded-[8px] transition"
                  onClick={() => setView("manage")}
                >
                  <span className="text-[18px] text-[#000000]">
                    Manage labels
                  </span>
                  <span className="text-[#000000] text-[20px] font-normal">
                    {">"}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center cursor-pointer px-[10px] py-[6px] hover:bg-[#F2F2F2] rounded-[8px] transition"
                  onClick={() => setView("create")}
                >
                  <span className="text-[18px] text-[#000000]">Create New</span>
                  <span className="text-[#000000] text-[20px] font-normal">
                    {">"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        {view === "manage" && (
          <div className="w-full flex flex-col text-[#000000]">
            <h2 className="text-[20px] font-normal mb-[24px]">Settings</h2>
            <div className="mb-[40px]">
              <div className="flex items-center text-[16px] font-bold mb-[12px] pl-[10px]">
                <div className="w-[200px]">Default System Labels</div>
                <div className="w-[280px]">Show label list</div>
              </div>
              <div className="flex flex-col gap-[12px] pl-[40px] w-full">
                {[
                  { name: "All Inbox", noAction: true },
                  { name: "Archive" },
                  { name: "Snoozed" },
                  { name: "Sent mail", extra: "Show If unread" },
                  { name: "Outbox", extra: "Show If unread" },
                  { name: "Junk" },
                  { name: "Trash" },
                  { name: "Drafts" },
                  { name: "Favourite" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center text-[14px]"
                  >
                    <span className="w-[170px]">{item.name}</span>
                    {!item.noAction && (
                      <div className="flex items-center gap-[16px]">
                        <button
                          className={`cursor-pointer hover:opacity-75 ${defaultLabelsVisibility[item.name] === "show" ? "text-black" : "text-[#6A37F5]"}`}
                          onClick={() =>
                            handleVisibilityChange(item.name, "show")
                          }
                        >
                          Show
                        </button>
                        <button
                          className={`cursor-pointer hover:opacity-75 ${defaultLabelsVisibility[item.name] === "hide" ? "text-black" : "text-[#6A37F5]"}`}
                          onClick={() =>
                            handleVisibilityChange(item.name, "hide")
                          }
                        >
                          hide
                        </button>
                        {item.extra && (
                          <button
                            className={`text-[13px] ml-[10px] cursor-pointer hover:opacity-75 ${defaultLabelsVisibility[item.name] === "show_if_unread" ? "text-black" : "text-[#6A37F5]"}`}
                            onClick={() =>
                              handleVisibilityChange(
                                item.name,
                                "show_if_unread",
                              )
                            }
                          >
                            {" "}
                            {item.extra}{" "}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-[15px]">
              <div className="flex items-center text-[16px] font-bold mb-[12px] pl-[10px]">
                <div className="w-[220px]">Labels</div>
                <div className="w-[250px] text-center">Show in label list</div>
                <div className="w-[120px] text-left">Action</div>
              </div>
              <div className="flex flex-col gap-[12px] pl-[40px]">
                {customLabels
                  .filter((item) => !item.parent && item.name !== "Others")
                  .map((item) => (
                    <div
                      key={item.name}
                      onClick={() => {
                        setParent(item.name);
                        setIsDropdownOpen(false);
                      }}
                      className="px-[12px] py-[10px] text-[14px] text-black cursor-pointer hover:bg-[#EAEAEA]"
                    >
                      {item.name}
                    </div>
                  ))}
              </div>
            </div>
            <div className="w-full border-t border-[#E8E8E8] pt-[15px] pb-[10px] flex items-center justify-center gap-[12px]">
              <span className="text-[15px] font-bold">Note:</span>
              <span className="text-[15px]">
                Messages will remain even if the label is removed.
              </span>
            </div>
          </div>
        )}
        {view === "create" && (
          <div className="relative w-full h-full">
            <h2 className="text-[18px] font-medium mb-[18px]">New Label</h2>
            <div className="w-full flex flex-col gap-[6px] mb-[16px]">
              <span className="text-[14px] text-[#000000]">
                Type Your New Label Name:
              </span>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-[200px] h-[36px] bg-[#EAEAEA] rounded-[6px] px-[12px] outline-none text-[14px] text-[#2A2A2A]"
                placeholder="Meetings"
              />
            </div>
            <div className="flex items-center gap-[8px] mb-[10px] mt-[5px]">
              <div
                className="w-[16px] h-[16px] border border-[#000000] rounded-[4px] flex items-center justify-center cursor-pointer bg-white"
                onClick={() => setParentEnabled(!parentEnabled)}
              >
                {parentEnabled && (
                  <div className="w-[10px] h-[4.5px] border-b-[2px] border-l-[2px] border-[#000000] rotate-[-45deg] mb-[2px]" />
                )}
              </div>
              <span className="text-[14px] text-[#000000]">
                Choose Parent Label
              </span>
            </div>
            <div className="relative w-[200px]" ref={dropdownRef}>
              <div
                onClick={() =>
                  parentEnabled && setIsDropdownOpen((prev) => !prev)
                }
                className={`w-full h-[36px] bg-[#EAEAEA] rounded-[6px] px-[12px] text-[14px] text-[#000000] flex items-center justify-between ${
                  !parentEnabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <span>{parent || "Select Parent Label"}</span>
                <span className="text-[#000000] text-[11px] inline-block scale-x-150 font-bold">
                  ∨
                </span>
              </div>
              {isDropdownOpen && parentEnabled && (
                <div className="absolute top-[40px] left-0 w-full bg-white border border-[#EAEAEA] rounded-[6px] overflow-hidden z-50 shadow-lg">
                  {customLabels
                    .filter(
                      (item) =>
                        !item.parent &&
                        item.name.trim().toLowerCase() !== "others",
                    )
                    .map((item) => (
                      <div
                        key={item.name}
                        onClick={() => {
                          setParent(item.name);
                          setIsDropdownOpen(false);
                        }}
                        className="px-[12px] py-[10px] text-[14px] text-black cursor-pointer hover:bg-[#EAEAEA]"
                      >
                        {item.name}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="absolute top-[205px] left-[20px] flex items-center gap-[35px]">
              <button
                className="text-[14px] text-[#000000] cursor-pointer hover:opacity-70"
                onClick={() => setView("main")}
              >
                Cancel{" "}
              </button>
              <button
                className="w-[100px] h-[28px] flex items-center justify-center text-[14px] text-black bg-[#C4C4C4] rounded-[24px] cursor-pointer hover:bg-[#A8A8A8] transition"
                onClick={handleCreate}
              >
                Create
              </button>
            </div>
          </div>
        )}
      </div>
      {editingLabel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditingLabel(null)}
          ></div>
          <div className="relative bg-white w-[636px] h-[301px] rounded-[14px] px-[35px] py-[35px] flex flex-col shadow-2xl z-10 font-['Inter']">
            <button
              className="absolute top-[13px] right-[20px] text-[24px] text-black font-bold hover:opacity-60 cursor-pointer"
              onClick={() => setEditingLabel(null)}
            >
              {" "}
              ✕{" "}
            </button>
            <h2 className="w-[78px] h-[24px] mt-[10px] left-[28px] text-[20px] font-medium mb-[25px]">
              Rename
            </h2>
            <div className="flex flex-col gap-[12px] mb-[35px]">
              <label className="text-[16px] font-medium text-black">Name</label>
              <input
                type="text"
                value={editingLabel}
                onChange={(e) => setEditLabelName(e.target.value)}
                className="w-[560px] border border-[#D1D1D1] rounded-[1px] px-[12px] py-[8px] text-[14px] outline-none text-[#AAAAAA] focus:text-black"
                placeholder="Office"
              />
            </div>
            <div className="flex justify-end gap-[16px] pr-[10px]">
              <button
                className="bg-[#C4C4C4] text-white font-medium px-[24px] py-[6px] rounded-[20px] text-[15px] cursor-pointer hover:bg-[#A8A8A8] transition"
                onClick={handleUpdateLabel}
              >
                Update{" "}
              </button>
              <button
                className="bg-white border border-[#C4C4C4] text-black font-medium px-[24px] py-[6px] rounded-[20px] text-[15px] cursor-pointer hover:bg-[#F9F9F9] transition"
                onClick={() => {
                  setEditingLabel(null);
                  setEditLabelName("");
                }}
              >
                Cancel{" "}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabelAs;
