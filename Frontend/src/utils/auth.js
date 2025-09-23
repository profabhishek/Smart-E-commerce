export function getCartOwnerId() {
  const userId = localStorage.getItem("user_id");
  if (userId) return userId;

  let guestId = localStorage.getItem("guest_id");
  if (!guestId) {
    guestId = "guest-" + crypto.randomUUID();  // unique id
    localStorage.setItem("guest_id", guestId);
  }
  return guestId;
}