import React, {useCallback, useEffect, useState} from 'react';
import {useTTSStore} from '../hooks/useTTSStore';
import {TTSApiService} from '../services/api';
import {FavoritesService} from '../services/favorites';
import type {HistoryItem, FavoriteVoiceItem} from '../types/index';
import {COMMON_LANGUAGES} from '../types/index';
import {Button} from '../components/ui/Button';
import {Textarea} from '../components/ui/Textarea';
import {Select} from '../components/ui/Select';
import {Slider} from '../components/ui/Slider';
import {HistoryList} from '../components/audio/HistoryList';
import {UnifiedAudioPlayer} from '../components/audio/UnifiedAudioPlayer';
import VoiceLibrary from '../components/voice/VoiceLibrary';

interface HomeProps {
  onOpenSettings: () => void;
}

const Home: React.FC<HomeProps> = ({ onOpenSettings }) => {
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

    // 声音库模态框状态
    const [voiceLibraryOpen, setVoiceLibraryOpen] = useState(false);
    const [openVoiceLibraryWithFavorites, setOpenVoiceLibraryWithFavorites] = useState(false);

    // 快捷键帮助弹窗状态
    const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

    // 使用 useCallback 稳定化函数引用，防止重复初始化
    const initializeAppCallback = useCallback(() => {
        initializeApp();
    }, [initializeApp]); // 包含 initializeApp 依赖

    // 打开声音库（可选择是否默认显示收藏）
    const openVoiceLibrary = (showFavorites = false) => {
        setOpenVoiceLibraryWithFavorites(showFavorites);
        setVoiceLibraryOpen(true);
    };

    // 快捷键处理
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+K 或 Cmd+K 打开声音库
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                openVoiceLibrary(false);
            }

            // Ctrl+/ 或 Cmd+/ 显示快捷键帮助
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                setShortcutsHelpOpen(true);
            }

            // Ctrl+E 或 Cmd+E 聚焦文本输入框
            if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
                event.preventDefault();
                document.getElementById('text-input')?.focus();
            }

            // Ctrl+Enter 或 Cmd+Enter 生成
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                // 检查是否在文本输入框内
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.id === 'text-input' || activeElement.tagName === 'TEXTAREA')) {
                    event.preventDefault();
                    handleGenerateSpeech();
                }
            }

            // ESC 键关闭弹窗
            if (event.key === 'Escape') {
                if (voiceLibraryOpen) {
                    setVoiceLibraryOpen(false);
                }
                if (shortcutsHelpOpen) {
                    setShortcutsHelpOpen(false);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [voiceLibraryOpen, shortcutsHelpOpen]);

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
        console.log(`主页面回显检查 - voice: ${voice}, voices: ${voices.length}, languageMap: ${languageMap.size}`);

        if (voice && voices.length > 0 && languageMap.size > 0) {
            // 根据选择的voice查找对应的语音信息
            const selectedVoiceInfo = voices.find(v => (v.short_name || v.id) === voice);

            console.log(`查找语音信息:`, selectedVoiceInfo);

            if (selectedVoiceInfo && selectedVoiceInfo.locale) {
                const voiceLocale = selectedVoiceInfo.locale;
                console.log(`语音locale: ${voiceLocale}`);

                // 查找locale对应的语言
                let foundLanguage = '';
                for (const [languageName, regions] of languageMap.entries()) {
                    const region = regions.find(r => r.locale === voiceLocale);
                    if (region) {
                        foundLanguage = languageName;
                        console.log(`找到对应语言: ${languageName} -> ${voiceLocale}`);
                        break;
                    }
                }

                if (foundLanguage) {
                    // 避免重复设置（防止无限循环）
                    if (selectedLanguage !== foundLanguage || locale !== voiceLocale) {
                        console.log(`更新语言区域: ${selectedLanguage} -> ${foundLanguage}, ${locale} -> ${voiceLocale}`);
                        setSelectedLanguage(foundLanguage);
                        setLocale(voiceLocale);

                        // 保存到localStorage
                        localStorage.setItem('tts_current_language', foundLanguage);
                        localStorage.setItem('tts_current_locale', voiceLocale);
                    } else {
                        console.log(`语言区域无需更新，当前已是: ${foundLanguage}, ${voiceLocale}`);
                    }
                } else {
                    console.log(`未找到locale ${voiceLocale} 对应的语言`);
                }
            } else {
                console.log(`未找到语音信息或语音无locale`);
            }
        } else {
            console.log(`条件不满足，跳过回显: voice=${!!voice}, voices=${voices.length}, languageMap=${languageMap.size}`);
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

    // 通用的安全复制函数
    const safeCopyToClipboard = async (text: string, successMessage: string) => {
        try {
            // 首先尝试使用现代的 Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                showSuccessMessage(successMessage);
            } else {
                // 降级到传统的复制方法
                fallbackCopyTextToClipboard(text, successMessage);
            }
        } catch (error) {
            console.warn('Clipboard API failed, using fallback:', error);
            // 如果现代API失败，使用降级方案
            fallbackCopyTextToClipboard(text, successMessage);
        }
    };

    // 传统的复制方法降级方案
    const fallbackCopyTextToClipboard = (text: string, successMessage: string) => {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;

            // 避免滚动到底部
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';

            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                showSuccessMessage(successMessage);
            } else {
                showCopyFailedMessage(text);
            }
        } catch (error) {
            console.error('Fallback copy failed:', error);
            showCopyFailedMessage(text);
        }
    };

    // 显示成功消息
    const showSuccessMessage = (message: string) => {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse';
        successDiv.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => {
            if (document.body.contains(successDiv)) {
                document.body.removeChild(successDiv);
            }
        }, 3000);
    };

    // 显示复制失败消息并提供手动复制选项
    const showCopyFailedMessage = (text: string) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-sm max-w-md';
        errorDiv.innerHTML = `
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="font-semibold">自动复制失败</span>
                </div>
                <div class="text-xs opacity-90">
                    请手动复制以下内容：
                </div>
                <div class="bg-white bg-opacity-20 rounded p-2 text-xs font-mono break-all">
                    ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}
                </div>
                <button class="bg-white text-red-500 px-2 py-1 rounded text-xs font-semibold hover:bg-opacity-90 transition-colors" onclick="this.parentElement.remove()">
                    关闭
                </button>
            </div>
        `;
        document.body.appendChild(errorDiv);

        // 10秒后自动移除
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 10000);
    };

    const handleGenerateSpeech = async () => {
        await generateSpeech();
    };

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
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
            errorMessage.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>生成音频失败: ${error instanceof Error ? error.message : '未知错误'}</span>
                </div>
            `;
            document.body.appendChild(errorMessage);
            setTimeout(() => errorMessage.remove(), 3000);
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

    // 处理收藏状态变化
    const handleFavoritesChange = useCallback(() => {
        loadFavoriteVoices();
    }, [loadFavoriteVoices]);

    // 删除单个收藏声音
    const handleRemoveFavorite = (e: React.MouseEvent, favorite: FavoriteVoiceItem) => {
        e.stopPropagation(); // 阻止事件冒泡，避免触发选择

        try {
            const result = FavoritesService.removeFromFavorites(favorite.id);

            if (result) {
                // 显示删除成功提示
                const message = document.createElement('div');
                message.className = 'fixed top-4 right-4 bg-gray-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse';
                message.innerHTML = `
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>已移除收藏: ${favorite.localName || favorite.name}</span>
                    </div>
                `;
                document.body.appendChild(message);

                setTimeout(() => {
                    message.remove();
                }, 2000);

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

            // 显示选择成功提示
            const message = document.createElement('div');
            message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse';
            message.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>已选择收藏声音: ${favorite.localName || favorite.name}</span>
                </div>
            `;
            document.body.appendChild(message);

            setTimeout(() => {
                message.remove();
            }, 2000);
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在初始化应用...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
            {/* 现代化背景装饰 */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 left-1/2 w-60 h-60 bg-gradient-to-r from-cyan-400/10 to-teal-400/10 rounded-full blur-2xl animate-pulse delay-500"></div>
            </div>

            <div className="relative z-10">
                {/* 顶部导航栏 */}
                <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100/50 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                {/* 移动端菜单按钮 */}
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="md:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>

                                {/* Logo和标题 */}
                                <div className="flex items-center space-x-3 ml-2 md:ml-0">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900">TTS Studio</h1>
                                        <p className="text-xs text-gray-500 hidden sm:block">AI 文本转语音</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {/* 快速统计 */}
                                <div className="hidden sm:flex items-center text-xs text-gray-500 mr-4">
                                    <span>{voices.length} 声音</span>
                                </div>

                                {/* 快速操作按钮 */}
                                <button
                                    onClick={() => openVoiceLibrary(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                                    title="声音库 (Ctrl+K)"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span className="hidden sm:inline">声音库</span>
                                </button>

                                <button
                                    onClick={() => setShortcutsHelpOpen(true)}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                                    title="快捷键帮助 (Ctrl+/)"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="hidden sm:inline">快捷键</span>
                                </button>

                                <button
                                    onClick={onOpenSettings}
                                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                                    title="设置"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="hidden sm:inline">设置</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 主要内容区域 */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* 错误提示 */}
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 左侧主要控制面板 */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* 快速选择 */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-800">快速选择</h3>
                                    <span className="text-xs text-gray-500">
                                        {selectedLanguage || '选择语言'}
                                    </span>
                                </div>

                                {/* 收藏声音下拉框 */}
                                {favoriteVoices.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">
                                                🌟 收藏声音 ({favoriteVoices.length})
                                            </span>
                                            <button
                                                onClick={() => openVoiceLibrary(true)}
                                                className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                                                title="在声音库中管理收藏"
                                            >
                                                管理 →
                                            </button>
                                        </div>
                                        <Select
                                            value={voice}
                                            onChange={(e) => {
                                                const selectedFavorite = favoriteVoices.find(fav => fav.id === e.target.value);
                                                if (selectedFavorite) {
                                                    handleFavoriteSelect(selectedFavorite);
                                                }
                                            }}
                                            options={[
                                                { value: '', label: '选择收藏声音...' },
                                                ...favoriteVoices.map(fav => ({
                                                    value: fav.id,
                                                    label: `${fav.localName || fav.name} (${fav.locale})`,
                                                }))
                                            ]}
                                            placeholder="快速选择收藏声音"
                                            size="sm"
                                        />
                                    </div>
                                )}

                                {/* 常用语言快捷选择 */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {commonLanguagesAvailable.slice(0, 12).map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => handleLanguageChange(lang)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                                                selectedLanguage === lang
                                                    ? 'bg-blue-500 text-white shadow-lg'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700 border border-gray-200'
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>

                                {/* 高级选择 */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                    <div className="mt-3">
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
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">语音参数</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                语速
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium border border-blue-200">{rate}%</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setRate(config?.defaultRate || '0')}
                                                    disabled={rate === (config?.defaultRate || '0')}
                                                    title="重置为默认值"
                                                    className="w-10 h-8 flex items-center justify-center text-sm font-mono bg-blue-50 text-blue-700 rounded-md font-medium border border-blue-200 hover:bg-blue-100 hover:border-blue-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-200"
                                                >
                                                    ↺
                                                </button>
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

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                                </svg>
                                                语调
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium border border-purple-200">{pitch}%</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPitch(config?.defaultPitch || '0')}
                                                    disabled={pitch === (config?.defaultPitch || '0')}
                                                    title="重置为默认值"
                                                    className="w-10 h-8 flex items-center justify-center text-sm font-mono bg-purple-50 text-purple-700 rounded-md font-medium border border-purple-200 hover:bg-purple-100 hover:border-purple-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-colors duration-200"
                                                >
                                                    ↺
                                                </button>
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

                            {/* 文本输入和生成区域 */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
                                    <h3 className="text-white font-semibold flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        文本内容
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <Textarea
                                            id="text-input"
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="在此输入要转换为语音的文本内容，支持 SSML 标记语言..."
                                            rows={8}
                                            className="resize-none text-base leading-relaxed border-0 focus:ring-2 focus:ring-blue-500/20"
                                        />

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <svg className="w-4 h-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                支持 SSML，字符数: {text.length}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* 清空按钮 */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setText('')}
                                                    disabled={!text.trim()}
                                                    title="清空"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>

                                                {/* 快速导入按钮组 */}
                                                <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-gray-600 hover:text-green-600 hover:bg-green-50"
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
                                                        className="text-gray-600 hover:text-purple-600 hover:bg-purple-50"
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
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                                                    onClick={handleGenerateSpeech}
                                                    disabled={isLoading || !text.trim() || !voice}
                                                    title={isLoading ? '生成中...' : '生成 (Ctrl+Enter)'}
                                                >
                                                    {isLoading ? (
                                                        <><svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        生成中...</>
                                                    ) : (
                                                        <>
                                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            生成
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 右侧面板 */}
                        <div className="space-y-6">
                            {/* 历史记录 */}
                            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
                                    <h3 className="text-white font-semibold flex items-center justify-between">
                                        <span className="flex items-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            历史记录
                                        </span>
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                            {history.length}
                                        </span>
                                    </h3>
                                </div>
                                <div className="p-4 max-h-[400px] overflow-y-auto">
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
                                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
                                    <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                                        <h3 className="text-white font-semibold flex items-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            播放器
                                        </h3>
                                    </div>
                                    <div className="p-4">
                                        <UnifiedAudioPlayer
                                            audioUrl={audioUrl}
                                            autoPlay={false}
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
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* 移动端侧边栏（抽屉式） */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex flex-col h-full">
                    {/* 抽屉头部 */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800">TTS Studio</h2>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* 抽屉内容 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">

                        {/* 统计信息 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">使用统计</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">可用声音</span>
                                    <span className="font-medium">{voices.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">历史记录</span>
                                    <span className="font-medium">{history.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">收藏声音</span>
                                    <span className="font-medium">{favoriteVoices.length}</span>
                                </div>
                            </div>
                            {favoriteVoices.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            openVoiceLibrary(true);
                                            setSidebarOpen(false);
                                        }}
                                        className="w-full text-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        管理收藏 ({favoriteVoices.length})
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 遮罩层 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 声音库模态框 */}
            <VoiceLibrary
                isOpen={voiceLibraryOpen}
                onClose={() => {
                    setVoiceLibraryOpen(false);
                    setOpenVoiceLibraryWithFavorites(false);
                }}
                onFavoritesChange={handleFavoritesChange}
                showFavoritesOnly={openVoiceLibraryWithFavorites}
            />

            {/* 快捷键帮助弹窗 */}
            {shortcutsHelpOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
                        {/* 头部 */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center">
                                        <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        快捷键
                                    </h2>
                                    <p className="text-indigo-100 text-sm mt-1">
                                        提高您的工作效率
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShortcutsHelpOpen(false)}
                                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* 内容 */}
                        <div className="p-6 space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">打开声音库</span>
                                    </div>
                                    <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded shadow-sm">
                                        {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
                                    </kbd>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">生成</span>
                                    </div>
                                    <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded shadow-sm">
                                        {navigator.platform.includes('Mac') ? '⌘⏎' : 'Ctrl+⏎'}
                                    </kbd>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">聚焦文本内容</span>
                                    </div>
                                    <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded shadow-sm">
                                        {navigator.platform.includes('Mac') ? '⌘E' : 'Ctrl+E'}
                                    </kbd>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">快捷键帮助</span>
                                    </div>
                                    <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded shadow-sm">
                                        {navigator.platform.includes('Mac') ? '⌘/' : 'Ctrl+/'}
                                    </kbd>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-gray-900">关闭弹窗</span>
                                    </div>
                                    <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded shadow-sm">
                                        ESC
                                    </kbd>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600 text-center">
                                    💡 提示：生成快捷键仅在文本输入框内有效
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;