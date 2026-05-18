import React from "react";
import media1 from '../../../../assets/images/media1.png';
import media2 from '../../../../assets/images/media2.png';
import media3 from '../../../../assets/images/media3.png';
import media4 from '../../../../assets/images/media4.png';
import media5 from '../../../../assets/images/media5.png';

const Media = () => {
  const mediaData = [
    {
      date: "Jan 20",
      items: [
        { id: 1, url: media1 },
        { id: 2, url: media2},
        { id: 3, url:media3},
      ],
    },
    {
      date: "Mar 16",
      items: [
        { id: 4, url: media4 },
        { id: 5, url: media5},
      ],
    },
  ];

  return (
    <div className="w-full h-full overflow-auto px-4 py-3">
      <h2 className="w-[131px] h-[14px] text-[20px] inter-medium text-[#000000] mb-[46px]">
        MEDIA
      </h2>

      {mediaData.length === 0 ? (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <img
          src="/images/no-media.png"
          alt="no media"
          className="w-[160px] mb-4 opacity-80"
        />

        <p className="text-[14px] text-[#6B7280] mb-1">
          No media found
        </p>

        <p className="text-[12px] text-[#9CA3AF]">
          Images and videos shared will appear here
        </p>
      </div>
    ) : (mediaData.map((group, index) => (
        <div key={index} className="mb-6">
          <p className="text-[18px] text-[#000000] mb-2 inter-bold">
            {group.date}
          </p>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {group.items.map((item) => (
              <div
                key={item.id}
                className="w-[240px] h-[140px] overflow-hidden bg-gray-200 cursor-pointer hover:scale-[1.02] transition"
              >
                <img
                  src={item.url}
                  alt="media"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )))}
    </div>
  );
};

export default Media;