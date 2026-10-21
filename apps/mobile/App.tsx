import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GranosScreen from './src/screens/GranosScreen';
import LotesScreen from './src/screens/LotesScreen';
import LoteDetalleScreen from './src/screens/LoteDetalleScreen';

export type RootStackParamList = {
  Granos: undefined;
  Lotes: { idGrano: number; nombre: string };
  LoteDetalle: { idLote: number; codigo: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Granos">
        <Stack.Screen name="Granos" component={GranosScreen} options={{ title: 'Granos' }} />
        <Stack.Screen name="Lotes" component={LotesScreen} options={({ route }) => ({ title: route.params.nombre })} />
        <Stack.Screen name="LoteDetalle" component={LoteDetalleScreen} options={({ route }) => ({ title: route.params.codigo })} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
