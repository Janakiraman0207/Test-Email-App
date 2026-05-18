import React, { useState } from "react";
import sharedimg from "../../../assets/images/sharedimg.png";
import sharedimg1 from "../../../assets/images/sharedimg1.png";
import sharedimg2 from "../../../assets/images/sharedimg2.png";
import sharedimg3 from "../../../assets/images/sharedimg3.png";
import sharedimg4 from "../../../assets/images/sharedimg4.png";
import sharedimg5 from "../../../assets/images/sharedimg5.png";
import sharedimg6 from "../../../assets/images/sharedimg6.png";



const Sharedwithmepopup = ({ isOpen, onClose, selectedFile }) => {
	const [showInvitePopup, setShowInvitePopup] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [invitedUsers, setInvitedUsers] = useState([]);
	const [showPermissionDropdown, setShowPermissionDropdown] = useState(false);
	const [openInvitedPermissionFor, setOpenInvitedPermissionFor] = useState(null);
	const [permission, setPermission] = useState("Can edit");
	const [showAnyonePopup, setShowAnyonePopup] = useState(false);
	const [anyoneAccess, setAnyoneAccess] = useState("Can view");
	const [showAnyoneDropdown, setShowAnyoneDropdown] = useState(false);
	const [whoHasAccess, setWhoHasAccess] = useState("Anyone");
	const [isPasswordRequired, setIsPasswordRequired] = useState(false);
	const [whatCanTheyDo, setWhatCanTheyDo] = useState("View");
	const [password, setPassword] = useState("");
	const inviteInputHeight = selectedUsers.length > 0 ? Math.max(40, selectedUsers.length * 28 + 12) : 40;

	if (!isOpen) return null;

	const handleUserSelect = (user) => {
		const alreadySelected = selectedUsers.findIndex(u => u.email === user.email);
		if (alreadySelected > -1) {
			setSelectedUsers(selectedUsers.filter((_, i) => i !== alreadySelected));
		} else {
			setSelectedUsers([...selectedUsers, user]);
		}
		setShowInvitePopup(false);
	};

	const handleRemoveUser = (email) => {
		const updatedUsers = selectedUsers.filter(u => u.email !== email);
		setSelectedUsers(updatedUsers);
		if (updatedUsers.length === 0) {
			setShowPermissionDropdown(false);
		}
	};

	const handleInviteUsers = () => {
		if (selectedUsers.length === 0) return;

		setInvitedUsers((prev) => {
			const usersByEmail = new Map(prev.map((u) => [u.email, u]));

			selectedUsers.forEach((u) => {
				usersByEmail.set(u.email, { ...u, permission });
			});

			return Array.from(usersByEmail.values());
		});

		setSelectedUsers([]);
		setShowInvitePopup(false);
		setShowPermissionDropdown(false);
	};

	const handleInvitedUserPermissionChange = (email, nextPermission) => {
		setInvitedUsers((prev) =>
			prev.map((u) =>
				u.email === email ? { ...u, permission: nextPermission } : u
			)
		);
	};

	const handlePermissionToggle = (e) => {
		e.stopPropagation();
		if (selectedUsers.length === 0) {
			setShowPermissionDropdown(false);
			return;
		}
		setShowPermissionDropdown((prev) => !prev);
	};

	const generatePassword = () => {
		const length = 12;
		const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
		let newPassword = "";
		for (let i = 0; i < length; i++) {
			newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
		}
		setPassword(newPassword);
	};

	const copyPasswordToClipboard = () => {
		if (password) {
			navigator.clipboard.writeText(password);
		}
	};

	return (
		<>
		{!showAnyonePopup && <div className="fixed inset-0 z-[100] bg-black/20" onClick={onClose}>

			<div
				className="absolute bg-white rounded-[20px] "
				style={{
					width: "418px",
					height: "auto",
					maxHeight: "calc(100vh - 160px)",
					top: "136px",
					left: "493px",
					opacity: 1,
				}}
				onClick={(e) => {
					e.stopPropagation();
					setShowInvitePopup(false);
					setShowPermissionDropdown(false);
					setOpenInvitedPermissionFor(null);
				}}
			>
				<div className="p-5 gap-[15px] flex flex-col">
				<div className="flex flex-col gap-[10px]">
                    <div className="flex flex-row items-center justify-between">
						<h3 className="text-[16px] inter-bold text-[14px] text-[#040B23]">Daily Task Sheet- Email</h3>
						<button onClick={onClose} className="text-[#000000]">✕</button>
					</div>

					<div
						className="relative w-[378px] z-[160]"
						style={{ minHeight: "40px", height: `${inviteInputHeight}px` }}
						onClick={(e) => e.stopPropagation()}
					>
						<input
							type="text"
							placeholder={selectedUsers.length > 0 ? "" : "Enter email id to invite"}
							className="w-[378px] rounded-[8px] inter-regular text-[12px] placeholder:text-[#3D3D3D] border-[1px] border-[#C6C6C6] pl-3 pr-[130px] outline-none"
							style={{ height: `${inviteInputHeight}px` }}
							onClick={() => setShowInvitePopup(true)}
						/>
						<div className="absolute left-3 top-2 flex flex-col gap-1 w-[310px]">
							{selectedUsers.map((user) => (
								<div
									key={user.email}
									className="flex items-center gap-1 px-2 py-1 rounded-[4px] bg-[#EEEDED]"
									style={{
										height: "24px",
										width: "fit-content",
									}}
								>
									<span className="inter-medium text-[10px] text-[#040B23]">{user.name}</span>
									<button
										onClick={(e) => {
											e.stopPropagation();
											handleRemoveUser(user.email);
										}}
										className="text-[#717171] hover:text-[#040B23] text-[12px]"
									>
										✕
									</button>
								</div>
							))}
						</div>
						<div className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-[10px] z-[170]">
							{selectedUsers.length > 0 && (
								<button
									type="button"
									className="inline-flex items-center gap-[12px] inter-medium text-[10px]"
									onClick={handlePermissionToggle}
								>
									{permission}
									<svg width="6" height="4" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M0.312499 0.312499C0.312499 0.312499 2.15417 2.8125 2.8125 2.8125C3.47083 2.8125 5.3125 0.3125 5.3125 0.3125" stroke="black" strokeWidth="0.625" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
								</button>
							)}
							<button
								type="button"
								className="inter-bold text-[12px] text-[#6A37F5]"
								onClick={handleInviteUsers}
							>
								Invite
							</button>
							{showPermissionDropdown && selectedUsers.length > 0 && (
								<div
									className="absolute right-[48px] top-[22px] z-[220] rounded-[8px] border border-[#E8E8E8] bg-white"
									style={{ width: "150px", height: "102px", opacity: 1 }}
									onClick={(e) => e.stopPropagation()}
								>
									<button
										type="button"
										className="w-full h-[34px] text-left px-3 inter-regular text-[11px] text-[#040B23] hover:bg-[#F7F7F7]"
										onClick={() => {
											setPermission("Can edit");
											setShowPermissionDropdown(false);
										}}
									>
										Can edit
									</button>
									<button
										type="button"
										className="w-full h-[34px] text-left px-3 inter-regular text-[11px] text-[#040B23] hover:bg-[#F7F7F7]"
										onClick={() => {
											setPermission("Can view");
											setShowPermissionDropdown(false);
										}}
									>
										Can view
									</button>
									<button
										type="button"
										className="w-full h-[34px] text-left px-3 inter-regular text-[11px] text-[#040B23] hover:bg-[#F7F7F7]"
										onClick={() => {
											setPermission("View & comment");
											setShowPermissionDropdown(false);
										}}
									>
										View & comment
									</button>
								</div>
							)}
						</div>
						{showInvitePopup && (
							<div
								className="absolute left-0 z-[120] rounded-[8px] border border-[#E8E8E8] bg-white overflow-y-auto"
								style={{
									width: "378px",
									height: "308px",
									top: `${inviteInputHeight + 8}px`,
									opacity: 1,
									boxShadow:
										"0px 4px 10px 0px #0000001A, 0px 17px 17px 0px #00000017, 0px 39px 24px 0px #0000000D, 0px 70px 28px 0px #00000003, 0px 109px 31px 0px #00000000",
								}}
								onClick={(e) => e.stopPropagation()}
							>
								<div className="p-3 flex flex-col gap-[0px]">
									{[
										{ img: sharedimg, name: "Alice Johnson", email: "Alicejohnson@thestackly.com" },
										{ img: sharedimg1, name: "Bob Smith", email: "bobsmith@thestackly.com" },
										{ img: sharedimg2, name: "Charlie Davis", email: "charlied@thestackly.com" },
										{ img: sharedimg3, name: "Diana Prince", email: "dianap@thestackly.com" },
										{ img: sharedimg4, name: "Ethan Hunt", email: "ethanh@thestackly.com" },
										{ img: sharedimg5, name: "Fiona Green", email: "fionag@thestackly.com" },
										{ img: sharedimg6, name: "George Miller", email: "georgem@thestackly.com" },
									].map((user, index) => (
										<div key={index} className="flex items-center gap-3 p-2 rounded-[6px] hover:bg-[#F5F5F5] cursor-pointer" onClick={() => handleUserSelect(user)}>
											<img src={user.img} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
											<div className="flex flex-col gap-1 flex-1">
												<span className="inter-medium text-[12px] text-[#040B23]">{user.name}</span>
												<span className="inter-regular text-[10px] text-[#717171]">{user.email}</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
                </div>
                <div className="flex flex-col gap-[10px] min-h-[60px] ">
                   <span className="inter-bold text-[10px]">Who has access</span>
					<div className="relative w-[378px] h-[28px]">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-black">
							{whoHasAccess === "Only invited people" ? (
								<svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M0.678667 11.7294C0.828667 12.8427 1.75067 13.7154 2.87333 13.7667C3.81733 13.8101 4.77667 13.8327 5.83333 13.8327C6.89 13.8327 7.84933 13.8101 8.79333 13.7661C9.916 13.7154 10.838 12.8427 10.988 11.7294C11.086 11.0027 11.1667 10.2581 11.1667 9.49939C11.1667 8.74072 11.086 7.99605 10.988 7.26939C10.838 6.15605 9.916 5.28339 8.79333 5.23205C7.80732 5.18699 6.82038 5.16498 5.83333 5.16605C4.77667 5.16605 3.81733 5.18872 2.87333 5.23272C1.75067 5.28339 0.828667 6.15605 0.678667 7.26939C0.58 7.99605 0.5 8.74072 0.5 9.49939C0.5 10.2581 0.580667 11.0027 0.678667 11.7294Z" stroke="black"/>
									<path d="M2.83203 5.16667V3.5C2.83203 2.70435 3.1481 1.94129 3.71071 1.37868C4.27332 0.81607 5.03638 0.5 5.83203 0.5C6.62768 0.5 7.39074 0.81607 7.95335 1.37868C8.51596 1.94129 8.83203 2.70435 8.83203 3.5V5.16667" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M5.83008 9.5H5.83758" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							) : (
								<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M7.16667 13.8333C10.8486 13.8333 13.8333 10.8486 13.8333 7.16667C13.8333 3.48477 10.8486 0.5 7.16667 0.5C3.48477 0.5 0.5 3.48477 0.5 7.16667C0.5 10.8486 3.48477 13.8333 7.16667 13.8333Z" stroke="black"/>
									<path d="M4.5 7.16667C4.5 11.1667 7.16667 13.8333 7.16667 13.8333C7.16667 13.8333 9.83333 11.1667 9.83333 7.16667C9.83333 3.16667 7.16667 0.5 7.16667 0.5C7.16667 0.5 4.5 3.16667 4.5 7.16667Z" stroke="black" strokeLinejoin="round"/>
									<path d="M13.167 9.16602H1.16699M13.167 5.16602H1.16699" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							)}
						</span>
						<input
							type="text"
							defaultValue="Anyone"
							readOnly
							className="w-[378px] h-[28px] rounded-[6px] bg-[#F1F1F1] pl-9 pr-[62px] inter-medium text-[10px] outline-none cursor-pointer"
							onClick={(e) => { e.stopPropagation(); setShowAnyonePopup(true); }}
						/>
						<span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-[12px] inter-medium text-[10px]">
							Can view
							<svg width="4" height="6" viewBox="0 0 4 6" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M0.312499 5.3125C0.312499 5.3125 2.8125 3.47083 2.8125 2.8125C2.8125 2.15417 0.3125 0.3125 0.3125 0.3125" stroke="black" strokeWidth="0.625" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</span>
					</div>
                </div>
				<div className="w-full flex flex-col gap-[10px] min-h-0">
                    <span className="inter-bold text-[10px]">People’s with access</span>
					{invitedUsers.length === 0 ? (
						<span className="inter-regular text-[10px] text-[#717171]">No users added</span>
					) : (
						<div className="flex flex-col gap-[8px] max-h-[140px] overflow-y-auto">
							{invitedUsers.map((user) => (
								<div key={user.email} className="relative flex items-center justify-between rounded-[6px] bg-[#F8F8F8] px-2 py-1.5">
									<div className="flex items-center gap-2">
										<img src={user.img} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
										<div className="flex flex-col">
											<span className="inter-medium text-[10px] text-[#040B23]">{user.name}</span>
											<span className="inter-regular text-[9px] text-[#717171]">{user.email}</span>
										</div>
									</div>
									<button
										type="button"
										className="inline-flex items-center gap-[6px] inter-medium text-[9px] text-[#3D3D3D]"
										onClick={(e) => {
											e.stopPropagation();
											setOpenInvitedPermissionFor((prev) =>
												prev === user.email ? null : user.email
											);
										}}
									>
										{user.permission || "Can edit"}
										<svg width="6" height="4" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M0.312499 0.312499C0.312499 0.312499 2.15417 2.8125 2.8125 2.8125C3.47083 2.8125 5.3125 0.3125 5.3125 0.3125" stroke="black" strokeWidth="0.625" strokeLinecap="round" strokeLinejoin="round"/>
										</svg>
									</button>
									{openInvitedPermissionFor === user.email && (
										<div
											className="absolute right-0 top-[28px] z-[220] rounded-[8px] border border-[#E8E8E8] bg-white"
											style={{
												width: "150px",
												height: "102px",
												opacity: 1,
												boxShadow:
													"0px 4px 10px 0px #0000001A, 0px 17px 17px 0px #00000017, 0px 39px 24px 0px #0000000D, 0px 70px 28px 0px #00000003, 0px 109px 31px 0px #00000000",
											}}
											onClick={(e) => e.stopPropagation()}
										>
											<button
												type="button"
												className="w-full h-[34px] text-left px-3 inter-regular text-[11px] text-[#040B23] hover:bg-[#F7F7F7]"
												onClick={() => {
													handleInvitedUserPermissionChange(user.email, "Can edit");
													setOpenInvitedPermissionFor(null);
												}}
											>
												Can edit
											</button>
											<button
												type="button"
												className="w-full h-[34px] text-left px-3 inter-regular text-[11px] text-[#040B23] hover:bg-[#F7F7F7]"
												onClick={() => {
													handleInvitedUserPermissionChange(user.email, "Can view");
													setOpenInvitedPermissionFor(null);
												}}
											>
												Can view
											</button>
											<button
												type="button"
												className="w-full h-[34px] text-left px-3 inter-regular text-[11px] text-[#040B23] hover:bg-[#F7F7F7]"
												onClick={() => {
													handleInvitedUserPermissionChange(user.email, "View & comment");
													setOpenInvitedPermissionFor(null);
												}}
											>
												View & comment
											</button>
										</div>
									)}
								</div>
							))}
						</div>
					)}
                </div>
				 <button className="shrink-0 flex items-center justify-center w-[378px] h-[28px] rounded-[10px] bg-[#141414]">
                    <span className="inter-regular text-[10px] text-white">Copy invite link</span>
                 </button>
				</div>
			</div>
		</div>}

			{/* show settingspopup */}
			{showAnyonePopup && (
				<div className="fixed inset-0 z-[300] bg-black/20" onClick={() => setShowAnyonePopup(false)}>
					<div
						className="absolute bg-white rounded-[20px] flex flex-col"
						style={{
							width: "418px",
							height: isPasswordRequired ? "455px" : "411px",
							top: "136px",
							left: "493px",
							opacity: 1,
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-5 flex flex-col gap-[20px] h-full">
						   <div className="flex flex-row justify-between">
							<div className="flex flex-row w-[130px] h-[20px]">
								<button
									type="button"
									className="w-[20px] h-[20px] flex items-center justify-between"
									onClick={(e) => {
										e.stopPropagation();
										setShowAnyonePopup(false);
										setShowAnyoneDropdown(false);
									}}
								>
									<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M5.625 0.625C5.625 0.625 0.625 4.3075 0.625 5.625C0.625 6.9425 5.625 10.625 5.625 10.625" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</button>
						      <h1 className="inter-bold text-[14px] ">Share settings</h1>
						    </div>
							<div className="w-[20px] h-[20px] flex items-center justify-between">
								<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M10.625 0.625L0.625 10.625M10.625 10.625L0.625 0.625" stroke="black" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
							</div>
						   </div>
						   <div className="flex flex-col w-[378px] h-[78px] gap-[10px]">
							<span className="inter-bold text-[10px]">Who has access</span>
							<div className="relative w-[378px] h-[28px]">
						<span className="absolute left-3 top-1/2 -translate-y-1/2 text-black">
							{whoHasAccess === "Only invited people" ? (
								<svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M0.678667 11.7294C0.828667 12.8427 1.75067 13.7154 2.87333 13.7667C3.81733 13.8101 4.77667 13.8327 5.83333 13.8327C6.89 13.8327 7.84933 13.8101 8.79333 13.7661C9.916 13.7154 10.838 12.8427 10.988 11.7294C11.086 11.0027 11.1667 10.2581 11.1667 9.49939C11.1667 8.74072 11.086 7.99605 10.988 7.26939C10.838 6.15605 9.916 5.28339 8.79333 5.23205C7.80732 5.18699 6.82038 5.16498 5.83333 5.16605C4.77667 5.16605 3.81733 5.18872 2.87333 5.23272C1.75067 5.28339 0.828667 6.15605 0.678667 7.26939C0.58 7.99605 0.5 8.74072 0.5 9.49939C0.5 10.2581 0.580667 11.0027 0.678667 11.7294Z" stroke="black"/>
									<path d="M2.83203 5.16667V3.5C2.83203 2.70435 3.1481 1.94129 3.71071 1.37868C4.27332 0.81607 5.03638 0.5 5.83203 0.5C6.62768 0.5 7.39074 0.81607 7.95335 1.37868C8.51596 1.94129 8.83203 2.70435 8.83203 3.5V5.16667" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
									<path d="M5.83008 9.5H5.83758" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							) : (
								<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M7.16667 13.8333C10.8486 13.8333 13.8333 10.8486 13.8333 7.16667C13.8333 3.48477 10.8486 0.5 7.16667 0.5C3.48477 0.5 0.5 3.48477 0.5 7.16667C0.5 10.8486 3.48477 13.8333 7.16667 13.8333Z" stroke="black"/>
									<path d="M4.5 7.16667C4.5 11.1667 7.16667 13.8333 7.16667 13.8333C7.16667 13.8333 9.83333 11.1667 9.83333 7.16667C9.83333 3.16667 7.16667 0.5 7.16667 0.5C7.16667 0.5 4.5 3.16667 4.5 7.16667Z" stroke="black" strokeLinejoin="round"/>
									<path d="M13.167 9.16602H1.16699M13.167 5.16602H1.16699" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
								</svg>
							)}
						</span>
						<input
							type="text"
							value={whoHasAccess}
							readOnly
							className="w-[378px] h-[28px] rounded-[6px] bg-[#F1F1F1] pl-9 pr-[62px] inter-medium text-[10px] outline-none cursor-pointer"
							onClick={(e) => { e.stopPropagation(); setShowAnyoneDropdown((prev) => !prev); }}
						/>
						<span className="absolute right-3 top-1/2 -translate-y-1/2">
							<svg width="6" height="4" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M0.312499 0.312499C0.312499 0.312499 2.15417 2.8125 2.8125 2.8125C3.47083 2.8125 5.3125 0.3125 5.3125 0.3125" stroke="black" strokeWidth="0.625" strokeLinecap="round" strokeLinejoin="round"/>
							</svg>
						</span>
						{showAnyoneDropdown && (
							<div
								className="absolute left-0 top-[32px] z-[400] rounded-[8px] bg-white border border-[#E8E8E8] overflow-hidden"
								style={{
									width: "378px",
									height: "74px",
									boxShadow:
										"0px 4px 10px 0px #0000001A, 0px 17px 17px 0px #00000017, 0px 39px 24px 0px #0000000D, 0px 70px 28px 0px #00000003, 0px 109px 31px 0px #00000000",
								}}
								onClick={(e) => e.stopPropagation()}
							>
								<button
									type="button"
									className="w-full h-[37px] flex items-center justify-between px-3 inter-regular text-[12px] text-[#000000] hover:bg-[#F7F7F7]"
									onClick={() => { setWhoHasAccess("Only invited people"); setShowAnyoneDropdown(false); }}
								>
									<span className="flex items-center gap-[8px]">
										<svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M0.678667 11.7294C0.828667 12.8427 1.75067 13.7154 2.87333 13.7667C3.81733 13.8101 4.77667 13.8327 5.83333 13.8327C6.89 13.8327 7.84933 13.8101 8.79333 13.7661C9.916 13.7154 10.838 12.8427 10.988 11.7294C11.086 11.0027 11.1667 10.2581 11.1667 9.49939C11.1667 8.74072 11.086 7.99605 10.988 7.26939C10.838 6.15605 9.916 5.28339 8.79333 5.23205C7.80732 5.18699 6.82038 5.16498 5.83333 5.16605C4.77667 5.16605 3.81733 5.18872 2.87333 5.23272C1.75067 5.28339 0.828667 6.15605 0.678667 7.26939C0.58 7.99605 0.5 8.74072 0.5 9.49939C0.5 10.2581 0.580667 11.0027 0.678667 11.7294Z" stroke="black"/>
											<path d="M2.83203 5.16667V3.5C2.83203 2.70435 3.1481 1.94129 3.71071 1.37868C4.27332 0.81607 5.03638 0.5 5.83203 0.5C6.62768 0.5 7.39074 0.81607 7.95335 1.37868C8.51596 1.94129 8.83203 2.70435 8.83203 3.5V5.16667" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
											<path d="M5.83008 9.5H5.83758" stroke="black" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
										</svg>
										Only invited people
									</span>
									{whoHasAccess === "Only invited people" && (
										<svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M0.4375 4.8125L2.47917 6.85417L8.60417 0.4375" stroke="black" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
										</svg>
									)}
								</button>
								<button
									type="button"
									className="w-full h-[37px] flex items-center justify-between px-3 inter-regular text-[12px] text-[#000000] hover:bg-[#F7F7F7]"
									onClick={() => { setWhoHasAccess("Anyone"); setShowAnyoneDropdown(false); }}
								>
									<span className="flex items-center gap-[8px]">
										<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M7.16667 13.8333C10.8486 13.8333 13.8333 10.8486 13.8333 7.16667C13.8333 3.48477 10.8486 0.5 7.16667 0.5C3.48477 0.5 0.5 3.48477 0.5 7.16667C0.5 10.8486 3.48477 13.8333 7.16667 13.8333Z" stroke="black"/>
											<path d="M4.5 7.16667C4.5 11.1667 7.16667 13.8333 7.16667 13.8333C7.16667 13.8333 9.83333 11.1667 9.83333 7.16667C9.83333 3.16667 7.16667 0.5 7.16667 0.5C7.16667 0.5 4.5 3.16667 4.5 7.16667Z" stroke="black" strokeLinejoin="round"/>
											<path d="M13.168 9.16406H1.16797M13.168 5.16406H1.16797" stroke="black" strokeLinecap="round" strokeLinejoin="round"/>
										</svg>
										Anyone
									</span>
									{whoHasAccess === "Anyone" && (
										<svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M0.4375 4.8125L2.47917 6.85417L8.60417 0.4375" stroke="black" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
										</svg>
									)}
								</button>
							</div>
						)}
						<span className="inter-regular text-[10px]">Anyone, even those outside your organization, will be able to access this file.</span>
					</div>
						   </div>
                        <div className="flex flex-col gap-[10px] w-[122px] h-[108px]">
							<span className="inter-bold text-[10px]">What can they do</span>
							<label className="h-[20px] flex flex-row gap-[10px] items-center cursor-pointer">
								<input
									type="radio"
									name="whatCanTheyDo"
									value="View"
									checked={whatCanTheyDo === "View"}
									onChange={() => setWhatCanTheyDo("View")}
									className="sr-only"
								/>
								<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
									{whatCanTheyDo === "View" ? (
										<>
											<circle cx="8.5" cy="8.5" r="7.5" fill="black" stroke="black" strokeWidth="1.25"/>
											<path d="M5.5 8.5L7.5 10.5L11.5 6.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
										</>
									) : (
										<path d="M8.125 15.625C12.2671 15.625 15.625 12.2671 15.625 8.125C15.625 3.98286 12.2671 0.625 8.125 0.625C3.98286 0.625 0.625 3.98286 0.625 8.125C0.625 12.2671 3.98286 15.625 8.125 15.625Z" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
									)}
								</svg>
								<span className="inter-regular text-[12px]">View</span>
							</label>
							<label className="h-[20px] flex flex-row gap-[10px] items-center cursor-pointer">
								<input
									type="radio"
									name="whatCanTheyDo"
									value="Edit"
									checked={whatCanTheyDo === "Edit"}
									onChange={() => setWhatCanTheyDo("Edit")}
									className="sr-only"
								/>
								<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
									{whatCanTheyDo === "Edit" ? (
										<>
											<circle cx="8.5" cy="8.5" r="7.5" fill="black" stroke="black" strokeWidth="1.25"/>
											<path d="M5.5 8.5L7.5 10.5L11.5 6.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
										</>
									) : (
										<path d="M8.125 15.625C12.2671 15.625 15.625 12.2671 15.625 8.125C15.625 3.98286 12.2671 0.625 8.125 0.625C3.98286 0.625 0.625 3.98286 0.625 8.125C0.625 12.2671 3.98286 15.625 8.125 15.625Z" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
									)}
								</svg>
								<span className="inter-regular text-[12px]">Edit</span>
							</label>
							<label className="h-[20px] flex flex-row gap-[10px] items-center cursor-pointer">
								<input
									type="radio"
									name="whatCanTheyDo"
									value="View & comment"
									checked={whatCanTheyDo === "View & comment"}
									onChange={() => setWhatCanTheyDo("View & comment")}
									className="sr-only"
								/>
								<svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
									{whatCanTheyDo === "View & comment" ? (
										<>
											<circle cx="8.5" cy="8.5" r="7.5" fill="black" stroke="black" strokeWidth="1.25"/>
											<path d="M5.5 8.5L7.5 10.5L11.5 6.5" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
										</>
									) : (
										<path d="M8.125 15.625C12.2671 15.625 15.625 12.2671 15.625 8.125C15.625 3.98286 12.2671 0.625 8.125 0.625C3.98286 0.625 0.625 3.98286 0.625 8.125C0.625 12.2671 3.98286 15.625 8.125 15.625Z" stroke="black" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
									)}
								</svg>
								<span className="inter-regular text-[12px] whitespace-nowrap">View & comment</span>
							</label>
						</div>
						<div className="w-[378px] gap-[10px] flex flex-col">
							<span className="inter-bold text-[10px]">Additional security</span>
							<label className="h-[20px] flex flex-row gap-[10px] items-center cursor-pointer justify-between w-full">
								<div className="flex flex-row gap-[10px] items-center">
									<input
										type="checkbox"
										checked={isPasswordRequired}
										onChange={(e) => setIsPasswordRequired(e.target.checked)}
										className="sr-only"
									/>
									<span
										className={`w-[18px] h-[18px] rounded-[3px] border flex items-center justify-center ${
											isPasswordRequired ? "bg-[#6A37F5] border-[#6A37F5]" : "bg-white border-[#C5C5C5]"
										}`}
									>
										{isPasswordRequired && (
											<svg width="8" height="7" viewBox="0 0 8 7" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M0.5625 3.47917L2.64583 5.5625L7.22917 0.5625" stroke="white" strokeWidth="1.125" strokeLinecap="round" strokeLinejoin="round"/>
											</svg>
										)}
									</span>
									<span className="inter-regular text-[12px] whitespace-nowrap">Password required</span>
								</div>
								{isPasswordRequired && (
									<span 
										className="inter-regular text-[12px] text-[#6A37F5] cursor-pointer whitespace-nowrap"
										onClick={(e) => { e.stopPropagation(); generatePassword(); }}
									>
										Generate
									</span>
								)}
							</label>
							{isPasswordRequired && (
								<div className="relative w-[378px]">
									<input
										type="text"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Add a password"
										className="w-[378px] h-[34px] rounded-[6px] border border-[#C5C5C5] bg-[#F1F1F1] px-3 inter-regular text-[12px] outline-none placeholder:inter-regular placeholder:text-[10px] placeholder:text-[#888888]"
									/>
									<svg 
										className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" 
										width="13" 
										height="13" 
										viewBox="0 0 13 13" 
										fill="none" 
										xmlns="http://www.w3.org/2000/svg"
										onClick={(e) => { e.stopPropagation(); copyPasswordToClipboard(); }}
									>
										<path d="M4.52148 8.02148C4.52148 6.37182 4.52148 5.5464 5.03423 5.03423C5.5464 4.52148 6.37182 4.52148 8.02148 4.52148H8.60482C10.2545 4.52148 11.0799 4.52148 11.5921 5.03423C12.1048 5.5464 12.1048 6.37182 12.1048 8.02148V8.60482C12.1048 10.2545 12.1048 11.0799 11.5921 11.5921C11.0799 12.1048 10.2545 12.1048 8.60482 12.1048H8.02148C6.37182 12.1048 5.5464 12.1048 5.03423 11.5921C4.52148 11.0799 4.52148 10.2545 4.52148 8.60482V8.02148Z" stroke="black" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
										<path d="M9.1875 4.52083C9.18575 2.79592 9.16008 1.90225 8.65783 1.29033C8.56094 1.1723 8.4527 1.06405 8.33467 0.967167C7.68833 0.4375 6.7305 0.4375 4.8125 0.4375C2.89508 0.4375 1.93608 0.4375 1.29033 0.967167C1.1723 1.06405 1.06405 1.1723 0.967167 1.29033C0.4375 1.93667 0.4375 2.8945 0.4375 4.8125C0.4375 6.72992 0.4375 7.68892 0.967167 8.33467C1.06405 8.4527 1.1723 8.56094 1.29033 8.65783C1.90283 9.1595 2.79533 9.18633 4.52083 9.1875" stroke="black" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"/>
									</svg>
								</div>
							)}
						</div>
						<div className="mt-auto flex flex-row justify-end gap-[10px]">
							<button
								type="button"
								className="w-[80px] h-[28px] px-4 rounded-[10px] inter-regular text-[10px] text-[#141414] bg-[#E4E4E4]"
								onClick={() => setShowAnyonePopup(false)}
							>
								Discard
							</button>
							<button
								type="button"
								className="w-[80px] h-[28px] px-4 rounded-[10px] bg-[#141414] inter-regular text-[10px] text-white "
							>
								Save
							</button>
						</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Sharedwithmepopup;
