export const formatUser = (user,type="name") => {
  if (!user) return "";
   if (Array.isArray(user)) {
    user = user[0];
  }
  if (typeof user === "string") return type === "email" ? "" : user;

   const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();

  if (type === "email") {
    return user.email || "";
  }

  return fullName || user.email || "";
};