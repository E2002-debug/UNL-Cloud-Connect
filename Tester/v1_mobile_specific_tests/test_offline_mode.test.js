import React from 'react';
import { render } from '@testing-library/react-native';
// Mockeando hook de red o estado offline (ejemplo con NetInfo)
import { useNetInfo } from '@react-native-community/netinfo';
// import { Text } from 'react-native';

// Suponiendo un componente que renderiza un aviso si no hay internet
const OfflineAlert = () => {
  const { isConnected } = useNetInfo();
  if (!isConnected) return <div>Modo Offline: Datos Cacheados</div>;
  return null;
};

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: jest.fn(),
}));

describe('Pruebas Específicas para Móviles (Offline / Interrupciones)', () => {
  it('Debe mostrar alerta de Modo Offline cuando no hay conexión', () => {
    // 1. Simulamos que el dispositivo perdió conexión (Modo Avión / Sin WiFi)
    useNetInfo.mockReturnValue({ isConnected: false });
    
    const { getByText } = render(<OfflineAlert />);
    expect(getByText('Modo Offline: Datos Cacheados')).toBeTruthy();
  });
  
  it('No debe mostrar alerta cuando hay conexión', () => {
    // 1. Simulamos que el dispositivo recuperó conexión
    useNetInfo.mockReturnValue({ isConnected: true });
    
    const { queryByText } = render(<OfflineAlert />);
    expect(queryByText('Modo Offline: Datos Cacheados')).toBeNull();
  });
});
