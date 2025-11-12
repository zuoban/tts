import React, {useCallback, useEffect, useState} from 'react';
import {useTTSStore} from '../hooks/useTTSStore';
import {TTSApiService} from '../services/api';
import type {HistoryItem} from '../types/index';
import {COMMON_LANGUAGES} from '../types/index';
import {Button} from '../components/ui/Button';
import {Textarea} from '../components/ui/Textarea';
import {Select} from '../components/ui/Select';
import {Slider} from '../components/ui/Slider';
import {HistoryList} from '../components/audio/HistoryList';

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
        playHistoryItem,
        downloadHistoryAudio,
        removeFromHistory,
        clearHistory,
        addToHistory,
        setCurrentPlayingId,
    } = useTTSStore();

    const [audioErrors, setAudioErrors] = useState<Record<string, boolean>>({});

    // 二级联动状态
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [languageMap, setLanguageMap] = useState<Map<string, any[]>>(new Map());

    // 使用 useCallback 稳定化函数引用，防止重复初始化
    const initializeAppCallback = useCallback(() => {
        initializeApp();
    }, [initializeApp]); // 包含 initializeApp 依赖

    useEffect(() => {
        initializeAppCallback();
    }, [initializeAppCallback]);

    // 从localStorage恢复保存的语言和区域设置
    useEffect(() => {
        // 如果已有声音选择，优先根据声音回显，跳过localStorage恢复
        if (voice) {
            return;
        }

        const savedLanguage = localStorage.getItem('tts_current_language');
        const savedLocale = localStorage.getItem('tts_current_locale');

        if (savedLanguage && savedLocale && languageMap.size > 0) {
            // 验证保存的语言和区域是否仍然有效
            const regions = languageMap.get(savedLanguage);
            const isValid = regions?.some(r => r.locale === savedLocale);

            if (isValid) {
                setSelectedLanguage(savedLanguage);
                setLocale(savedLocale);
                console.log(`从localStorage恢复语言: ${savedLanguage}, 区域: ${savedLocale}`);
            }
        }
    }, [voice, languageMap, setLocale, setSelectedLanguage]);

    const buildLanguageMap = useCallback(() => {
        const newLanguageMap = new Map();

        voices.forEach(voice => {
            if (voice.locale && voice.locale_name) {
                const nameMatch = voice.locale_name.match(/^(.+?)\s*\(([^)]+)\)$/);
                if (nameMatch) {
                    const [, languageName, regionCode] = nameMatch;
                    if (!newLanguageMap.has(languageName)) {
                        newLanguageMap.set(languageName, new Map());
                    }
                    // 使用Map存储，自动去重
                    newLanguageMap.get(languageName).set(voice.locale, {
                        locale: voice.locale,
                        regionCode: regionCode,
                        displayName: voice.locale_name
                    });
                } else {
                    // 没有括号的情况，作为单一语言
                    if (!newLanguageMap.has(voice.locale_name)) {
                        newLanguageMap.set(voice.locale_name, new Map());
                    }
                    newLanguageMap.get(voice.locale_name).set(voice.locale, {
                        locale: voice.locale,
                        regionCode: voice.locale,
                        displayName: voice.locale_name
                    });
                }
            }
        });

        // 将Map转换为数组格式
        newLanguageMap.forEach((regionsMap, languageName) => {
            newLanguageMap.set(languageName, Array.from(regionsMap.values()));
        });

        // 缓存到localStorage
        try {
            const mapObject = Object.fromEntries(newLanguageMap);
            localStorage.setItem('tts_language_map', JSON.stringify(mapObject));
            localStorage.setItem('tts_language_map_timestamp', Date.now().toString());
            console.log('语言区域数据已缓存');
        } catch (error) {
            console.error('缓存语言区域数据失败:', error);
        }

        setLanguageMap(newLanguageMap);
    }, [voices, setLanguageMap]);

    // 构建语言区域映射并缓存
    useEffect(() => {
        if (voices.length > 0) {
            // 检查本地缓存
            const cachedLanguageData = localStorage.getItem('tts_language_map');
            const cachedTimestamp = localStorage.getItem('tts_language_map_timestamp');

            // 缓存有效期为4小时
            const CACHE_DURATION = 4 * 60 * 60 * 1000;
            const now = Date.now();

            if (cachedLanguageData && cachedTimestamp && (now - parseInt(cachedTimestamp)) < CACHE_DURATION) {
                try {
                    const parsedData = JSON.parse(cachedLanguageData);
                    setLanguageMap(new Map(Object.entries(parsedData)));
                    console.log('使用缓存的语言区域数据');
                } catch (error) {
                    console.error('解析缓存数据失败:', error);
                    buildLanguageMap();
                }
            } else {
                buildLanguageMap();
            }
        }
    }, [voices, buildLanguageMap]);

    // 根据声音回显语言和区域（优先级最高）
    useEffect(() => {
        if (voice && voices.length > 0 && languageMap.size > 0) {
            // 根据选择的voice查找对应的语音信息
            const selectedVoiceInfo = voices.find(v => (v.short_name || v.id) === voice);

            if (selectedVoiceInfo && selectedVoiceInfo.locale) {
                const voiceLocale = selectedVoiceInfo.locale;

                // 查找locale对应的语言
                for (const [languageName, regions] of languageMap.entries()) {
                    const region = regions.find(r => r.locale === voiceLocale);
                    if (region) {
                        // 避免重复设置（防止无限循环）
                        if (selectedLanguage !== languageName || locale !== voiceLocale) {
                            setSelectedLanguage(languageName);
                            setLocale(voiceLocale);

                            // 保存到localStorage
                            localStorage.setItem('tts_current_language', languageName);
                            localStorage.setItem('tts_current_locale', voiceLocale);

                            console.log(`根据声音 ${voice} 回显语言: ${languageName}, 区域: ${voiceLocale}`);
                        }
                        break;
                    }
                }
            }
        }
    }, [voice, voices, languageMap, setLocale, selectedLanguage, locale]);

    // 根据选择的locale恢复selectedLanguage（仅在voice为空时生效）
    useEffect(() => {
        if (!voice && locale && languageMap.size > 0) {
            // 查找locale对应的语言
            for (const [languageName, regions] of languageMap.entries()) {
                const region = regions.find(r => r.locale === locale);
                if (region) {
                    setSelectedLanguage(languageName);
                    break;
                }
            }
        }
    }, [voice, locale, languageMap]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => clearError(), 5000);
            return () => clearTimeout(timer);
        }
    }, [error, clearError]);

    const handleGenerateSpeech = async () => {
        await generateSpeech();
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

            // 重置错误状态
            setAudioErrors(prev => ({
                ...prev,
                [item.id]: false
            }));

        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to regenerate speech');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayHistoryItemDirectly = async (item: HistoryItem) => {

        try {
            setLoading(true);
            setError(null);

            // 清理之前的音频控制器
            if ((window as any).tempAudioControls) {
                const oldControls = (window as any).tempAudioControls;
                if (oldControls.getAudio()) {
                    const oldAudio = oldControls.getAudio();
                    oldAudio.pause();
                    if (oldAudio.src && oldAudio.src.startsWith('blob:')) {
                        URL.revokeObjectURL(oldAudio.src);
                    }
                }
                delete (window as any).tempAudioControls;
            }

            // 直接使用历史记录的参数重新生成音频并播放
            const audioBlob = await TTSApiService.regenerateSpeech(item);
            const audioUrl = URL.createObjectURL(audioBlob);

            // 创建临时音频元素
            const audio = new Audio();
            audio.src = audioUrl;
            audio.preload = 'auto';

            // 设置音频属性以提高播放成功率
            audio.volume = 1.0;
            audio.muted = false;

            // 添加暂停功能管理
            const playPauseAudio = async () => {
                try {
                    if (audio.paused) {
                        // 确保音频已加载
                        if (audio.readyState < 2) {
                            await new Promise((resolve) => {
                                audio.addEventListener('canplay', resolve, {once: true});
                            });
                        }
                        await audio.play();
                    } else {
                        audio.pause();
                    }
                } catch (error) {
                    console.error('音频播放控制失败:', error);
                    setError('音频播放失败');
                }
            };

            // 暴露播放/暂停方法到全局作用域，以便按钮控制
            (window as any).tempAudioControls = {
                playPause: playPauseAudio,
                isPlaying: () => !audio.paused,
                getAudio: () => audio
            };

            // 设置当前播放ID
            setCurrentPlayingId(item.id);

            // 音频播放完成后清理
            audio.addEventListener('ended', () => {
                setCurrentPlayingId(null);
                URL.revokeObjectURL(audioUrl);
                delete (window as any).tempAudioControls;
            });

            // 音频加载失败处理
            audio.addEventListener('error', (e) => {
                console.error('音频加载失败:', e);
                setError('音频加载失败');
                setCurrentPlayingId(null);
                URL.revokeObjectURL(audioUrl);
                delete (window as any).tempAudioControls;
            });

            // 等待音频加载完成后播放
            audio.addEventListener('canplay', async () => {
                try {
                    await audio.play();
                } catch (error) {
                    console.error('音频播放失败:', error);
                    setError('音频播放失败，请重试');
                    setCurrentPlayingId(null);
                    URL.revokeObjectURL(audioUrl);
                    delete (window as any).tempAudioControls;
                }
            }, {once: true});

            // 开始加载音频
            audio.load();

        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to generate speech');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleHistoryPlayback = async (item: HistoryItem) => {
        // 如果当前点击的项目正在播放，则暂停
        if (currentPlayingId === item.id && (window as any).tempAudioControls) {
            const controls = (window as any).tempAudioControls;
            if (controls.getAudio() && !controls.getAudio().ended) {
                controls.playPause(); // 暂停播放
                setCurrentPlayingId(null);
                return;
            }
        }

        // 否则开始新的播放（停止当前其他播放）
        if ((window as any).tempAudioControls) {
            const controls = (window as any).tempAudioControls;
            const audio = controls.getAudio();
            if (audio && !audio.ended) {
                audio.pause();
                if (audio.src && audio.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audio.src);
                }
            }
            delete (window as any).tempAudioControls;
        }

        await handlePlayHistoryItemDirectly(item);
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在初始化应用...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* 背景装饰效果 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto p-4 pt-6">
                <div
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 my-2 overflow-hidden">
                    {/* 简化的头部 */}
                    <header
                        className="text-center py-4 px-6 bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-gray-200/50">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">文本转语音 (TTS)</h1>
                        <p className="text-xl text-gray-600">将文本转换为自然流畅的语音</p>
                    </header>

                    <main className="p-3 space-y-3">

                        {/* 错误提示 */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* 声音设置 - 紧凑版 */}
                        <div className="border border-gray-200/50 rounded-lg p-4">
                            {/* 常用语言快速选择 */}
                            <div className="mb-4 pb-3 border-b border-gray-100">
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs text-gray-500 self-center">常用语言:</span>
                                    {commonLanguagesAvailable.length > 0 ? (
                                        commonLanguagesAvailable.slice(0, 8).map(lang => (
                                            <button
                                                key={lang}
                                                onClick={() => handleLanguageChange(lang)}
                                                className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors duration-200 ${
                                                    selectedLanguage === lang
                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                                                }`}
                                            >
                                                {lang}
                                            </button>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400">加载中...</span>
                                    )}
                                </div>
                            </div>

                            <div className={`grid grid-cols-1 gap-3 ${
                                selectedLanguage && languageMap.get(selectedLanguage)?.length === 1
                                    ? 'lg:grid-cols-3'
                                    : 'lg:grid-cols-4'
                            }`}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">语言</label>
                                    <Select
                                        value={selectedLanguage}
                                        onChange={(e) => handleLanguageChange(e.target.value)}
                                        options={languageOptions}
                                        loading={voices.length === 0}
                                        placeholder="选择语言"
                                    />
                                </div>

                                {/* 只有在选择了语言且有多个区域时才显示区域选择器 */}
                                {selectedLanguage && (languageMap.get(selectedLanguage)?.length ?? 0) > 1 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">区域</label>
                                        <Select
                                            value={locale}
                                            onChange={(e) => handleRegionChange(e.target.value)}
                                            options={regionOptions}
                                            loading={false}
                                            placeholder="选择区域"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">声音</label>
                                    <Select
                                        value={voice}
                                        onChange={(e) => handleVoiceChange(e.target.value)}
                                        options={voiceOptions}
                                        loading={voices.length === 0}
                                        placeholder={locale ? "选择声音" : "请先选择语言"}
                                        disabled={!locale}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">风格</label>
                                    <Select
                                        value={style}
                                        onChange={(e) => setStyle(e.target.value)}
                                        options={styleOptions}
                                        loading={false}
                                        placeholder={voice ? (selectedVoiceStyles.length > 0 ? "选择风格" : "该声音无特定风格") : "请先选择声音"}
                                        disabled={!voice || selectedVoiceStyles.length === 0}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 声音参数 - 紧凑版 */}
                        <div className="border border-gray-200/50 rounded-lg p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">语速</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-gray-600">{rate}%</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setRate(config?.defaultRate || '0')}
                                                disabled={rate === (config?.defaultRate || '0')}
                                                title="重置"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2}
                                                     stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                    <Slider
                                        value={Number(rate)}
                                        onChange={(e) => setRate(e.target.value)}
                                        min={-100}
                                        max={100}
                                        className="slider-no-label"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">语调</label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-mono text-gray-600">{pitch}%</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPitch(config?.defaultPitch || '0')}
                                                disabled={pitch === (config?.defaultPitch || '0')}
                                                title="重置"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2}
                                                     stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>
                                    <Slider
                                        value={Number(pitch)}
                                        onChange={(e) => setPitch(e.target.value)}
                                        min={-100}
                                        max={100}
                                        className="slider-no-label"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 文本输入 */}
                        <div className="border border-gray-200/50 rounded-lg p-4">
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="输入要转换为语音的文本内容..."
                                rows={6}
                                showCharCount
                                maxLength={5000}
                                className="resize-none"
                            />
                        </div>

                        {/* 生成按钮 - 简化版 */}
                        <div className="flex justify-center">
                            <Button
                                onClick={handleGenerateSpeech}
                                loading={isLoading}
                                disabled={!text.trim() || !voice}
                                variant="primary"
                                size="lg"
                                className="w-full lg:w-auto px-12 py-3 h-12"
                            >
                                {isLoading ? '正在生成...' : '转换为语音'}
                            </Button>
                        </div>

                        {/* 历史记录列表 */}
                        <div className="space-y-4">
                            <HistoryList
                                items={history}
                                currentPlayingId={currentPlayingId}
                                onPlayItem={playHistoryItem}
                                onDownloadItem={downloadHistoryAudio}
                                onRemoveItem={removeFromHistory}
                                onClearAll={clearHistory}
                                onRegenerateItem={handleRegenerateHistoryItem}
                                onPlayHistoryItemDirectly={handleToggleHistoryPlayback}
                                onLoadToForm={handleLoadToForm}
                            />
                        </div>
                    </main>

                    {/* 页脚 */}
                    <footer className="text-center py-6 text-gray-600 text-sm border-t border-gray-200/50">
                        <p>© 2025 TTS服务 | <a href="https://github.com/zuoban/tts" target="_blank"
                                               rel="noopener noreferrer"
                                               className="text-blue-500 hover:underline">GitHub</a></p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default Home;