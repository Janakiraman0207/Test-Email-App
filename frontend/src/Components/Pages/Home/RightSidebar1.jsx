import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import notesimg from "../../../assets/images/3d-notes.png";
import organisation from "../../../assets/images/discussion.png";
import todo from "../../../assets/images/shipment.png";
// import slideIn from "../../../../src/index.css";

import { 
  getNotes, createNote, deleteNote,
  getTasks, createTask, updateTask,
  getPeople, toggleFavourite, createChatRoom
} from '../../../api/api';
import { ArrowIcon, ChatIcon, CheckBoxIcon, HorizontalThreeDotsIcon, PhoneIcon, RefreshIcon, SearchIcon, TextDropdownArrowIcon, TodolistBellIcon, TodolistCalendarIcon, TriangleArrowIcon } from '../../../assets/icons/IconRegistry';

export const RightSidebar1 = ({ onClose, defaultSection }) => {
  const navigate = useNavigate();
  const [selectedIcon, setSelectedIcon] = useState(defaultSection || "notes"); 
  const [searchQuery, setSearchQuery] = useState('');
  const [newTask, setNewTask] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [toast, setToast] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  // const [notes, setNotes] = useState([
  //   { id: 1, title: 'Title here', content: 'Take your notes', bgColor: '#F1F8DC' },
  //   { id: 2, title: 'Meeting Agenda', content: 'Discuss project updates', bgColor: '#DCF6F8' },
  //   { id: 3, title: 'Action Items', content: 'Follow up on client feedback', bgColor: '#DCE4F8' },
  //   { id: 4, title: 'Design Review', content: 'Present new wireframes', bgColor: '#F8DCDC' },
  //   { id: 5, title: 'Budget Discussion', content: 'quarterly spending', bgColor: '#F1F8DC' },
  //   { id: 6, title: 'Next Steps', content: 'Plan for next sprint', bgColor: '#DCF8E0' },
  // ]);
  const [notes, setNotes] = useState([]);
  const [todos, setTodos] = useState([]);

   useEffect(() => {
   fetchNotes();
   fetchTasks();
   fetchPeople();
}, []);

  const fetchNotes = async () => {
    try {
      const res = await getNotes();
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    }
  };

  const fetchTasks = async () => {
  try {
    const res = await getTasks();
    setTodos(res.data);
  } catch (err) {
    console.error("Failed to fetch tasks", err);
  }
};

 const toggleTodo = async (todo) => {
  try {
    const newStatus = todo.status === "done" ? "todo" : "done";

    const res = await updateTask(todo.id, {
      status: newStatus
    });

    setTodos(prev =>
      prev.map(t => (t.id === todo.id ? res.data : t))
    );
  } catch (err) {
    console.error("Update task failed", err);
  }
};

  const addTodo = async () => {
  if (!newTask.trim()) return;

  try {
    const res = await createTask({
      title: newTask,
      description: newTask,
      status:"todo",
      priority: "MEDIUM"
    });

    setTodos(prev => [res.data, ...prev]);
    setNewTask("");
  } catch (err) {
  console.error("FULL ERROR:", err);
  console.log("SERVER ERROR:", err.response?.data);
}
};

const [people, setPeople] = useState([]);

const pastelColors = [
  "#F1F8DC", // pastel green
  "#DCF6F8", // pastel cyan
  "#F8E8DC", // pastel peach
  "#E8DCF8", // pastel lavender
  "#F8DCDC", // pastel pink
  "#DCF8E0", // mint
  "#FFF4CC", // pastel yellow
  "#DCE7F8", // pastel blue
];

const getNoteColor = (noteId) => {
  return pastelColors[noteId % pastelColors.length];
};

  // const addNote = () => {
  //   if (noteTitle.trim() || noteContent.trim()) {
  //     const colors = ['#F1F8DC', '#DCF6F8', '#DCE4F8', '#F8DCDC', '#DCF8E0'];
  //     const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
  //     const newNote = {
  //       id: notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1,
  //       title: noteTitle.trim() || 'Untitled',
  //       content: noteContent.trim() || 'No content',
  //       bgColor: randomColor
  //     };
  //     setNotes([newNote, ...notes]);
  //     setNoteTitle('');
  //     setNoteContent('');
  //   }
  // };

const addNote = async () => {
  if (!noteTitle.trim() && !noteContent.trim()) return;

  try {
    const res = await createNote({
      title: noteTitle,
      content: noteContent,
    });

    setNotes(prev => [res.data, ...prev]);

    setNoteTitle("");
    setNoteContent("");
  } catch (err) {
    console.error("Create note failed", err);
  }
};

const handleToggleFavourite = async (id) => {
  try {
    let action = "";

    setPeople(prev =>
      prev.map(p => {
        if (p.id === id) {
          action = p.is_favourite ? "Removed from favourites" : "Added to favourites";
          return { ...p, is_favourite: !p.is_favourite };
        }
        return p;
      })
    );

    setToast(action);
setShowToast(true);

setTimeout(() => {
  setShowToast(false);
}, 2000);

    await toggleFavourite(id);

  } catch (err) {
    console.error("Toggle favourite failed", err);
    fetchPeople(); // fallback
  }
};

  const filteredContacts = useMemo(() => {
  const source = [...people];

  const filtered = searchQuery
    ? source.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : source;

  // ⭐ favourites always on top
  return filtered.sort((a, b) => b.is_favourite - a.is_favourite);

}, [searchQuery, people]);

const favoriteContacts = useMemo(() => {
  return filteredContacts.filter(c => c.is_favourite);
}, [filteredContacts]);

const allContacts = useMemo(() => {
  return filteredContacts;
}, [filteredContacts]);

  const handleOpenChat = async (contact) => {
    if (!contact?.email) return;

    try {
      const room = await createChatRoom(contact.id, contact.email);
      const roomId = room?.id || room?._id || room?.room_id || room?.roomId;

      if (!roomId) {
        throw new Error("Chat room id missing from response");
      }

      onClose?.();
      navigate(`/chat/${roomId}`, { state: { chatRoom: room } });
    } catch (err) {
      console.error("Failed to open chat", err);
      setToast("Unable to open chat");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  };

  const renderContactItem = (contact) => (
    <div key={contact.id} className='flex flex-row w-full h-[24px] gap-[12px]'>
      <div className="w-[24px] h-[24px] bg-gray-300 rounded-full flex items-center justify-center text-[10px]">
            {contact.name?.charAt(0)}
      </div>
      <div className='flex flex justify-between w-[233px] h-[20px]'>
        <span className='inter-regular text-[12px] gap-[20px] tracking-[1px]'>{contact.name}</span>
        <div className='flex flex-row items-center w-[80px] h-[20px] gap-[10px]'>
          <PhoneIcon/>
          <ChatIcon onClick={() => handleOpenChat(contact)}
            className="flex items-center justify-center cursor-pointer transform transition duration-200 hover:scale-110"
            title={`Message ${contact.name || contact.email}`}/>
          {/* <HorizontalThreeDotsIcon/> */}

          <div
            onClick={() => handleToggleFavourite(contact.id)}
            className="cursor-pointer transform transition duration-200 hover:scale-110"
          >
             {contact.is_favourite ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="#FFD700"
                className="transition duration-300 scale-110"
              >
               <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21z"/>
              </svg>
              ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2"
                className="transition duration-300"
              >
                <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 7.46 13.97 5.82 21z"/>
              </svg>
            )}
                </div>

        </div>
      </div>
    </div>
  );

  const handleDeleteNote = async (id) => {
  try {
    await deleteNote(id);
    setNotes(prev => prev.filter(note => note.id !== id));
  } catch (err) {
    console.error("Delete failed", err);
  }
};

const fetchPeople = async () => {
  try {
    const res = await getPeople();

    console.log("PEOPLE API:", res.data);

    setPeople(res.data.all_contacts || []);
  } catch (err) {
    console.error("Failed to fetch people", err);
  }
};

  return (
    <div className="w-[289px] h-screen flex flex-col bg-white rounded-[7px] shadow-[-2px_0px_4px_0px_#7E7E7E4F] z-50">
      {/* Popup content goes here */}
      <div className="flex flex-row items-center justify-center w-full h-[50px] border-b border-[#D9D9D9]">
        <div className="flex flex-row w-[267px] h-[30px] flex items-center justify-between">
          <div className="flex flex-row items-center w-[114px] h-[30px] gap-[15px]">
            <div
              className={`flex items-center justify-center w-[30px] h-[30px] rounded-[5px] cursor-pointer ${selectedIcon === "notes" ? "bg-[#6A37F5]" : ""}`}
              onClick={() => setSelectedIcon("notes")}
            >
              <img src={notesimg} alt="notes" className="w-[20px] h-[20px]" />
            </div>
            <div
              className={`flex items-center justify-center w-[30px] h-[30px] rounded-[5px] cursor-pointer ${selectedIcon === "todos" ? "bg-[#6A37F5]" : ""}`}
              onClick={() => setSelectedIcon("todos")}
            >
              <img
                src={todo}
                alt="todo"
                className="w-[20px] h-[20px]"
              />
            </div>
            <div
              className={`flex items-center justify-center w-[30px] h-[30px] rounded-[5px] cursor-pointer ${selectedIcon === "organisation" ? "bg-[#6A37F5]" : ""}`}
              onClick={() => setSelectedIcon("organisation")}
            >
              <img
                src={organisation}
                alt="organisation"
                className="w-[20px] h-[20px]"
              />
            </div>
          </div>
          <div
            className="flex items-center justify-center w-[20px] h-[20px] cursor-pointer"
            onClick={onClose}
          >
            <div className="flex items-center justify-center w-[16.667px] h-[16.67px] rounded-[50%] bg-[#EDEDED]">
              <ArrowIcon
                direction="left"
                className="text-[#6A37F5] rounded-[2px]"
                strokeWidth="1.25"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes display */}
      {selectedIcon === "notes" && (
        <div className="fixed flex flex-col w-[286px] h-[660px] top-[182px] px-[10px] gap-[10px] py-[20px]">
          <span className="inter-regular text-[10px] text-[#686868]">
            Your{" "}
            <span className="inter-semibold text-[12px] text-black">Notes</span>
          </span>
          <div className="flex flex-col w-[270px] h-[111px] gap-[0px]  rounded-[8px] border-[1px] border-[#EAEAEA] relative">
            <div className="flex items-center w-full h-[44px] bg-[#F4F4F4] rounded-tl-[8px] rounded-tr-[8px]">
              <input
                type="text"
                placeholder="Title here"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full h-[35px] px-[10px] outline-none inter-regular text-[12px] placeholder:text-[#858585] bg-transparent"
              />
            </div>
            <input
              type="text"
              placeholder="Take your notes"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addNote()}
              className="w-full h-[67px] rounded-bl-[8px] rounded-br-[8px] px-[10px] outline-none text-[12px] inter-regular placeholder:text-[12px] placeholder:inter-regular"
            />
            <button
              className="absolute bottom-[0px] right-[0px] w-[53px] h-[35px] p-[10px] gap-[10px] flex items-center justify-center cursor-pointer"
              onClick={addNote}
            >
              <span className="inter-medium text-[12px] text-[#6A37F5]">
                Done
              </span>
            </button>
          </div>

          {/* Notes content Section */}
          <div className="flex flex-col w-[266px] h-full mt-[10px] gap-[12px] overflow-y-auto">
            {/* {notes.map((note) => (
              <div 
                key={note.id} 
                className='flex flex-col w-full h-[76px] p-[10px] rounded-[8px] gap-[10px]'
                style={{ backgroundColor: note.bgColor }}
              >
                <span className='inter-semibold text-[12px]'>{note.title}</span>
                <span className='inter-regular text-[12px] text-[#383838]'>{note.content}</span>
              </div>
            ))} */}
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex flex-col w-full p-[10px] rounded-[8px] gap-[10px] relative"
                style={{
                   backgroundColor: getNoteColor(note.id)
                  }}
              >
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="absolute top-2 right-2 text-xs text-red-500"
                >
                  Delete
                </button>

                <span className="inter-semibold text-[12px]">{note.title}</span>
                <span className="inter-regular text-[12px] text-[#383838]">
                  {note.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* To-do section */}
      {selectedIcon === "todos" && (
        <div className="fixed flex flex-col w-[286px] h-[660px] top-[182px] px-[10px] gap-[10px] py-[20px]">
          <span className="inter-regular text-[10px] text-[#686868]">
            Your{" "}
            <span className="inter-semibold text-[12px] text-[#040B23]">
              To-Do Lists
            </span>
          </span>
          <div className="flex flex-col w-[270px] h-[94px] gap-[0px]  rounded-[8px] border-[1px] border-[#EAEAEA] relative">
            <input
              type="text"
              placeholder="Type your task"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTodo()}
              className="w-full h-[44px] px-[10px] bg-[#F4F4F4] rounded-tl-[8px] rounded-tr-[8px] outline-none inter-regular text-[12px] placeholder:text-[#858585]"
            />
            <div className="flex items-center justify-between w-[270px] h-[50px] px-[10px] gap-[50px]">
              <div className="flex flex-row w-[70px] h-[16px] gap-[10px]">
                <TodolistBellIcon />
                <TodolistCalendarIcon />
                <RefreshIcon />
              </div>
              <button
                className="w-[53px] h-[35px] p-[10px] gap-[10px] flex items-center justify-center cursor-pointer"
                onClick={addTodo}
                
              >
                <span className="inter-medium text-[12px] text-[#6A37F5]">
                  Add
                </span>
              </button>
            </div>
          </div>

          {/* To-do content Section */}
          <div className="flex-1 flex flex-col gap-[14px] mt-[10px] overflow-y-auto min-h-0">
            {todos.filter((todo) => todo.status !== "done")
               .map((todo) => (
              <div
                key={todo.id}
                className="flex flex-row w-full h-[15px] gap-[6px]"
              >
                <div
                  className="flex items-center justify-center w-[14px] h-[14px] cursor-pointer"
                  onClick={() => toggleTodo(todo)}
                >
                  <CheckBoxIcon
                    checked={todo.status === "done"}
                    size={14}
                    className="transition-all duration-200 hover:scale-110"
                  />
                </div>
                <span
                  className={`inter-regular text-[12px] ${todo.status === "done" ? "line-through text-[#888]" : ""}`}
                >
                  {todo.title}
                </span>
              </div>
            ))}
            {todos.filter((todo) => todo.status !== "done").length > 0 && (
            <button className="min-w-[60px] h-[20px] rounded-[4px] bg-[#512ABA14] inter-regular text-[10px] text-[#383838] px-[7px]">
              {(() => {
                const today = new Date();
                const taskDate = todos[0]?.created_at
                  ? new Date(todos[0].created_at)
                  : new Date();

                const diffTime =
                  today.setHours(0, 0, 0, 0) -
                  taskDate.setHours(0, 0, 0, 0);

                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (diffDays === 0) return "Today";
                if (diffDays === 1) return "Yesterday";

                return taskDate.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                });
              })()}
            </button>
            )}
          </div>

          {/* Bottom div */}
          <div className="flex items-center w-[286px] h-[70px] px-[15px] border-t border-[#D9D9D9] mt-0 px-[15px] py-[10px]">
            <div className="flex flex-row items-center justify-between cursor-pointer w-[150px] h-[20px] gap-[5px]" onClick={() => setShowCompletedTasks(!showCompletedTasks)}>
              <div className="flex flex-row items-center gap-[5px]">
                <div className={`flex items-center justify-center w-[20px] h-[20px] transition-transform duration-300 ${showCompletedTasks ? "rotate-90" : ""}`}>
                    <TriangleArrowIcon direction="right" />
                  </div>
               <span className="inter-semibold text-[12px] text-[#040B23] mt-[1px]">
                Completed Task ({todos.filter((todo) => todo.status === "done").length})
               </span>
              </div>
            </div>
           {showCompletedTasks && (
             <div className="flex flex-col gap-[10px] max-h-[120px] overflow-y-auto mt-[12px]">
               {todos
                 .filter((todo) => todo.status === "done")
                 .map((todo) => (
                  <div
                    key={todo.id}
                    className="flex flex-row items-center gap-[6px]"
                  >
                    <CheckBoxIcon
                      checked={true}
                      size={14}
                      className="transition-all duration-200 hover:scale-110"
                    />
                    <span className="inter-regular text-[12px] line-through text-[#888]">
                      {todo.title}
                    </span>
                  </div>
               ))}
             </div>
            )}
          </div>
        </div>
      )}

      {/* Organisation section */}
      {selectedIcon === "organisation" && (
        <div className="fixed flex flex-col w-[286px] h-[660px] top-[182px] px-[10px] gap-[10px] py-[20px]">
          <span className="inter-regular text-[10px] text-[#686868]">
            Organisation{" "}
            <span className="inter-semibold text-[12px] text-black">
              Peoples
            </span>
          </span>
          <div className="flex flex-row items-center w-[269px] h-[34px] gap-[10px] px-[10px] rounded-[8px] border border-[#EAEAEA] bg-white">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search People"
              className="w-full h-full outline-none text-[12px] inter-regular placeholder:text-[#C1C1C1]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Favorite content Section */}
          <div className="flex flex-col w-[269px] gap-[20px]">
            <span className="inter-bold text-[11px] tracking-[2px]">
              Favorites
            </span>
            <div className="flex flex-col w-[269px] py-[10px] px-[5px] max-h-[200px] overflow-y-auto gap-[14px]">
              {favoriteContacts.length > 0 ? (
                favoriteContacts.map(renderContactItem)
              ) : (
                <div className="flex justify-center items-center h-[24px]">
                  <span className="inter-regular text-[12px] text-[#888]">
                    {searchQuery
                      ? "No matching favorites found"
                      : "No favorites"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* All Contacts Section */}
          <div className="flex flex-col w-[269px] h-[350px] gap-[20px] mt-[10px]">
            <span className="inter-bold text-[11px] tracking-[1px] ">
              All Contacts
            </span>

            {/* Contacts List */}
            <div className="flex flex-col w-[269px] h-[300px] gap-[14px] px-[5px] py-[10px] overflow-y-auto">
              {allContacts.length > 0 ? (
                allContacts.map(renderContactItem)
              ) : (
                <div className="flex justify-center items-center h-[24px]">
                  <span className="inter-regular text-[12px] text-[#888]">
                    {searchQuery ? "No contacts found" : "No contacts"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
       {/* ✅ Toast message */}
          {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ease-out ${
            showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <div
            className={`${
              toast.includes("Removed") ? "bg-red-500" : "bg-green-600"
            } text-white px-4 py-2 rounded-md text-[12px] shadow-lg flex items-center gap-2`}
          >
            ✓ {toast}
          </div>
        </div>
      )}
    </div>    
  );
};
