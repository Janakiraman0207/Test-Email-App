import React, { useState, useEffect } from 'react';

const LinkCreatedModal = ({ isOpen, onClose, linkUrl, onSettingsClick }) => {
  const [copied, setCopied] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small timeout to allow the element to mount before animating opacity and transform
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
      // Wait for the transition duration (300ms) before unwiring it from DOM
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy link to clipboard');
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-black/20 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`} 
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-[20px] shadow-lg flex flex-col pt-5 pb-[35px] px-5 gap-4 transition-all duration-300 transform ${visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
        style={{ width: "418px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-2">
          <h2 className="inter-bold text-[14px] text-[#040B23]">Link Created</h2>
          <button onClick={onClose} className="text-[#000000] hover:opacity-70">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="text" 
            readOnly 
            value={linkUrl || ""} 
            className="flex-1 h-[40px] rounded-[8px] bg-[#F1F1F1] border border-[#EAEAEA] px-3 inter-regular text-[12px] text-[#222] outline-none"
          />
          <button 
            onClick={handleCopy}
            className={`h-[40px] px-4 rounded-[8px] inter-medium text-[12px] text-white transition-colors ${copied ? 'bg-green-600' : 'bg-[#141414] hover:bg-[#222]'}`}
            style={{ minWidth: '80px' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {onSettingsClick && (
          <div className="mt-2 flex justify-start">
            <button 
              onClick={() => {
                onClose();
                onSettingsClick();
              }}
              className="inter-medium text-[12px] text-[#6A37F5] hover:underline"
            >
              Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkCreatedModal;
