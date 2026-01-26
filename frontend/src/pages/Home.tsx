import React, {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
// ============================================================
// 📦 Store 导入 - 选择使用新旧版本
// ============================================================
// 选项 1: 使用新版本的组合 Hook（推荐，性能优化）
// import {useTTSStoreV2 as useTTSStore} from '../hooks/useTTSStoreV2';

// 选项 2: 使用旧版本（当前默认）
import {useTTSStore} from '../hooks/useTTSStore';
//
// 💡 切换方式：只需注释/取消注释对应的导入行即可
//    新版本提供相同的接口，但底层使用拆分的 Store，性能更好
// ============================================================

import {TTSApiService} from '../services/api';
import {FavoritesService} from '../services/favorites';
import type {HistoryItem, FavoriteVoiceItem} from '../types/index';
import {COMMON_LANGUAGES} from '../types/index';
import {Button} from '../components/ui/Button';
import {Textarea} from '../components/ui/Textarea';
import {Select} from '../components/ui/Select';
import {Slider} from '../components/ui/Slider';
import {Alert} from '../components/ui/Alert';
import {
  VoiceSelectorSkeleton,
  ParameterControlsSkeleton,
  TextSkeleton,
} from '../components/ui/Skeleton';
import {HistoryList} from '../components/audio/HistoryList';
import {UnifiedAudioPlayer} from '../components/audio/UnifiedAudioPlayer';
import { Navbar } from '../components/layout/Navbar';
import { showSuccess, showInfo, showWarning, showError } from '../components/ui/Toast';

const Home: React.FC = () => {
    const {
        text,
        voice,
        style,
        rate,
        pitch,
        locale,
        isLoading,
        error,
        voices,
        config,
        history,
        currentPlayingId,
        audioUrl,
        initializeApp,
        setText,
        setVoice,
        setStyle,
        setRate,
        setPitch,
        setLocale,
        setError,
        clearError,
        setLoading,
        generateSpeech,
        downloadHistoryAudio,
        removeFromHistory,
        clearHistory,
        addToHistory,
        setCurrentPlayingId,
        playHistoryItem,
        setAudioUrl,
    } = useTTSStore();

    // 二级联动状态
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [languageMap, setLanguageMap] = useState<Map<string, any[]>>(new Map());

    // 侧边栏状态
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // 自动播放标志 - 在生成新音频时设置为 true
    const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

    // 优化：移除useCallback避免依赖问题，initializeApp本身就很稳定
    // 直接使用useEffect调用，避免不必要的重新渲染
    useEffect(() => {
        initializeApp();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 空依赖数组，只在组件挂载时执行一次（initializeApp内部已有防重复机制）

    // 监听从模板页面返回时的自动填充
    useEffect(() => {
        const selectedTemplate = sessionStorage.getItem('selected_template');
        if (selectedTemplate) {
            setText(selectedTemplate);
            sessionStorage.removeItem('selected_template');
        }
    }, []);

    const handleGenerateSpeech = async () => {
        setShouldAutoPlay(true);
        await generateSpeech();
    };

    // 监听快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            // Ctrl+E / Cmd+E: 聚焦文本输入框
            if (isCtrlOrCmd && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                const textarea = document.getElementById('text-input');
                if (textarea) {
                    textarea.focus();
                }
            }

            // Ctrl+Enter / Cmd+Enter: 生成语音
            if (isCtrlOrCmd && e.key === 'Enter') {
                // 只有当不在 loading 状态，且有文本和声音时才触发
                if (!isLoading && text.trim() && voice) {
                    e.preventDefault();
                    handleGenerateSpeech();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, text, voice]); // 移除了 handleGenerateSpeech 依赖，因为它是组件内定义的

    const handleImportReader = async () => {
        if (!voice) {
            setError('请先选择声音');
            return;
        }

        try {
            setError(null);

            // 获取当前声音的显示名称
            const currentVoice = voices.find(v => v.id === voice);
            const displayName = currentVoice ? (currentVoice.local_name || currentVoice.display_name || currentVoice.name) : 'TTS语音';

            // 构造请求参数，与TTS参数相同
            const params = new URLSearchParams();
            params.append('n', displayName);
            params.append('voice', voice);
            if (style) params.append('style', style);
            params.append('rate', rate);
            params.append('pitch', pitch);

            const apiKey = localStorage.getItem('tts_api_key');
            if (apiKey) {
                params.append('api_key', apiKey);
            }

            // 构造完整的请求URL
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/api/v1/reader.json?${params.toString()}`;

            // 使用安全的复制方法
            await safeCopyToClipboard(url, '导入阅读链接已复制到剪贴板');

        } catch (error) {
            setError('复制到剪贴板失败');
        }
    };

    const handleImportIfreetime = async () => {
        if (!voice || !text.trim()) {
            setError('请先选择声音并输入文本');
            return;
        }

        try {
            setError(null);

            // 获取当前声音的显示名称
            const currentVoice = voices.find(v => v.id === voice);
            const displayName = currentVoice ? (currentVoice.local_name || currentVoice.display_name || currentVoice.name) : 'TTS语音';

            // 构造请求参数，与TTS参数相同
            const params = new URLSearchParams();
            params.append('n', displayName);
            params.append('voice', voice);
            if (style) params.append('style', style);
            params.append('rate', rate);
            params.append('pitch', pitch);

            const apiKey = localStorage.getItem('tts_api_key');
            if (apiKey) {
                params.append('api_key', apiKey);
            }

            // 构造完整的请求URL
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/api/v1/ifreetime.json?${params.toString()}`;

            // 使用安全的复制方法
            await safeCopyToClipboard(url, '导入爱阅记链接已复制到剪贴板');

        } catch (error) {
            setError('复制到剪贴板失败');
        }
    };

    const handleRegenerateHistoryItem = async (item: HistoryItem) => {

        try {
            setLoading(true);
            setError(null);

            // 使用历史记录的参数重新生成音频
            const audioBlob = await TTSApiService.regenerateSpeech(item);
            const audioUrl = URL.createObjectURL(audioBlob);

            // 创建更新后的历史记录项
            const updatedItem = {
                ...item,
                audioUrl,
                createdAt: new Date()
            };

            // 移除旧的记录并添加新的记录
            removeFromHistory(item.id);
            addToHistory(updatedItem);

        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to regenerate speech');
        } finally {
            setLoading(false);
        }
    };

  
    const handleLoadToForm = (item: HistoryItem) => {
        // 将历史记录的数据填充到表单中
        setText(item.text);
        setStyle(item.style || '');
        setRate(item.rate);
        setPitch(item.pitch);

        // 先设置locale，再设置voice，这样声音回显逻辑可以正确触发
        setLocale(item.locale);

        // 稍微延迟设置voice，确保locale和语言映射已经准备好
        setTimeout(() => {
            setVoice(item.voice);
        }, 100);

        // 清除之前的错误状态
        clearError();

        // 清空播放器状态（音频URL和当前播放ID）
        setAudioUrl(null);
        setCurrentPlayingId(null);

        // 可选：滚动到页面顶部，让用户看到填充的表单
        window.scrollTo({top: 0, behavior: 'smooth'});

        console.log(`从历史记录加载: voice=${item.voice}, locale=${item.locale}`);
    };


    // 处理语言选择（第一级）
    const handleLanguageChange = (languageName: string) => {
        setSelectedLanguage(languageName);

        // 保存当前选择到localStorage
        localStorage.setItem('tts_current_language', languageName);

        // 检查该语言是否只有一个区域
        const regions = languageMap.get(languageName);
        if (regions && regions.length === 1) {
            // 如果只有一个区域，自动选中它
            const singleLocale = regions[0].locale;
            setLocale(singleLocale);
            setVoice(''); // 清空声音选择
            setStyle(''); // 清空风格选择
            localStorage.setItem('tts_current_locale', singleLocale);
        } else {
            // 如果有多个区域，清空locale让用户选择
            setLocale('');
            setVoice(''); // 清空声音选择
            setStyle(''); // 清空风格选择
            localStorage.removeItem('tts_current_locale');
        }
    };

    // 处理区域选择（第二级）
    const handleRegionChange = (regionLocale: string) => {
        setLocale(regionLocale);
        setVoice(''); // 清空声音选择，让用户重新选择
        setStyle(''); // 清空风格选择
        localStorage.setItem('tts_current_locale', regionLocale);
    };

    // 点击历史记录项播放音频
    const handlePlayHistoryItem = async (item: HistoryItem) => {
        try {
            // 调用store的playHistoryItem方法，加载数据到表单
            playHistoryItem(item);

            // 自动生成新的音频
            await generateSpeech();
        } catch (error) {
            console.error('播放历史记录失败:', error);
            showError(`生成音频失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    };

    // 重新生成历史记录音频功能已移除

    // 处理外部locale变化（如从声音库返回）
    const handleLocaleChange = (newLocale: string) => {
        setLocale(newLocale);
        setVoice(''); // 清空声音选择，让用户重新选择
        setStyle(''); // 清空风格选择
    };

    const handleVoiceChange = (newVoice: string) => {
        setVoice(newVoice);

        // 检查当前选择的风格是否在新声音的风格列表中
        if (style) {
            const newSelectedVoice = voices.find(v => (v.short_name || v.id) === newVoice);
            const newVoiceStyles = newSelectedVoice?.style_list || [];

            if (!newVoiceStyles.includes(style)) {
                setStyle(''); // 如果当前风格不在新声音的风格列表中，清空风格选择
            }
        }

        console.log(`用户选择声音: ${newVoice}`);
    };

    // 获取收藏声音列表
    const [favoriteVoices, setFavoriteVoices] = useState<FavoriteVoiceItem[]>([]);

    // 加载收藏声音列表
    const loadFavoriteVoices = useCallback(() => {
        try {
            const favorites = FavoritesService.getFavorites();
            // 按收藏时间倒序排列（最新的在前）
            favorites.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
            setFavoriteVoices(favorites);
        } catch (error) {
            console.error('获取收藏声音失败:', error);
            setFavoriteVoices([]);
        }
    }, [voice, voices]); // 依赖voice和voices，确保收藏状态同步

    // 初始加载收藏声音列表
    useEffect(() => {
        loadFavoriteVoices();
    }, [loadFavoriteVoices]);

    // 删除单个收藏声音
    const handleRemoveFavorite = (e: React.MouseEvent, favorite: FavoriteVoiceItem) => {
        e.stopPropagation(); // 阻止事件冒泡，避免触发选择

        try {
            const result = FavoritesService.removeFromFavorites(favorite.id);

            if (result) {
                showInfo(`已移除收藏: ${favorite.localName || favorite.name}`);
                // 重新加载收藏列表
                loadFavoriteVoices();
            }
        } catch (error) {
            console.error('移除收藏失败:', error);
        }
    };

    // 清空收藏功能已移至VoiceLibrary组件中

    // 处理收藏声音选择
    const handleFavoriteSelect = (favorite: FavoriteVoiceItem) => {
        try {
            // 设置locale和voice
            setLocale(favorite.locale);

            // 查找对应的语言并设置
            for (const [languageName, regions] of languageMap.entries()) {
                const region = regions.find(r => r.locale === favorite.locale);
                if (region) {
                    setSelectedLanguage(languageName);
                    localStorage.setItem('tts_current_language', languageName);
                    localStorage.setItem('tts_current_locale', favorite.locale);
                    break;
                }
            }

            // 稍微延迟设置voice，确保locale已设置
            setTimeout(() => {
                setVoice(favorite.id);
                setStyle(''); // 清空风格选择
            }, 100);

            showSuccess(`已选择收藏声音: ${favorite.localName || favorite.name}`);
        } catch (error) {
            console.error('选择收藏声音失败:', error);
        }
    };

    // 生成语言选项（第一级）
    const languageOptions = Array.from(languageMap.entries()).map(([languageName, regions]) => ({
        value: languageName,
        label: languageName,
    }));

    // 生成区域选项（第二级）
    const regionOptions = selectedLanguage
        ? languageMap.get(selectedLanguage)
        ?.sort((a, b) => a.regionCode.localeCompare(b.regionCode))
        ?.map(region => ({
            value: region.locale,
            label: region.regionCode,
        })) || []
        : [];

    // 常用语言（动态生成）
    const availableLanguages = Array.from(languageMap.keys());
    const commonLanguagesAvailable = COMMON_LANGUAGES.filter(lang => availableLanguages.includes(lang));

    // 根据 locale 过滤声音
    const filteredVoices = locale
        ? voices.filter(voice => {
            // 优先使用 locale 字段匹配，其次是 short_name
            return voice.locale === locale ||
                voice.short_name === locale ||
                (voice.locale && voice.locale.startsWith(locale + '-')) ||
                (voice.short_name && voice.short_name.startsWith(locale + '-'));
        })
        : voices;

    const voiceOptions = filteredVoices.map((v) => ({
        value: v.short_name || v.id,  // 优先使用 short_name，否则使用 id
        label: v.local_name ? `${v.local_name} - ${v.gender}` : `${v.name} (${v.locale}) - ${v.gender}`,
    }));

    // 获取选中声音的风格列表
    const selectedVoice = voices.find(v => (v.short_name || v.id) === voice);
    const selectedVoiceStyles = selectedVoice?.style_list || [];

    const styleOptions = selectedVoiceStyles.map((s) => ({
        value: s,
        label: s,
    }));

    if (isLoading && voices.length === 0) {
        return (
            <div className="min-h-screen bg-gray-950 relative overflow-hidden">
                {/* 动态背景网格 */}
                <div className="fixed inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: `
                            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px'
                    }}></div>
                </div>

                <div className="relative z-10">
                    {/* 顶部导航骨架屏 */}
                    <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-50 mb-6">
                        <div className="flex items-center justify-between h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-800 rounded-lg animate-pulse"></div>
                                <div className="h-6 w-32 bg-gray-800 rounded animate-pulse"></div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="h-8 w-24 bg-gray-800 rounded-lg animate-pulse"></div>
                                <div className="h-8 w-8 bg-gray-800 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    {/* 主要内容骨架屏 */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* 左侧主要控制面板骨架屏 */}
                        <div className="xl:col-span-8 space-y-6">
                            {/* 文本输入骨架屏 */}
                            <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6">
                                <TextSkeleton lines={3} />
                            </div>

                            {/* 语音选择骨架屏 */}
                            <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6">
                                <VoiceSelectorSkeleton />
                            </div>

                            {/* 参数控制骨架屏 */}
                            <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6">
                                <ParameterControlsSkeleton />
                            </div>
                        </div>

                        {/* 右侧历史记录骨架屏 */}
                        <div className="xl:col-span-4">
                            <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6">
                                <div className="h-6 w-24 bg-gray-800 rounded mb-4 animate-pulse"></div>
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-start space-x-3 p-3 border border-gray-800 rounded-lg">
                                            <div className="w-8 h-8 bg-gray-800 rounded-full animate-pulse flex-shrink-0"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-full bg-gray-800 rounded animate-pulse"></div>
                                                <div className="h-3 w-2/3 bg-gray-800 rounded animate-pulse"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 relative overflow-hidden">
            {/* 动态背景网格 */}
            <div className="fixed inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                        linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                        linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            {/* 音频波形装饰 */}
            <div className="fixed top-20 left-0 right-0 h-32 opacity-20 pointer-events-none">
                <div className="h-full flex items-center justify-around">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 bg-gradient-to-t from-green-500 to-transparent rounded-full"
                            style={{
                                height: `${20 + Math.random() * 60}%`,
                                animationName: 'wave',
                                animationDuration: `${1 + Math.random()}s`,
                                animationTimingFunction: 'ease-in-out',
                                animationIterationCount: 'infinite',
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes wave {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.5); }
                }
            `}</style>

            <div className="relative z-10">
                {/* 顶部导航栏 */}
                <Navbar />

                {/* 主要内容区域 */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* 错误提示 - 使用 Alert 组件 */}
                    {error && (
                        <div className="mb-6">
                            <Alert
                                type="error"
                                message={error}
                                onClose={() => setError('')}
                                autoClose={5000}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* 左侧主要控制面板 */}
                        <div className="xl:col-span-8 space-y-6">
                            {/* 快速选择 */}
                            <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <h3 className="text-lg font-semibold text-gray-100 font-mono tracking-tight">快速选择</h3>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-800 rounded text-xs text-green-400 font-mono">
                                        {selectedLanguage || '请选择语言'}
                                    </div>
                                </div>

                                {/* 常用语言快捷选择 */}
                                <div className="mb-6">
                                    <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider">快速预设</div>
                                    <div className="flex flex-wrap gap-2">
                                        {commonLanguagesAvailable.slice(0, 12).map(lang => (
                                            <button
                                                key={lang}
                                                onClick={() => handleLanguageChange(lang)}
                                                className={`px-4 py-2 text-sm font-medium rounded transition-all duration-200 ${
                                                    selectedLanguage === lang
                                                        ? 'bg-green-500 text-gray-900 shadow-lg shadow-green-500/50 font-mono'
                                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700 font-mono'
                                                    }`}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 高级选择 */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Select
                                        value={selectedLanguage}
                                        onChange={(e) => handleLanguageChange(e.target.value)}
                                        options={[
                                            { value: '', label: '选择语言' },
                                            ...languageOptions
                                        ]}
                                        placeholder="所有语言"
                                        size="sm"
                                    />
                                    {selectedLanguage && (languageMap.get(selectedLanguage)?.length ?? 0) > 1 && (
                                        <Select
                                            value={locale}
                                            onChange={(e) => handleRegionChange(e.target.value)}
                                            options={[
                                                { value: '', label: '区域' },
                                                ...regionOptions
                                            ]}
                                            placeholder="选择区域"
                                            size="sm"
                                        />
                                    )}
                                    <Select
                                        value={voice}
                                        onChange={(e) => handleVoiceChange(e.target.value)}
                                        options={[
                                            { value: '', label: locale ? "声音" : "先选语言" },
                                            ...voiceOptions
                                        ]}
                                        loading={voices.length === 0}
                                        placeholder={locale ? "选择声音" : "请先选择语言"}
                                        disabled={!locale}
                                        size="sm"
                                    />
                                </div>

                                {/* 风格选择 */}
                                {voice && selectedVoiceStyles.length > 0 && (
                                    <div className="mt-4">
                                        <Select
                                            value={style}
                                            onChange={(e) => setStyle(e.target.value)}
                                            options={[
                                                { value: '', label: "选择风格" },
                                                ...styleOptions
                                            ]}
                                            placeholder="选择风格"
                                            size="sm"
                                        />
                                    </div>
                                )}
                             </div>

                            {/* 语音参数调节 */}
                            <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                        <h3 className="text-lg font-semibold text-gray-100 font-mono tracking-tight">语音参数</h3>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-800/50 rounded text-xs text-orange-400 font-mono border border-orange-500/20">
                                        参数调节
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    {/* 语速控制 */}
                                    <div className="relative group">
                                        {/* 角落装饰 */}
                                        <div className="absolute -top-px -left-px w-4 h-4 border-l-2 border-t-2 border-green-500/20 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute -top-px -right-px w-4 h-4 border-r-2 border-t-2 border-green-500/20 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute -bottom-px -left-px w-4 h-4 border-l-2 border-b-2 border-green-500/20 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute -bottom-px -right-px w-4 h-4 border-r-2 border-b-2 border-green-500/20 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 group-hover:border-gray-600/50 transition-all duration-300">
                                            {/* 标签和值显示 */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                    <label className="text-sm font-medium text-gray-300 font-mono">语速</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-mono text-green-400 font-semibold">
                                                        {rate}%
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRate(config?.defaultRate || '0')}
                                                        disabled={rate === (config?.defaultRate || '0')}
                                                        title="重置为默认值"
                                                        className="w-9 h-9 flex items-center justify-center text-lg font-mono text-gray-500 hover:text-green-400 disabled:text-gray-700 disabled:cursor-not-allowed transition-all duration-200"
                                                    >
                                                        ↺
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 滑块区域 */}
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    {/* 滑块 */}
                                                    <Slider
                                                        value={Number(rate)}
                                                        onChange={(e) => setRate(e.target.value)}
                                                        min={-100}
                                                        max={100}
                                                        className="slider-no-label"
                                                    />
                                                </div>

                                                {/* 刻度标记 */}
                                                <div className="flex justify-between items-center px-1">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-px h-2 bg-gray-600"></div>
                                                        <span className="text-[10px] text-gray-500 font-mono mt-1">-100</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-px h-2 bg-green-500/50"></div>
                                                        <span className="text-[10px] text-gray-400 font-mono mt-1">0</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-px h-2 bg-gray-600"></div>
                                                        <span className="text-[10px] text-gray-500 font-mono mt-1">+100</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 语调控制 */}
                                    <div className="relative group">
                                        {/* 角落装饰 */}
                                        <div className="absolute -top-px -left-px w-4 h-4 border-l-2 border-t-2 border-orange-500/20 rounded-tl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute -top-px -right-px w-4 h-4 border-r-2 border-t-2 border-orange-500/20 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute -bottom-px -left-px w-4 h-4 border-l-2 border-b-2 border-orange-500/20 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <div className="absolute -bottom-px -right-px w-4 h-4 border-r-2 border-b-2 border-orange-500/20 rounded-br-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 group-hover:border-gray-600/50 transition-all duration-300">
                                            {/* 标签和值显示 */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                                        <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                                        </svg>
                                                    </div>
                                                    <label className="text-sm font-medium text-gray-300 font-mono">语调</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-mono text-orange-400 font-semibold">
                                                        {pitch}%
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPitch(config?.defaultPitch || '0')}
                                                        disabled={pitch === (config?.defaultPitch || '0')}
                                                        title="重置为默认值"
                                                        className="w-9 h-9 flex items-center justify-center text-lg font-mono text-gray-500 hover:text-orange-400 disabled:text-gray-700 disabled:cursor-not-allowed transition-all duration-200"
                                                    >
                                                        ↺
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 滑块区域 */}
                                            <div className="space-y-3">
                                                <div className="relative">
                                                    {/* 滑块 */}
                                                    <Slider
                                                        value={Number(pitch)}
                                                        onChange={(e) => setPitch(e.target.value)}
                                                        min={-100}
                                                        max={100}
                                                        className="slider-no-label"
                                                    />
                                                </div>

                                                {/* 刻度标记 */}
                                                <div className="flex justify-between items-center px-1">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-px h-2 bg-gray-600"></div>
                                                        <span className="text-[10px] text-gray-500 font-mono mt-1">-100</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-px h-2 bg-orange-500/50"></div>
                                                        <span className="text-[10px] text-gray-400 font-mono mt-1">0</span>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-px h-2 bg-gray-600"></div>
                                                        <span className="text-[10px] text-gray-500 font-mono mt-1">+100</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 文本输入和生成区域 */}
                            <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <h3 className="text-lg font-semibold text-gray-100 font-mono tracking-tight">文本内容</h3>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-800 rounded text-xs text-green-400 font-mono">
                                        SSML支持
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* 文本输入框 */}
                                    <div className="relative group">
                                        <Textarea
                                            id="text-input"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="在此输入要转换为语音的文本内容，支持 SSML 标记语言..."
                                            rows={12}
                                            className="resize-none text-base leading-relaxed bg-gray-950 text-gray-100 placeholder-gray-600 border-2 border-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-500/50 focus:ring-offset-0 focus:ring-offset-gray-900 font-mono transition-all duration-200"
                                        />
                                        {/* 角标装饰 */}
                                        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-green-500/30 rounded-tl-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
                                        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-green-500/30 rounded-tr-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
                                        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-green-500/30 rounded-bl-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-green-500/30 rounded-br-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
                                    </div>

                                    {/* 信息栏 */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm font-mono">
                                            <svg className="w-4 h-4 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="text-gray-400">字符数:</span>
                                            <span className="text-green-400 ml-1">{text.length}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* 清空按钮 */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 font-mono text-xs p-2 rounded-lg transition-all"
                                                onClick={() => setText('')}
                                                disabled={!text.trim()}
                                                title="清空"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </Button>

                                            {/* 快速导入按钮组 */}
                                            <div className="flex items-center gap-1 border-l border-gray-700 pl-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-green-400 hover:bg-green-500/10 font-mono text-xs p-2 rounded-lg transition-all"
                                                    onClick={handleImportReader}
                                                    disabled={!text.trim() || !voice}
                                                    title="导入阅读"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 font-mono text-xs p-2 rounded-lg transition-all"
                                                    onClick={handleImportIfreetime}
                                                    disabled={!text.trim() || !voice}
                                                    title="导入爱阅记"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                    </svg>
                                                </Button>
                                            </div>

                                            {/* 生成按钮 */}
                                            <Button
                                                size="lg"
                                                className={`bg-gradient-to-r hover:from-green-600 hover:to-emerald-700 text-white border-0 px-8 py-3 shadow-lg transition-all duration-200 font-mono font-semibold rounded-lg ${
                                                    isLoading
                                                        ? 'from-gray-600 to-gray-700 cursor-not-allowed'
                                                        : 'from-green-600 to-emerald-700 hover:shadow-green-500/50 hover:shadow-xl animate-pulse'
                                                }`}
                                                onClick={handleGenerateSpeech}
                                                disabled={isLoading || !text.trim() || !voice}
                                                title={isLoading ? '生成中...' : '生成 (Ctrl+Enter)'}
                                            >
                                                {isLoading ? (
                                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 右侧面板 */}
                        <div className="xl:col-span-4 space-y-6">
                            {/* 历史记录 */}
                            <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6 shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <h3 className="text-lg font-semibold text-gray-100 font-mono tracking-tight">历史记录</h3>
                                    </div>
                                    <div className="px-3 py-1 bg-gray-800 rounded text-xs text-orange-400 font-mono">
                                        {history.length}
                                    </div>
                                </div>
                                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                    <HistoryList
                                        items={history}
                                        currentPlayingId={currentPlayingId}
                                        onDownloadItem={downloadHistoryAudio}
                                        onRemoveItem={removeFromHistory}
                                        onClearAll={clearHistory}
                                        onRegenerateItem={handleRegenerateHistoryItem}
                                        onLoadToForm={handleLoadToForm}
                                        onPlayItem={handlePlayHistoryItem}
                                    />
                                </div>
                            </div>

                            {/* 音频播放器 */}
                            {audioUrl && (
                                <div className="bg-gray-900/80 backdrop-blur-xl rounded-lg border border-gray-800 p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-cyan-400 blur-sm rounded-full animate-pulse"></div>
                                                <div className="relative w-2 h-2 bg-cyan-400 rounded-full"></div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-100 font-mono tracking-tight">播放器</h3>
                                        </div>
                                        <div className="px-3 py-1 bg-cyan-500/10 rounded text-xs text-cyan-400 font-mono border border-cyan-500/20">
                                            音频控制
                                        </div>
                                    </div>
                                    <UnifiedAudioPlayer
                                        audioUrl={audioUrl}
                                        autoPlay={shouldAutoPlay}
                                        itemId={currentPlayingId || undefined}
                                        variant="full"
                                        showProgress={true}
                                        showVolume={true}
                                        showDownload={true}
                                        onDownload={(audioUrl, text) => {
                                            const a = document.createElement('a');
                                            a.href = audioUrl;
                                            const cleanText = text
                                                .substring(0, 20)
                                                .replace(/[<>:"/\\|?*]/g, '')
                                                .replace(/\s+/g, '_')
                                                .trim();
                                            const filename = cleanText ? `tts_${cleanText}_${Date.now()}.mp3` : `tts_audio_${Date.now()}.mp3`;
                                            a.download = filename;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* 移动端侧边栏（抽屉式） */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gray-900 border-r border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    {/* 抽屉头部 */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-100 font-mono">TTS Studio</h2>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-200"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 抽屉内容 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">

                        {/* 统计信息 */}
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-300 mb-3 font-mono">使用统计</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">可用声音</span>
                                    <span className="font-mono text-green-400">{voices.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">历史记录</span>
                                    <span className="font-mono text-orange-400">{history.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">收藏声音</span>
                                    <span className="font-mono text-cyan-400">{favoriteVoices.length}</span>
                                </div>
                            </div>
                            {favoriteVoices.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                    <Link
                                        to="/voices?favorites=true"
                                        onClick={() => setSidebarOpen(false)}
                                        className="block w-full text-center px-3 py-2 text-sm text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors font-mono"
                                    >
                                        管理收藏 ({favoriteVoices.length})
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 遮罩层 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default Home;