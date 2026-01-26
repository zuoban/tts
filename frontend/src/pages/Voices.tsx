import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTTSStore } from "../hooks/useTTSStore";
import { TTSApiService } from "../services/api";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { FavoritesService } from "../services/favorites";
import ConfirmModal from "../components/ui/ConfirmModal";
import type { Voice } from "../types/index";
import { Navbar } from "../components/layout/Navbar";
import { showSuccess, showError, showInfo } from "../components/ui/Toast";

export default function Voices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showFavoritesOnly = searchParams.get('favorites') === 'true';

  const {
    voices,
    loadVoices,
    isLoading,
    setVoice,
    setStyle,
    setRate,
    setPitch,
    locale: currentLocale,
  } = useTTSStore();

  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [showFavoritesOnlyState, setShowFavoritesOnlyState] = useState(showFavoritesOnly);
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<Set<string>>(new Set());
  const [clearFavoritesConfirmOpen, setClearFavoritesConfirmOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (voices.length === 0) {
      loadVoices();
    }
  }, [voices, loadVoices]);

  useEffect(() => {
    setShowFavoritesOnlyState(showFavoritesOnly);

    if (showFavoritesOnly) {
      setSearchTerm("");
    } else if (currentLocale) {
      setSearchTerm(currentLocale);
    } else {
      setSearchTerm("");
    }

    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, [showFavoritesOnly, currentLocale]);

  useEffect(() => {
    const favorites = FavoritesService.getFavorites();
    const favoriteIds = new Set(favorites.map((item) => item.id));
    setFavoriteVoiceIds(favoriteIds);
  }, [voices]);

  useEffect(() => {
    filterVoices();
  }, [voices, searchTerm, selectedGender, showFavoritesOnlyState, favoriteVoiceIds]);

  const filterVoices = () => {
    let filtered = voices;

    if (showFavoritesOnlyState) {
      filtered = filtered.filter((voice) => {
        const voiceId = voice.short_name || voice.id;
        return favoriteVoiceIds.has(voiceId);
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (voice) =>
          voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voice.locale.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (voice.local_name &&
            voice.local_name.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    if (selectedGender) {
      filtered = filtered.filter((voice) => voice.gender === selectedGender);
    }

    setFilteredVoices(filtered);
  };

  const genderOptions = [
    { value: "", label: "全部" },
    { value: "Male", label: "男声" },
    { value: "Female", label: "女声" },
  ];

  const previewVoice = async (voiceId: string) => {
    try {
      const voice = voices.find((v) => v.id === voiceId || v.short_name === voiceId);
      if (!voice) {
        console.error("Voice not found:", voiceId);
        return;
      }

      const getPreviewText = (locale: string, voiceName: string) => {
        const previewTexts: Record<string, string> = {
          "zh-CN": `你好，我是${voiceName}，很高兴为您服务。`,
          "zh-TW": `你好，我是${voiceName}，很高興為您服務。`,
          "zh-HK": `你好，我是${voiceName}，很開心為您服務。`,
          zh: `你好，我是${voiceName}，很高兴为您服务。`,
          "en-US": `Hello, I'm ${voiceName}. It's a pleasure to help you.`,
          "en-GB": `Hello, I'm ${voiceName}. It's a pleasure to assist you.`,
          "en-AU": `G'day, I'm ${voiceName}. Happy to help you out.`,
          en: `Hello, I'm ${voiceName}. It's a pleasure to help you.`,
          "ja-JP": `こんにちは、私は${voiceName}です。お手伝いできることを嬉しく思います。`,
          ja: `こんにちは、私は${voiceName}です。お手伝いできることを嬉しく思います。`,
          "ko-KR": `안녕하세요, 저는 ${voiceName}입니다. 도와드릴 수 있어 기쁩니다.`,
          ko: `안녕하세요, 저는 ${voiceName}입니다. 도와드릴 수 있어 기쁩니다.`,
          default: `Hello, I'm ${voiceName}. It's a pleasure to help you.`,
        };

        return (
          previewTexts[locale] ||
          previewTexts[locale.split("-")[0]] ||
          previewTexts["default"]
        );
      };

      const voiceName = voice.local_name || voice.name;
      const previewText = getPreviewText(voice.locale, voiceName);

      const audioBlob = await TTSApiService.synthesizeSpeech({
        text: previewText,
        voice: voice.short_name || voice.id,
        rate: "0",
        pitch: "0",
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio();
      audio.src = audioUrl;
      audio.volume = 1.0;

      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(audioUrl);
      });

      await audio.play();

      showSuccess(`正在试听: ${voice.local_name || voice.name}`, 3000);
    } catch (error) {
      console.error("Preview voice failed:", error);
      showError("试听失败，请重试", 3000);
    }
  };

  const selectVoiceForForm = (voice: Voice) => {
    console.log(`声音库选择语音: ${voice.short_name || voice.id}`);

    const voiceId = voice.short_name || voice.id;
    setVoice(voiceId);
    setStyle("");
    setRate("0");
    setPitch("0");

    showSuccess(`已选择 ${voice.local_name || voice.name} (${voice.locale_name || voice.locale})`);

    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const toggleFavorite = (e: React.MouseEvent, voice: Voice) => {
    e.stopPropagation();
    const voiceId = voice.short_name || voice.id;
    const result = FavoritesService.toggleFavorite(voice);

    const newFavoriteIds = new Set(favoriteVoiceIds);
    if (result.added) {
      newFavoriteIds.add(voiceId);
    } else {
      newFavoriteIds.delete(voiceId);
    }
    setFavoriteVoiceIds(newFavoriteIds);

    if (result.added) {
      showSuccess(`已添加到收藏: ${voice.local_name || voice.name}`);
    } else {
      showInfo(`已移除收藏: ${voice.local_name || voice.name}`);
    }
  };

  const handleClearAllFavorites = () => {
    setClearFavoritesConfirmOpen(true);
  };

  const confirmClearAllFavorites = () => {
    try {
      FavoritesService.clearFavorites();

      showInfo("已清空所有收藏");

      const favorites = FavoritesService.getFavorites();
      const favoriteIds = new Set(favorites.map((item) => item.id));
      setFavoriteVoiceIds(favoriteIds);

      if (favorites.length === 0) {
        setShowFavoritesOnlyState(false);
      }
    } catch (error) {
      console.error("清空收藏失败:", error);
    }
    setClearFavoritesConfirmOpen(false);
  };

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
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 头部区域 */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="relative group">
               <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               
               <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 tracking-tight mb-2">
                 {showFavoritesOnlyState ? '我的收藏' : '声音库'}
               </h1>
               <p className="text-gray-400 font-mono text-sm tracking-wide flex items-center gap-3">
                 {showFavoritesOnlyState
                   ? `管理您的收藏声音 (共 ${favoriteVoiceIds.size} 个)`
                   : (
                     <>
                        <span>浏览所有可用的TTS声音，试听并选择最适合的声音</span>
                        <span className="text-cyan-500/50">///</span>
                        <span>共 {voices.length} 个声音</span>
                     </>
                   )
                 }
               </p>
            </div>

            {showFavoritesOnlyState && favoriteVoiceIds.size > 0 && (
                <button
                onClick={handleClearAllFavorites}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm whitespace-nowrap"
                >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm font-medium">清空</span>
                </button>
            )}
          </div>

          <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
            <div className="p-6">
              {/* 筛选控件 */}
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      ref={searchInputRef}
                      placeholder="搜索声音名称、区域..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        title="清除搜索"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <Select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    options={genderOptions}
                  />
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  共 <span className="font-semibold text-green-400">{voices.length}</span> 个声音
                  {searchTerm || selectedGender || showFavoritesOnlyState ? (
                    <>
                      ，已筛选出{" "}
                      <span className="font-semibold text-green-400">
                        {filteredVoices.length}
                      </span>{" "}
                      个
                      {showFavoritesOnlyState && (
                        <span className="ml-2 text-yellow-400 font-medium">
                          (仅收藏)
                        </span>
                      )}
                    </>
                  ) : (
                    ""
                  )}
                </div>
              </div>

              {/* 声音列表 */}
              {filteredVoices.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredVoices.map((voice) => (
                    <div
                      key={voice.id}
                      className={`group bg-gray-800/50 backdrop-blur-xl border-2 rounded-xl hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col ${
                        favoriteVoiceIds.has(voice.short_name || voice.id)
                          ? "border-yellow-400 shadow-lg"
                          : "border-gray-700 hover:border-green-500"
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br rounded-full -mr-12 -mt-12 ${
                        favoriteVoiceIds.has(voice.short_name || voice.id)
                          ? "from-yellow-500/20 to-orange-500/20"
                          : "from-green-500/20 to-emerald-500/20"
                      } group-hover:scale-150 transition-transform duration-500`}></div>

                      <div className="relative p-4 space-y-3 flex-1">
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={(e) => toggleFavorite(e, voice)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              favoriteVoiceIds.has(voice.short_name || voice.id)
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-700/50 text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400 border border-gray-600"
                            }`}
                            title={
                              favoriteVoiceIds.has(voice.short_name || voice.id)
                                ? "取消收藏"
                                : "添加收藏"
                            }
                          >
                            <svg
                              className="w-4 h-4"
                              fill={favoriteVoiceIds.has(voice.short_name || voice.id) ? "currentColor" : "none"}
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                              />
                            </svg>
                          </button>
                        </div>

                        <div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            voice.gender === "Female"
                              ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}>
                            {voice.gender === "Female" ? "女声" : "男声"}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-100 text-sm font-mono">
                            {voice.local_name || voice.name}
                          </h3>
                          <div className="mt-2 space-y-1.5 text-xs">
                            <div className="flex items-baseline">
                              <span className="font-medium text-gray-500 w-12">区域</span>
                              <span className="text-gray-400 font-mono">{voice.locale_name || voice.locale}</span>
                            </div>
                            {voice.sample_rate_hertz && (
                              <div className="flex items-baseline">
                                <span className="font-medium text-gray-500 w-12">采样率</span>
                                <span className="font-mono text-gray-400">{voice.sample_rate_hertz}Hz</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-700 bg-gray-800/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              previewVoice(voice.id);
                            }}
                            className="flex items-center justify-center w-8 h-8 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 hover:bg-green-500/20 hover:border-green-500 hover:text-green-400 transition-all duration-200"
                            title="试听此声音"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectVoiceForForm(voice);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-sm font-mono"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            选择
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 空状态 */}
              {!isLoading && filteredVoices.length === 0 && (
                <div className="text-center py-12">
                  {showFavoritesOnlyState ? (
                    <>
                      <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-gray-100 mb-2 font-mono">
                        暂无收藏的声音
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">
                        点击声音卡片上的星星图标来添加收藏
                      </p>
                      <button
                        onClick={() => navigate('/voices')}
                        className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all duration-200 font-semibold font-mono shadow-md hover:shadow-lg"
                      >
                        浏览所有声音
                      </button>
                    </>
                  ) : (
                    <>
                      <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-gray-100 mb-2 font-mono">
                        没有找到匹配的声音
                      </h3>
                      <p className="text-gray-400 text-sm mb-4">尝试调整筛选条件或搜索关键词</p>
                      <div className="flex items-center justify-center gap-3">
                        {searchTerm || selectedGender ? (
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedGender('');
                            }}
                            className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 font-semibold font-mono shadow-md hover:shadow-lg"
                          >
                            清除筛选
                          </button>
                        ) : null}
                        {favoriteVoiceIds.size > 0 && (
                          <button
                            onClick={() => navigate('/voices?favorites=true')}
                            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all duration-200 font-semibold font-mono shadow-md hover:shadow-lg"
                          >
                            浏览收藏 ({favoriteVoiceIds.size})
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={clearFavoritesConfirmOpen}
        title="清空"
        message="确定要清空所有收藏吗？此操作不可恢复。"
        confirmText="清空"
        cancelText="取消"
        type="danger"
        onConfirm={confirmClearAllFavorites}
        onCancel={() => setClearFavoritesConfirmOpen(false)}
      />
    </div>
  );
}
