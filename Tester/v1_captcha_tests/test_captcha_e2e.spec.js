const { test, expect } = require('@playwright/test');

test.describe('V1 CAPTCHA Login Tests', () => {
  test('Should not login if CAPTCHA is empty', async ({ page }) => {
    // Simulamos la URL del web frontend
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[placeholder="usuario.apellido@unl.edu.ec"]', 'test.user@unl.edu.ec');
    await page.fill('input[placeholder="••••••••"]', 'password123');
    
    // No llenamos el captcha
    await page.click('button[type="submit"]');
    
    // Verificamos que aparezca el mensaje de error del captcha
    const toastMessage = await page.locator('text=Por favor, complete todos los campos, incluido el CAPTCHA.');
    await expect(toastMessage).toBeVisible();
  });

  test('Should not login if CAPTCHA is wrong', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    await page.fill('input[placeholder="usuario.apellido@unl.edu.ec"]', 'test.user@unl.edu.ec');
    await page.fill('input[placeholder="••••••••"]', 'password123');
    
    // Llenamos el captcha incorrectamente
    await page.fill('input[placeholder="Respuesta"]', '999');
    
    await page.click('button[type="submit"]');
    
    const toastMessage = await page.locator('text=El CAPTCHA es incorrecto.');
    await expect(toastMessage).toBeVisible();
  });
});
