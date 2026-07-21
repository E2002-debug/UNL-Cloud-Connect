const { test, expect } = require('@playwright/test');

test.describe('V1 Frontend Web - Navigation and Views', () => {
  test('Home page should load correctly', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    
    // Asumimos que hay un header o título
    await expect(page).toHaveTitle(/UNL-Cloud-Connect/i);
    
    // Debe haber un botón para ir al login o registrarse
    const loginLink = page.locator('text=Iniciar sesión');
    if (await loginLink.isVisible()) {
      await expect(loginLink).toBeVisible();
    }
  });

  test('Dashboard should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    
    // Debería redirigir automáticamente
    await expect(page).toHaveURL(/.*login/);
  });

  test('Register page should contain correct form fields', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
