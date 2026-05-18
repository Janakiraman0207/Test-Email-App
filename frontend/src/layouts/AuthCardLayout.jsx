import React, { useState, useEffect } from "react";
import forgot from "../assets/images/forgot.png";
import { FadeWrapper } from "../animations/FadeWrapper";
import { AUTH_SLIDES } from "../config/authslides.config";

export const AuthCardLayout = ({ isVisible, variant }) => {
  const slides = AUTH_SLIDES[variant] || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisibleFade, setIsVisibleFade] = useState(true);

  const SLIDE_INTERVAL = 6000;
  const FADE_DURATION = 1000;

  useEffect(() => {
    if (slides.length <= 1) return;

    let timeoutId;

    const run = () => {
      // fade out
      setIsVisibleFade(false);

      timeoutId = setTimeout(() => {
        // change slide
        setActiveIndex((prev) => (prev + 1) % slides.length);

        // fade in
        setIsVisibleFade(true);

        // wait, then run again
        timeoutId = setTimeout(run, SLIDE_INTERVAL);
      }, FADE_DURATION);
    };

    // start first cycle
    timeoutId = setTimeout(run, SLIDE_INTERVAL);

    return () => clearTimeout(timeoutId);
  }, [slides.length]);

  const activeSlide = slides[activeIndex];

  return (
    <div className="relative w-[598px] h-[748px]">
      <h1 className="absolute bottom-[697px] left-[60px] text-[24.18px] text-black self-start krona-one-regular">
        STACKLY
      </h1>
      <FadeWrapper isVisible={isVisible}>
        <>
          <img src={forgot} alt="Forgot" className="w-[598px] h-[748px] z-0" />
          {activeSlide.type === "image" && (
            <div
              className={`absolute flex justify-center items-center left-1/2 top-1/2 z-10 transition-opacity ease-in-out ${
                isVisibleFade ? "opacity-100" : "opacity-0"
              }`}
              style={{
                width: 548,
                height: 444.81,
                // top: `${activeSlide.top}px`,
                // left: `${activeSlide.left}px`,
                // width: `${activeSlide.width}px`,
                // height: `${activeSlide.height}px`,
                transform: "translate(-50%, calc(-50% - 30px))",
                transitionDuration: `${FADE_DURATION}ms`,
              }}
            >
              <img
                src={activeSlide.image}
                alt={activeSlide.title}
                className="max-w-[548px] max-h-full object-contain"
              />
            </div>
          )}
          <div
            className={`absolute left-[40px] top-[580px] flex flex-col items-start transition-opacity ease-in-out ${
              isVisibleFade ? "opacity-100" : "opacity-0"
            }`}
            style={{
              width: "400px",
              transitionDuration: `${FADE_DURATION}ms`,
            }}
          >
            <h2 className="text-white text-[20px] inter-semibold">
              {activeSlide.title}
            </h2>
            <p className="text-white text-[12px] leading-[24px] opacity-80 mt-1">
              {activeSlide.description}
            </p>
          </div>
          {slides.length > 1 && (
            <div className="flex items-center justify-center absolute left-[540px] top-[625px] w-[48px] h-[100px] rounded-[18px] bg-[#0E0929] cursor-pointer">
              <div className="flex flex-col gap-[10px]">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-300 ${
                      index === activeIndex
                        ? "w-[11px] h-[31px] bg-[#A494FF] rounded-[24px]"
                        : "w-[11px] h-[11px] bg-[#4D447E] rounded-full"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      </FadeWrapper>
    </div>
  );
};