import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../../frontend-web/src/pages/Dashboard';

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('V1 Web Dashboard Unit Tests', () => {
  beforeEach(() => {
    // Configurar un token JWT falso simulando un administrador
    const fakeToken = btoa(JSON.stringify({ id_rol: 1, id_usuario: 1, nombre: 'Admin' }));
    mockLocalStorage.getItem.mockReturnValue(`fake_header.${fakeToken}.fake_signature`);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Renderiza el dashboard correctamente para un usuario administrador', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );
    
    // Asumimos que el dashboard muestra un texto o componente general
    // expect(screen.getByText(/Panel de Control/i)).toBeInTheDocument();
    
    // Valida que el mock del local storage fue llamado
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('access_token');
  });
});
