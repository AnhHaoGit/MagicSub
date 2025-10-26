import { languages } from "@/lib/languages";

export const formatLanguage = (value) => {
  const lang = languages.find((l) => l.value === value);
  return lang ? lang.label : value;
};
