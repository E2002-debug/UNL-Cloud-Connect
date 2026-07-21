import React from 'react';
import { render } from '@testing-library/react-native';
// Mockeando componentes de navegación o pantallas base si existen
import App from '../../../frontend-mobile/App'; 

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() => Promise.resolve({ idToken: 'test_token' })),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  }
}));

describe('V1 Frontend Mobile - Main Navigation', () => {
  it('Should render the App without crashing', () => {
    const { getByText } = render(<App />);
    // Debería empezar en la pantalla de Login (debido al initialRouteName)
    expect(getByText('¡Bienvenido!')).toBeTruthy();
  });
});
