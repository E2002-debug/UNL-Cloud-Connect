const { test, expect } = require('@playwright/test');

test.describe('UI, Usabilidad y Compatibilidad Responsiva', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // Simular iPhone X

  test('La vista móvil del Login web debe adaptarse correctamente', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // El contenedor de autenticación debe estar visible en móviles
    const authContainer = page.locator('.auth-container');
    await expect(authContainer).toBeVisible();
    
    // Validar que los campos de entrada encajan en la pantalla
    const emailInput = page.locator('input[type="text"]').first();
    const box = await emailInput.boundingBox();
    expect(box.width).toBeLessThanOrEqual(375);
  });

  test.use({ viewport: { width: 1024, height: 768 } }); // Simular Tablet (iPad)
  
  test('La vista tablet debe mostrar elementos lado a lado si está configurado', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    const authLeft = page.locator('.auth-left');
    await expect(authLeft).toBeVisible();
  });
});
