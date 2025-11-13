import React, { useEffect, useState, useRef } from "react";
import { useTTSStore } from "../../hooks/useTTSStore";
import { TTSApiService } from "../../services/api";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";
import { FavoritesService } from "../../services/favorites";
import type { Voice } from "../../types/index";

interface VoiceLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onFavoritesChange?: () => void;
}

const VoiceLibrary: React.FC<VoiceLibraryProps> = ({
  isOpen,
  onClose,
  onFavoritesChange,
}) => {
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
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<Set<string>>(
    new Set(),
  );

  // 搜索框引用
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (voices.length === 0 && isOpen) {
      loadVoices();
    }
  }, [voices, loadVoices, isOpen]);

  // 当语音库打开时，优先使用区域，如果没有区域则使用语言编码填入搜索框
  useEffect(() => {
    if (isOpen) {
      if (currentLocale) {
        // 填入当前的 locale（无论是完整的 zh-CN 还是语言编码 zh）
        setSearchTerm(currentLocale);
      } else {
        // 如果没有任何 locale 设置，清空搜索框
        setSearchTerm("");
      }

      // 聚焦搜索框
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, currentLocale]);

  // 加载收藏状态
  useEffect(() => {
    const favorites = FavoritesService.getFavorites();
    const favoriteIds = new Set(favorites.map((item) => item.id));
    setFavoriteVoiceIds(favoriteIds);
  }, [voices]);

  // 使用声音列表直接过滤
  useEffect(() => {
    filterVoices();
  }, [voices, searchTerm, selectedGender]);

  const filterVoices = () => {
    let filtered = voices;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(
        (voice) =>
          voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          voice.locale.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (voice.local_name &&
            voice.local_name.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // 性别过滤
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
      const voice = voices.find(
        (v) => v.id === voiceId || v.short_name === voiceId,
      );
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

      // 显示试听成功提示
      const previewMessage = document.createElement("div");
      previewMessage.className =
        "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse";
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

      setTimeout(() => {
        previewMessage.remove();
      }, 3000);
    } catch (error) {
      console.error("Preview voice failed:", error);

      const errorMessage = document.createElement("div");
      errorMessage.className =
        "fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm";
      errorMessage.innerHTML = `
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>试听失败，请重试</span>
        </div>
      `;
      document.body.appendChild(errorMessage);

      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    }
  };

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

  const copyVoiceId = (voiceId: string, voiceName: string) => {
    safeCopyToClipboard(voiceId, `已复制 ${voiceName} 的 ID`);
  };

  const selectVoiceForForm = (voice: Voice) => {
    console.log(`声音库选择语音: ${voice.short_name || voice.id}`);
    console.log(`语音信息:`, {
      locale: voice.locale,
      locale_name: voice.locale_name,
      name: voice.name,
      local_name: voice.local_name,
    });

    // 设置声音到表单
    const voiceId = voice.short_name || voice.id;
    setVoice(voiceId);
    setStyle("");
    setRate("0");
    setPitch("0");

    // 显示成功提示
    const successMessage = document.createElement("div");
    successMessage.className =
      "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse";
    successMessage.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>已选择 ${voice.local_name || voice.name}</span>
        <span class="ml-2 text-xs opacity-75">${voice.locale_name || voice.locale}</span>
      </div>
    `;
    document.body.appendChild(successMessage);

    setTimeout(() => {
      successMessage.remove();
      onClose(); // 关闭声音库
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

    // 通知父组件收藏状态已改变
    if (onFavoritesChange) {
      onFavoritesChange();
    }

    const message = document.createElement("div");
    message.className = `fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 text-sm animate-pulse ${
      result.added ? "bg-yellow-500 text-white" : "bg-gray-500 text-white"
    }`;
    message.innerHTML = `
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
            result.added
              ? "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              : "M6 18L18 6M6 6l12 12"
          }" />
        </svg>
        <span>${result.added ? "已添加到收藏" : "已移除收藏"}: ${voice.local_name || voice.name}</span>
      </div>
    `;
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">声音库</h2>
              <p className="text-purple-100">
                浏览所有可用的TTS声音，试听并选择最适合的声音
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 筛选控件 */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="清除搜索"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
            <div className="mt-3 text-sm text-gray-600">
              共 <span className="font-semibold">{voices.length}</span> 个声音
              {searchTerm || selectedGender ? (
                <>
                  ，已筛选出{" "}
                  <span className="font-semibold text-blue-600">
                    {filteredVoices.length}
                  </span>{" "}
                  个
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
                  className="group bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden min-h-[280px]"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>

                  <div className="relative p-4 space-y-3 min-h-[160px]">
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                          voice.gender === "Female"
                            ? "bg-pink-100 text-pink-700 border border-pink-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {voice.gender === "Female" ? "女声" : "男声"}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="flex-1 pr-12">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {voice.local_name || voice.name}
                          </h3>
                        </div>
                      </div>

                      <table className="w-full text-sm">
                        <tbody>
                          <tr>
                            <td className="px-0 py-1.5 font-medium text-gray-700 w-16 text-xs">
                              区域
                            </td>
                            <td className="px-2 py-1.5 text-gray-600 text-xs">
                              {voice.locale_name || voice.locale}
                            </td>
                          </tr>

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

                          {(voice.style_list || voice.styles) &&
                            (voice.style_list || voice.styles)!.length > 0 && (
                              <tr>
                                <td className="px-0 py-1.5 font-medium text-gray-700 w-16 text-xs align-top">
                                  风格
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex flex-wrap gap-0.5">
                                    {(voice.style_list || voice.styles)!
                                      .slice(0, 2)
                                      .map((style) => (
                                        <span
                                          key={style}
                                          className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100"
                                        >
                                          {style}
                                        </span>
                                      ))}
                                    {(voice.style_list || voice.styles)!
                                      .length > 2 && (
                                      <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 text-xs rounded border border-gray-200">
                                        +
                                        {(voice.style_list || voice.styles)!
                                          .length - 2}
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

                  <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex gap-2 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            previewVoice(voice.id);
                          }}
                          className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded-lg text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow"
                          title="试听此声音"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyVoiceId(
                              voice.id,
                              voice.local_name || voice.name,
                            );
                          }}
                          className="flex items-center justify-center w-8 h-8 bg-white border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow"
                          title="复制声音ID"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => toggleFavorite(e, voice)}
                          className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 shadow-sm hover:shadow ${
                            favoriteVoiceIds.has(voice.short_name || voice.id)
                              ? "bg-yellow-50 border-yellow-400 text-yellow-600 hover:bg-yellow-100"
                              : "bg-white border-gray-300 text-gray-800 hover:bg-yellow-50 hover:border-yellow-400"
                          }`}
                          title={
                            favoriteVoiceIds.has(voice.short_name || voice.id)
                              ? "取消收藏"
                              : "添加收藏"
                          }
                        >
                          <svg
                            className="w-3 h-3"
                            fill={
                              favoriteVoiceIds.has(voice.short_name || voice.id)
                                ? "currentColor"
                                : "none"
                            }
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectVoiceForForm(voice);
                        }}
                        className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                        title="选择此声音"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 空状态 */}
          {!isLoading && filteredVoices.length === 0 && (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                没有找到匹配的声音
              </h3>
              <p className="text-gray-500">尝试调整筛选条件或搜索关键词</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceLibrary;
