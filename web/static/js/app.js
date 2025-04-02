function saveApiKey() {
    const apiKeyInput = document.getElementById('api-key');
    const apiKeyGroup = document.getElementById('api-key-group');

    if (apiKeyInput) {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            // 保存到localStorage
            localStorage.setItem('apiKey', apiKey);

            // 显示成功消息
            showCustomAlert('API Key 已成功保存', 'success');

            // 隐藏API Key输入区域
            if (apiKeyGroup) {
                apiKeyGroup.classList.add('hidden');
            }
        } else {
            showCustomAlert('API Key 已清空', 'success');
            localStorage.setItem('apiKey', '')
            // 隐藏API Key输入区域
            if (apiKeyGroup) {
                apiKeyGroup.classList.add('hidden');
            }
        }
    }
}

// 保存表单数据到localStorage
function saveFormData() {
    const textInput = document.getElementById('text');
    const voiceSelect = document.getElementById('voice');
    const styleSelect = document.getElementById('style');
    const rateInput = document.getElementById('rate');
    const pitchInput = document.getElementById('pitch');

    // 保存文本内容
    if (textInput && textInput.value) {
        localStorage.setItem('ttsText', textInput.value);
    }

    // 保存语音选择
    if (voiceSelect && voiceSelect.value) {
        localStorage.setItem('ttsVoice', voiceSelect.value);
    }

    // 保存风格选择
    if (styleSelect && styleSelect.value) {
        localStorage.setItem('ttsStyle', styleSelect.value);
    }

    // 保存语速
    if (rateInput && rateInput.value) {
        localStorage.setItem('ttsRate', rateInput.value);
    }

    // 保存语调
    if (pitchInput && pitchInput.value) {
        localStorage.setItem('ttsPitch', pitchInput.value);
    }
}

// 从localStorage加载表单数据
function loadFormData() {
    const textInput = document.getElementById('text');
    const voiceSelect = document.getElementById('voice');
    const styleSelect = document.getElementById('style');
    const rateInput = document.getElementById('rate');
    const rateValue = document.getElementById('rateValue');
    const pitchInput = document.getElementById('pitch');
    const pitchValue = document.getElementById('pitchValue');

    // 加载文本内容
    const savedText = localStorage.getItem('ttsText');
    if (savedText && textInput) {
        textInput.value = savedText;
        // 更新字符计数
        if (document.getElementById('charCount')) {
            document.getElementById('charCount').textContent = savedText.length;
        }
    }

    // 加载语速
    const savedRate = localStorage.getItem('ttsRate');
    if (savedRate && rateInput) {
        rateInput.value = savedRate;
        if (rateValue) {
            rateValue.textContent = savedRate + '%';
        }
    }

    // 加载语调
    const savedPitch = localStorage.getItem('ttsPitch');
    if (savedPitch && pitchInput) {
        pitchInput.value = savedPitch;
        if (pitchValue) {
            pitchValue.textContent = savedPitch + '%';
        }
    }

    // 保存风格选择的值，以便在语音加载后使用
    const savedStyle = localStorage.getItem('ttsStyle');

    // 加载语音选择（在语音列表加载完成后处理）
    const savedVoice = localStorage.getItem('ttsVoice');
    if (savedVoice && voiceSelect) {
        // 在initVoicesList完成后设置
        const voiceLoadInterval = setInterval(() => {
            if (voiceSelect.options.length > 0 && voiceSelect.options[0].value !== "loading") {
                for (let i = 0; i < voiceSelect.options.length; i++) {
                    if (voiceSelect.options[i].value === savedVoice) {
                        voiceSelect.selectedIndex = i;
                        // 触发change事件以更新风格选项
                        const event = new Event('change');
                        voiceSelect.dispatchEvent(event);

                        // 在语音选择更新后，设置保存的风格
                        // 使用setTimeout确保风格选项已经更新
                        setTimeout(() => {
                            if (savedStyle && styleSelect && styleSelect.options.length > 0) {
                                for (let j = 0; j < styleSelect.options.length; j++) {
                                    if (styleSelect.options[j].value === savedStyle) {
                                        styleSelect.selectedIndex = j;
                                        break;
                                    }
                                }
                            }
                        }, 100);

                        break;
                    }
                }
                clearInterval(voiceLoadInterval);
            }
        }, 100);
    } else {
        // 如果没有保存的语音选择，但有保存的风格，直接尝试设置风格
        if (savedStyle && styleSelect) {
            const styleLoadInterval = setInterval(() => {
                if (styleSelect.options.length > 0) {
                    for (let i = 0; i < styleSelect.options.length; i++) {
                        if (styleSelect.options[i].value === savedStyle) {
                            styleSelect.selectedIndex = i;
                            break;
                        }
                    }
                    clearInterval(styleLoadInterval);
                }
            }, 100);
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // 获取DOM元素
    const textInput = document.getElementById('text');
    const voiceSelect = document.getElementById('voice');
    const styleSelect = document.getElementById('style');
    const rateInput = document.getElementById('rate');
    const rateValue = document.getElementById('rateValue');
    const pitchInput = document.getElementById('pitch');
    const pitchValue = document.getElementById('pitchValue');
    const apiKeyInput = document.getElementById('api-key');
    const apiKeyGroup = document.getElementById('api-key-group');
    const speakButton = document.getElementById('speak');
    const downloadButton = document.getElementById('download');
    const copyLinkButton = document.getElementById('copyLink');
    const copyHttpTtsLinkButton = document.getElementById('copyHttpTtsLink');
    const copyIfreetimeLinkButton = document.getElementById('copyIfreetimeLink'); // 新增元素引用
    const audioPlayer = document.getElementById('audioPlayer');
    const resultSection = document.getElementById('resultSection');
    const charCount = document.getElementById('charCount');
    const toggleApiKeyButton = document.getElementById('toggle-api-key');
    const apiKeyStatus = document.getElementById('api-key-status');
    const apiKeySaveButton = document.getElementById('apvi-key-save');
    const togglePasswordButton = document.getElementById('toggle-password');

    // 保存最后一个音频URL
    let lastAudioUrl = '';
    // 存储语音数据
    let voicesData = [];

    // 初始化
    initVoicesList();
    initEventListeners();
    loadApiKeyFromLocalStorage(); // 加载API Key
    loadFormData(); // 加载表单数据

    // 更新字符计数
    textInput.addEventListener('input', function () {
        charCount.textContent = this.value.length;
        // 保存文本内容
        localStorage.setItem('ttsText', this.value);
    });

    // 更新语速值显示
    rateInput.addEventListener('input', function () {
        const value = this.value;
        rateValue.textContent = value + '%';
        // 保存语速
        localStorage.setItem('ttsRate', value);
    });

    // 更新语调值显示
    pitchInput.addEventListener('input', function () {
        const value = this.value;
        pitchValue.textContent = value + '%';
        // 保存语调
        localStorage.setItem('ttsPitch', value);
    });

    // 语音选择变化时更新可用风格
    voiceSelect.addEventListener('change', function () {
        updateStyleOptions();
        // 保存语音选择
        localStorage.setItem('ttsVoice', this.value);
    });

    // 添加风格选择变化事件
    styleSelect.addEventListener('change', function () {
        // 保存风格选择
        localStorage.setItem('ttsStyle', this.value);
    });

    // 获取可用语音列表
    async function initVoicesList() {
        try {
            const response = await fetch(`${config.basePath}/voices`);
            if (!response.ok) throw new Error('获取语音列表失败');

            voicesData = await response.json();

            // 清空并重建选项
            voiceSelect.innerHTML = '';

            // 如果还在加载，使用带有动画的加载提示
            if (voicesData.length === 0) {
                const option = document.createElement('option');
                option.value = "loading";
                option.textContent = "加载中";
                option.className = "loading-text";
                voiceSelect.appendChild(option);
                return;
            }

            // 按语言和名称分组
            const voicesByLocale = {};

            voicesData.forEach(voice => {
                if (!voicesByLocale[voice.locale]) {
                    voicesByLocale[voice.locale] = [];
                }
                voicesByLocale[voice.locale].push(voice);
            });

            // 创建选项组
            for (const locale in voicesByLocale) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = voicesByLocale[locale][0].locale_name;

                voicesByLocale[locale].forEach(voice => {
                    const option = document.createElement('option');
                    option.value = voice.short_name;
                    option.textContent = `${voice.local_name || voice.display_name} (${voice.gender})`;

                    // 如果是默认语音则选中
                    if (voice.short_name === config.defaultVoice) {
                        option.selected = true;
                    }

                    optgroup.appendChild(option);
                });

                voiceSelect.appendChild(optgroup);
            }

            // 初始化风格列表
            updateStyleOptions();
        } catch (error) {
            console.error('获取语音列表失败:', error);
            voiceSelect.innerHTML = '<option value="" class="text-red-500">无法加载语音列表</option>';
        }
    }

    // 更新风格选项
    function updateStyleOptions() {
        // 清空风格选择
        styleSelect.innerHTML = '';

        // 获取当前选中的语音
        const selectedVoice = voiceSelect.value;
        const voiceData = voicesData.find(v => v.short_name === selectedVoice);

        if (!voiceData || !voiceData.style_list || voiceData.style_list.length === 0) {
            // 如果没有可用风格，添加默认选项
            const option = document.createElement('option');
            option.value = "general";
            option.textContent = "普通";
            styleSelect.appendChild(option);
            return;
        }

        // 添加清空选项
        const emptyOption = document.createElement('option');
        emptyOption.value = "";
        emptyOption.textContent = "-- 无风格 --";
        styleSelect.appendChild(emptyOption);

        // 添加可用风格选项
        voiceData.style_list.forEach(style => {
            const option = document.createElement('option');
            option.value = style;
            option.textContent = style;

            // 如果是默认风格则选中
            if (style === config.defaultStyle ||
                (!config.defaultStyle && style === "general")) {
                option.selected = true;
            }

            styleSelect.appendChild(option);
        });

        // 在风格选项更新后，尝试恢复保存的风格设置
        const savedStyle = localStorage.getItem('ttsStyle');
        if (savedStyle) {
            for (let i = 0; i < styleSelect.options.length; i++) {
                if (styleSelect.options[i].value === savedStyle) {
                    styleSelect.selectedIndex = i;
                    break;
                }
            }
        }
    }

    // 初始化事件监听器
    function initEventListeners() {
        // 转换按钮点击事件
        speakButton.addEventListener('click', generateSpeech);

        // 下载按钮点击事件
        downloadButton.addEventListener('click', function () {
            if (lastAudioUrl) {
                const a = document.createElement('a');
                a.href = lastAudioUrl;
                a.download = 'speech.mp3';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        });

        // 复制链接按钮点击事件
        copyLinkButton.addEventListener('click', function () {
            if (lastAudioUrl) {
                // 获取完整的URL，包括域名部分
                const fullUrl = new URL(lastAudioUrl, window.location.origin).href;
                copyToClipboard(fullUrl);
            }
        });

        // 复制HttpTTS链接按钮点击事件
        copyHttpTtsLinkButton.addEventListener('click', function () {
            const text = "{{java.encodeURI(speakText)}}";
            const voice = voiceSelect.value;
            const displayName = voiceSelect.options[voiceSelect.selectedIndex].text;
            const style = styleSelect.value;
            const rate = "{{speakSpeed*4}}"
            const pitch = pitchInput.value;
            const apiKey = apiKeyInput.value.trim();

            // 构建HttpTTS链接
            let httpTtsLink = `${window.location.origin}${config.basePath}/reader.json?&v=${voice}&r=${rate}&p=${pitch}&n=${displayName}`;

            // 只有当style不为空时才添加
            if (style) {
                httpTtsLink += `&s=${style}`;
            }

            // 添加API Key参数（如果有）
            if (apiKey) {
                httpTtsLink += `&api_key=${apiKey}`;
            }

            window.open(httpTtsLink, '_blank')
        });

        // 复制爱阅记链接按钮点击事件
        copyIfreetimeLinkButton.addEventListener('click', function () {
            const voice = voiceSelect.value;
            const displayName = voiceSelect.options[voiceSelect.selectedIndex].text;
            const style = styleSelect.value;
            const rate = rateInput.value
            const pitch = pitchInput.value;
            const apiKey = apiKeyInput.value.trim();

            // 构建爱阅记链接
            let ifreetimeLink = `${window.location.origin}${config.basePath}/ifreetime.json?&v=${voice}&r=${rate}&p=${pitch}&n=${displayName}`;

            // 只有当style不为空时才添加
            if (style) {
                ifreetimeLink += `&s=${style}`;
            }

            // 添加API Key参数（如果有）
            if (apiKey) {
                ifreetimeLink += `&api_key=${apiKey}`;
            }

            window.open(ifreetimeLink, '_blank')
        });

        // 显示/隐藏API Key区域的按钮事件
        if (toggleApiKeyButton) {
            toggleApiKeyButton.addEventListener('click', function () {
                if (apiKeyGroup) {
                    apiKeyGroup.classList.toggle('hidden');

                    // 如果是显示操作，聚焦到输入框
                    if (!apiKeyGroup.classList.contains('hidden') && apiKeyInput) {
                        apiKeyInput.focus();
                    }
                }
            });
        }

        // API Key显示/隐藏功能
        if (togglePasswordButton) {
            togglePasswordButton.addEventListener('click', function () {
                const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
                apiKeyInput.setAttribute('type', type);

                // 更新图标
                if (type === 'password') {
                    this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>`;
                } else {
                    this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>`;
                }
            });
        }

        // 按Enter键保存API Key
        if (apiKeyInput) {
            apiKeyInput.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    saveApiKey(); // 直接调用全局保存函数
                }
            });
        }

        // 增强音频播放器
        enhanceAudioPlayer();
    }

    // 生成语音
    async function generateSpeech() {
        const text = textInput.value.trim();
        if (!text) {
            showCustomAlert('请输入要转换的文本', 'warning');
            return;
        }

        const voice = voiceSelect.value;
        const style = styleSelect.value;
        const rate = rateInput.value;
        const pitch = pitchInput.value;
        const apiKey = apiKeyInput.value.trim();

        // 保存表单数据
        saveFormData();

        // 禁用按钮，显示加载状态
        speakButton.disabled = true;
        speakButton.textContent = '生成中...';

        try {
            // 构建URL参数
            const params = new URLSearchParams({
                t: text,
                v: voice,
                r: rate,
                p: pitch
            });

            // 只有当style不为空时才添加
            if (style) {
                params.append('s', style);
            }

            // 添加API Key参数（如果有）
            if (apiKey) {
                params.append('api_key', apiKey);
            }

            const url = `${config.basePath}/tts?${params.toString()}`;

            // 使用fetch发送请求以便捕获HTTP状态码
            const response = await fetch(url);

            if (response.status === 401) {
                // 显示API Key输入框
                apiKeyGroup.classList.remove('hidden');
                showCustomAlert('请输入有效的API Key以继续操作', 'error');
                throw new Error('需要API Key授权');
            }

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            // 获取音频blob
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);

            // 更新音频播放器
            audioPlayer.src = audioUrl;
            lastAudioUrl = url; // 保存原始URL用于下载和复制链接

            // 显示结果区域
            resultSection.classList.remove('hidden');

            // 播放音频
            audioPlayer.play();
        } catch (error) {
            console.error('生成语音失败:', error);
            if (error.message !== '需要API Key授权') {
                showCustomAlert('生成语音失败，请重试', 'error');
            }
        } finally {
            // 恢复按钮状态
            speakButton.disabled = false;
            speakButton.textContent = '转换为语音';
        }
    }

    // 保存API Key到localStorage
    function saveApiKeyToLocalStorage(apiKey) {
        console.log('Saving API Key to localStorage'); // 添加调试日志
        if (apiKey) {
            localStorage.setItem('apiKey', apiKey);
        } else {
            localStorage.removeItem('apiKey');
            // 如果清除了API Key，显示输入区域
            if (apiKeyGroup) {
                apiKeyGroup.classList.remove('hidden');
            }
        }
    }

    // 从localStorage加载API Key
    function loadApiKeyFromLocalStorage() {
        const apiKey = localStorage.getItem('apiKey');

        if (apiKey && apiKeyInput) {
            apiKeyInput.value = apiKey;

            // 显示已保存状态
            if (apiKeyStatus) {
                apiKeyStatus.textContent = 'API Key 已保存';
                apiKeyStatus.className = 'api-key-status valid';
                apiKeyStatus.classList.remove('hidden');
            }
        }
    }

    // 自定义音频播放器增强
    function enhanceAudioPlayer() {
        // 监听音频播放器出现在DOM中
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    const audioPlayer = document.getElementById('audioPlayer');
                    if (audioPlayer && !audioPlayer.dataset.enhanced) {
                        // 标记为已增强，避免重复处理
                        audioPlayer.dataset.enhanced = 'true';

                        // 为音频播放器添加额外样式
                        audioPlayer.addEventListener('play', () => {
                            audioPlayer.classList.add('playing');
                            // 可以添加播放时的视觉反馈
                            resultSection.classList.add('active-playback');
                        });

                        audioPlayer.addEventListener('pause', () => {
                            audioPlayer.classList.remove('playing');
                            resultSection.classList.remove('active-playback');
                        });
                    }
                }
            });
        });

        // 开始观察DOM变化
        observer.observe(document.body, {childList: true, subtree: true});
    }

    // 复制内容到剪贴板的通用函数
    function copyToClipboard(text) {
        let success = false;
        navigator.clipboard.writeText(text).then(() => {
            showCustomAlert('链接已复制到剪贴板', 'success');
            success = true;
        }).catch(err => {
            console.error('复制失败:', err);
            // 兼容处理
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                showCustomAlert('链接已复制到剪贴板', 'success');
                success = true;
            } catch (err) {
                console.error('复制失败:', err);
                shwoCustomAlert('复制失败', 'error');
                success = false;
            }

            document.body.removeChild(textArea);
        });
        return success;
    }

    // 添加通知函数
    function showNotification(message, type = 'info', duration = 3000) {
        // 移除任何现有通知
        const existingNotifications = document.querySelectorAll('.api-key-notification');
        existingNotifications.forEach(notification => {
            document.body.removeChild(notification);
        });

        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `api-key-notification ${type}`;

        // 添加图标
        let icon = '';
        switch (type) {
            case 'success':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="#10b981"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>';
                break;
            case 'error':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="#ef4444"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>';
                break;
            case 'warning':
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="#f59e0b"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>';
                break;
            default:
                icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="#3b82f6"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>';
        }

        notification.innerHTML = `${icon}<span>${message}</span>`;

        // 添加到页面
        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // 设置自动关闭
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // 添加自定义alert函数到全局范围
    window.showCustomAlert = showCustomAlert;
});

// 自定义alert函数
function showCustomAlert(message, type = 'info', title = '', duration = 3000) {
    // 获取或创建通知容器
    let container = document.getElementById('custom-alert-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'custom-alert-container';
        container.className = 'custom-alert-container';
        document.body.appendChild(container);
    }

    // 创建通知元素
    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;

    // 根据类型设置图标
    let iconSvg = '';
    switch (type) {
        case 'success':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071-1.414-1.414-5.656 5.657-2.829-2.829-1.414 1.414L11.003 16z"/></svg>';
            break;
        case 'error':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/></svg>';
            break;
        case 'warning':
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10-10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/></svg>';
            break;
        default: // info
            iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10-10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z"/></svg>';
    }

    // 构建通知内容
    alert.innerHTML = `
        <div class="custom-alert-icon">
            ${iconSvg}
        </div>
        <div class="custom-alert-content">
            ${title ? `<h4>${title}</h4>` : ''}
            <p class="custom-alert-message">${message}</p>
        </div>
        <button class="custom-alert-close" aria-label="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"/>
            </svg>
        </button>
        <div class="custom-alert-progress"></div>
    `;

    // 添加到容器
    container.appendChild(alert);

    // 添加关闭事件
    const closeBtn = alert.querySelector('.custom-alert-close');
    closeBtn.addEventListener('click', () => {
        removeAlert(alert);
    });

    // 动画效果
    setTimeout(() => {
        alert.classList.add('show');

        // 进度条动画
        const progress = alert.querySelector('.custom-alert-progress::after');
        if (progress) {
            progress.style.animation = `progress ${duration}ms linear forwards`;
        }
    }, 10);

    // 自动关闭
    const timeout = setTimeout(() => {
        removeAlert(alert);
    }, duration);

    // 清除函数
    function removeAlert(element) {
        element.classList.remove('show');
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);
        clearTimeout(timeout);
    }

    // 返回alert对象，以便可以手动控制
    return {
        element: alert,
        close: () => removeAlert(alert)
    };
}

// 替换全局的alert函数（可选，谨慎使用）
const originalAlert = window.alert;
window.alert = function (message) {
    showCustomAlert(message, 'info');
};
