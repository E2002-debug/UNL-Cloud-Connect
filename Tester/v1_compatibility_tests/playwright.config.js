// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '../v1_ui_usability_tests',
  fullyParallel: true,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  // PRUEBAS DE COMPATIBILIDAD DE NAVEGADORES
  projects: [
    {
      name: 'chromium', // Chrome, Edge
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox', // Firefox
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit', // Safari / iOS
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome', // Android
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari', // iPhone
      use: { ...devices['iPhone 12'] },
    },
  ],
});
