import React, { useState } from "react";
import forgot from "../../../assets/images/forgot.png";

export default function Card() {
  const layoutOrder = ["default", "layout1", "layout2"];
  const [layoutState, setLayoutState] = useState("default");

  const handleVerticalClick = () => {
    const currentIndex = layoutOrder.indexOf(layoutState);
    const nextIndex = (currentIndex + 1) % layoutOrder.length;
    setLayoutState(layoutOrder[nextIndex]);
  };

  const handleHorizontalClick = () => {
    setLayoutState("default");
  };

  const verticalBarPositions = [
    "start", // default
    "center", // layout1
    "end", // layout2
  ];
  const currentBarPosition =
    verticalBarPositions[layoutOrder.indexOf(layoutState)];

  return (
    <div className="relative w-[598px] h-[748px]">
      <img src={forgot} alt="Forgot" className="w-[598px] h-[748px] z-0" />
      <h1
        className="absolute bottom-[697px] left-[60px] text-[24.18px] text-black self-start"
        style={{ fontFamily: "'Krona One', sans-serif" }}
      >
        STACKLY
      </h1>
      {layoutState === "default" && (
        <div
          className="flex flex-col justify-center items-center absolute left-1/2 top-1/2 w-[308px] h-[322px] bg-[white] gap-[20px] rounded-[16px] z-10"
          style={{ transform: "translate(-50%, calc(-50% - 30px))" }}
        >
          <div className="w-[68px] h-[68px] rounded-[50%] bg-[#F3F3F3]"></div>
          <div className="flex flex-col w-[242px] h-[59px] rounded-[8px] bg-[#F3F3F3]"></div>
          <div className="flex flex-col w-[242px] h-[59px] rounded-[8px] bg-[#F3F3F3]"></div>
        </div>
      )}
      {layoutState === "layout1" && (
        <div
          className="absolute flex justify-center items-center left-1/2 top-1/2 w-[500px] h-[450px] z-10"
          style={{ transform: "translate(-50%, calc(-50% - 30px))" }}
        >
          <img
            src={layout1}
            alt="Layout 1"
            className="object-contain max-w-[497px] h-[414px] rounded-[16px]"
            style={{ display: "block", margin: "auto" }}
          />
        </div>
      )}
      {layoutState === "layout2" && (
        <div
          className="absolute flex justify-center items-center left-1/2 top-1/2 w-[308px] h-[322px] z-10"
          style={{ transform: "translate(-50%, calc(-50% - 30px))" }}
        >
          <img
            src={layout2}
            alt="Layout 2"
            className="object-contain w-[518px] h-[322px] rounded-[16px]"
            style={{ display: "block", margin: "auto" }}
          />
        </div>
      )}
      {layoutState === "default" && (
        <div
          className="absolute flex justify-center items-center bg-[white] rounded-[12px] p-[5px] shadow-[0px_-4px_12.8px_0px_#00000000]"
          style={{
            width: "141px",
            height: "57px",
            top: "485px",
            left: "40px",
            opacity: 1,
          }}
        >
          <div className="flex flex-row items-center w-[125px] h-[41px]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.007 2.10377C8.60544 1.65006 7.08181 2.28116 6.41156 3.59306L5.60578 5.17023C5.51004 5.35763 5.35763 5.51004 5.17023 5.60578L3.59306 6.41156C2.28116 7.08181 1.65006 8.60544 2.10377 10.007L2.64923 11.692C2.71404 11.8922 2.71404 12.1078 2.64923 12.308L2.10377 13.993C1.65006 15.3946 2.28116 16.9182 3.59306 17.5885L5.17023 18.3942C5.35763 18.49 5.51004 18.6424 5.60578 18.8298L6.41156 20.407C7.08181 21.7189 8.60544 22.35 10.007 21.8963L11.692 21.3508C11.8922 21.286 12.1078 21.286 12.308 21.3508L13.993 21.8963C15.3946 22.35 16.9182 21.7189 17.5885 20.407L18.3942 18.8298C18.49 18.6424 18.6424 18.49 18.8298 18.3942L20.407 17.5885C21.7189 16.9182 22.35 15.3946 21.8963 13.993L21.3508 12.308C21.286 12.1078 21.286 11.8922 21.3508 11.692L21.8963 10.007C22.35 8.60544 21.7189 7.08181 20.407 6.41156L18.8298 5.60578C18.6424 5.51004 18.49 5.35763 18.3942 5.17023L17.5885 3.59306C16.9182 2.28116 15.3946 1.65006 13.993 2.10377L12.308 2.64923C12.1078 2.71403 11.8922 2.71404 11.692 2.64923L10.007 2.10377ZM6.75977 11.7573L8.17399 10.343L11.0024 13.1715L16.6593 7.51465L18.0735 8.92886L11.0024 15.9999L6.75977 11.7573Z"
                fill="#00A47B"
              />
            </svg>
          </div>
        </div>
      )}

      <div
        className="absolute flex flex-col items-start"
        style={{
          width: "400px",
          height: "85px",
          top: "580px",
          left: "40px",
          opacity: 1,
        }}
      >
        <h1
          className="flex flex-start inter-bold text-[#FFFFFF] font-[700] text-[22px] leading-[100%] tracking-[0] w-[264px] h-[27px]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Reset your password 🔒
        </h1>
        <p
          className="inter-regular text-[#FFFFFF] font-[700] text-[12px] leading-[24px] tracking-[0] w-[400px] h-[48px]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Lorem Ipsum is simply dummy text of the printing and typesetting
          industry. Lorem Ipsum has been the industry's standard
        </p>
      </div>

      <div
        className="flex items-center justify-center absolute left-[540px] top-[625px] w-[48px] h-[100px] rounded-[18px] bg-[#0E0929]"
        style={{ cursor: "pointer" }}
        onClick={handleVerticalClick}
      >
        <div className="flex flex-col w-[11px] h-[73px] gap-[10px] relative">
          {currentBarPosition === "start" && (
            <>
              <div className="w-[11px] h-[31px] rounded-[24px] bg-[#A494FF]"></div>
              <div className="w-[11px] h-[11px] rounded-[50%] bg-[#4D447E]"></div>
              <div className="w-[11px] h-[11px] rounded-[50%] bg-[#4D447E]"></div>
            </>
          )}
          {currentBarPosition === "center" && (
            <>
              <div className="w-[11px] h-[11px] rounded-[50%] bg-[#4D447E]"></div>
              <div className="w-[11px] h-[31px] rounded-[24px] bg-[#A494FF]"></div>
              <div className="w-[11px] h-[11px] rounded-[50%] bg-[#4D447E]"></div>
            </>
          )}
          {currentBarPosition === "end" && (
            <>
              <div className="w-[11px] h-[11px] rounded-[50%] bg-[#4D447E]"></div>
              <div className="w-[11px] h-[11px] rounded-[50%] bg-[#4D447E]"></div>
              <div className="w-[11px] h-[31px] rounded-[24px] bg-[#A494FF]"></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}