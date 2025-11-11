// 主题切换功能
class ThemeManager {
    constructor() {
        this.storageKey = 'tts-theme-preference';
        this.darkClass = 'dark';
        this.init();
    }

    init() {
        // 确保DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initWhenReady();
            });
        } else {
            this.initWhenReady();
        }
    }

    initWhenReady() {
        // 先创建主题切换按钮
        this.createThemeToggle();
        // 然后加载并应用主题
        this.loadTheme();
        // 最后设置系统主题监听
        this.setupSystemThemeListener();
    }

    // 获取当前主题
    getCurrentTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        if (savedTheme) {
            return savedTheme;
        }

        // 检查系统主题偏好
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    // 应用主题
    applyTheme(theme) {
        const html = document.documentElement;
        const body = document.body;

        if (html && body) {
            if (theme === 'dark') {
                html.setAttribute('data-theme', 'dark');
                body.classList.add(this.darkClass);
            } else {
                html.removeAttribute('data-theme');
                body.classList.remove(this.darkClass);
            }
        }

        // 更新切换按钮状态
        this.updateToggleIcon(theme);

        // 保存偏好设置
        localStorage.setItem(this.storageKey, theme);

        // 触发主题变更事件
        this.dispatchThemeChangeEvent(theme);
    }

    // 加载保存的主题
    loadTheme() {
        const theme = this.getCurrentTheme();
        this.applyTheme(theme);
    }

    // 切换主题
    toggleTheme() {
        // 获取当前实际应用的主题，而不是存储的主题
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        console.log(`切换主题: ${currentTheme} -> ${newTheme}`);
        this.applyTheme(newTheme);
        return newTheme;
    }

    // 创建主题切换按钮
    createThemeToggle() {
        // 创建切换按钮容器
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'theme-toggle-container';
        toggleContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        `;

        // 创建切换按钮
        const toggleButton = document.createElement('button');
        toggleButton.id = 'theme-toggle';
        toggleButton.className = 'theme-toggle';
        toggleButton.setAttribute('aria-label', '切换主题');
        toggleButton.style.cssText = `
            background: var(--glass-bg);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 12px;
            cursor: pointer;
            box-shadow: var(--shadow-lg);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 48px;
            height: 48px;
        `;

        // 设置初始图标
        this.updateToggleIcon(this.getCurrentTheme());

        // 添加悬浮效果
        toggleButton.addEventListener('mouseenter', () => {
            toggleButton.style.transform = 'translateY(-2px)';
            toggleButton.style.boxShadow = 'var(--shadow-xl)';
        });

        toggleButton.addEventListener('mouseleave', () => {
            toggleButton.style.transform = 'translateY(0)';
            toggleButton.style.boxShadow = 'var(--shadow-lg)';
        });

        // 添加点击事件
        toggleButton.addEventListener('click', () => {
            this.toggleTheme();
        });

        // 设置初始图标（在添加到DOM之前）
        const initialTheme = this.getCurrentTheme();
        this.setToggleIcon(toggleButton, initialTheme);

        // 组装元素
        toggleContainer.appendChild(toggleButton);

        // 添加到页面
        if (document.body) {
            document.body.appendChild(toggleContainer);
        } else {
            // 如果body还未准备好，等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    if (document.body) {
                        document.body.appendChild(toggleContainer);
                    }
                });
            } else {
                // DOM已经加载完成，但body可能还不存在
                setTimeout(() => {
                    if (document.body) {
                        document.body.appendChild(toggleContainer);
                    }
                }, 0);
            }
        }
    }

    // 更新切换按钮图标
    updateToggleIcon(theme) {
        // 使用多种方法查找按钮，确保能找到
        let toggleButton = document.getElementById('theme-toggle');

        // 如果通过ID找不到，尝试通过类名或其他方式查找
        if (!toggleButton) {
            toggleButton = document.querySelector('.theme-toggle');
        }

        // 如果还是找不到，延迟重试几次
        if (!toggleButton) {
            let retryCount = 0;
            const retryInterval = setInterval(() => {
                toggleButton = document.getElementById('theme-toggle') || document.querySelector('.theme-toggle');
                if (toggleButton || retryCount >= 5) {
                    clearInterval(retryInterval);
                    if (toggleButton) {
                        this.setToggleIcon(toggleButton, theme);
                    }
                }
                retryCount++;
            }, 100);
            return;
        }

        this.setToggleIcon(toggleButton, theme);
    }

    // 设置切换按钮图标的实际方法
    setToggleIcon(toggleButton, theme) {
        if (!toggleButton) return;

        const sunIcon = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transition: all 0.3s ease;">
                <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        const moonIcon = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transition: all 0.3s ease;">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        toggleButton.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
        toggleButton.style.color = 'var(--text-primary)';
    }

    // 监听系统主题变化
    setupSystemThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // 标准浏览器
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', (e) => {
                    // 只有在没有用户偏好时才自动切换
                    if (!localStorage.getItem(this.storageKey)) {
                        this.applyTheme(e.matches ? 'dark' : 'light');
                    }
                });
            }
            // 兼容旧浏览器
            else if (mediaQuery.addListener) {
                mediaQuery.addListener((e) => {
                    if (!localStorage.getItem(this.storageKey)) {
                        this.applyTheme(e.matches ? 'dark' : 'light');
                    }
                });
            }
        }
    }

    // 触发主题变更事件
    dispatchThemeChangeEvent(theme) {
        const event = new CustomEvent('themeChanged', {
            detail: { theme }
        });
        document.dispatchEvent(event);
    }

    // 重置主题偏好（跟随系统）
    resetToSystemTheme() {
        localStorage.removeItem(this.storageKey);
        this.loadTheme();
    }

    // 获取主题信息
    getThemeInfo() {
        return {
            current: this.getCurrentTheme(),
            system: window.matchMedia ?
                window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' :
                'unknown',
            hasUserPreference: !!localStorage.getItem(this.storageKey)
        };
    }
}

// 创建全局主题管理器实例
// 延迟创建以确保所有脚本都加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
        setupThemeEventListeners();
    });
} else {
    window.themeManager = new ThemeManager();
    setupThemeEventListeners();
}

// 设置主题事件监听器
function setupThemeEventListeners() {
    // 监听主题变更事件，可以用于其他组件的响应
    document.addEventListener('themeChanged', (event) => {
        console.log(`主题已切换到: ${event.detail.theme}`);

        // 这里可以添加其他需要在主题切换时执行的逻辑
        // 例如：重新渲染图表、更新第三方组件样式等
    });
}

// 导出主题管理器（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}