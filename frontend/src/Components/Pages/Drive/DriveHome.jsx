import React, { useState } from "react";
import { Navbar } from '../Home/Navbar/Navbar';
import { AppNavBar } from "../Home/Navbar/AppNavBar";
import { RightSidebar } from "../Home/RightSidebar";
// Make sure to adjust these import paths based on your actual folder structure:
import { LeftSidebar } from "../Drive/DriveLeftSidebar"; 
import DrivePage from "../Drive/DrivePage";// Your "All files" component
import MyFiles from "../Drive/MyFiles";
import SharedWithMe from "../Drive/SharedWithMe";
import Favourite from "../Drive/Favourite";
import Trash from "../Drive/Trash";
import People from "./BrowseFilesBy/People";
import Meetings from "./BrowseFilesBy/Meetings";
import Media from "./BrowseFilesBy/Media";

export const DriveHome = () => {
  // State to track which sidebar item is currently selected
  const [activeTab, setActiveTab] = useState("All files");

  // Dynamically render the middle content based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "All files":
        return <DrivePage />; 
        
      case "My files":
        return <MyFiles />;

        case "Shared with me":         
        return <SharedWithMe />;

        case "Favourite":          
        return <Favourite />;
        
      case "Trash":
        return <Trash />;
        
      // Add other cases (Shared with me, Favourite) here later...

    case "People":
      return <People />;

    case "Meetings":
      return <Meetings />;

    case "Media":
      return <Media />;
        
      default:
        return <DrivePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] relative overflow-x-hidden">
      {/* Top Navbars */}
      <Navbar />
      <AppNavBar />

      {/* Main Content Area */}
      <div className="flex">
        {/* Left Sidebar gets the state and the function to update it */}
        <LeftSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Page Content is injected here */}
        <div className="flex-1 overflow-auto">{renderContent()}</div>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
};

export default DriveHome;