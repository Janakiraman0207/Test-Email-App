import React, { useState, useEffect } from "react";
import { Navbar } from "./Navbar/Navbar";
import { AppNavBar } from "./Navbar/AppNavBar";
import { Sidebar } from "./Sidebar";
import { InboxList } from "./InboxList";
import { MailView } from "./MailView";
import { RightSidebar } from "./RightSidebar";
import { useSmoothNavigation } from "../../../hooks/useSmoothNavigation";
import {
  getDraftMails,
  getInboxMails,
  getSentMails,
  getOutboxMails,
  getSpamMails,
  getArchivedMails,
  getTrashMails,
  toggleReadMail,
  getStarredMails,
  archiveMail,
  deleteMail,
  unarchiveMail,
  toggleStarMail,
  restoreMail,
} from "../../../api/api";

import { ComposeModal } from "./ComposeSection/ComposeModal";

const Home = () => {
  const [defaultLabelsVisibility, setDefaultLabelsVisibility] = useState({
    Archive: "show",
    Snoozed: "show",
    "Sent mail": "show",
    Outbox: "show",
    Junk: "show",
    Trash: "show",
    Drafts: "show",
    Favourite: "show",

    //Labels
    Events: "show",
    Meetings: "show",
    Promotions: "show",
    Others: "show",
  });

  const [customLabels, setCustomLabels] = useState([
    { name: "Events", parent: null },
    { name: "Meetings", parent: null },
    { name: "Promotions", parent: null },
    { name: "Others", parent: null },
  ]);

  const { visible, smoothNavigate } = useSmoothNavigation(1000);
  // const [mails, setMails] = useState([]);
  const [inboxMails, setInboxMails] = useState([]);
  const [sentMails, setSentMails] = useState([]);
  const [outboxMails, setOutboxMails] = useState([]);
  const [draftMails, setDraftMails] = useState([]);
  const [spamMails, setSpamMails] = useState([]);
  const [archivedMails, setArchivedMails] = useState([]);
  const [trashMails, setTrashMails] = useState([]);
  const [favoriteMails, setFavoriteMails] = useState([]);
  const [selectedMail, setSelectedMail] = useState(null);
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);
  const [selectedMailbox, setSelectedMailbox] = useState("inbox");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const normalizeMail = (mail) => ({
    ...mail,
    id: mail.id || mail.mail_id || mail.email_id,
    from: mail.from || mail.sender || mail.sender_email || mail.sender_id || "",
    to:
      mail.to || mail.receiver || mail.receiver_email || mail.receiver_id || "",
    date: mail.date || mail.created_at || mail.updated_at || null,
  });

  const loadMailbox = async (mailbox, bypassCache = false) => {
    try {
      let response;

      switch (mailbox) {
        case "inbox":
          if (!bypassCache && inboxMails.length > 0) return;
          response = await getInboxMails();
          setInboxMails(response.data.map(normalizeMail));
          break;

        case "sent":
          response = await getSentMails();
          setSentMails(response.data.map(normalizeMail));
          break;

        case "outbox":
          response = await getOutboxMails();
          setOutboxMails(response.data.map(normalizeMail));
          break;

        case "drafts":
          if (!bypassCache && draftMails.length > 0) return;
          response = await getDraftMails();
          setDraftMails(response.data.map(normalizeMail));
          break;

        case "junk":
          if (!bypassCache && spamMails.length > 0) return;
          response = await getSpamMails();
          setSpamMails(response.data.map(normalizeMail));
          break;

        case "archived":
          if (!bypassCache && archivedMails.length > 0) return;
          response = await getArchivedMails();
          setArchivedMails(response.data.map(normalizeMail));
          break;

        case "trash":
          if (!bypassCache && trashMails.length > 0) return;
          response = await getTrashMails();
          setTrashMails(response.data.map(normalizeMail));
          break;
        case "favorite":
          if (!bypassCache && favoriteMails.length > 0) return;
          response = await getStarredMails();
          setFavoriteMails(response.data.map(normalizeMail));
          break;

        default:
          return;
      }
    } catch (error) {
      console.error("Failed to load mailbox:", error);
    }
  };

//   useEffect(() => {
//   loadMailbox("inbox");
// }, []);


useEffect(() => {
  // if (selectedMailbox) {
    loadMailbox(selectedMailbox,true);

     const interval = setInterval(() => {
      loadMailbox("outbox", true);
      loadMailbox("sent", true);
      loadMailbox("inbox", true);
    }, 10000);
  // }

  // Fetch drafts initially so the sidebar badge reflects the true count early
  const fetchDraftsForBadge = async () => {
    if (draftMails.length === 0) {
      try {
        const response = await getDraftMails();
        setDraftMails(response.data.map(normalizeMail));
      } catch (err) {}
    }
  };
  fetchDraftsForBadge();
}, [selectedMailbox]);

 useEffect(() => {
    if (selectedMailbox !== "inbox") return;

    const interval = setInterval(async () => {
      try {
        const response = await getInboxMails();
        const newData = response.data.map(normalizeMail);

        setInboxMails((prev) => {
          if (!prev.length) return newData;

          const existingIds = new Set(prev.map((m) => m.id));

          const newMails = newData.filter((m) => !existingIds.has(m.id));

          if (newMails.length === 0) return prev;

          return [...newMails, ...prev];
        });
      } catch (err) {
        console.error("Auto refresh failed:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedMailbox]);

  const mails =
    selectedMailbox === "inbox"
      ? inboxMails
      : selectedMailbox === "sent"
        ? sentMails
        : selectedMailbox === "outbox"
          ? outboxMails
          : selectedMailbox === "drafts"
            ? draftMails
            : selectedMailbox === "junk"
              ? spamMails
              : selectedMailbox === "archived"
                ? archivedMails
                : selectedMailbox === "trash"
                  ? trashMails
                  : selectedMailbox === "favorite"
                    ? favoriteMails
                    : [];

  const handleArchive = async (mailId) => {
    try {
      const mailToArchive =
        inboxMails.find((m) => m.id === mailId) ||
        sentMails.find((m) => m.id === mailId) ||
        draftMails.find((m) => m.id === mailId) ||
        spamMails.find((m) => m.id === mailId) ||
        trashMails.find((m) => m.id === mailId) ||
        favoriteMails.find((m) => m.id === mailId);

      if (mailToArchive) {
        setArchivedMails((prev) => [mailToArchive, ...prev]);
      }
      if (mailToArchive) {
        setArchivedMails((prev) => [mailToArchive, ...prev]);
      }

      if (selectedMailbox === "inbox")
        setInboxMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "sent")
        setSentMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "drafts")
        setDraftMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "junk")
        setSpamMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "trash")
        setTrashMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "favorite")
        setFavoriteMails((prev) => prev.filter((m) => m.id !== mailId));

      setSelectedMail(null);
      await archiveMail(mailId);
    } catch (err) {
      console.error("Archive failed", err);
    }
  };

  const handleUnarchive = async (mailId) => {
    try {
      if (selectedMailbox === "archived") {
        setArchivedMails((prev) => prev.filter((m) => m.id !== mailId));
      }
      setSelectedMail(null);
      await unarchiveMail(mailId);
    } catch (err) {
      console.error("Unarchive failed", err);
    }
  };

  const handleDelete = async (mailId) => {
    if (!mailId) return;

    try {
      const mailToDelete =
        inboxMails.find((m) => m.id === mailId) ||
        sentMails.find((m) => m.id === mailId) ||
        draftMails.find((m) => m.id === mailId) ||
        spamMails.find((m) => m.id === mailId) ||
        archivedMails.find((m) => m.id === mailId) ||
        favoriteMails.find((m) => m.id === mailId);

      if (mailToDelete) {
        setTrashMails((prev) => [mailToDelete, ...prev]);
      }

      if (selectedMailbox === "inbox")
        setInboxMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "sent")
        setSentMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "drafts")
        setDraftMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "archived")
        setArchivedMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "junk")
        setSpamMails((prev) => prev.filter((m) => m.id !== mailId));
      if (selectedMailbox === "favorite")
        setFavoriteMails((prev) => prev.filter((m) => m.id !== mailId));

      setSelectedMail(null);
      await deleteMail(mailId);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSnooze = async (mailIds, scheduledTime) => {
    const ids = Array.isArray(mailIds) ? mailIds : [mailIds];
    try {
      for (const mailId of ids) {
        if (selectedMailbox === "inbox")
          setInboxMails((prev) => prev.filter((m) => m.id !== mailId));
        if (selectedMailbox === "sent")
          setSentMails((prev) => prev.filter((m) => m.id !== mailId));
        if (selectedMailbox === "drafts")
          setDraftMails((prev) => prev.filter((m) => m.id !== mailId));
        if (selectedMailbox === "junk")
          setSpamMails((prev) => prev.filter((m) => m.id !== mailId));
        if (selectedMailbox === "trash")
          setTrashMails((prev) => prev.filter((m) => m.id !== mailId));
        if (selectedMailbox === "favorite")
          setFavoriteMails((prev) => prev.filter((m) => m.id !== mailId));
        if (selectedMailbox === "archived")
          setArchivedMails((prev) => prev.filter((m) => m.id !== mailId));

        if (selectedMail?.id === mailId) {
          setSelectedMail(null);
        }
      }
      console.log(`Snoozed emails: ${ids.join(", ")} until ${scheduledTime}`);
      // await snoozeMailAPI(ids, scheduledTime); // Backend handle separately
    } catch (err) {
      console.error("Snooze failed", err);
    }
  };

  const handleToggleRead = async (mailId) => {
    try {
      const mail =
        inboxMails.find((m) => m.id === mailId) ||
        sentMails.find((m) => m.id === mailId) ||
        draftMails.find((m) => m.id === mailId) ||
        spamMails.find((m) => m.id === mailId) ||
        archivedMails.find((m) => m.id === mailId) ||
        trashMails.find((m) => m.id === mailId) ||
        favoriteMails.find((m) => m.id === mailId);

      if (!mail) return;

      const currentValue =
        mail.isRead !== undefined ? mail.isRead : mail.is_read;
      const newValue = !currentValue;

      const updateMailList = (prev) =>
        prev.map((m) =>
          m.id === mailId ? { ...m, isRead: newValue, is_read: newValue } : m,
        );

      setInboxMails(updateMailList);
      setSentMails(updateMailList);
      setDraftMails(updateMailList);
      setSpamMails(updateMailList);
      setArchivedMails(updateMailList);
      setTrashMails(updateMailList);
      setFavoriteMails(updateMailList);

      if (selectedMail?.id === mailId) {
        setSelectedMail((prev) => ({
          ...prev,
          isRead: newValue,
          is_read: newValue,
        }));
      }

      if (!newValue) {
        setSelectedMail(null);
      }

      await toggleReadMail(mailId, newValue);
    } catch (err) {
      console.error("Read toggle failed", err);
    }
  };

  const handleToggleStar = async (mailId) => {
    try {
      const mail =
        inboxMails.find((m) => m.id === mailId) ||
        sentMails.find((m) => m.id === mailId) ||
        draftMails.find((m) => m.id === mailId) ||
        spamMails.find((m) => m.id === mailId) ||
        archivedMails.find((m) => m.id === mailId) ||
        trashMails.find((m) => m.id === mailId) ||
        favoriteMails.find((m) => m.id === mailId);

      if (!mail) return;

      const newValue = !mail.is_favorite;

      // ✅ Update Inbox (DO NOT REMOVE)
      setInboxMails((prev) =>
        prev.map((m) =>
          m.id === mailId ? { ...m, is_favorite: newValue } : m,
        ),
      );

      // ✅ Update Sent
      setSentMails((prev) =>
        prev.map((m) =>
          m.id === mailId ? { ...m, is_favorite: newValue } : m,
        ),
      );

      // ✅ Update selected mail
      if (selectedMail?.id === mailId) {
        setSelectedMail((prev) => ({ ...prev, is_favorite: newValue }));
      }

      // ✅ Favourite list = filter result
      if (newValue) {
        setFavoriteMails((prev) =>
          prev.some((m) => m.id === mailId)
            ? prev
            : [...prev, { ...mail, is_favorite: true }],
        );
      } else {
        setFavoriteMails((prev) => prev.filter((m) => m.id !== mailId));
      }

      await toggleStarMail(mailId, newValue);
    } catch (err) {
      console.error("Star failed", err);
    }
  };

  const handleRestore = async (mailId) => {
    try {
      const restoredMail = trashMails.find((m) => m.id === mailId);
      if (!restoredMail) return;

      setTrashMails((prev) => prev.filter((m) => m.id !== mailId));
      setInboxMails((prev) => [restoredMail, ...prev]);
      setSelectedMail(null);

      await restoreMail(mailId);
    } catch (err) {
      console.error("Restore failed", err);
    }
  };

  const getIsUnread = (m) => {
    const read = m.isRead !== undefined ? m.isRead : m.is_read;
    return !read;
  };

  const unreadCounts = {
    inbox: inboxMails.filter(getIsUnread).length,
    drafts: draftMails.length, // total drafts count instead of just unread
    junk: spamMails.filter(getIsUnread).length,
    trash: trashMails.filter(getIsUnread).length,
    archived: archivedMails.filter(getIsUnread).length,
    favorite: favoriteMails.filter(getIsUnread).length,
  };

  const handleSelectMail = async (mail) => {
    if (!mail) {
      setSelectedMail(null);
      return;
    }

    // Immediately mark as read locally and display
    const isCurrentlyRead =
      mail.isRead !== undefined ? mail.isRead : mail.is_read;
    if (!isCurrentlyRead) {
      const updatedMail = { ...mail, isRead: true, is_read: true };

      const updateMailList = (prev) =>
        prev.map((m) => (m.id === mail.id ? updatedMail : m));

      setInboxMails(updateMailList);
      setSentMails(updateMailList);
      setDraftMails(updateMailList);
      setSpamMails(updateMailList);
      setArchivedMails(updateMailList);
      setTrashMails(updateMailList);
      setFavoriteMails(updateMailList);

      setSelectedMail(updatedMail);

      try {
        await toggleReadMail(mail.id);
      } catch (err) {
        console.error("Failed to mark mail as read on open", err);
      }
    } else {
      setSelectedMail(mail);
    }
  };

  const selectNextMail = (removedId) => {
    if (selectedMailbox === "inbox") {
      setInboxMails((prev) => {
        const updated = prev.filter((m) => m.id !== removedId);
        handleSelectMail(updated[0] || null);
        return updated;
      });
    }

    if (selectedMailbox === "sent") {
      setSentMails((prev) => {
        const updated = prev.filter((m) => m.id !== removedId);
        handleSelectMail(updated[0] || null);
        return updated;
      });
    }

    if (selectedMailbox === "drafts") {
      setDraftMails((prev) => {
        const updated = prev.filter((m) => m.id !== removedId);
        handleSelectMail(updated[0] || null);
        return updated;
      });
    }
  };
  const handleTogglePin = (mailId, newStatus) => {
    const updateList = (listSetter) => {
      listSetter((prev) =>
        prev.map((m) =>
          m.id === mailId ? { ...m, is_important: newStatus } : m,
        ),
      );
    };

    updateList(setInboxMails);
    updateList(setSentMails);
    updateList(setDraftMails);
    updateList(setSpamMails);
    updateList(setArchivedMails);
    updateList(setTrashMails);
    updateList(setFavoriteMails);

    if (selectedMail?.id === mailId) {
      setSelectedMail((prev) => ({
        ...prev,
        is_important: newStatus,
      }));
    }
  };

  return (
    <>
      <div
        className={`w-full flex flex-col overflow-hidden transition-all duration-1000 ease-in-out
        ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <Navbar />
        <AppNavBar setIsComposeOpen={setIsComposeOpen} />
        <div className="flex h-175  overflow-hidden">
          <Sidebar
            selectedMailbox={selectedMailbox}
            setSelectedMailbox={setSelectedMailbox}
            loadMailbox={loadMailbox}
            unreadCounts={unreadCounts}
            defaultLabelsVisibility={defaultLabelsVisibility}
            customLabels={customLabels}
          />
          <InboxList
            mails={mails}
            selectedMail={selectedMail}
            setSelectedMail={handleSelectMail}
            selectedMailbox={selectedMailbox}
            setIsComposeOpen={setIsComposeOpen}
            setDraftData={setDraftData}
            onToggleStar={handleToggleStar}
            isComposeOpen={isComposeOpen}
          />
          <MailView
            mail={selectedMail}
            mails={mails}
            selectedMailbox={selectedMailbox}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onToggleStar={handleToggleStar}
            onToggleRead={handleToggleRead}
            onUnarchive={handleUnarchive}
            setSelectedMail={handleSelectMail}
            onRestore={handleRestore}
            onSnooze={handleSnooze}
            onTogglePin={handleTogglePin}
            defaultLabelsVisibility={defaultLabelsVisibility}
            setDefaultLabelsVisibility={setDefaultLabelsVisibility}
            taskRefreshTrigger={taskRefreshTrigger}
            setTaskRefreshTrigger={setTaskRefreshTrigger}
            customLabels={customLabels}
            setCustomLabels={setCustomLabels}
          />
          <RightSidebar taskRefreshTrigger={taskRefreshTrigger} />
          <ComposeModal
            isOpen={isComposeOpen}
            onClose={async () => {
              setIsComposeOpen(false);
              setDraftData(null);
              // Always refresh drafts to sync the sidebar badge when compose modal is handled
              await loadMailbox("drafts", true);
            }}
            onSendSuccess={async () => {
              await loadMailbox("outbox", true);
              await loadMailbox("sent", true);
            }}
            onDeleteSuccess={async (deletedId) => {
              setDraftMails((prev) => prev.filter((m) => m.id !== deletedId));
              if (selectedMail?.id === deletedId) setSelectedMail(null);
            }}
            draftData={draftData}
          />
        </div>
      </div>
    </>
  );
};
export default Home;