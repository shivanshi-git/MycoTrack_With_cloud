// Mock auth service — no Firebase required.
// Accepts any email/password combination.

let currentUser = null;
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb(currentUser));

export const loginUser = async (email, password) => {
  // Accept any non-empty email + password — no validation against a DB
  currentUser = { email, uid: "mock-uid-" + Math.random().toString(36).slice(2) };
  notify();
  return currentUser;
};

export const registerUser = async (email, password) => {
  // Same as login — just set the user
  currentUser = { email, uid: "mock-uid-" + Math.random().toString(36).slice(2) };
  notify();
  return currentUser;
};

export const logoutUser = async () => {
  currentUser = null;
  notify();
};

export const subscribeToAuthChanges = (callback) => {
  listeners.add(callback);
  // Fire immediately with current state
  callback(currentUser);
  // Return unsubscribe function
  return () => listeners.delete(callback);
};