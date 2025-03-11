const encoder = new TextEncoder();
let expiredAt = null;
let endpoint = null;
const API_KEY = 'your-secret-api-key'; // 添加 API 密钥常量，可以修改为你想要的值

// 定义需要保留的 SSML 标签模式
const preserveTags = [
  { name: 'break', pattern: /<break\s+[^>]*\/>/g },
  { name: 'speak', pattern: /<speak>|<\/speak>/g },
  { name: 'prosody', pattern: /<prosody\s+[^>]*>|<\/prosody>/g },
  { name: 'emphasis', pattern: /<emphasis\s+[^>]*>|<\/emphasis>/g },
  { name: 'voice', pattern: /<voice\s+[^>]*>|<\/voice>/g },
  { name: 'say-as', pattern: /<say-as\s+[^>]*>|<\/say-as>/g },
  { name: 'phoneme', pattern: /<phoneme\s+[^>]*>|<\/phoneme>/g },
  { name: 'audio', pattern: /<audio\s+[^>]*>|<\/audio>/g },
  { name: 'p', pattern: /<p>|<\/p>/g },
  { name: 's', pattern: /<s>|<\/s>/g },
  { name: 'sub', pattern: /<sub\s+[^>]*>|<\/sub>/g },
  { name: 'mstts', pattern: /<mstts:[^>]*>|<\/mstts:[^>]*>/g }
];

function uuid(){
  return crypto.randomUUID().replace(/-/g, '')
}

// EscapeSSML 转义 SSML 内容，但保留配置的标签
function escapeSSML(ssml) {
  // 使用占位符替换标签
  let placeholders = new Map();
  let processedSSML = ssml;
  let counter = 0;

  // 处理所有配置的标签
  for (const tag of preserveTags) {
    processedSSML = processedSSML.replace(tag.pattern, function(match) {
      const placeholder = `__SSML_PLACEHOLDER_${tag.name}_${counter++}__`;
      placeholders.set(placeholder, match);
      return placeholder;
    });
  }

  // 对处理后的文本进行HTML转义
  let escapedContent = escapeBasicXml(processedSSML);

  // 恢复所有标签占位符
  placeholders.forEach((tag, placeholder) => {
    escapedContent = escapedContent.replace(placeholder, tag);
  });

  return escapedContent;
}

// 基本 XML 转义功能，只处理基本字符
function escapeBasicXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

async function handleRequest(request) {
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;

  if (path === '/tts') {
    // 从请求参数获取 API 密钥
    const apiKey = requestUrl.searchParams.get('api_key');

    // 验证 API 密钥
    if (!validateApiKey(apiKey)) {
      return new Response('Unauthorized: Invalid API key', { status: 401 });
    }

    const text = requestUrl.searchParams.get('t') || '';
    const voiceName = requestUrl.searchParams.get('v') || 'zh-CN-XiaoxiaoMultilingualNeural';
    const rate =  Number(requestUrl.searchParams.get('r')) || 0;
    const pitch = Number(requestUrl.searchParams.get('p')) || 0;
    const outputFormat = requestUrl.searchParams.get('o') || 'audio-24khz-48kbitrate-mono-mp3';
    const download = requestUrl.searchParams.get('d') || false;
    const response = await getVoice(text, voiceName, rate, pitch, outputFormat, download);
    return response;
  }

  if(path === '/voices') {
    const l = (requestUrl.searchParams.get('l') || '').toLowerCase();
    const f = requestUrl.searchParams.get('f');
    let response = await voiceList();

    if(l.length > 0) {
      response = response.filter(item => item.Locale.toLowerCase().includes(l));
    }

    if(f === "0") {
      response = response.map(item => {
        return `
- !!org.nobody.multitts.tts.speaker.Speaker
  avatar: ''
  code: ${item.ShortName}
  desc: ''
  extendUI: ''
  gender:${item.Gender === 'Female' ? '0' : '1'}
  name: ${item.LocalName}
  note: 'wpm: ${item.WordsPerMinute||''}'
  param: ''
  sampleRate: ${item.SampleRateHertz|| '24000'}
  speed: 1.5
  type: 1
  volume: 1`
    })
      return new Response(response.join('\n'), headers={
        'Content-Type': 'application/html; charset=utf-8'
      });
    }else if(f === "1"){
      const map = new Map(response.map(item => [item.ShortName, item.LocalName]))
      return new Response(JSON.stringify(Object.fromEntries(map)), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }else {
      return new Response(JSON.stringify(response), {
        headers:{
        'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }
  }

  const baseUrl = request.url.split('://')[0] + "://" +requestUrl.host;
  return new Response(`
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Microsoft TTS API</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'ms-blue': '#0078d4',
              'ms-dark-blue': '#005a9e',
            }
          }
        }
      }
    </script>
  </head>
  <body class="bg-gray-50 text-gray-800">
    <!-- 导航栏 -->
    <nav class="bg-ms-blue shadow-lg">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <svg class="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span class="ml-2 font-bold text-white text-xl">Microsoft TTS API</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 主要功能区 -->
      <div class="flex flex-col lg:flex-row gap-8">
        <!-- 左边栏：语音转换 -->
        <div class="lg:w-2/3">
          <div class="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div class="px-4 py-5 sm:px-6">
              <h2 class="text-lg font-medium text-gray-900">在线文本转语音</h2>
              <p class="mt-1 text-sm text-gray-500">输入文本并选择语音进行转换</p>
            </div>
            <div class="px-4 py-5 sm:p-6">
              <form id="ttsForm" class="space-y-6">
                <div>
                  <label for="apiKey" class="block text-sm font-medium text-gray-700">API Key</label>
                  <input type="text" id="apiKey" name="apiKey" required
                    class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ms-blue focus:border-ms-blue"
                    placeholder="输入API Key" />
                </div>

                <div>
                  <label for="text" class="block text-sm font-medium text-gray-700">输入文本</label>
                  <textarea id="text" name="text" rows="4" required
                    class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ms-blue focus:border-ms-blue"
                    placeholder="请输入要转换的文本"></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div class="flex justify-between mb-1">
                      <label for="languageFilter" class="block text-sm font-medium text-gray-700">语言</label>
                    </div>
                    <select id="languageFilter" name="languageFilter"
                      class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-ms-blue focus:border-ms-blue sm:text-sm"
                      onchange="filterVoicesByLanguage()">
                      <option value="zh">中文 (Chinese)</option>
                      <option value="all">所有语言</option>
                      <option value="en">英文 (English)</option>
                      <option value="ja">日文 (Japanese)</option>
                      <option value="ko">韩文 (Korean)</option>
                      <option value="fr">法语 (French)</option>
                      <option value="de">德语 (German)</option>
                      <option value="es">西班牙语 (Spanish)</option>
                      <option value="ru">俄语 (Russian)</option>
                    </select>
                  </div>

                  <div>
                    <div class="flex justify-between mb-1">
                      <label for="voice" class="block text-sm font-medium text-gray-700">选择语音</label>
                    </div>
                    <select id="voice" name="voice"
                      class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-ms-blue focus:border-ms-blue sm:text-sm">
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label for="rate" class="block text-sm font-medium text-gray-700">语速调整</label>
                    <div class="flex items-center mt-2">
                      <span id="rateValue" class="w-8 text-sm text-gray-500">0</span>
                      <input type="range" id="rate" name="rate" min="-100" max="100" value="0"
                        class="mt-1 block w-full" oninput="document.getElementById('rateValue').textContent=this.value" />
                    </div>
                  </div>

                  <div>
                    <label for="pitch" class="block text-sm font-medium text-gray-700">音调调整</label>
                    <div class="flex items-center mt-2">
                      <span id="pitchValue" class="w-8 text-sm text-gray-500">0</span>
                      <input type="range" id="pitch" name="pitch" min="-100" max="100" value="0"
                        class="mt-1 block w-full" oninput="document.getElementById('pitchValue').textContent=this.value" />
                    </div>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                  <button type="submit"
                    class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-ms-blue hover:bg-ms-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ms-blue">
                    生成语音
                  </button>
                  <button type="button" id="downloadBtn" style="display:none;"
                    class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    下载音频
                  </button>
                </div>

                <div id="voiceLoadError" role="alert" class="mt-4 rounded-md bg-red-50 p-4" style="display: none;">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <h3 class="text-sm font-medium text-red-800">无法加载语音列表</h3>
                      <div class="mt-2 text-sm text-red-700">
                        <p>显示默认语音列表。请检查网络连接或稍后再试。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>

              <div id="audioContainer" class="mt-6 rounded-md bg-gray-50 p-4 border border-gray-200" style="display: none;">
                <audio id="audioPlayer" controls class="w-full"></audio>
              </div>
            </div>
          </div>
        </div>

        <!-- 右边栏：API文档 -->
        <div class="lg:w-1/3 space-y-6">
          <!-- 关于卡片 -->
          <div class="bg-white overflow-hidden shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900">关于服务</h3>
              <div class="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Microsoft TTS API 是一个高质量的文本转语音服务，支持多种语言和声音。
                  通过简单的 API 调用，可以将文本转换为自然流畅的语音。
                </p>
              </div>
              <div class="mt-3 bg-blue-50 p-3 rounded-md">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3 flex-1 md:flex md:justify-between">
                    <p class="text-sm text-blue-700">
                      支持 SSML 标签，可以精确控制语音合成效果
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- API 文档链接 -->
          <div class="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg font-medium text-gray-900">API 文档</h3>
            </div>
            <div class="px-4 py-5 sm:p-6">
              <h4 class="text-base font-medium text-gray-900 mb-2">文本转语音 API</h4>
              <code class="text-sm block bg-gray-50 p-2 rounded mb-2 overflow-auto">/tts?api_key={key}&t={text}&v={voice}&r={rate}&p={pitch}</code>
              <ul class="list-disc pl-5 text-sm space-y-1">
                <li><span class="text-red-600">api_key</span>: API密钥 [必填]</li>
                <li><span class="text-red-600">t</span>: 文本内容 [必填]</li>
                <li>v: 语音名称 [可选]</li>
                <li>r: 语速调整 (-100~100) [可选]</li>
                <li>p: 音调调整 (-100~100) [可选]</li>
              </ul>

              <h4 class="text-base font-medium text-gray-900 mt-6 mb-2">获取语音列表 API</h4>
              <code class="text-sm block bg-gray-50 p-2 rounded mb-2 overflow-auto">/voices?l={locale}&f={format}</code>
              <ul class="list-disc pl-5 text-sm space-y-1">
                <li>l: 语言筛选 (如 'zh', 'en')</li>
                <li>f: 返回格式 (0=TTS格式, 1=JSON格式)</li>
              </ul>

              <div class="mt-6 bg-amber-50 p-3 rounded-md">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-amber-800">重要提示</h3>
                    <div class="mt-2 text-sm text-amber-700">
                      <ul class="list-disc pl-5 space-y-1">
                        <li>所有请求必须提供有效的 API 密钥</li>
                        <li>请确保中文文本进行 URL 编码</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="bg-gray-100 border-t border-gray-200">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p class="text-gray-500 text-sm text-center">&copy; ${new Date().getFullYear()} Microsoft TTS API 服务</p>
      </div>
    </footer>

    <script>
      // 存储所有语音数据
      let allVoices = [];
      let languageGroups = new Map();

      document.getElementById('ttsForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const apiKey = document.getElementById('apiKey').value;
        const text = encodeURIComponent(document.getElementById('text').value);
        const voice = document.getElementById('voice').value;
        const rate = document.getElementById('rate').value;
        const pitch = document.getElementById('pitch').value;

        if (!text) {
          alert('请输入要转换的文本');
          return;
        }

        if (!apiKey) {
          alert('请输入API Key');
          return;
        }

        const url = \`${baseUrl}/tts?api_key=\${apiKey}&t=\${text}&v=\${voice}&r=\${rate}&p=\${pitch}\`;

        try {
          const audioPlayer = document.getElementById('audioPlayer');
          audioPlayer.src = url;
          audioPlayer.play();

          document.getElementById('audioContainer').style.display = 'block';
          document.getElementById('downloadBtn').style.display = 'inline-block';

          document.getElementById('downloadBtn').onclick = function() {
            const downloadUrl = url + '&d=true';
            window.location.href = downloadUrl;
          };
        } catch (error) {
          alert('生成音频失败: ' + error.message);
        }
      });

      // 按语言筛选语音
      function filterVoicesByLanguage() {
        const languageFilter = document.getElementById('languageFilter').value;
        const voiceSelect = document.getElementById('voice');

        // 清空当前选项
        voiceSelect.innerHTML = '';

        if (languageFilter === 'all') {
          // 显示所有语言，按语言分组
          languageGroups.forEach((voices, locale) => {
            const group = document.createElement('optgroup');
            group.label = getLanguageDisplayName(locale);

            voices.forEach(voice => {
              const option = document.createElement('option');
              option.value = voice.ShortName;
              option.text = \`\${voice.LocalName || voice.DisplayName} (\${voice.Gender === 'Female' ? '女' : '男'})\`;
              group.appendChild(option);
            });

            voiceSelect.appendChild(group);
          });
        } else {
          // 显示特定语言
          const voices = languageGroups.get(languageFilter) || [];
          if (voices.length > 0) {
            // 为选定的语言添加标记组
            const group = document.createElement('optgroup');
            group.label = getLanguageDisplayName(languageFilter);

            voices.forEach(voice => {
              const option = document.createElement('option');
              option.value = voice.ShortName;
              option.text = \`\${voice.LocalName || voice.DisplayName} (\${voice.Gender === 'Female' ? '女' : '男'})\`;
              group.appendChild(option);
            });

            voiceSelect.appendChild(group);

            // 如果有声音，默认选择第一个
            if (voices.length > 0) {
              voiceSelect.value = voices[0].ShortName;
            }
          } else {
            // 如果没有找到语音，显示提示
            const option = document.createElement('option');
            option.text = '没有找到语音';
            option.disabled = true;
            voiceSelect.appendChild(option);
          }
        }
      }

      // 获取语言显示名称
      function getLanguageDisplayName(locale) {
        const languageNames = {
          'zh': '中文 (Chinese)',
          'en': '英文 (English)',
          'ja': '日文 (Japanese)',
          'ko': '韩文 (Korean)',
          'fr': '法语 (French)',
          'de': '德语 (German)',
          'es': '西班牙语 (Spanish)',
          'it': '意大利语 (Italian)',
          'pt': '葡萄牙语 (Portuguese)',
          'ru': '俄语 (Russian)',
          'ar': '阿拉伯语 (Arabic)',
          'hi': '印地语 (Hindi)',
          'th': '泰语 (Thai)',
          'vi': '越南语 (Vietnamese)',
          'id': '印尼语 (Indonesian)',
          'ms': '马来语 (Malay)',
          'nl': '荷兰语 (Dutch)',
          'pl': '波兰语 (Polish)',
          'tr': '土耳其语 (Turkish)'
        };

        // 提取主要语言代码（如zh-CN中的zh）
        const mainCode = locale.split('-')[0];
        return languageNames[mainCode] || locale;
      }

      // 加载可用语音列表
      async function loadVoices() {
        try {
          const response = await fetch('${baseUrl}/voices');
          if (response.ok) {
            allVoices = await response.json();

            // 按语言对语音进行分组
            allVoices.forEach(voice => {
              const locale = voice.Locale.split('-')[0]; // 提取主要语言代码
              if (!languageGroups.has(locale)) {
                languageGroups.set(locale, []);
              }
              languageGroups.get(locale).push(voice);
            });

            // 对每种语言的语音按名称排序
            languageGroups.forEach((voices, locale) => {
              voices.sort((a, b) => {
                const nameA = a.LocalName || a.DisplayName;
                const nameB = b.LocalName || b.DisplayName;
                return nameA.localeCompare(nameB);
              });
            });

            // 默认显示中文语音
            filterVoicesByLanguage();

          } else {
            console.error('获取语音列表失败：', response.status);
            showDefaultVoices();
          }
        } catch (error) {
          console.error('加载语音列表失败:', error);
          showDefaultVoices();
        }
      }

      // 加载默认语音列表
      function showDefaultVoices() {
        document.getElementById('voiceLoadError').style.display = 'block';
        const voiceSelect = document.getElementById('voice');
        voiceSelect.innerHTML = '';

        const defaultVoices = [
          { value: "zh-CN-XiaoxiaoNeural", text: "晓晓(女) - zh-CN-XiaoxiaoNeural" },
          { value: "zh-CN-YunxiNeural", text: "云希(男) - zh-CN-YunxiNeural" },
          { value: "zh-CN-XiaomoNeural", text: "晓墨(女) - zh-CN-XiaomoNeural" },
          { value: "zh-CN-YunjianNeural", text: "云健(男) - zh-CN-YunjianNeural" },
          { value: "zh-CN-XiaochenNeural", text: "晓陈(儿童) - zh-CN-XiaochenNeural" },
          { value: "en-US-AriaNeural", text: "Aria(女) - en-US-AriaNeural" },
          { value: "en-US-GuyNeural", text: "Guy(男) - en-US-GuyNeural" }
        ];

        const group = document.createElement('optgroup');
        group.label = '默认语音';

        defaultVoices.forEach(voice => {
          const option = document.createElement('option');
          option.value = voice.value;
          option.text = voice.text;
          group.appendChild(option);
        });

        voiceSelect.appendChild(group);

        // 默认选择第一个语音
        if (defaultVoices.length > 0) {
          voiceSelect.value = defaultVoices[0].value;
        }
      }

      // 页面加载完成后加载语音列表
      window.onload = loadVoices;
    </script>
  </body>
  </html>
  `, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }});
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function getEndpoint() {
  const endpointUrl = 'https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0';
  const headers = {
    'Accept-Language': 'zh-Hans',
    'X-ClientVersion': '4.0.530a 5fe1dc6c',
    'X-UserId': generateUserId(), // 使用随机生成的UserId
    'X-HomeGeographicRegion': 'zh-Hans-CN',
    'X-ClientTraceId': uuid(), // 直接使用uuid函数生成

    'X-MT-Signature': await sign(endpointUrl),
    'User-Agent': 'okhttp/4.5.0',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': '0',
    'Accept-Encoding': 'gzip'
  };

  return fetch(endpointUrl, {
    method: 'POST',
    headers: headers
  }).then(res => res.json());
}

// 随机生成 X-UserId，格式为 16 位字符（字母+数字）
function generateUserId() {
  const chars = 'abcdef0123456789'; // 只使用16进制字符，与原格式一致
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sign(urlStr) {
  const url = urlStr.split('://')[1];
  const encodedUrl = encodeURIComponent(url);
  const uuidStr = uuid();
  const formattedDate = dateFormat();
  const bytesToSign = `MSTranslatorAndroidApp${encodedUrl}${formattedDate}${uuidStr}`.toLowerCase();
  const decode = await base64ToBytes('oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw==');
  const signData = await hmacSha256(decode, bytesToSign);
  const signBase64 = await bytesToBase64(signData);
  return `MSTranslatorAndroidApp::${signBase64}::${formattedDate}::${uuidStr}`;
}

function dateFormat() {
  const formattedDate = new Date().toUTCString().replace(/GMT/, '').trim() + 'GMT';
  return formattedDate.toLowerCase();
}

function getSsml(text, voiceName, rate, pitch) {
  text = escapeSSML(text);
  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="zh-CN"> <voice name="${voiceName}"> <mstts:express-as style="general" styledegree="1.0" role="default"> <prosody rate="${rate}%" pitch="${pitch}%" volume="50">${text}</prosody> </mstts:express-as> </voice> </speak>`;
}

function voiceList() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.26',
    'X-Ms-Useragent': 'SpeechStudio/2021.05.001',
    'Content-Type': 'application/json',
    'Origin': 'https://azure.microsoft.com',
    'Referer': 'https://azure.microsoft.com'
  };

  return fetch('https://eastus.api.speech.microsoft.com/cognitiveservices/voices/list', {
    headers: headers,
    cf: {
      // Always cache this fetch regardless of content type
      // for a max of 5 seconds before revalidating the resource
      cacheTtl: 600,
      cacheEverything: true,
      cacheKey: "mstrans-voice-list",
    },
  }).then(res => res.json());
}

async function hmacSha256(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
return new Uint8Array(signature);
}

async function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function bytesToBase64(bytes) {
  const base64 = btoa(String.fromCharCode.apply(null, bytes));
  return base64;
}



// API 密钥验证函数
function validateApiKey(apiKey) {
  return apiKey === API_KEY;
}

async function getVoice(text, voiceName = 'zh-CN-XiaoxiaoMultilingualNeural', rate = 0, pitch = 0, outputFormat='audio-24khz-48kbitrate-mono-mp3', download=false) {
  // get expiredAt from endpoint.t (jwt token)
  if (!expiredAt || Date.now() / 1000 > expiredAt - 60) {
    endpoint = await getEndpoint();
    const jwt = endpoint.t.split('.')[1];
    const decodedJwt = JSON.parse(atob(jwt));
    expiredAt = decodedJwt.exp;
    const seconds = (expiredAt - Date.now() / 1000);
    clientId = uuid();
    console.log('getEndpoint, expiredAt:' + (seconds/ 60) + 'm left')
  } else {
    const seconds = (expiredAt - Date.now() / 1000);
    console.log('expiredAt:' + (seconds/ 60) + 'm left')
  }

  const url = `https://${endpoint.r}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const headers = {
    'Authorization': endpoint.t,
    'Content-Type': 'application/ssml+xml',
    'User-Agent': 'okhttp/4.5.0',
    'X-Microsoft-OutputFormat': outputFormat
  };
  const ssml = getSsml(text, voiceName, rate, pitch);

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: ssml
  });
  if(response.ok) {
    if (!download) {
      return response;
    }
    const resp = new Response(response.body, response);
    resp.headers.set('Content-Disposition', `attachment; filename="${uuid()}.mp3"`);
    return resp;
  } else {
    return new Response(response.statusText, { status: response.status });
  }
}