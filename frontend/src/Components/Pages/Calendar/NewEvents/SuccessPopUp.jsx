import React from 'react';
import { SuccessTick } from '../../../../assets/icons/Icons';

const SuccessPopUp = () => (
  <div className="fixed inset-0 flex items-center justify-center z-[100]">
    <div
      className="bg-white border border-[#EAEAEA] rounded-[20px] shadow-lg flex flex-col items-center"
      style={{
        width: 345,
        height: 159,
        opacity: 1,
        transform: 'rotate(0deg)',
        padding: '24px 0', // vertical centering for content
      }}
    >
      <div className='flex flex-col justify-center items-center w-[232px] h-[105px] gap-[16px]'>
        <SuccessTick />

        <div className='flex flex-col w-full h-[63px] gap-[10px] items-center justify-center'>
          <span className='inter-semibold text-[14px] text-center'>Successfully</span>
          <div className='flex flex-1 items-center justify-center w-full'>
            <span
              className='inter-regular text-[11px] text-center w-full'
              style={{ lineHeight: '18px' }}
            >
              Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SuccessPopUp;