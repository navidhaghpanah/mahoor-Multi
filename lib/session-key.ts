// Single source of truth for the localStorage key holding the signed session
// token, shared between ClientAppRouter (writes it on login) and lib/listings.ts
// (reads it to attach Authorization headers on mutating API calls).
export const SESSION_KEY = "mahoor_session";
