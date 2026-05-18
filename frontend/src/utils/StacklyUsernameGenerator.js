export const StacklyUsernameGenerator = (fullName) => {
  if (!fullName.trim()) return [];

  const clean = fullName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

  const parts = clean.split(" ");
  const first = parts[0] || "";
  const last = parts[1] || "";

  const base = first + (last || "");
  const short = first.slice(0, 6);
  const noVowels = base.replace(/[aeiou]/g, "");

  // CLEAN small numbers only
  const twoDigit = () => String(Math.floor(10 + Math.random() * 89)); // 10–99
  const threeDigit = () => String(Math.floor(100 + Math.random() * 899)); //100–999
  const year2 = () => String(1980 + Math.floor(Math.random() * 40)).slice(-2); //80–19

  // const numbers = [
  //   twoDigit(),
  //   threeDigit(),
  //   year2(),
  // ];

  const suggestions = new Set();

  // Clean patterns Gmail uses
  // suggestions.add(`${first}${numbers[0]}`);
  // suggestions.add(`${first}${numbers[1]}`);
  // suggestions.add(`${base}${numbers[0]}`);
  // suggestions.add(`${short}${numbers[0]}`);
  // suggestions.add(`${noVowels}${numbers[0]}`);
  // suggestions.add(`${first}.${last}${numbers[0]}`);
  // suggestions.add(`${first}${last.slice(0, 2)}${numbers[0]}`);
  // suggestions.add(`${first}_${numbers[2]}`);
  // suggestions.add(`${first}${last.charAt(0)}${numbers[2]}`);

  suggestions.add(`${first}${twoDigit()}`);
  suggestions.add(`${first}${threeDigit()}`);
  suggestions.add(`${base}${twoDigit()}`);
  suggestions.add(`${short}${twoDigit()}`);
  suggestions.add(`${noVowels}${twoDigit()}`);
  suggestions.add(`${first}.${last}${twoDigit()}`);
  suggestions.add(`${first}_${year2()}`);
  suggestions.add(`${first}${last.charAt(0)}${year2()}`);

  // Return only 6 clean suggestions
  // return Array.from(suggestions).slice(0, 6);
  // };

    return Array.from(suggestions)
    .slice(0, 3)
    .map((u) => `${u}`);

};
