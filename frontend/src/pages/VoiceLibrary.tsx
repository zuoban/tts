import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTTSStore } from '../hooks/useTTSStore';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { TTSApiService } from '../services/api';
import { COMMON_LANGUAGES } from '../types/index';
import type { Voice } from '../types/index';

const VoiceLibrary: React.FC = () => {
  const navigate = useNavigate();
  const {
    voices,
    loadVoices,
    isLoading,
    error,
    locale: storeLocale,
    setLocale,
    setVoice,
    setStyle,
    setRate,
    setPitch
  } = useTTSStore();
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [filteredByLocaleVoices, setFilteredByLocaleVoices] = useState<Voice[]>([]);

  // 语言区域映射状态
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [languageMap, setLanguageMap] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    if (voices.length === 0) {
      loadVoices();
    }
  }, [voices, loadVoices]);

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
          const newLanguageMap = new Map(Object.entries(parsedData));

          // 将Map转换为数组格式
          newLanguageMap.forEach((regionsMap, languageName) => {
            const typedRegionsMap = regionsMap as Map<string, any[]>;
            newLanguageMap.set(languageName, Array.from(typedRegionsMap.values()));
          });

          setLanguageMap(newLanguageMap as Map<string, any[]>);
          console.log('声音库使用缓存的语言区域数据');
        } catch (error) {
          console.error('解析缓存数据失败:', error);
          buildLanguageMap();
        }
      } else {
        buildLanguageMap();
      }
    }
  }, [voices]);

  const buildLanguageMap = () => {
    const newLanguageMap = new Map();

    voices.forEach(voice => {
      if (voice.locale && voice.locale_name) {
        const nameMatch = voice.locale_name.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (nameMatch) {
          const [, languageName, regionCode] = nameMatch;
          if (!newLanguageMap.has(languageName)) {
            newLanguageMap.set(languageName, new Map());
          }
          // 使用Map存储，自动去重locale和regionCode
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
      console.log('声音库语言区域数据已缓存');
    } catch (error) {
      console.error('缓存语言区域数据失败:', error);
    }

    // 更新组件状态
    setLanguageMap(newLanguageMap);
  };

  // 获取当前语言和区域设置
  const getCurrentHomePageSettings = () => {
    const savedLocale = localStorage.getItem('tts_current_locale');
    const savedLanguage = localStorage.getItem('tts_current_language');
    return { locale: savedLocale, language: savedLanguage };
  };

  // 初始化时使用保存的设置
  useEffect(() => {
    if (languageMap.size > 0) {
      const homePageSettings = getCurrentHomePageSettings();

      if (homePageSettings.locale && homePageSettings.language) {
        // 使用保存的设置
        setSelectedLanguage(homePageSettings.language);
        setLocale(homePageSettings.locale);
      } else if (storeLocale && languageMap.size > 0) {
        // 如果没有保存的设置，但store有值，则恢复对应的语言
        for (const [languageName, regions] of languageMap.entries()) {
          const region = regions.find(r => r.locale === storeLocale);
          if (region) {
            setSelectedLanguage(languageName);
            break;
          }
        }
      }
    }
  }, [languageMap.size]);

  // 使用store的locale作为唯一数据源
  useEffect(() => {
    // 先按区域筛选
    filterVoicesByLocale();
  }, [voices, storeLocale]);

  useEffect(() => {
    // 再按其他条件筛选
    filterVoices();
  }, [filteredByLocaleVoices, searchTerm, selectedGender]);

  const filterVoicesByLocale = () => {
    // 根据 store 的 locale 过滤声音
    const filtered = storeLocale
      ? voices.filter(voice => {
          // 优先使用 locale 字段匹配，其次是 short_name
          return voice.locale === storeLocale ||
                 voice.short_name === storeLocale ||
                 (voice.locale && voice.locale.startsWith(storeLocale + '-')) ||
                 (voice.short_name && voice.short_name.startsWith(storeLocale + '-'));
        })
      : voices;

    setFilteredByLocaleVoices(filtered);
  };

  const filterVoices = () => {
    let filtered = filteredByLocaleVoices;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(voice =>
        voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voice.locale.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (voice.local_name && voice.local_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 性别过滤
    if (selectedGender) {
      filtered = filtered.filter(voice => voice.gender === selectedGender);
    }

    setFilteredVoices(filtered);
  };

  // 动态生成常用语言列表（基于实际数据）
  const availableLanguages = Array.from(languageMap.keys());
  const commonLanguagesAvailable = COMMON_LANGUAGES.filter(lang => availableLanguages.includes(lang));

  // 语言选项（第一级）
  const languageOptions = Array.from(languageMap.entries()).map(([languageName, regions]) => ({
    value: languageName,
    label: languageName,
    regions: regions
  }));

  // 区域选项（第二级）
  const regionOptions = selectedLanguage
    ? languageMap.get(selectedLanguage)
        ?.sort((a, b) => a.regionCode.localeCompare(b.regionCode)) // 按区域代码排序
        ?.map(region => ({
            value: region.locale,
            label: region.regionCode,
          })) || []
    : [];

  // 处理语言选择（第一级）- 只在声音库内部使用
  const handleLanguageChange = (languageName: string) => {
    setSelectedLanguage(languageName);

    // 保存到声音库的临时设置
    localStorage.setItem('voiceLibrary_language', languageName);

    // 检查该语言是否只有一个区域
    const regions = languageMap.get(languageName);
    if (regions && regions.length === 1) {
      // 如果只有一个区域，自动选中它
      setLocale(regions[0].locale);
      localStorage.setItem('voiceLibrary_locale', regions[0].locale);
    } else {
      // 如果有多个区域，清空locale让用户选择
      setLocale('');
      localStorage.setItem('voiceLibrary_locale', '');
    }
  };

  // 处理区域选择（第二级）- 只在声音库内部使用
  const handleRegionChange = (locale: string) => {
    setLocale(locale); // 更新store的locale
    localStorage.setItem('voiceLibrary_locale', locale);
  };

  const genderOptions = [
    { value: '', label: '全部' },
    { value: 'Male', label: '男声' },
    { value: 'Female', label: '女声' },
  ];

  const previewVoice = async (voiceId: string) => {
    try {
      // 查找对应的声音信息
      const voice = voices.find(v => v.id === voiceId || v.short_name === voiceId);
      if (!voice) {
        console.error('Voice not found:', voiceId);
        return;
      }

      // 根据语言选择对应的试听文本
    const getPreviewText = (locale: string, voiceName: string) => {
      // 语言到试听文本的映射
      const previewTexts: Record<string, string> = {
        // 中文相关
        'zh-CN': `你好，我是${voiceName}，很高兴为您服务。`,
        'zh-TW': `你好，我是${voiceName}，很高興為您服務。`,
        'zh-HK': `你好，我是${voiceName}，很開心為您服務。`,
        'zh': `你好，我是${voiceName}，很高兴为您服务。`,

        // 英文
        'en-US': `Hello, I'm ${voiceName}. It's a pleasure to help you.`,
        'en-GB': `Hello, I'm ${voiceName}. It's a pleasure to assist you.`,
        'en-AU': `G'day, I'm ${voiceName}. Happy to help you out.`,
        'en': `Hello, I'm ${voiceName}. It's a pleasure to help you.`,

        // 日文
        'ja-JP': `こんにちは、私は${voiceName}です。お手伝いできることを嬉しく思います。`,
        'ja': `こんにちは、私は${voiceName}です。お手伝いできることを嬉しく思います。`,

        // 韩文
        'ko-KR': `안녕하세요, 저는 ${voiceName}입니다. 도와드릴 수 있어 기쁩니다.`,
        'ko': `안녕하세요, 저는 ${voiceName}입니다. 도와드릴 수 있어 기쁩니다.`,

        // 西班牙文
        'es-ES': `Hola, soy ${voiceName}. Encantado de ayudarle.`,
        'es-MX': `Hola, soy ${voiceName}. Encantado de ayudarte.`,
        'es': `Hola, soy ${voiceName}. Encantado de ayudarle.`,

        // 法文
        'fr-FR': `Bonjour, je suis ${voiceName}. Ravi de vous aider.`,
        'fr-CA': `Bonjour, je suis ${voiceName}. Heureux de vous aider.`,
        'fr': `Bonjour, je suis ${voiceName}. Ravi de vous aider.`,

        // 德文
        'de-DE': `Hallo, ich bin ${voiceName}. Ich freue mich, Ihnen zu helfen.`,
        'de': `Hallo, ich bin ${voiceName}. Ich freue mich, Ihnen zu helfen.`,

        // 意大利文
        'it-IT': `Ciao, sono ${voiceName}. Piacere di aiutarti.`,
        'it': `Ciao, sono ${voiceName}. Piacere di aiutarti.`,

        // 俄文
        'ru-RU': `Здравствуйте, я ${voiceName}. Рад помочь вам.`,
        'ru': `Здравствуйте, я ${voiceName}. Рад помочь вам.`,

        // 阿拉伯文
        'ar-SA': `مرحباً، أنا ${voiceName}. سعيد بمساعدتك.`,
        'ar': `مرحباً، أنا ${voiceName}. سعيد بمساعدتك.`,

        // 印地文
        'hi-IN': `नमस्ते, मैं ${voiceName} हूं। आपकी सहायता करके खुशी हुई।`,
        'hi': `नमस्ते, मैं ${voiceName} हूं। आपकी सहायता करके खुशी हुई।`,

        // 葡萄牙文
        'pt-BR': `Olá, sou ${voiceName}. É um prazer ajudar você.`,
        'pt-PT': `Olá, sou ${voiceName}. É um prazer ajudá-lo.`,
        'pt': `Olá, sou ${voiceName}. É um prazer ajudar você.`,

        // 荷兰文
        'nl-NL': `Hallo, ik ben ${voiceName}. Ik help u graag.`,
        'nl': `Hallo, ik ben ${voiceName}. Ik help u graag.`,

        // 瑞典文
        'sv-SE': `Hej, jag är ${voiceName}. Jag hjälper dig gärna.`,
        'sv': `Hej, jag är ${voiceName}. Jag hjälper dig gärna.`,

        // 默认英文
        'default': `Hello, I'm ${voiceName}. It's a pleasure to help you.`
      };

      // 尝试精确匹配locale，然后尝试语言前缀匹配
      return previewTexts[locale] ||
             previewTexts[locale.split('-')[0]] ||
             previewTexts['default'];
    };

    const voiceName = voice.local_name || voice.name;
    const previewText = getPreviewText(voice.locale, voiceName);

    const audioBlob = await TTSApiService.synthesizeSpeech({
      text: previewText,
      voice: voice.short_name || voice.id,
      rate: '0',
      pitch: '0'
    });

      const audioUrl = URL.createObjectURL(audioBlob);

      // 创建并播放音频
      const audio = new Audio();
      audio.src = audioUrl;
      audio.volume = 1.0;

      // 播放完成后清理URL
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });

      // 播放音频
      await audio.play();

      // 显示试听成功提示
      const previewMessage = document.createElement('div');
      previewMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse';
      previewMessage.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>正在试听: ${voice.local_name || voice.name}</span>
        </div>
      `;
      document.body.appendChild(previewMessage);

      // 3秒后自动移除提示
      setTimeout(() => {
        previewMessage.remove();
      }, 3000);

    } catch (error) {
      console.error('Preview voice failed:', error);

      // 显示错误提示
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
      errorMessage.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>试听失败，请重试</span>
        </div>
      `;
      document.body.appendChild(errorMessage);

      // 3秒后自动移除提示
      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    }
  };

  const copyVoiceId = (voiceId: string, voiceName: string) => {
    navigator.clipboard.writeText(voiceId);

    // 显示复制成功提示
    const copyMessage = document.createElement('div');
    copyMessage.className = 'fixed top-4 right-4 bg-gray-700 text-white px-3 py-1.5 rounded-lg shadow-lg z-50 text-sm';
    copyMessage.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
        <span>已复制 ${voiceName} 的 ID</span>
      </div>
    `;
    document.body.appendChild(copyMessage);

    // 2秒后自动移除提示
    setTimeout(() => {
      copyMessage.remove();
    }, 2000);
  };

  const selectVoiceForForm = (voice: Voice) => {
    // 清理声音库的临时设置
    localStorage.removeItem('voiceLibrary_language');
    localStorage.removeItem('voiceLibrary_locale');

    // 获取当前声音库选择的语言和区域
    const currentLanguage = selectedLanguage;
    const currentLocale = storeLocale;

    // 保存语言和区域设置
    localStorage.setItem('tts_current_language', currentLanguage);
    localStorage.setItem('tts_current_locale', currentLocale);

    // 设置声音到表单，保留用户已输入的文本内容
    setVoice(voice.short_name || voice.id);
    // 重置声音相关参数（风格、语速、语调）
    setStyle('');
    setRate('0');
    setPitch('0');

    // 显示成功提示
    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse';
    successMessage.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>已选择 ${voice.local_name || voice.name}</span>
      </div>
    `;
    document.body.appendChild(successMessage);

    // 3秒后自动移除提示并跳转到首页
    setTimeout(() => {
      successMessage.remove();
      // 自动跳转到首页
      navigate('/');
    }, 1500); // 1.5秒后跳转，给用户足够时间看到成功提示
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* 背景装饰效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 pt-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 my-2 overflow-hidden">
          {/* 简化的头部 */}
          <header className="text-center py-4 px-6 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-b border-gray-200/50">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">声音库</h1>
            <p className="text-xl text-gray-600">浏览所有可用的TTS声音，试听并选择最适合的声音</p>
          </header>

          <main className="p-3 space-y-3">
            {/* 语言区域选择 - 二级联动 */}
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

              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择语言
                </label>
                <Select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  options={languageOptions}
                  placeholder="选择语言"
                  loading={voices.length === 0}
                />
              </div>

              {/* 只有在选择语言且有多个区域时才显示区域选择器 */}
              {selectedLanguage && (languageMap.get(selectedLanguage)?.length ?? 0) > 1 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择区域
                  </label>
                  <Select
                    value={storeLocale}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    options={regionOptions}
                    placeholder="选择区域"
                    loading={false}
                  />
                </div>
              )}

              {/* 显示当前选择状态 */}
              {selectedLanguage && languageMap.get(selectedLanguage)?.length === 1 && storeLocale && (
                <div className="mb-3">
                  <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    已自动选择 <span className="font-semibold">{selectedLanguage}</span> - <span className="font-semibold">{storeLocale}</span>
                  </div>
                </div>
              )}

  
              {storeLocale && (
                <div className="text-sm text-blue-600">
                  已选择 <span className="font-semibold">{selectedLanguage}</span> - <span className="font-semibold">{storeLocale}</span>，显示 <span className="font-semibold">{filteredByLocaleVoices.length}</span> 个声音
                </div>
              )}
            </div>

            {/* 进一步筛选控件 */}
            {storeLocale && (
              <div className="border border-gray-200/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="搜索声音名称..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <Select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    options={genderOptions}
                  />
                </div>
              </div>
            )}

            {/* 统计信息 */}
            {storeLocale && (
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  {searchTerm || selectedGender ? (
                    <>筛选后找到 <span className="font-semibold text-blue-600">{filteredVoices.length}</span> 个声音</>
                  ) : (
                    <>该区域共有 <span className="font-semibold text-blue-600">{filteredByLocaleVoices.length}</span> 个声音</>
                  )}
                </p>
                <div className="flex gap-2">
                  {(searchTerm || selectedGender) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedGender('');
                      }}
                    >
                      清除筛选
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadVoices()}
                    loading={isLoading}
                  >
                    刷新列表
                  </Button>
                </div>
              </div>
            )}

            {!storeLocale && (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">请先选择语言区域</h3>
                <p className="text-gray-500">选择一个语言区域来浏览对应的声音选项</p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* 加载状态 */}
            {isLoading && filteredVoices.length === 0 && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载声音列表...</p>
              </div>
            )}

            {/* 声音列表 */}
            {storeLocale && filteredVoices.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredVoices.map((voice) => (
                  <div
                    key={voice.id}
                    className="group bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                    style={{ minHeight: '320px' }}
                  >
                    {/* 背景装饰 */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>

                    {/* 固定内容区域 */}
                    <div className="relative p-4 space-y-3" style={{ minHeight: '180px' }}>
                      {/* 右上角性别标签 */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                            voice.gender === 'Female'
                              ? 'bg-pink-100 text-pink-700 border border-pink-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {voice.gender === 'Female' ? '女声' : '男声'}
                        </span>
                      </div>

                      {/* 主体信息表格 */}
                      <div className="space-y-3">
                        {/* 声音名称行 */}
                        <div className="flex items-center">
                          <div className="flex-1 pr-12">
                            <h3 className="font-semibold text-gray-900 text-base">
                              {voice.local_name || voice.name}
                            </h3>
                          </div>
                        </div>

                        {/* 信息表格 */}
                        <table className="w-full text-sm">
                          <tbody>
                            {/* 语言区域 */}
                            <tr>
                              <td className="px-0 py-1.5 font-medium text-gray-700 w-16 text-xs">
                                区域
                              </td>
                              <td className="px-2 py-1.5 text-gray-600 text-xs">
                                {voice.locale_name || voice.locale}
                              </td>
                            </tr>

                            {/* 采样率 */}
                            {voice.sample_rate_hertz && (
                              <tr>
                                <td className="px-0 py-1.5 font-medium text-gray-700 w-16 text-xs">
                                  采样率
                                </td>
                                <td className="px-2 py-1.5">
                                  <span className="font-mono text-gray-600 text-xs">
                                    {voice.sample_rate_hertz}Hz
                                  </span>
                                </td>
                              </tr>
                            )}

                            {/* 风格列表 */}
                            {(voice.style_list || voice.styles) && (voice.style_list || voice.styles)!.length > 0 && (
                              <tr>
                                <td className="px-0 py-1.5 font-medium text-gray-700 w-16 text-xs align-top">
                                  风格
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex flex-wrap gap-0.5">
                                    {(voice.style_list || voice.styles)!.slice(0, 3).map((style) => (
                                      <span
                                        key={style}
                                        className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100"
                                      >
                                        {style}
                                      </span>
                                    ))}
                                    {(voice.style_list || voice.styles)!.length > 3 && (
                                      <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-xs rounded border border-gray-200">
                                        +{(voice.style_list || voice.styles)!.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* 角色列表 */}
                            {voice.roles && voice.roles.length > 0 && (
                              <tr>
                                <td className="px-0 py-1.5 font-medium text-gray-700 w-16 text-xs align-top">
                                  角色
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex flex-wrap gap-0.5">
                                    {voice.roles.slice(0, 2).map((role) => (
                                      <span
                                        key={role}
                                        className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-xs rounded border border-purple-100"
                                      >
                                        {role}
                                      </span>
                                    ))}
                                    {voice.roles.length > 2 && (
                                      <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-xs rounded border border-gray-200">
                                        +{voice.roles.length - 2}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 固定底部按钮区域 */}
                    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-gray-50/50 p-4">
                      <div className="flex items-center justify-between gap-3 w-full">
                        {/* 辅助按钮组 */}
                        <div className="flex gap-2 flex-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              previewVoice(voice.id);
                            }}
                            className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow"
                            title="试听此声音"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyVoiceId(voice.id, voice.local_name || voice.name);
                            }}
                            className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                            title="复制声音ID"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>

                        {/* 主要操作按钮 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectVoiceForForm(voice);
                          }}
                          className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                          title="选择此声音"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 空状态 */}
            {storeLocale && !isLoading && filteredVoices.length === 0 && filteredByLocaleVoices.length > 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的声音</h3>
                <p className="text-gray-500 mb-4">尝试调整筛选条件或搜索关键词</p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGender('');
                  }}
                >
                  清除筛选
                </Button>
              </div>
            )}

            {storeLocale && !isLoading && filteredByLocaleVoices.length === 0 && voices.length > 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">该区域暂无可用声音</h3>
                <p className="text-gray-500">请尝试选择其他语言区域</p>
              </div>
            )}

            {!isLoading && voices.length === 0 && !error && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无可用声音</h3>
                <p className="text-gray-500">请检查网络连接或稍后重试</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default VoiceLibrary;