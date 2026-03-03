const SPECIAL_CHARACTERS = "!@#$%^&*_-+=?";
const DICTIONARY_WORDS = [
  "about", "after", "again", "apple", "admin", "august", "before", "button",
  "change", "default", "dragon", "freedom", "google", "hello", "january",
  "july", "june", "login", "manager", "monday", "november", "october",
  "orange", "password", "people", "qwerty", "sample", "secret", "september",
  "summer", "spring", "system", "thursday", "welcome", "winter", "mypass",
  "service", "secure", "sunday", "saturday", "friday"
];

const SEQUENCES = [
  "abcdefghijklmnopqrstuvwxyz",
  "zyxwvutsrqponmlkjihgfedcba",
  "0123456789",
  "9876543210",
  "qwertyuiop", "poiuytrewq",
  "asdfghjkl", "lkjhgfdsa",
  "zxcvbnm", "mnbvcxz"
];

export const PASSWORD_POLICY_POINTS = [
  "Minimum 16 characters",
  "At least 2 uppercase letters (A-Z)",
  "At least 2 lowercase letters (a-z)",
  "At least 2 numbers (0-9)",
  "At least 2 special characters (! @ # $ % ^ & * _ - + = ?)",
  "Must not include your username or email id",
  "No more than 2 identical characters in a row (e.g., aaa, 111)",
  "Must not include sequences like abcd, 1234, qwerty",
  "Must not include dictionary words longer than 4 letters",
  "Must not match your last 5 passwords"
];

const normalize = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const containsSequence = (password) => {
  const value = password.toLowerCase();
  for (let i = 0; i <= value.length - 4; i += 1) {
    const part = value.slice(i, i + 4);
    if (/^[a-z]{4}$/.test(part) || /^[0-9]{4}$/.test(part)) {
      let asc = true;
      let desc = true;
      for (let j = 1; j < part.length; j += 1) {
        const diff = part.charCodeAt(j) - part.charCodeAt(j - 1);
        asc = asc && diff === 1;
        desc = desc && diff === -1;
      }
      if (asc || desc) {
        return true;
      }
    }
    if (SEQUENCES.some((seq) => seq.includes(part))) {
      return true;
    }
  }
  return false;
};

const getIdentityTokens = ({ firstName = "", lastName = "", email = "" }) => {
  const tokens = [];
  const pushToken = (value) => {
    const clean = normalize(value);
    if (clean) {
      tokens.push(clean);
    }
  };

  pushToken(firstName);
  pushToken(lastName);
  const localPart = email.toLowerCase().split("@")[0] || "";
  pushToken(localPart);
  localPart.split(/[^a-z0-9]+/).forEach(pushToken);
  return tokens.filter((token) => token.length >= 3);
};

export const validatePasswordPolicy = ({ password, firstName = "", lastName = "", email = "" }) => {
  if (!password || password.length < 16) {
    return "Password must be at least 16 characters long.";
  }

  const chars = [...password];
  const uppercase = chars.filter((ch) => /[A-Z]/.test(ch)).length;
  const lowercase = chars.filter((ch) => /[a-z]/.test(ch)).length;
  const digits = chars.filter((ch) => /[0-9]/.test(ch)).length;
  const specials = chars.filter((ch) => SPECIAL_CHARACTERS.includes(ch)).length;

  if (uppercase < 2 || lowercase < 2 || digits < 2 || specials < 2) {
    return "Password must include at least 2 uppercase, 2 lowercase, 2 numbers, and 2 special characters.";
  }

  if (/(.)\1\1/.test(password)) {
    return "Password cannot contain more than 2 identical consecutive characters.";
  }

  const normalizedPassword = normalize(password);
  const identityTokens = getIdentityTokens({ firstName, lastName, email });
  if (identityTokens.some((token) => normalizedPassword.includes(token))) {
    return "Password must not include your username or email id.";
  }

  if (containsSequence(password)) {
    return "Password must not contain sequential patterns like abcd, 1234, or qwerty.";
  }

  if (DICTIONARY_WORDS.some((word) => word.length > 4 && normalizedPassword.includes(word))) {
    return "Password must not contain dictionary words longer than four characters.";
  }

  return "";
};
