document.addEventListener('DOMContentLoaded', function() {
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
    const apiKeyButtons = document.getElementById('api-key-buttons');
    const speakButton = document.getElementById('speak');
    const downloadButton = document.getElementById('download');
    const copyLinkButton = document.getElementById('copyLink');
    const copyHttpTtsLinkButton = document.getElementById('copyHttpTtsLink');
    const audioPlayer = document.getElementById('audioPlayer');
    const resultSection = document.getElementById('resultSection');
    const charCount = document.getElementById('charCount');

    // 保存最后一个音频URL
    let lastAudioUrl = '';
    // 存储语音数据
    let voicesData = [];

    // 初始化
    initVoicesList();
    initEventListeners();
    loadApiKeyFromLocalStorage(); // 加载API Key

    // 更新字符计数
    textInput.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });

    // 更新语速值显示
    rateInput.addEventListener('input', function() {
        const value = this.value;
        rateValue.textContent = value + '%';
    });

    // 更新语调值显示
    pitchInput.addEventListener('input', function() {
        const value = this.value;
        pitchValue.textContent = value + '%';
    });

    // 语音选择变化时更新可用风格
    voiceSelect.addEventListener('change', function() {
        updateStyleOptions();
    });

    // 获取可用语音列表
    async function initVoicesList() {
        try {
            const response = await fetch(`${config.basePath}/voices`);
            if (!response.ok) throw new Error('获取语音列表失败');

            voicesData = await response.json();

            // 清空并重建选项
            voiceSelect.innerHTML = '';

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
            voiceSelect.innerHTML = '<option value="">无法加载语音列表</option>';
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
    }

    // 初始化事件监听器
    function initEventListeners() {
        // 转换按钮点击事件
        speakButton.addEventListener('click', generateSpeech);

        // 下载按钮点击事件
        downloadButton.addEventListener('click', function() {
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
        copyLinkButton.addEventListener('click', function() {
            if (lastAudioUrl) {
                // 获取完整的URL，包括域名部分
                const fullUrl = new URL(lastAudioUrl, window.location.origin).href;
                copyToClipboard(fullUrl);
            }
        });

        // 复制HttpTTS链接按钮点击事件
        copyHttpTtsLinkButton.addEventListener('click', function() {
            const text = textInput.value.trim();
            if (!text) {
                alert('请输入要转换的文本');
                return;
            }

            const voice = voiceSelect.value;
            const style = styleSelect.value;
            const rate = rateInput.value;
            const pitch = pitchInput.value;
            const apiKey = apiKeyInput.value.trim();

            // 构建HttpTTS链接
            let httpTtsLink = `${window.location.origin}${config.basePath}/tts?t=${encodeURIComponent(text)}&v=${voice}&r=${rate}&p=${pitch}&s=${style}`;

            // 添加API Key参数（如果有）
            if (apiKey) {
                httpTtsLink += `&api_key=${apiKey}`;
            }

            copyToClipboard(httpTtsLink);
        });

        // 保存API Key按钮点击事件
        const saveApiKeyButton = document.createElement('button');
        saveApiKeyButton.textContent = '保存';
        saveApiKeyButton.className = 'flex-1 h-10 px-4 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center justify-center';
        saveApiKeyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存
        `;
        saveApiKeyButton.addEventListener('click', function() {
            saveApiKeyToLocalStorage(apiKeyInput.value);

            // 显示保存成功提示
            const successNotice = document.createElement('div');
            successNotice.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md flex items-center z-50';
            successNotice.innerHTML = `
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                API Key 已保存
            `;
            document.body.appendChild(successNotice);

            // 2秒后自动移除提示
            setTimeout(() => {
                document.body.removeChild(successNotice);
            }, 2000);
        });
        apiKeyButtons.appendChild(saveApiKeyButton);

        // 清除API Key按钮点击事件
        const clearApiKeyButton = document.createElement('button');
        clearApiKeyButton.textContent = '清除';
        clearApiKeyButton.className = 'flex-1 h-10 px-4 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center justify-center';
        clearApiKeyButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            清除
        `;
        clearApiKeyButton.addEventListener('click', function() {
            localStorage.removeItem('apiKey');
            apiKeyInput.value = '';

            // 显示清除成功提示
            const successNotice = document.createElement('div');
            successNotice.className = 'fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-md flex items-center z-50';
            successNotice.innerHTML = `
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                API Key 已清除
            `;
            document.body.appendChild(successNotice);

            // 2秒后自动移除提示
            setTimeout(() => {
                document.body.removeChild(successNotice);
            }, 2000);
        });
        apiKeyButtons.appendChild(clearApiKeyButton);
    }

    // 增加密码显示/隐藏功能
    const togglePasswordButton = document.getElementById('toggle-password');
    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', function() {
            const apiKeyInput = document.getElementById('api-key');
            const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
            apiKeyInput.setAttribute('type', type);

            // 更新图标
            if (type === 'password') {
                this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>`;
            } else {
                this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>`;
            }
        });
    }

    // 复制内容到剪贴板的通用函数
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('链接已复制到剪贴板');
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
                alert('链接已复制到剪贴板');
            } catch (err) {
                console.error('复制失败:', err);
            }

            document.body.removeChild(textArea);
        });
    }

    // 生成语音
    async function generateSpeech() {
        const text = textInput.value.trim();
        if (!text) {
            alert('请输入要转换的文本');
            return;
        }

        const voice = voiceSelect.value;
        const style = styleSelect.value;
        const rate = rateInput.value;
        const pitch = pitchInput.value;
        const apiKey = apiKeyInput.value.trim();

        // 禁用按钮，显示加载状态
        speakButton.disabled = true;
        speakButton.textContent = '生成中...';

        try {
            // 构建URL参数
            const params = new URLSearchParams({
                t: text,
                v: voice,
                s: style,
                r: rate,
                p: pitch
            });

            // 添加API Key参数（如果有）
            if (apiKey) {
                params.append('api_key', apiKey);
            }

            const url = `${config.basePath}/tts?${params.toString()}`;

            // 使用fetch发送请求以便捕获HTTP状态码
            const response = await fetch(url);

            if (response.status === 401) {
                // 显示API Key输入框
                apiKeyGroup.style.display = 'flex';
                alert('请输入有效的API Key以继续操作');
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
                alert('生成语音失败，请重试');
            }
        } finally {
            // 恢复按钮状态
            speakButton.disabled = false;
            speakButton.textContent = '转换为语音';
        }
    }

    // 保存API Key到localStorage
    function saveApiKeyToLocalStorage(apiKey) {
        if (apiKey) {
            localStorage.setItem('apiKey', apiKey);
        } else {
            localStorage.removeItem('apiKey');
        }
    }

    // 从localStorage加载API Key
    function loadApiKeyFromLocalStorage() {
        const apiKey = localStorage.getItem('apiKey');
        if (apiKey) {
            apiKeyInput.value = apiKey;
        }
    }
});
