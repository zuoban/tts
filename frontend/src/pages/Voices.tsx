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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid, faPlay, faCheck } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

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
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<Set<string>>(new Set());
  const [clearFavoritesConfirmOpen, setClearFavoritesConfirmOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (voices.length === 0) {
      loadVoices();
    }
  }, [voices, loadVoices]);

  useEffect(() => {
    if (showFavoritesOnly) {
      setSearchTerm("");
    } else if (currentLocale) {
      setSearchTerm(currentLocale);
    }
  }, [showFavoritesOnly, currentLocale]);

  useEffect(() => {
    const favorites = FavoritesService.getFavorites();
    const favoriteIds = new Set(favorites.map((item) => item.id));
    setFavoriteVoiceIds(favoriteIds);
  }, [voices]);

  useEffect(() => {
    let filtered = voices;

    if (showFavoritesOnly) {
      filtered = filtered.filter((voice) => {
        const voiceId = voice.short_name || voice.id;
        return favoriteVoiceIds.has(voiceId);
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (voice) =>
          voice.name.toLowerCase().includes(term) ||
          voice.locale.toLowerCase().includes(term) ||
          (voice.local_name && voice.local_name.toLowerCase().includes(term)),
      );
    }

    if (selectedGender) {
      filtered = filtered.filter((voice) => voice.gender === selectedGender);
    }

    setFilteredVoices(filtered);
  }, [voices, searchTerm, selectedGender, showFavoritesOnly, favoriteVoiceIds]);

  const previewVoice = async (voiceId: string) => {
    try {
      const voice = voices.find((v) => v.id === voiceId || v.short_name === voiceId);
      if (!voice) return;

      const previewTexts: Record<string, string> = {
          "zh-CN": `你好，我是${voice.local_name || voice.name}。`,
          "en-US": `Hello, I'm ${voice.local_name || voice.name}.`,
          "default": `Hello, I'm ${voice.local_name || voice.name}.`,
      };
      
      const localeKey = Object.keys(previewTexts).find(k => voice.locale.includes(k)) || "default";
      const text = previewTexts[localeKey] || previewTexts["default"];

      const audioBlob = await TTSApiService.synthesizeSpeech({
        text,
        voice: voice.short_name || voice.id,
        rate: "0",
        pitch: "0",
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => URL.revokeObjectURL(audioUrl);
      await audio.play();

      showSuccess(`正在试听: ${voice.local_name || voice.name}`);
    } catch (error) {
      showError("试听失败");
    }
  };

  const selectVoiceForForm = (voice: Voice) => {
    setVoice(voice.short_name || voice.id);
    setStyle("");
    setRate("0");
    setPitch("0");
    showSuccess(`已选择 ${voice.local_name || voice.name}`);
    setTimeout(() => navigate('/'), 300);
  };

  const toggleFavorite = (e: React.MouseEvent, voice: Voice) => {
    e.stopPropagation();
    const voiceId = voice.short_name || voice.id;
    const result = FavoritesService.toggleFavorite(voice);

    const newFavoriteIds = new Set(favoriteVoiceIds);
    if (result.added) newFavoriteIds.add(voiceId);
    else newFavoriteIds.delete(voiceId);
    setFavoriteVoiceIds(newFavoriteIds);

    if (result.added) showSuccess("已收藏");
    else showInfo("已取消收藏");
  };

  const confirmClearAllFavorites = () => {
    FavoritesService.clearFavorites();
    showInfo("已清空所有收藏");
    setFavoriteVoiceIds(new Set());
    setClearFavoritesConfirmOpen(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="container max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {showFavoritesOnly ? '我的收藏' : '声音库'}
            </h1>
            <p className="text-muted-foreground">
              {showFavoritesOnly
                ? `管理您的收藏声音 (共 ${favoriteVoiceIds.size} 个)`
                : `浏览所有可用的TTS声音 (${voices.length} 个)`}
            </p>
          </div>

          {showFavoritesOnly && favoriteVoiceIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setClearFavoritesConfirmOpen(true)}>
              清空收藏
            </Button>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
               <Input
                  ref={searchInputRef}
                  placeholder="搜索声音名称、区域..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              options={[
                { value: "", label: "全部性别" },
                { value: "Male", label: "男声" },
                { value: "Female", label: "女声" },
              ]}
            />
          </div>

          {filteredVoices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVoices.map((voice) => {
                const isFav = favoriteVoiceIds.has(voice.short_name || voice.id);
                return (
                  <div
                    key={voice.id}
                    className={`group relative flex flex-col rounded-lg border transition-all hover:shadow-md ${isFav ? 'border-primary/50 bg-primary/5' : 'border-border bg-card hover:border-primary/30'}`}
                  >
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          voice.gender === "Female" ? "bg-pink-500/10 text-pink-500 border-pink-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}>
                          {voice.gender === "Female" ? "女声" : "男声"}
                        </span>
                        <button onClick={(e) => toggleFavorite(e, voice)} className="text-yellow-400 hover:scale-110 transition-transform">
                          <FontAwesomeIcon icon={isFav ? faStarSolid : faStarRegular} />
                        </button>
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-1 truncate" title={voice.local_name || voice.name}>
                        {voice.local_name || voice.name}
                      </h3>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>{voice.locale_name || voice.locale}</div>
                        {voice.sample_rate_hertz && <div className="font-mono opacity-70">{voice.sample_rate_hertz}Hz</div>}
                      </div>
                    </div>

                    <div className="p-3 border-t border-border bg-muted/30 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => previewVoice(voice.id)}>
                        <FontAwesomeIcon icon={faPlay} className="mr-2 h-3 w-3" /> 试听
                      </Button>
                      <Button size="sm" className="flex-1 h-8" onClick={() => selectVoiceForForm(voice)}>
                        <FontAwesomeIcon icon={faCheck} className="mr-2 h-3 w-3" /> 选择
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              未找到匹配的声音
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={clearFavoritesConfirmOpen}
        title="清空收藏"
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
