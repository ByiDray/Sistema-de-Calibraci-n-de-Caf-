import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GranosScreen from './src/screens/GranosScreen';
import GranoFormScreen from './src/screens/GranoFormScreen';
import LotesScreen from './src/screens/LotesScreen';
import LoteDetalleScreen from './src/screens/LoteDetalleScreen';
import LoteFormScreen from './src/screens/LoteFormScreen';
import CalibracionFormScreen from './src/screens/CalibracionFormScreen';
import EquiposScreen from './src/screens/EquiposScreen';
import EquipoFormScreen from './src/screens/EquipoFormScreen';
import { ProveedorAvisos } from './src/ui';
import { color } from './src/tema';
import type { CafeStackParamList, EquiposStackParamList, TabsParamList } from './src/navegacion';

const tema: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: color.primario, background: color.fondo, card: color.superficie, text: color.texto, border: color.borde },
};

const cabecera: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: color.fondo },
  headerShadowVisible: false,
  headerTintColor: color.primario,
  headerTitleStyle: { color: color.texto, fontWeight: '700' },
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: color.fondo },
};

const Cafe = createNativeStackNavigator<CafeStackParamList>();
function CafeStack() {
  return (
    <Cafe.Navigator screenOptions={cabecera}>
      <Cafe.Screen name="Granos" component={GranosScreen} options={{ title: 'Mis cafés', headerLargeTitle: true }} />
      <Cafe.Screen name="GranoForm" component={GranoFormScreen}
        options={({ route }) => ({ title: route.params?.idGrano ? 'Editar café' : 'Nuevo café', presentation: 'modal' })} />
      <Cafe.Screen name="Lotes" component={LotesScreen} options={({ route }) => ({ title: route.params.nombre })} />
      <Cafe.Screen name="LoteForm" component={LoteFormScreen}
        options={({ route }) => ({ title: route.params.idLote ? 'Editar lote' : 'Nuevo lote', presentation: 'modal' })} />
      <Cafe.Screen name="LoteDetalle" component={LoteDetalleScreen} options={({ route }) => ({ title: route.params.codigo })} />
      <Cafe.Screen name="CalibracionForm" component={CalibracionFormScreen} options={{ title: 'Nueva calibración' }} />
    </Cafe.Navigator>
  );
}

const Equipos = createNativeStackNavigator<EquiposStackParamList>();
function EquiposStack() {
  return (
    <Equipos.Navigator screenOptions={cabecera}>
      <Equipos.Screen name="Equipos" component={EquiposScreen} options={{ title: 'Equipos', headerLargeTitle: true }} />
      <Equipos.Screen name="EquipoForm" component={EquipoFormScreen}
        options={({ route }) => ({ title: route.params?.idEquipo ? 'Editar equipo' : 'Nuevo equipo', presentation: 'modal' })} />
    </Equipos.Navigator>
  );
}

const Tabs = createBottomTabNavigator<TabsParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <ProveedorAvisos>
        <NavigationContainer theme={tema}>
          <Tabs.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: color.primario,
              tabBarInactiveTintColor: color.textoTenue,
              tabBarStyle: { backgroundColor: color.superficie, borderTopColor: color.borde },
              tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
              tabBarIcon: ({ color: c, focused, size }) => (
                <Ionicons
                  size={size}
                  color={c}
                  name={route.name === 'CafeTab' ? (focused ? 'cafe' : 'cafe-outline') : (focused ? 'construct' : 'construct-outline')}
                />
              ),
            })}
          >
            <Tabs.Screen name="CafeTab" component={CafeStack} options={{ title: 'Cafés' }} />
            <Tabs.Screen name="EquiposTab" component={EquiposStack} options={{ title: 'Equipos' }} />
          </Tabs.Navigator>
        </NavigationContainer>
        <StatusBar style="dark" />
      </ProveedorAvisos>
    </SafeAreaProvider>
  );
}
