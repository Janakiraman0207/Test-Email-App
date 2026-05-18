import React, { useEffect, useRef, useState } from "react";
import { ClearColorOption } from "./ClearColorOption";

export const ColorPicker = ({ onSelect, value, type = "text" }) => {
  const [advanced, setAdvanced] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [hsv, setHsv] = useState({
    h: 270,
    s: 60,
    v: 95,
  });
  const isDragging = useRef(false);

  useEffect(() => {
    if (!value || value.startsWith("rgba")) return;

    const rgb = hexToRgb(value);

    const newHsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    setHsv(newHsv);
  }, [value]);

  const palette = [
    [
      "#000000",
      "#444444",
      "#666666",
      "#999999",
      "#cccccc",
      "#eeeeee",
      "#f3f3f3",
      "#ffffff",
    ],

    [
      "#ff0000",
      "#ff9900",
      "#ffff00",
      "#00ff00",
      "#00ffff",
      "#0000ff",
      "#9900ff",
      "#ff00ff",
    ],

    [
      "#f4cccc",
      "#fce5cd",
      "#fff2cc",
      "#d9ead3",
      "#d0e0e3",
      "#cfe2f3",
      "#d9d2e9",
      "#ead1dc",
    ],

    [
      "#ea9999",
      "#f9cb9c",
      "#d9ff99",
      "#b6d7a8",
      "#a2c4c9",
      "#9fc5e8",
      "#b4a7d6",
      "#d5a6bd",
    ],

    [
      "#e06666",
      "#f6b26b",
      "#ffd966",
      "#93c47d",
      "#76a5af",
      "#6fa8dc",
      "#8e7cc3",
      "#c27ba0",
    ],

    [
      "#cc0000",
      "#e69138",
      "#f1c232",
      "#6aa84f",
      "#45818e",
      "#3d85c6",
      "#674ea7",
      "#a64d79",
    ],

    [
      "#990000",
      "#b45f06",
      "#bf9000",
      "#38761d",
      "#134f5c",
      "#0b5394",
      "#351c75",
      "#741b47",
    ],

    [
      "#660000",
      "#783f04",
      "#7f6000",
      "#274e13",
      "#0c343d",
      "#073763",
      "#20124d",
      "#4c1130",
    ],
  ];

  const isSameColor = (c1, c2) => {
    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);

    return (
      Math.abs(r1 - r2) <= 2 && Math.abs(g1 - g2) <= 2 && Math.abs(b1 - b2) <= 2
    );
  };

  const hexToRgb = (hex) => {
    hex = hex.replace("#", "");

    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }

    const bigint = parseInt(hex, 16);

    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  };

  const hsvToHex = (h, s, v) => {
    s /= 100;
    v /= 100;

    let c = v * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = v - c;

    let r = 0,
      g = 0,
      b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const color = hsvToHex(hsv.h, hsv.s, hsv.v); // ✅ FIRST

  const rgb = hexToRgb(color);

  const rgbToHsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);

    let h,
      s,
      v = max;
    const d = max - min;

    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }

    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      v: Math.round(v * 100),
    };
  };

  const pickColor = async () => {
    if ("EyeDropper" in window) {
      const eye = new EyeDropper();
      const result = await eye.open();
      const hex = result.sRGBHex;

      const bigint = parseInt(hex.slice(1), 16);

      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;

      const newHsv = rgbToHsv(r, g, b);
      setHsv(newHsv);
      onSelect(hex);
    }
  };

  if (advanced) {
    return (
      <div
        className="absolute top-8 left-0 bg-white shadow-xl p-[8px] z-50 w-[190px] min-w-[190px] h-[276px] rounded-[4px] flex flex-col gap-[8px]"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* 🎨 GRADIENT (GMAIL STYLE) */}
        <div
          className="relative w-[174px] h-[174px] cursor-crosshair overflow-hidden"
          style={{
            background: `hsl(${hsv.h},100%,50%)`,
          }}
          onMouseDown={(e) => {
            isDragging.current = true;

            const rect = e.currentTarget.getBoundingClientRect();
            let latestHsv = { ...hsv };

            const update = (event) => {
              if (!isDragging.current) return;

              const x = Math.max(
                0,
                Math.min(rect.width, event.clientX - rect.left),
              );
              const y = Math.max(
                0,
                Math.min(rect.height, event.clientY - rect.top),
              );

              const s = (x / rect.width) * 100;
              const v = 100 - (y / rect.height) * 100;

              latestHsv = { ...hsv, s, v };
              setHsv(latestHsv); // UI update ONLY
            };

            update(e);

            window.addEventListener("mousemove", update);

            window.addEventListener(
              "mouseup",
              () => {
                isDragging.current = false;
                window.removeEventListener("mousemove", update);

                // ✅ CALL ONLY ONCE AFTER DRAG
                onSelect(hsvToHex(latestHsv.h, latestHsv.s, latestHsv.v));
              },
              { once: true },
            );
          }}
        >
          {/* overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

          {/* selector */}
          <div
            className="absolute w-[12px] h-[12px] border-2 border-white rounded-full shadow"
            style={{
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        {/* 🌈 HUE SLIDER */}
        <div className="relative h-[8px] rounded overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)",
            }}
          />

          <input
            type="range"
            min="0"
            max="360"
            value={hsv.h}
            onChange={(e) => {
              const h = Number(e.target.value);

              const newHsv = { ...hsv, h };
              setHsv(newHsv);

              // ✅ apply instantly (NO stale state)
              const hex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
              onSelect(hex);
            }}
            className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer translate-y-[-2px]"
          />
        </div>

        {/* 🎯 OPACITY */}
        <div className="flex items-center gap-2">
          <button
            onClick={pickColor}
            className="w-[32px] h-[32px] rounded-md flex items-center justify-center cursor-pointer"
            style={{
              background: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 9 9" fill="white">
              <path d="M8.54928 1.27081L7.41968 0.141201C7.23141 -0.0470669 6.92729 -0.0470669 6.73902 0.141201L5.23288 1.64734L4.30119 0.725314L3.62053 1.40597L4.30602 2.09146L0 6.39748V8.69049H2.293L6.59903 4.38447L7.28451 5.06995L7.96517 4.38929L7.03832 3.46244L8.54446 1.9563C8.73755 1.7632 8.73755 1.45907 8.54928 1.27081Z" />
            </svg>
          </button>

          <div className="flex-1 relative h-[8px] rounded overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 50% / 8px 8px",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0), rgba(${rgb[0]},${rgb[1]},${rgb[2]},1))`,
              }}
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onChange={(e) => {
                const val = Number(e.target.value);
                setOpacity(val);
                const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
                const [r, g, b] = hexToRgb(hex);
                onSelect(hex);
              }}
              className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer"
            />
          </div>
        </div>

        {/* 🔢 HEX + RGB */}

        <div className="flex flex-col gap-[6px] w-fit max-w-[172px] h-fit max-h-[42px]">
          {/* LABELS */}
          <div className="flex items-start justify-start text-[11px] text-[#000000] inter-medium gap-[8px]">
            <span className="w-[59px] h-fit max-h-[10px]">HEX</span>
            <div className="flex items-start justify-start">
              <span className="w-[35px] h-fit max-h-[10px]">R</span>
              <span className="w-[35px] h-fit max-h-[10px]">G</span>
              <span className="w-[35px] h-fit max-h-[10px]">B</span>
            </div>
          </div>

          {/* INPUT ROW */}
          <div className="flex gap-[8px]">
            {/* HEX (LEFT BIG BOX) */}
            <input
              value={color}
              onChange={(e) => {
                let val = e.target.value;
                if (!val.startsWith("#")) val = "#" + val;

                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                  const bigint = parseInt(val.slice(1), 16);
                  const r = (bigint >> 16) & 255;
                  const g = (bigint >> 8) & 255;
                  const b = bigint & 255;

                  const newHsv = rgbToHsv(r, g, b);
                  setHsv(newHsv);
                  onSelect(val);
                }
              }}
              className="w-[59px] h-fit max-h-[28px] border-[0.8px] border-[#E0E0E0] rounded-[4px] px-3 text-[14px]"
            />

            {/* RGB GROUP */}
            <div className="flex flex-1 max-h-[28px] border-[0.8px] border-[#E0E0E0] rounded-[4px] overflow-hidden">
              <input
                value={rgb[0]}
                onChange={(e) => {
                  const newRgb = [...rgb];
                  newRgb[0] = Number(e.target.value);
                  const newHsv = rgbToHsv(...newRgb);
                  setHsv(newHsv);
                  onSelect(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
                }}
                className="w-full text-center w-[35px] border-r border-[#E0E0E0] outline-none"
              />

              <input
                value={rgb[1]}
                onChange={(e) => {
                  const newRgb = [...rgb];
                  newRgb[1] = Number(e.target.value);
                  const newHsv = rgbToHsv(...newRgb);
                  setHsv(newHsv);
                  onSelect(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
                }}
                className="w-full text-center w-[35px] border-r border-[#E0E0E0] outline-none"
              />

              <input
                value={rgb[2]}
                onChange={(e) => {
                  const newRgb = [...rgb];
                  newRgb[2] = Number(e.target.value);
                  const newHsv = rgbToHsv(...newRgb);
                  setHsv(newHsv);
                  onSelect(hsvToHex(newHsv.h, newHsv.s, newHsv.v));
                }}
                className="w-full text-center w-[35px] outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute bg-white shadow-md rounded p-2 z-50 w-[154px] h-[220px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between text-[11px] mb-1">
        {type === "highlight" ? "Highlighter" : "Text color"}
        <ClearColorOption
          label={type === "highlight" ? "No Highlight" : "No Color"}
          onClear={() => onSelect(null)}
        />
      </div>

      {palette.map((row, i) => (
        <div
          key={i}
          className={`flex gap-[2px] ${i === 0 || i === 1 ? "mb-[6px]" : "mb-[2px]"}`}
        >
          {row.map((c) => (
            <div
              key={c}
              onClick={() => {
                const bigint = parseInt(c.slice(1), 16);

                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;

                const newHsv = rgbToHsv(r, g, b);
                setHsv(newHsv);
                onSelect(c);
              }}
              className="w-[16px] h-[16px] relative flex items-center justify-center cursor-pointer"
              style={{ background: c }}
            >
              {value && isSameColor(value, c) && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[11px]">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={() => setAdvanced(true)}
        className="text-[11px] mt-1 cursor-pointer"
      >
        More colors
      </button>
    </div>
  );
};
