const GUEST_ID_KEY = "guestId";

export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch (e) {
    console.error("Failed to access localStorage for guestId:", e);
    return `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}
