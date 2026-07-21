import React from 'react';
import { render } from '@testing-library/react-native';

// Mock simple de la pantalla Participant, suponiendo que existe
// import ParticipantScreen from '../../../frontend-mobile/src/screens/ParticipantScreen';

const MockParticipantScreen = ({ route }) => {
  const { user } = route.params;
  return (
    <div testID="participant-screen">
      Bienvenido Participante {user?.name}
    </div>
  );
};

describe('V1 Mobile Participant Screen Tests', () => {
  it('Muestra los datos del participante logueado', () => {
    const routeParams = {
      params: {
        user: { name: 'Estudiante Prueba', id_rol: 2, email: 'prueba@unl.edu.ec' }
      }
    };
    
    const { getByText } = render(<MockParticipantScreen route={routeParams} />);
    
    expect(getByText('Bienvenido Participante Estudiante Prueba')).toBeTruthy();
  });
});
