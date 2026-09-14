import axios from "axios";

// Deliberately a separate, minimal axios instance rather than the shared
// `api` in ./api.js - the public enquiry form is never logged in, so it has
// no JWT to attach and none of api.js's 401-session-expiry redirect logic
// applies to it. Keeping it separate also guarantees a stray token sitting
// in localStorage (e.g. an admin testing the public form in the same
// browser) is never sent to this unauthenticated endpoint.
const REQUEST_TIMEOUT_MS = 30000;

const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
    timeout: REQUEST_TIMEOUT_MS
});

export const getPublicIndustries = async () => {
    const response = await publicApi.get("/public/industries");
    return response.data;
};

export const getPublicProducts = async () => {
    const response = await publicApi.get("/public/products");
    return response.data;
};

export const getPublicBatteries = async () => {
    const response = await publicApi.get("/public/batteries");
    return response.data;
};

export const submitPublicLead = async (payload) => {
    const response = await publicApi.post("/public/leads", payload);
    return response.data;
};

export default publicApi;
