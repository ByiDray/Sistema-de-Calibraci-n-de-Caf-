import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type CafeStackParamList = {
  Granos: undefined;
  GranoForm: { idGrano?: number };
  Lotes: { idGrano: number; nombre: string };
  LoteForm: { idGrano: number; idLote?: number };
  LoteDetalle: { idLote: number; codigo: string };
  CalibracionForm: { idLote: number; codigo?: string };
};

export type EquiposStackParamList = {
  Equipos: undefined;
  EquipoForm: { idEquipo?: number; tipo?: 'molino' | 'maquina' };
};

export type TabsParamList = {
  CafeTab: NavigatorScreenParams<CafeStackParamList>;
  EquiposTab: NavigatorScreenParams<EquiposStackParamList>;
};

export type CafeProps<R extends keyof CafeStackParamList> = NativeStackScreenProps<CafeStackParamList, R>;
export type EquiposProps<R extends keyof EquiposStackParamList> = NativeStackScreenProps<EquiposStackParamList, R>;
