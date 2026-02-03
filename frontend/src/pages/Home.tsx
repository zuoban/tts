import React, {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {useTTSStore} from '../hooks/useTTSStore';
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
import { Navbar } from '../components/layout/Navbar';
import { showSuccess, showInfo, showWarning, showError } from '../components/ui/Toast';
import { HistoryList } from '../components/audio/HistoryList';
import { UnifiedAudioPlayer } from '../components/audio/UnifiedAudioPlayer';

// Utility for safe copy to clipboard
const safeCopyToClipboard = async (text: string, successMessage: string) => {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess(successMessage);
    } catch (err) {
        showError('复制失败');
        console.error('Failed to copy!', err);
    }
};

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
        removeFromHistory,
        clearHistory,
        playHistoryItem,
        setAudioUrl,
    } = useTTSStore();

    // 二级联动状态
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [languageMap, setLanguageMap] = useState<Map<string, any[]>>(new Map());

    // 自动播放标志
    const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

    // Initialize App
    useEffect(() => {
        initializeApp();
    }, []);

    // Load template if exists
    useEffect(() => {
        const selectedTemplate = sessionStorage.getItem('selected_template');
        if (selectedTemplate) {
            setText(selectedTemplate);
            sessionStorage.removeItem('selected_template');
        }
    }, []);
    
    // Group voices by language
    useEffect(() => {
        if (voices.length > 0) {
            const newMap = new Map();
            voices.forEach(voice => {
                // Heuristic: Use display name or locale to group
                const langCode = voice.locale.split('-')[0];
                const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(langCode) || langCode;
                
                if (!newMap.has(langName)) {
                    newMap.set(langName, []);
                }
                const existing = newMap.get(langName);
                if (!existing.some((r: any) => r.locale === voice.locale)) {
                    existing.push({
                        locale: voice.locale,
                        regionCode: voice.locale // Simplified
                    });
                }
            });
            setLanguageMap(newMap);
        }
    }, [voices]);


    const handleGenerateSpeech = async () => {
        setShouldAutoPlay(true);
        await generateSpeech();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            if (isCtrlOrCmd && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                document.getElementById('text-input')?.focus();
            }
            if (isCtrlOrCmd && e.key === 'Enter') {
                if (!isLoading && text.trim() && voice) {
                    e.preventDefault();
                    handleGenerateSpeech();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, text, voice]);


    // Handlers
    const handleLanguageChange = (languageName: string) => {
        setSelectedLanguage(languageName);
        localStorage.setItem('tts_current_language', languageName);
        const regions = languageMap.get(languageName);
        if (regions && regions.length === 1) {
            setLocale(regions[0].locale);
            setVoice('');
            setStyle('');
        } else {
            setLocale('');
            setVoice('');
            setStyle('');
        }
    };

    const handleRegionChange = (regionLocale: string) => {
        setLocale(regionLocale);
        setVoice('');
        setStyle('');
    };

    const handleVoiceChange = (newVoice: string) => {
        setVoice(newVoice);
        if (style) {
            const newSelectedVoice = voices.find(v => (v.short_name || v.id) === newVoice);
            if (!newSelectedVoice?.style_list?.includes(style)) {
                setStyle('');
            }
        }
    };
    
    const handleImportReader = async () => {
         if (!voice) return setError('请先选择声音');
         const currentVoice = voices.find(v => v.id === voice);
         const displayName = currentVoice ? (currentVoice.local_name || currentVoice.display_name || currentVoice.name) : 'TTS语音';
         const params = new URLSearchParams({ n: displayName, voice, rate, pitch });
         if (style) params.append('style', style);
         const apiKey = localStorage.getItem('tts_api_key');
         if (apiKey) params.append('api_key', apiKey);
         
         const url = `${window.location.origin}/api/v1/reader.json?${params.toString()}`;
         if (navigator.clipboard) {
             await safeCopyToClipboard(url, '导入阅读链接已复制');
         } else {
             // Fallback
             try {
                 const textArea = document.createElement("textarea");
                 textArea.value = url;
                 document.body.appendChild(textArea);
                 textArea.select();
                 document.execCommand("copy");
                 document.body.removeChild(textArea);
                 showSuccess('导入阅读链接已复制');
             } catch (err) {
                 showError('复制失败，请手动复制');
                 console.error('Fallback copy failed', err);
             }
         }
    };

    const handleImportIfreetime = async () => {
         if (!voice || !text.trim()) return setError('请先选择声音并输入文本');
         const currentVoice = voices.find(v => v.id === voice);
         const displayName = currentVoice ? (currentVoice.local_name || currentVoice.display_name || currentVoice.name) : 'TTS语音';
         const params = new URLSearchParams({ n: displayName, voice, rate, pitch });
         if (style) params.append('style', style);
         const apiKey = localStorage.getItem('tts_api_key');
         if (apiKey) params.append('api_key', apiKey);

         const url = `${window.location.origin}/api/v1/ifreetime.json?${params.toString()}`;
         if (navigator.clipboard) {
             await safeCopyToClipboard(url, '导入爱阅记链接已复制');
         } else {
             // Fallback
             try {
                 const textArea = document.createElement("textarea");
                 textArea.value = url;
                 document.body.appendChild(textArea);
                 textArea.select();
                 document.execCommand("copy");
                 document.body.removeChild(textArea);
                 showSuccess('导入爱阅记链接已复制');
             } catch (err) {
                 showError('复制失败，请手动复制');
                 console.error('Fallback copy failed', err);
             }
         }
    };

    const handlePlayHistoryItem = async (item: HistoryItem) => {
        try {
            playHistoryItem(item);
            // Wait for state updates then play? 
            // The original code called generateSpeech() immediately after.
            // But UnifiedAudioPlayer might handle it via URL.
            // If the item has audioUrl, UnifiedAudioPlayer should play it.
            // If expired, maybe regeneration is needed.
            // For now, let's assume item has URL or we regenerate.
             // Auto generate if no URL?
            if (!item.audioUrl) {
                 await generateSpeech();
            }
        } catch (error: any) {
            showError(error.message || '播放失败');
        }
    };
    
    // Derived State for Options
    const languageOptions = Array.from(languageMap.entries()).map(([name]) => ({ value: name, label: name }));
    const regionOptions = selectedLanguage ? languageMap.get(selectedLanguage)?.map(r => ({ value: r.locale, label: r.regionCode })) || [] : [];
    
    // Voice filtering logic
    const filteredVoices = locale
        ? voices.filter(v => v.locale === locale || v.short_name === locale || v.locale?.startsWith(locale + '-') || v.short_name?.startsWith(locale + '-'))
        : voices;

    const voiceOptions = filteredVoices.map((v) => ({
        value: v.short_name || v.id,
        label: v.local_name ? `${v.local_name} - ${v.gender}` : `${v.name} (${v.locale}) - ${v.gender}`,
    }));

    const selectedVoiceObj = voices.find(v => (v.short_name || v.id) === voice);
    const styleOptions = selectedVoiceObj?.style_list?.map(s => ({ value: s, label: s })) || [];


    // Loading State
    if (isLoading && voices.length === 0) {
        return (
            <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
                <Navbar />
                <main className="container mx-auto px-4 py-8 grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1">
                     <div className="xl:col-span-8 space-y-6">
                        <div className="rounded-lg border bg-card p-6 shadow-sm"><TextSkeleton lines={3} /></div>
                        <div className="rounded-lg border bg-card p-6 shadow-sm"><VoiceSelectorSkeleton /></div>
                        <div className="rounded-lg border bg-card p-6 shadow-sm"><ParameterControlsSkeleton /></div>
                     </div>
                     <div className="xl:col-span-4">
                        <div className="rounded-lg border bg-card p-6 shadow-sm">
                            <VoiceSelectorSkeleton />
                        </div>
                     </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative flex flex-col font-sans">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1">
                {error && (
                    <div className="mb-6">
                        <Alert type="error" message={error} onClose={() => setError('')} autoClose={5000} />
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
                    {/* Left Panel: Controls */}
                    <div className="xl:col-span-8 space-y-4 sm:space-y-6">
                        
                        {/* Voice Selection Card */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                                    快速选择
                                </h3>
                                {selectedLanguage && <span className="text-xs font-mono px-2 py-1 rounded bg-secondary text-secondary-foreground">{selectedLanguage}</span>}
                            </div>
                            
                            {/* Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                <Select
                                    value={selectedLanguage}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    options={[{ value: '', label: '选择语言' }, ...languageOptions]}
                                    placeholder="所有语言"
                                />
                                {((languageMap.get(selectedLanguage)?.length ?? 0) > 1) && (
                                     <Select
                                        value={locale}
                                        onChange={(e) => handleRegionChange(e.target.value)}
                                        options={[{ value: '', label: '区域' }, ...regionOptions]}
                                        placeholder="选择区域"
                                    />
                                )}
                                <Select
                                    value={voice}
                                    onChange={(e) => handleVoiceChange(e.target.value)}
                                    options={[{ value: '', label: locale ? "声音" : "先选语言" }, ...voiceOptions]}
                                    disabled={!locale}
                                    placeholder={locale ? "选择声音" : "请先选择语言"}
                                />
                            </div>

                            {/* Style Selection */}
                            {voice && styleOptions.length > 0 && (
                                <Select
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    options={[{ value: '', label: "默认风格" }, ...styleOptions]}
                                    placeholder="选择风格"
                                />
                            )}
                        </div>

                         {/* Parameters Card */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
                             <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                                语音参数
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <Slider
                                    label="语速"
                                    value={Number(rate)}
                                    onChange={(e) => setRate(e.target.value)}
                                    min={-100}
                                    max={100}
                                    valueDisplay={`${rate}%`}
                                />
                                <Slider
                                    label="语调"
                                    value={Number(pitch)}
                                    onChange={(e) => setPitch(e.target.value)}
                                    min={-100}
                                    max={100}
                                    valueDisplay={`${pitch}%`}
                                />
                            </div>
                        </div>

                        {/* Text Input Card */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    文本内容
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                     <Button variant="ghost" size="sm" onClick={() => setText('')} disabled={!text}>清空</Button>
                                     <Button variant="ghost" size="sm" onClick={handleImportReader} disabled={!text || !voice}>导入阅读</Button>
                                     <Button variant="ghost" size="sm" onClick={handleImportIfreetime} disabled={!text || !voice}>导入爱阅记</Button>
                                </div>
                            </div>

                            <Textarea
                                id="text-input"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="输入文本..."
                                rows={7}
                                showCharCount
                                maxLength={5000}
                            />
                            
                            {/* Audio Player (Unified) - Show when URL is available */}
                            {audioUrl && (
                                <div className="mt-4">
                                    <UnifiedAudioPlayer
                                        audioUrl={audioUrl}
                                        autoPlay={shouldAutoPlay}
                                        showDownload
                                        onDownload={(url, text) => {
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `tts_${text.substring(0, 20)}_${Date.now()}.mp3`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button 
                                    size="lg" 
                                    onClick={handleGenerateSpeech} 
                                    disabled={isLoading || !text.trim() || !voice}
                                    loading={isLoading}
                                    className="w-full md:w-auto min-w-[120px]"
                                >
                                    {isLoading ? '生成中...' : '立即生成'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: History */}
                    <div className="xl:col-span-4 space-y-6">
                         <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm h-auto sm:h-full max-h-[70vh] sm:max-h-[calc(100vh-120px)] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base sm:text-lg font-semibold">历史记录</h3>
                                {history.length > 0 && (
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={clearHistory}>
                                        清空
                                    </Button>
                                )}
                            </div>
                            <HistoryList
                                items={history}
                                currentPlayingId={currentPlayingId}
                                onPlayItem={handlePlayHistoryItem}
                                onRemoveItem={removeFromHistory}
                            />
                         </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
