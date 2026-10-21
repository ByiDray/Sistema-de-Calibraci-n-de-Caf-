import { Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GranosScreen from './src/screens/GranosScreen';
import LotesScreen from './src/screens/LotesScreen';
import LoteDetalleScreen from './src/screens/LoteDetalleScreen';
import EquiposScreen from './src/screens/EquiposScreen';
import CalibracionFormScreen from './src/screens/CalibracionFormScreen';
import LoteFormScreen from './src/screens/LoteFormScreen';

export type RootStackParamList = {
  Equipos: undefined;
  CalibracionForm: { idLote: number };
  LoteForm: { idGrano: number; idLote?: number };
  Granos: undefined;
  Lotes: { idGrano: number; nombre: string };
  LoteDetalle: { idLote: number; codigo: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Granos">
        <Stack.Screen
          name="Granos"
          component={GranosScreen}
          options={({ navigation }) => ({
            title: 'Granos',
            headerRight: () => <Button title="Equipos" onPress={() => navigation.navigate('Equipos')} />,
          })}
        />
        <Stack.Screen name="Lotes" component={LotesScreen} options={({ route }) => ({ title: route.params.nombre })} />
        <Stack.Screen name="LoteDetalle" component={LoteDetalleScreen} options={({ route }) => ({ title: route.params.codigo })} />
        <Stack.Screen
          name="LoteForm"
          component={LoteFormScreen}
          options={({ route }) => ({ title: route.params.idLote ? 'Editar lote' : 'Nuevo lote' })}
        />
        <Stack.Screen name="Equipos"component={EquiposScreen} options={{ title: 'Equipos' }} />
        <Stack.Screen name="CalibracionForm" component={CalibracionFormScreen} options={{ title: 'Nueva calibración' }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
