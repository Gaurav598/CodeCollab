"use client";

import { useEffect } from "react";
import { serviceConfig } from "@/services/config";

export function ServerPing() {
  useEffect(() => {
    // Ping the backend's health endpoint to wake up the Render Free Tier instance
    // We use mode: 'no-cors' so we don't care about the response, we just want to send the request
    fetch(`${serviceConfig.apiBaseUrl}/health`, { method: "GET", mode: "no-cors" })
      .catch(() => {
        // Silently catch errors so it doesn't pollute the console
      });
  }, []);

  return null;
}
