// 声音库页面功能实现
class VoiceLibrary {
    constructor() {
        this.voices = [];
        this.filteredVoices = [];
        this.favorites = this.loadFavorites();
        this.selectedVoice = null;
        this.audioCache = new Map();

        // 语言分组映射 - 动态生成
        this.languageGroups = {};
        this.buildLanguageGroups();

        this.init();
    }

    // 构建语言分组映射
    buildLanguageGroups() {
        this.languageGroups = {};

        this.voices.forEach(voice => {
            const languageName = this.parseLanguageName(voice.locale_name);

            if (!this.languageGroups[languageName]) {
                this.languageGroups[languageName] = {
                    name: languageName,
                    variants: []
                };
            }

            // 添加地区变体，避免重复
            if (!this.languageGroups[languageName].variants.some(v => v.locale_name === voice.locale_name)) {
                this.languageGroups[languageName].variants.push({
                    locale_name: voice.locale_name,
                    locale: voice.locale
                });
            }
        });

        // 对每种语言的地区变体进行排序
        Object.keys(this.languageGroups).forEach(language => {
            this.languageGroups[language].variants.sort((a, b) => a.locale_name.localeCompare(b.locale_name));
        });
    }

    // 解析语言名称，提取括号外的语言名
    parseLanguageName(localeName) {
        const match = localeName.match(/^([^(]+)\s*\(/);
        return match ? match[1].trim() : localeName;
    }

    async init() {
        this.bindEvents();
        await this.loadVoices();
        this.updateSelectedVoice();
    }

    bindEvents() {
        // 搜索事件
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => this.filterVoices(), 300));
        }

        // 级联筛选事件
        const languageFilter = document.getElementById('language-filter');
        const localeFilter = document.getElementById('locale-filter');
        const genderFilter = document.getElementById('gender-filter');

        if (languageFilter) {
            languageFilter.addEventListener('change', () => this.onLanguageChange());
        }
        if (localeFilter) localeFilter.addEventListener('change', () => this.filterVoices());
        if (genderFilter) genderFilter.addEventListener('change', () => this.filterVoices());

        // 按钮事件
        const clearFilters = document.getElementById('clear-filters');
        const clearLanguage = document.getElementById('clear-language');
        const showFavorites = document.getElementById('show-favorites');
        if (clearFilters) clearFilters.addEventListener('click', () => this.clearFilters());
        if (clearLanguage) clearLanguage.addEventListener('click', () => this.clearLanguage());
        if (showFavorites) showFavorites.addEventListener('click', () => this.toggleFavorites());
    }

    async loadVoices() {
        const loadingState = document.getElementById('loading-state');
        const voiceGrid = document.getElementById('voice-grid');
        const emptyState = document.getElementById('empty-state');

        try {
            // 显示加载状态
            loadingState.classList.remove('hidden');
            voiceGrid.classList.add('hidden');
            emptyState.classList.add('hidden');

            // 获取声音列表
            const response = await fetch(`${config.basePath}/voices`);
            if (!response.ok) {
                throw new Error('获取声音列表失败');
            }

            this.voices = await response.json();
            this.filteredVoices = [...this.voices];

            // 构建语言分组
            this.buildLanguageGroups();

            // 初始化筛选器
            this.populateFilters();

            // 渲染声音列表
            this.renderVoices();
            this.updateVoiceCount();

            // 隐藏加载状态，显示结果
            loadingState.classList.add('hidden');
            voiceGrid.classList.remove('hidden');

        } catch (error) {
            console.error('加载声音列表失败:', error);
            loadingState.classList.add('hidden');
            emptyState.classList.remove('hidden');

            const emptyTitle = emptyState.querySelector('h3');
            const emptyDesc = emptyState.querySelector('p');
            if (emptyTitle) emptyTitle.textContent = '加载失败';
            if (emptyDesc) emptyDesc.textContent = error.message || '请稍后重试';
        }
    }

    populateFilters() {
        // 填充语言筛选器
        this.populateLanguageFilter();
        // 初始化地区变体筛选器
        this.updateLocaleFilter();
    }

    populateLanguageFilter() {
        const languageFilter = document.getElementById('language-filter');
        if (!languageFilter) return;

        // 清空现有选项
        languageFilter.innerHTML = '';

        // 添加"所有语言"选项
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = '所有语言';
        languageFilter.appendChild(allOption);

        // 获取所有语言名称并排序
        const languages = Object.keys(this.languageGroups).sort();

        // 添加语言选项
        languages.forEach(language => {
            const option = document.createElement('option');
            option.value = language;
            option.textContent = language;
            languageFilter.appendChild(option);
        });
    }

    generatePreviewText(voice) {
        // 根据语言生成不同的试听文本
        const locale = voice.locale.toLowerCase();

        // 中文语言
        if (locale.startsWith('zh-') || locale.startsWith('wuu-') || locale.startsWith('yue-')) {
            return `你好，我是${voice.local_name}，这是我的声音。`;
        }

        // 英语
        if (locale.startsWith('en-')) {
            return `Hello, I'm ${voice.local_name}. This is how my voice sounds.`;
        }

        // 阿拉伯语
        if (locale.startsWith('ar-')) {
            return `مرحباً، أنا ${voice.local_name}. هذا هو صوتي.`;
        }

        // 西班牙语
        if (locale.startsWith('es-')) {
            return `Hola, soy ${voice.local_name}. Así suena mi voz.`;
        }

        // 法语
        if (locale.startsWith('fr-')) {
            return `Bonjour, je suis ${voice.local_name}. Voici le son de ma voix.`;
        }

        // 德语
        if (locale.startsWith('de-')) {
            return `Hallo, ich bin ${voice.local_name}. So klingt meine Stimme.`;
        }

        // 日语
        if (locale.startsWith('ja-')) {
            return `こんにちは、${voice.local_name}です。私の声はこのように聞こえます。`;
        }

        // 韩语
        if (locale.startsWith('ko-')) {
            return `안녕하세요, ${voice.local_name}입니다. 제 목소리는 이렇게 들립니다.`;
        }

        // 俄语
        if (locale.startsWith('ru-')) {
            return `Здравствуйте, я ${voice.local_name}. Вот как звучит мой голос.`;
        }

        // 葡萄牙语
        if (locale.startsWith('pt-')) {
            return `Olá, sou ${voice.local_name}. Assim soa a minha voz.`;
        }

        // 意大利语
        if (locale.startsWith('it-')) {
            return `Ciao, sono ${voice.local_name}. Così suona la mia voce.`;
        }

        // 荷兰语
        if (locale.startsWith('nl-')) {
            return `Hallo, ik ben ${voice.local_name}. Zo klinkt mijn stem.`;
        }

        // 印地语
        if (locale.startsWith('hi-')) {
            return `नमस्ते, मैं ${voice.local_name} हूँ। यह मेरी आवाज़ कैसी सुनाई देती है।`;
        }

        // 默认使用中文
        return `你好，我是${voice.local_name}，这是我的声音。`;
    }

    onLanguageChange() {
        const languageFilter = document.getElementById('language-filter');
        const localeFilter = document.getElementById('locale-filter');
        const selectedLanguage = languageFilter.value;

        if (selectedLanguage === '') {
            // 如果选择了"所有语言"，显示所有地区变体
            this.updateLocaleFilter();
        } else {
            // 更新地区变体筛选器
            this.updateLocaleFilter(selectedLanguage);
        }

        localeFilter.disabled = false;

        // 触发筛选
        this.filterVoices();
    }

    updateLocaleFilter(language = '') {
        const localeFilter = document.getElementById('locale-filter');
        if (!localeFilter) return;

        // 清空现有选项
        localeFilter.innerHTML = '';

        if (language === '') {
            // 显示所有地区变体
            localeFilter.innerHTML = '<option value="">所有地区变体</option>';
            const localeNames = [...new Set(this.voices.map(voice => voice.locale_name))].sort();

            localeNames.forEach(localeName => {
                const option = document.createElement('option');
                const voice = this.voices.find(v => v.locale_name === localeName);
                option.value = voice ? voice.locale : '';
                option.textContent = localeName;
                localeFilter.appendChild(option);
            });
        } else {
            // 显示选定语言的所有地区变体
            localeFilter.innerHTML = '<option value="">选择地区变体</option>';
            const variants = this.languageGroups[language]?.variants || [];

            variants.forEach(variant => {
                const option = document.createElement('option');
                option.value = variant.locale;
                option.textContent = variant.locale_name;
                localeFilter.appendChild(option);
            });
        }
    }

    filterVoices() {
        const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
        const languageFilter = document.getElementById('language-filter')?.value || '';
        const localeFilter = document.getElementById('locale-filter')?.value || '';
        const genderFilter = document.getElementById('gender-filter')?.value || '';
        const showFavoritesOnly = document.getElementById('show-favorites')?.classList.contains('active');

        this.filteredVoices = this.voices.filter(voice => {
            // 搜索筛选
            const matchesSearch = !searchTerm ||
                voice.name.toLowerCase().includes(searchTerm) ||
                voice.display_name.toLowerCase().includes(searchTerm) ||
                voice.local_name.toLowerCase().includes(searchTerm);

            // 语言筛选
            let matchesLanguage = true;
            if (languageFilter !== '') {
                const voiceLanguageName = this.parseLanguageName(voice.locale_name);
                matchesLanguage = voiceLanguageName === languageFilter;
            }

            // 地区变体筛选
            const matchesLocale = !localeFilter || voice.locale === localeFilter;

            // 性别筛选
            const matchesGender = !genderFilter || voice.gender === genderFilter;

            // 收藏筛选
            const matchesFavorites = !showFavoritesOnly || this.favorites.has(voice.short_name);

            return matchesSearch && matchesLanguage && matchesLocale && matchesGender && matchesFavorites;
        });

        this.renderVoices();
        this.updateVoiceCount();
    }

    renderVoices() {
        const voiceGrid = document.getElementById('voice-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.filteredVoices.length === 0) {
            voiceGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        voiceGrid.classList.remove('hidden');
        emptyState.classList.add('hidden');

        voiceGrid.innerHTML = this.filteredVoices.map(voice => this.createVoiceCard(voice)).join('');

        // 绑定卡片事件
        this.bindCardEvents();
    }

    createVoiceCard(voice) {
        const isFavorite = this.favorites.has(voice.short_name);
        const styles = voice.style_list || [];

        return `
            <div class="voice-card" data-voice="${voice.short_name}">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-slate-800 mb-1">
                            ${voice.local_name}
                        </h3>
                        <p class="text-sm text-slate-600 mb-1">${voice.short_name}</p>
                        <p class="text-sm text-slate-500 mb-2">${voice.locale_name}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn-favorite ${isFavorite ? 'active' : ''}"
                                data-voice="${voice.short_name}"
                                title="${isFavorite ? '取消收藏' : '添加收藏'}">
                            ${isFavorite ? '❤️' : '🤍'}
                        </button>
                    </div>
                </div>

                <div class="flex flex-wrap gap-2 mb-3">
                    <span class="gender-tag gender-${voice.gender.toLowerCase()}">
                        ${voice.gender === 'Male' ? '男声' : '女声'}
                    </span>
                    <span class="locale-tag">${voice.locale}</span>
                    <span class="text-xs text-slate-500">${voice.sample_rate_hertz}Hz</span>
                </div>

                ${styles.length > 0 ? `
                    <div class="mb-3">
                        <p class="text-xs text-slate-600 mb-1">可用风格:</p>
                        <div class="flex flex-wrap gap-1">
                            ${styles.slice(0, 5).map(style =>
                                `<span class="style-tag">${style}</span>`
                            ).join('')}
                            ${styles.length > 5 ?
                                `<span class="style-tag">+${styles.length - 5}更多</span>` : ''}
                        </div>
                    </div>
                ` : ''}

                <div class="flex gap-2">
                    <button class="btn-preview" data-voice="${voice.short_name}"
                            data-text="${this.generatePreviewText(voice)}">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        试听
                    </button>
                    <button class="btn-select" data-voice="${voice.short_name}">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        选择
                    </button>
                </div>

                <div class="audio-container hidden mt-3">
                    <audio controls class="audio-player"></audio>
                </div>
            </div>
        `;
    }

    bindCardEvents() {
        // 收藏按钮
        document.querySelectorAll('.btn-favorite').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const voiceName = btn.dataset.voice;
                this.toggleFavorite(voiceName);
            });
        });

        // 试听按钮
        document.querySelectorAll('.btn-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const voiceName = btn.dataset.voice;
                const text = btn.dataset.text;
                this.previewVoice(voiceName, text, btn);
            });
        });

        // 选择按钮
        document.querySelectorAll('.btn-select').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const voiceName = btn.dataset.voice;
                this.selectVoice(voiceName);
            });
        });
    }

    async previewVoice(voiceName, text, button) {
        // 检查缓存
        const cacheKey = `${voiceName}-${text}`;
        if (this.audioCache.has(cacheKey)) {
            this.playAudio(this.audioCache.get(cacheKey), button);
            return;
        }

        // 禁用按钮，显示加载状态
        const originalContent = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<div class="loading-spinner" style="width: 16px; height: 16px;"></div> 生成中...';

        try {
            const params = new URLSearchParams({
                t: text,
                v: voiceName
            });

            const response = await fetch(`${config.basePath}/tts?${params}`);
            if (!response.ok) {
                throw new Error('生成语音失败');
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            // 缓存音频
            this.audioCache.set(cacheKey, audioUrl);

            // 播放音频
            this.playAudio(audioUrl, button);

        } catch (error) {
            console.error('试听失败:', error);
            alert('试听失败: ' + error.message);
        } finally {
            // 恢复按钮状态
            button.disabled = false;
            button.innerHTML = originalContent;
        }
    }

    playAudio(audioUrl, button) {
        const card = button.closest('.voice-card');
        const audioContainer = card.querySelector('.audio-container');
        const audioPlayer = card.querySelector('.audio-player');

        audioContainer.classList.remove('hidden');
        audioPlayer.src = audioUrl;
        audioPlayer.play();
    }

    selectVoice(voiceName) {
        this.selectedVoice = voiceName;

        // 保存到localStorage
        localStorage.setItem('ttsVoice', voiceName);

        // 更新UI
        this.updateSelectedVoice();

        // 显示选择成功提示
        this.showNotification('声音已选择，正在返回首页...', 'success');

        // 延迟返回首页
        setTimeout(() => {
            window.location.href = config.basePath + '/';
        }, 1500);
    }

    updateSelectedVoice() {
        const selectedVoiceElement = document.getElementById('selected-voice');
        if (!selectedVoiceElement) return;

        const currentVoice = localStorage.getItem('ttsVoice') || config.defaultVoice;
        const voice = this.voices.find(v => v.short_name === currentVoice);

        if (voice) {
            selectedVoiceElement.textContent = `${voice.display_name} (${voice.local_name})`;
        } else {
            selectedVoiceElement.textContent = currentVoice || '无';
        }
    }

    toggleFavorite(voiceName) {
        const btn = document.querySelector(`.btn-favorite[data-voice="${voiceName}"]`);
        if (!btn) return;

        if (this.favorites.has(voiceName)) {
            this.favorites.delete(voiceName);
            btn.classList.remove('active');
            btn.textContent = '🤍';
            btn.title = '添加收藏';
            this.showNotification('已取消收藏', 'info');
        } else {
            this.favorites.add(voiceName);
            btn.classList.add('active');
            btn.textContent = '❤️';
            btn.title = '取消收藏';
            this.showNotification('已添加到收藏', 'success');
        }

        this.saveFavorites();

        // 如果当前在收藏视图，更新列表
        if (document.getElementById('show-favorites')?.classList.contains('active')) {
            this.filterVoices();
        }
    }

    loadFavorites() {
        try {
            const saved = localStorage.getItem('favoriteVoices');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    }

    saveFavorites() {
        localStorage.setItem('favoriteVoices', JSON.stringify([...this.favorites]));
    }

    clearFilters() {
        document.getElementById('search-input').value = '';
        document.getElementById('language-filter').value = '';
        document.getElementById('locale-filter').value = '';
        document.getElementById('gender-filter').value = '';
        document.getElementById('show-favorites').classList.remove('active');

        // 重置地区变体筛选器
        this.updateLocaleFilter();

        this.filterVoices();
        this.showNotification('筛选条件已清除', 'info');
    }

    clearLanguage() {
        document.getElementById('language-filter').value = '';
        document.getElementById('locale-filter').value = '';

        // 重置地区变体筛选器
        this.updateLocaleFilter();

        this.filterVoices();
        this.showNotification('语言筛选已清除', 'info');
    }

    toggleFavorites() {
        const btn = document.getElementById('show-favorites');
        btn.classList.toggle('active');

        if (btn.classList.contains('active')) {
            btn.textContent = '显示全部';
            btn.style.background = 'rgba(239, 68, 68, 0.1)';
            btn.style.color = '#dc2626';
            this.showNotification('仅显示收藏的声音', 'info');
        } else {
            btn.textContent = '仅显示收藏';
            btn.style.background = '';
            btn.style.color = '';
            this.showNotification('显示所有声音', 'info');
        }

        this.filterVoices();
    }

    updateVoiceCount() {
        const countElement = document.getElementById('voice-count');
        if (countElement) {
            countElement.textContent = this.filteredVoices.length;
        }
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `custom-alert ${type} show`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 300px;
            transform: translateX(0);
            transition: transform 0.3s ease;
        `;

        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">${icon}</span>
                <span style="flex: 1;">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()"
                        style="background: none; border: none; cursor: pointer; font-size: 16px;">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // 自动移除
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new VoiceLibrary();
});