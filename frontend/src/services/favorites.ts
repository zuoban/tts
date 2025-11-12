import type { FavoriteVoiceItem, FavoritesState, Voice } from '../types/index';
import { STORAGE_KEYS } from '../types/index';

export class FavoritesService {
  // 获取收藏列表
  static getFavorites(): FavoriteVoiceItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (!stored) return [];

      const data: FavoritesState = JSON.parse(stored);
      return data.items.map(item => ({
        ...item,
        addedAt: new Date(item.addedAt)
      }));
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      return [];
    }
  }

  // 保存收藏列表
  static saveFavorites(items: FavoriteVoiceItem[]): void {
    try {
      const data: FavoritesState = {
        items,
        lastUpdated: new Date()
      };
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(data));
    } catch (error) {
      console.error('保存收藏列表失败:', error);
    }
  }

  // 添加收藏
  static addToFavorites(voice: Voice): boolean {
    try {
      const favorites = this.getFavorites();
      const voiceId = voice.short_name || voice.id;

      // 检查是否已经收藏
      if (favorites.some(item => item.id === voiceId)) {
        return false; // 已存在，返回false
      }

      const newItem: FavoriteVoiceItem = {
        id: voiceId,
        name: voice.name,
        localName: voice.local_name,
        locale: voice.locale,
        localeName: voice.locale_name,
        gender: voice.gender,
        styles: voice.style_list || voice.styles || [],
        addedAt: new Date()
      };

      favorites.push(newItem);
      this.saveFavorites(favorites);
      return true;
    } catch (error) {
      console.error('添加收藏失败:', error);
      return false;
    }
  }

  // 移除收藏
  static removeFromFavorites(voiceId: string): boolean {
    try {
      const favorites = this.getFavorites();
      const index = favorites.findIndex(item => item.id === voiceId);

      if (index === -1) {
        return false; // 不存在，返回false
      }

      favorites.splice(index, 1);
      this.saveFavorites(favorites);
      return true;
    } catch (error) {
      console.error('移除收藏失败:', error);
      return false;
    }
  }

  // 检查是否已收藏
  static isFavorite(voiceId: string): boolean {
    try {
      const favorites = this.getFavorites();
      return favorites.some(item => item.id === voiceId);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  }

  // 切换收藏状态
  static toggleFavorite(voice: Voice): { added: boolean; isFavorite: boolean } {
    const voiceId = voice.short_name || voice.id;
    const isFav = this.isFavorite(voiceId);

    if (isFav) {
      const removed = this.removeFromFavorites(voiceId);
      return { added: false, isFavorite: !removed };
    } else {
      const added = this.addToFavorites(voice);
      return { added, isFavorite: added };
    }
  }

  // 获取收藏数量
  static getFavoritesCount(): number {
    return this.getFavorites().length;
  }

  // 清空收藏
  static clearFavorites(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    } catch (error) {
      console.error('清空收藏失败:', error);
    }
  }

  // 按语言区域分组收藏
  static getFavoritesByLocale(): Record<string, FavoriteVoiceItem[]> {
    try {
      const favorites = this.getFavorites();
      return favorites.reduce((acc, item) => {
        if (!acc[item.locale]) {
          acc[item.locale] = [];
        }
        acc[item.locale].push(item);
        return acc;
      }, {} as Record<string, FavoriteVoiceItem[]>);
    } catch (error) {
      console.error('按语言分组收藏失败:', error);
      return {};
    }
  }
}