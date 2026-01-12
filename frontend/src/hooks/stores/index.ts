/**
 * 统一的 Store 导出
 *
 * 这个文件重新导出所有的 Store 和选择器 hooks
 * 使得组件可以方便地导入需要的状态
 */

// ========== Store 导出 ==========

// Form Store
export {
  useFormStore,
  useText,
  useVoiceSettings,
  useParameterSettings,
  useFormActions,
} from './formStore';

// Audio Store
export {
  useAudioStore,
  useAudioUrl,
  useCurrentPlayingId,
  useAudioState,
  useIsPlaying,
  useAudioActions,
} from './audioStore';

// UI Store
export {
  useUIStore,
  useIsLoading,
  useError,
  useModalStates,
  useLanguageState,
  useFavoriteVoices,
  useUIActions,
} from './uiStore';

// Data Store
export {
  useDataStore,
  useVoices,
  useStyles,
  useConfig,
  useHistory,
  useInitState,
  useHistoryActions,
  useDataActions,
} from './dataStore';

// ========== 类型导出 ==========

export type { FormState } from './formStore';
export type { AudioStateStore } from './audioStore';
export type { UIState } from './uiStore';
export type { DataState } from './dataStore';
