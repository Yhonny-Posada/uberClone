// src/constants/config.js
/**
 * General application configuration
 * Aligned with the provided information
 */

export const APP_CONFIG = {
  // Basic application data
  appName: "My Application",
  version: "1.0.0",
  environment: process.env.NODE_ENV || "development",

  // Valid routes (only existing and defined ones)
  routes: {
    home: "/",
    controlPanel: "/control-panel",
    userManagement: "/user-management",
    systemSettings: "/system-settings"
  },

  // Other defined parameters
  limits: {
    recordsPerPage: 20,
    maxNameLength: 50
  }
};