import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../../../frontend-mobile/src/screens/LoginScreen';

describe('V1 CAPTCHA Login Mobile Tests', () => {
  it('Should show error if CAPTCHA is empty', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={{}} />);
    
    const emailInput = getByPlaceholderText('usuario.apellido@unl.edu.ec');
    const passwordInput = getByPlaceholderText('••••••••');
    
    fireEvent.changeText(emailInput, 'test.user@unl.edu.ec');
    fireEvent.changeText(passwordInput, 'password123');
    
    const loginButton = getByText('Iniciar sesión');
    fireEvent.press(loginButton);
    
    expect(getByText('Por favor, completa todos los campos, incluido el CAPTCHA.')).toBeTruthy();
  });

  it('Should show error if CAPTCHA is wrong', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen navigation={{}} />);
    
    const emailInput = getByPlaceholderText('usuario.apellido@unl.edu.ec');
    const passwordInput = getByPlaceholderText('••••••••');
    const captchaInput = getByPlaceholderText('Respuesta');
    
    fireEvent.changeText(emailInput, 'test.user@unl.edu.ec');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(captchaInput, '999');
    
    const loginButton = getByText('Iniciar sesión');
    fireEvent.press(loginButton);
    
    expect(getByText('El CAPTCHA es incorrecto.')).toBeTruthy();
  });
});
