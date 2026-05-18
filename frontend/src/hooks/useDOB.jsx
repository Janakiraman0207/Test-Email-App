export const useDOB = (year, month) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);

  const getDatesInMonth = (year, month) => {
    if (!year || !month) {
      return Array.from({ length: 31 }, (_, i) => i + 1);
    }

    const monthIndex = months.indexOf(month);
    const totalDays = new Date(year, monthIndex + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: totalDays }, (_, i) => i + 1).filter(
      (day) => new Date(year, monthIndex, day) < today,
    );
  };

  const dates = getDatesInMonth(year, month);

  return { months, years, dates };
};
