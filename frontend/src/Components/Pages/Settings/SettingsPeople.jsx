import React, { useState, useEffect } from 'react';
import { fetchPeopleSettings, updatePeopleSetting } from '../../../api/api'; 

const SettingsPeople = () => {
  const [autoAddContacts, setAutoAddContacts] = useState(false);
  const [showProfilePhotos, setShowProfilePhotos] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState(false);
  const [syncPhoneContacts, setSyncPhoneContacts] = useState(false);

  // Fetch on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetchPeopleSettings(token)
      .then(data => {
        if (typeof data.auto_add_contacts === 'boolean') setAutoAddContacts(data.auto_add_contacts);
        if (typeof data.show_profile_photos === 'boolean'){ setShowProfilePhotos(data.show_profile_photos);
          localStorage.setItem('show_profile_photos', JSON.stringify(data.show_profile_photos)); }
        if (typeof data.contact_suggestions === 'boolean') { setContactSuggestions(data.contact_suggestions);  
          localStorage.setItem('contact_suggestions', JSON.stringify(data.contact_suggestions)); };
        if (typeof data.sync_phone_contacts === 'boolean') setSyncPhoneContacts(data.sync_phone_contacts);
      })
      .catch(err => console.error(err));
  }, []);

  // Update helper
  const updateSetting = (key, value, setter) => {
    const token = localStorage.getItem('token');
    updatePeopleSetting(key, value, token)
      .then(data => {
        if (typeof data[key] === 'boolean') setter(data[key]);
      })
      .catch(err => alert('Error: ' + err.message));
  };

  return (
    <div className='flex-grow flex flex-col h-full gap-[42px] px-[20px] py-[10px]'>
      <h1 className='inter-bold text-[18px] text-[black]'>People & Contacts</h1>
      <div className='flex flex-col w-full h-[296px] gap-[20px]'>

        {/* Auto-add-contacts */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Auto-add-contacts</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Automatically add people you email</span>
          </div>
          <button
            className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${
              autoAddContacts ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'
            }`}
            onClick={() => updateSetting('auto_add_contacts', !autoAddContacts, setAutoAddContacts)}
            aria-pressed={autoAddContacts}
            type="button"
          >
            <div
              className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                autoAddContacts ? 'bg-white' : 'bg-[#6A37F5]'
              }`}
              style={{
                transform: autoAddContacts ? 'translateX(19px)' : 'translateX(0)',
              }}
            ></div>
          </button>
        </div>
        {/* Show profile photos */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Show profile photos</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Display contact photos in email list</span>
          </div>
          <button
            className={`flex cursor-pointer items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${
              showProfilePhotos ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'
            }`}
            onClick={() => {
              const newVal = !showProfilePhotos;
              updateSetting('show_profile_photos', newVal, setShowProfilePhotos);
              localStorage.setItem('show_profile_photos', JSON.stringify(newVal));
              window.dispatchEvent(new Event('storage'));
            }}
            aria-pressed={showProfilePhotos}
            type="button"
          >
            <div
              className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                showProfilePhotos ? 'bg-white' : 'bg-[#6A37F5]'
              }`}
              style={{
                transform: showProfilePhotos ? 'translateX(19px)' : 'translateX(0)',
              }}
            ></div>
          </button>
        </div>
        {/* Contact suggestions */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Contact suggestions</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Suggest contacts when composing</span>
          </div>
          <button
            className={`flex items-center w-[42px] h-[23px] cursor-pointer rounded-[12px] px-[2px] transition-colors duration-200 ${
              contactSuggestions ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'
            }`}
            onClick={() => {
              const newVal = !contactSuggestions;
              updateSetting('contact_suggestions', newVal, setContactSuggestions);
              // Sync to localStorage so ComposeModal reads it immediately
              localStorage.setItem('contact_suggestions', JSON.stringify(newVal));
              window.dispatchEvent(new Event('storage'));
            }}
            aria-pressed={contactSuggestions}
            type="button"
          >
            <div
              className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                contactSuggestions ? 'bg-white' : 'bg-[#6A37F5]'
              }`}
              style={{
                transform: contactSuggestions ? 'translateX(19px)' : 'translateX(0)',
              }}
            ></div>
          </button>
        </div>
        {/* Sync with phone contacts */}
        <div className='w-full flex flex-row items-center justify-between h-[60px] border-b-[1px] border-[#EAEAEA] gap-[5px]'>
          <div className='flex flex-col gap-[5px]'>
            <h2 className='inter-medium text-[12px] text-[black]'>Sync with phone contacts</h2>
            <span className='inter-regular text-[12px] text-[#70707C]'>Keep contacts synced across devices</span>
          </div>
          <button
            className={`flex items-center w-[42px] h-[23px] rounded-[12px] px-[2px] transition-colors duration-200 ${
              syncPhoneContacts ? 'bg-[#6A37F5]' : 'bg-[#EDECFF]'
            }`}
            onClick={() => updateSetting('sync_phone_contacts', !syncPhoneContacts, setSyncPhoneContacts)}
            aria-pressed={syncPhoneContacts}
            type="button"
          >
            <div
              className={`w-[19px] h-[19px] rounded-full transition-all duration-200 ${
                syncPhoneContacts ? 'bg-white' : 'bg-[#6A37F5]'
              }`}
              style={{
                transform: syncPhoneContacts ? 'translateX(19px)' : 'translateX(0)',
              }}
            ></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPeople;