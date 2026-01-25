# 声音库增强功能建议

## 🎯 增强功能清单

### 1. 骨架屏加载状态

**目标**: 在声音列表加载时提供更好的视觉反馈

**实现方案**:
```tsx
// components/voice/VoiceLibrarySkeleton.tsx
export const VoiceLibrarySkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="h-4 bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-6 bg-gray-700 rounded w-12 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-700 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-700 rounded-lg flex-1 animate-pulse"></div>
            <div className="h-8 bg-gray-700 rounded-lg flex-1 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

**使用方式**:
```tsx
{isLoading && filteredVoices.length === 0 ? (
  <VoiceLibrarySkeleton />
) : (
  // 声音列表
)}
```

**优先级**: ⭐⭐⭐⭐⭐ 高
**预计工作量**: 2小时

---

### 2. 声音预览波形动画

**目标**: 在试听声音时显示动态波形效果

**实现方案**:
```tsx
// components/audio/VoiceWaveform.tsx
export const VoiceWaveform = ({ isPlaying }: { isPlaying: boolean }) => {
  return (
    <div className="flex items-center justify-center gap-0.5 h-8">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className={`w-1 bg-green-400 rounded-full transition-all duration-150 ${
            isPlaying ? 'animate-waveform' : 'h-2'
          }`}
          style={{
            animationDelay: `${i * 50}ms`,
            height: isPlaying ? `${Math.random() * 100}%` : '8px'
          }}
        />
      ))}
    </div>
  );
};

// CSS
@keyframes waveform {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}
```

**使用方式**:
```tsx
<button
  onClick={() => previewVoice(voice.id)}
  className="relative"
>
  {isPreviewing[voice.id] && <VoiceWaveform isPlaying={true} />}
  {/* play icon */}
</button>
```

**优先级**: ⭐⭐⭐⭐ 中高
**预计工作量**: 4小时

---

### 3. 收藏动画效果

**目标**: 添加收藏时的星星爆炸动画

**实现方案**:
```tsx
// components/ui/StarAnimation.tsx
export const StarAnimation = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * 360;
        const distance = 30;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;

        return (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full animate-star-explode"
            style={{
              '--tx': `${x}px`,
              '--ty': `${y}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

// CSS
@keyframes star-explode {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0);
    opacity: 0;
  }
}
```

**优先级**: ⭐⭐⭐ 中
**预计工作量**: 3小时

---

### 4. 搜索防抖优化

**目标**: 优化搜索输入性能，减少不必要的筛选

**实现方案**:
```tsx
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const VoiceLibrary = () => {
  const [searchInput, setSearchInput] = useState('');
  const searchTerm = useDebouncedValue(searchInput, 300);

  useEffect(() => {
    filterVoices();
  }, [searchTerm, selectedGender, showFavoritesOnly, favoriteVoiceIds]);

  return (
    <Input
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      // ...
    />
  );
};

// hooks/useDebouncedValue.ts
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
```

**优先级**: ⭐⭐⭐⭐⭐ 高
**预计工作量**: 1小时

---

### 5. 虚拟滚动

**目标**: 当声音列表很长时，优化渲染性能

**实现方案**:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const VoiceLibrary = () => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredVoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240, // 卡片高度
    overscan: 4,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const voice = filteredVoices[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <VoiceCard voice={voice} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

**优先级**: ⭐⭐ 低 (仅在声音数量超过100时需要)
**预计工作量**: 6小时

---

### 6. 声音分组显示

**目标**: 按语言或区域分组显示声音

**实现方案**:
```tsx
// 按区域分组
const groupedVoices = useMemo(() => {
  const groups = new Map<string, Voice[]>();

  filteredVoices.forEach(voice => {
    const locale = voice.locale_name || voice.locale;
    if (!groups.has(locale)) {
      groups.set(locale, []);
    }
    groups.get(locale)!.push(voice);
  });

  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}, [filteredVoices]);

return (
  <div>
    {groupedVoices.map(([locale, voices]) => (
      <div key={locale} className="mb-6">
        <h3 className="text-lg font-semibold text-gray-100 font-mono mb-3">
          {locale}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {voices.map(voice => (
            <VoiceCard key={voice.id} voice={voice} />
          ))}
        </div>
      </div>
    ))}
  </div>
);
```

**优先级**: ⭐⭐⭐ 中
**预计工作量**: 4小时

---

### 7. 高级筛选器

**目标**: 支持更多筛选条件（采样率、风格、年龄等）

**实现方案**:
```tsx
interface AdvancedFilters {
  sampleRates: number[];
  styles: string[];
  hasStyles: boolean;
}

const VoiceLibrary = () => {
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    sampleRates: [],
    styles: [],
    hasStyles: false,
  });

  const applyFilters = (voice: Voice) => {
    // 采样率筛选
    if (advancedFilters.sampleRates.length > 0) {
      if (!voice.sample_rate_hertz ||
          !advancedFilters.sampleRates.includes(voice.sample_rate_hertz)) {
        return false;
      }
    }

    // 风格筛选
    if (advancedFilters.styles.length > 0) {
      const voiceStyles = voice.style_list || voice.styles || [];
      if (!advancedFilters.styles.some(s => voiceStyles.includes(s))) {
        return false;
      }
    }

    // 是否有风格筛选
    if (advancedFilters.hasStyles) {
      const voiceStyles = voice.style_list || voice.styles || [];
      if (voiceStyles.length === 0) return false;
    }

    return true;
  };

  return (
    <>
      <AdvancedFilterPanel
        filters={advancedFilters}
        onChange={setAdvancedFilters}
      />
      {/* 声音列表 */}
    </>
  );
};
```

**优先级**: ⭐⭐ 低
**预计工作量**: 8小时

---

### 8. 批量操作

**目标**: 支持批量收藏、导出等操作

**实现方案**:
```tsx
const VoiceLibrary = () => {
  const [selectedVoices, setSelectedVoices] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  const toggleSelect = (voiceId: string) => {
    const newSelected = new Set(selectedVoices);
    if (newSelected.has(voiceId)) {
      newSelected.delete(voiceId);
    } else {
      newSelected.add(voiceId);
    }
    setSelectedVoices(newSelected);
  };

  const bulkFavorite = () => {
    selectedVoices.forEach(voiceId => {
      const voice = voices.find(v => v.id === voiceId);
      if (voice) {
        FavoritesService.toggleFavorite(voice);
      }
    });
    setSelectedVoices(new Set());
    setIsBulkMode(false);
  };

  return (
    <>
      {isBulkMode && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            已选择 {selectedVoices.size} 个声音
          </span>
          <div className="flex gap-2">
            <Button onClick={bulkFavorite} disabled={selectedVoices.size === 0}>
              批量收藏
            </Button>
            <Button variant="ghost" onClick={() => setIsBulkMode(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      {filteredVoices.map(voice => (
        <VoiceCard
          key={voice.id}
          voice={voice}
          selectable={isBulkMode}
          selected={selectedVoices.has(voice.id)}
          onSelect={() => toggleSelect(voice.id)}
        />
      ))}
    </>
  );
};
```

**优先级**: ⭐⭐ 低
**预计工作量**: 6小时

---

### 9. 声音对比功能

**目标**: 选择多个声音进行对比试听

**实现方案**:
```tsx
interface VoiceComparison {
  voices: Voice[];
  text: string;
}

const VoiceComparisonModal = ({ comparison, onClose }: {
  comparison: VoiceComparison;
  onClose: () => void;
}) => {
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  const playVoice = async (voice: Voice) => {
    setCurrentPlayingId(voice.id);
    // 播放逻辑...
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-70
                flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">
          声音对比
        </h2>

        <Textarea
          value={comparison.text}
          readOnly
          rows={4}
          className="mb-4 bg-gray-800 text-gray-100 border-gray-700"
        />

        <div className="space-y-3">
          {comparison.voices.map(voice => (
            <div
              key={voice.id}
              className={`flex items-center justify-between p-3 rounded-lg border-2
                          ${currentPlayingId === voice.id
                            ? 'border-green-500 bg-green-500/10'
                            : 'border-gray-700 bg-gray-800'}`}
            >
              <div className="flex-1">
                <div className="font-semibold text-gray-100">
                  {voice.local_name || voice.name}
                </div>
                <div className="text-sm text-gray-400">
                  {voice.locale_name || voice.locale}
                </div>
              </div>

              <Button
                onClick={() => playVoice(voice)}
                variant={currentPlayingId === voice.id ? "primary" : "ghost"}
              >
                {currentPlayingId === voice.id ? "播放中" : "试听"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
};
```

**优先级**: ⭐⭐⭐ 中
**预计工作量**: 8小时

---

### 10. 自定义主题

**目标**: 支持用户自定义颜色主题

**实现方案**:
```tsx
// types/theme.ts
interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
}

// hooks/useTheme.ts
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('voice-library-theme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  useEffect(() => {
    localStorage.setItem('voice-library-theme', JSON.stringify(theme));
    document.documentElement.style.setProperty('--primary-color', theme.colors.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.colors.secondary);
    // ...
  }, [theme]);

  return { theme, setTheme };
};

// components/theme/ThemeCustomizer.tsx
export const ThemeCustomizer = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">主题自定义</h3>

      <div>
        <label className="block text-sm text-gray-400 mb-2">主色调</label>
        <input
          type="color"
          value={theme.colors.primary}
          onChange={(e) => setTheme({
            ...theme,
            colors: { ...theme.colors, primary: e.target.value }
          })}
          className="w-full h-10 rounded cursor-pointer"
        />
      </div>

      {/* 其他颜色选择器 */}
    </div>
  );
};
```

**优先级**: ⭐ 低
**预计工作量**: 12小时

---

## 📊 优先级总结

### 立即实施 (⭐⭐⭐⭐⭐)
1. 搜索防抖优化
2. 骨架屏加载状态

### 短期实施 (⭐⭐⭐⭐)
3. 声音预览波形动画

### 中期实施 (⭐⭐⭐)
4. 收藏动画效果
5. 声音分组显示
6. 声音对比功能

### 长期考虑 (⭐⭐)
7. 高级筛选器
8. 批量操作

### 可选功能 (⭐)
9. 虚拟滚动
10. 自定义主题

---

**建议总工作量**: 约54小时（约7个工作日）

**建议实施顺序**:
1. 第1天: 搜索防抖 + 骨架屏
2. 第2天: 波形动画
3. 第3天: 收藏动画 + 声音分组
4. 第4-5天: 声音对比功能
5. 第6-7天: 其他功能按需实施

---

**文档创建时间**: 2026-01-26
**维护者**: TTS Studio 团队
