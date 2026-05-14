const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"] as const;

export function toBanglaNumber(value: number | string): string {
  return String(value).replace(/\d/g, (d) => banglaDigits[Number(d)]);
}

const fallbackBanglaMonths = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
] as const;

export function getBanglaMonthName(date: Date = new Date()): string {
  try {
    const month = new Intl.DateTimeFormat("bn-BD", { month: "long" }).format(
      date
    );
    return month;
  } catch {
    return fallbackBanglaMonths[date.getMonth()] ?? "মাস";
  }
}

export function getBookFairLabel(options?: { year?: number; date?: Date }): string {
  const date = options?.date ?? new Date();
  const year = options?.year ?? date.getFullYear();
  return `বইমেলা ${toBanglaNumber(year)}`;
}
