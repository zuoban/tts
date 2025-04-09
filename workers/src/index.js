const encoder = new TextEncoder();
let expiredAt = null;
let endpoint = null;
// 添加缓存相关变量
let voiceListCache = null;
let voiceListCacheTime = null;
const VOICE_CACHE_DURATION =4 *60 * 60 * 1000; // 4小时，单位毫秒

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
      // 改进 401 错误响应，提供更友好的错误信息
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: '无效的 API 密钥，请确保您提供了正确的密钥。',
        status: 401
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    const text = requestUrl.searchParams.get('t') || '';
    const voiceName = requestUrl.searchParams.get('v') || 'zh-CN-XiaoxiaoMultilingualNeural';
    const rate =  Number(requestUrl.searchParams.get('r')) || 0;
    const pitch = Number(requestUrl.searchParams.get('p')) || 0;
    const style = requestUrl.searchParams.get('s') || 'general';
    const outputFormat = requestUrl.searchParams.get('o') || 'audio-24khz-48kbitrate-mono-mp3';
    const download = requestUrl.searchParams.get('d') || false;
    const response = await getVoice(text, voiceName, rate, pitch, style, outputFormat, download);
    return response;
  }

  // 添加 reader.json 路径处理
  if (path === '/reader.json') {
    // 从请求参数获取 API 密钥
    const apiKey = requestUrl.searchParams.get('api_key');

    // 验证 API 密钥
    if (!validateApiKey(apiKey)) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: '无效的 API 密钥，请确保您提供了正确的密钥。',
        status: 401
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 从URL参数获取
    const voice = requestUrl.searchParams.get('v') || '';
    const rate = requestUrl.searchParams.get('r') || '';
    const pitch = requestUrl.searchParams.get('p') || '';
    const style = requestUrl.searchParams.get('s') || '';
    const displayName = requestUrl.searchParams.get('n') || 'Microsoft TTS';

    // 构建基本URL
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

    // 构建URL参数
    const urlParams = ["t={{java.encodeURI(speakText)}}", "r={{speakSpeed*4}}"];

    // 只有有值的参数才添加
    if (voice) {
      urlParams.push(`v=${voice}`);
    }

    if (pitch) {
      urlParams.push(`p=${pitch}`);
    }

    if (style) {
      urlParams.push(`s=${style}`);
    }

    if (apiKey) {
      urlParams.push(`api_key=${apiKey}`);
    }

    const url = `${baseUrl}/tts?${urlParams.join('&')}`;

    // 返回 reader 响应
    return new Response(JSON.stringify({
      id: Date.now(),
      name: displayName,
      url: url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  // 添加 ifreetime.json 路径处理
  if (path === '/ifreetime.json') {
    // 从请求参数获取 API 密钥
    const apiKey = requestUrl.searchParams.get('api_key');

    // 验证 API 密钥
    if (!validateApiKey(apiKey)) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: '无效的 API 密钥，请确保您提供了正确的密钥。',
        status: 401
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    // 从URL参数获取
    const voice = requestUrl.searchParams.get('v') || '';
    const rate = requestUrl.searchParams.get('r') || '';
    const pitch = requestUrl.searchParams.get('p') || '';
    const style = requestUrl.searchParams.get('s') || '';
    const displayName = requestUrl.searchParams.get('n') || 'Microsoft TTS';

    // 构建基本URL
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    const url = `${baseUrl}/tts`;

    // 生成随机的唯一ID
    const ttsConfigID = crypto.randomUUID();

    // 构建请求参数
    const params = {
      "t": "%@", // %@ 是 IFreeTime 中的文本占位符
      "v": voice,
      "r": rate,
      "p": pitch,
      "s": style
    };

    // 如果需要API密钥认证，添加到请求参数
    if (apiKey) {
      params["api_key"] = apiKey;
    }

    // 构建响应
    const response = {
      loginUrl: "",
      maxWordCount: "",
      customRules: {},
      ttsConfigGroup: "Azure",
      _TTSName: displayName,
      _ClassName: "JxdAdvCustomTTS",
      _TTSConfigID: ttsConfigID,
      httpConfigs: {
        useCookies: 1,
        headers: {}
      },
      voiceList: [],
      ttsHandles: [
        {
          paramsEx: "",
          processType: 1,
          maxPageCount: 1,
          nextPageMethod: 1,
          method: 1,
          requestByWebView: 0,
          parser: {},
          nextPageParams: {},
          url: url,
          params: params,
          httpConfigs: {
            useCookies: 1,
            headers: {}
          }
        }
      ]
    };

    // 返回 IFreeTime 响应
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }

  // 添加 OpenAI 兼容接口路由
  if (path === '/v1/audio/speech' || path === '/audio/speech') {
    return await handleOpenAITTS(request);
  }

  if(path === '/voices') {
    const l = (requestUrl.searchParams.get('l') || '').toLowerCase();
    const f = requestUrl.searchParams.get('f');
    let response = await voiceList();

    if(l.length > 0) {
      response = response.filter(item => item.Locale.toLowerCase().includes(l));
    }

    return new Response(JSON.stringify(response), {
      headers:{
      'Content-Type': 'application/json; charset=utf-8'
      }
    });
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
    <nav class="bg-ms-blue shadow-2xl">
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
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 justify-center" aria-label="Tabs">
          <button class="tab-link py-4 px-1 text-ms-blue border-b-2 border-ms-blue hover:text-ms-dark-blue" data-tab="tab1">在线文本转语音</button>
          <button class="tab-link py-4 px-1 text-gray-500 hover:text-ms-dark-blue" data-tab="tab2">API文档</button>
          <button class="tab-link py-4 px-1 text-gray-500 hover:text-ms-dark-blue" data-tab="tab3">关于服务</button>
        </nav>
      </div>

      <div id="tab1" class="tab-content mt-6">
        <!-- 在线文本转语音表单内容 -->
        <div class="flex flex-col lg:flex-row gap-8">
          <!-- 左边栏：语音转换 -->
          <div class="lg:w-3/4 mx-auto">
            <div class="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
              <div class="px-4 py-5 sm:px-6">
                <h2 class="text-lg font-medium text-gray-900">在线文本转语音</h2>
                <p class="mt-1 text-sm text-gray-500">输入文本并选择语音进行转换</p>
              </div>
              <div class="px-4 py-5 sm:p-6">
                <form id="ttsForm" class="space-y-6">
                  <!-- 添加错误提示区域 -->
                  <div id="apiErrorAlert" class="rounded-md bg-red-50 p-4" style="display: none;">
                    <div class="flex">
                      <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800" id="apiErrorTitle">错误</h3>
                        <div class="mt-2 text-sm text-red-700">
                          <p id="apiErrorMessage"></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label for="apiKey" class="block text-sm font-medium text-gray-700">API Key</label>
                    <div class="mt-1 flex rounded-md shadow-sm">
                      <div id="apiKeyInputGroup" class="flex-grow flex relative">
                        <input type="password" id="apiKey" name="apiKey" required
                          class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ms-blue focus:border-ms-blue"
                          placeholder="输入API Key" />
                        <button type="button" id="toggleApiKeyVisibility" class="absolute inset-y-0 right-0 px-3 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 06 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                      <button type="button" id="saveApiKey" class="ml-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-ms-blue hover:bg-ms-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ms-blue">
                        保存
                      </button>
                    </div>
                    <div id="savedApiKeyInfo" style="display:none;" class="mt-2 flex items-center justify-between">
                      <span class="text-sm text-green-600 flex items-center">
                        API Key 已保存
                      </span>
                      <button type="button" id="editApiKey" class="text-sm text-ms-blue hover:text-ms-dark-blue">
                        编辑
                      </button>
                    </div>
                  </div>

                  <div>
                    <label for="text" class="block text-sm font-medium text-gray-700">输入文本</label>
                    <textarea id="text" name="text" rows="4" required
                      class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-ms-blue focus:border-ms-blue"
                      placeholder="请输入要转换的文本"></textarea>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label for="voice" class="block text-sm font-medium text-gray-700">选择语音</label>
                      <select id="voice" name="voice"
                        class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-ms-blue focus:border-ms-blue sm:text-sm">
                      </select>
                    </div>

                    <div>
                      <label for="style" class="block text-sm font-medium text-gray-700">语音风格</label>
                      <select id="style" name="style"
                        class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-ms-blue focus:border-ms-blue sm:text-sm">
                        <option value="general" selected>标准</option>
                        <option value="advertisement_upbeat">广告热情</option>
                        <option value="affectionate">亲切</option>
                        <option value="angry">愤怒</option>
                        <option value="assistant">助理</option>
                        <option value="calm">平静</option>
                        <option value="chat">随意</option>
                        <option value="cheerful">愉快</option>
                        <option value="customerservice">客服</option>
                        <option value="depressed">沮丧</option>
                        <option value="disgruntled">不满</option>
                        <option value="documentary-narration">纪录片解说</option>
                        <option value="embarrassed">尴尬</option>
                        <option value="empathetic">共情</option>
                        <option value="envious">羡慕</option>
                        <option value="excited">兴奋</option>
                        <option value="fearful">恐惧</option>
                        <option value="friendly">友好</option>
                        <option value="gentle">温柔</option>
                        <option value="hopeful">希望</option>
                        <option value="lyrical">抒情</option>
                        <option value="narration-professional">专业叙述</option>
                        <option value="narration-relaxed">轻松叙述</option>
                        <option value="newscast">新闻播报</option>
                        <option value="newscast-casual">随意新闻</option>
                        <option value="newscast-formal">正式新闻</option>
                        <option value="poetry-reading">诗朗诵</option>
                        <option value="sad">悲伤</option>
                        <option value="serious">严肃</option>
                        <option value="shouting">大喊</option>
                        <option value="sports_commentary">体育解说</option>
                        <option value="sports_commentary_excited">激动体育解说</option>
                        <option value="whispering">低语</option>
                        <option value="terrified">恐慌</option>
                        <option value="unfriendly">冷漠</option>
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
                    <button type="button" id="getReaderLinkBtn"
                      class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ms-blue">
                      导入阅读
                    </button>
                    <button type="button" id="getIFreeTimeLinkBtn"
                      class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ms-blue">
                      导入爱阅记
                    </button>
                  </div>

                  <div id="voiceLoadError" role="alert" class="mt-4 rounded-md bg-red-50 p-4" style="display: none;">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fill-rule="evenodd" d="M10 18a8 8 100-16 8 8 000 16zM8.707 7.293a1 1 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293-1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
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
        </div>
      </div>

      <div id="tab2" class="tab-content mt-6" style="display: none;">
        <!-- API文档部分 -->
        <div class="w-full lg:w-2/3 mx-auto space-y-6">
          <!-- API 文档链接 -->
          <div class="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
            <div class="px-4 py-5 sm:px-6">
              <h3 class="text-lg font-medium text-gray-900">API 文档</h3>
            </div>
            <div class="px-4 py-5 sm:p-6">
              <h4 class="text-base font-medium text-gray-900 mb-2">文本转语音 API</h4>
              <code class="text-sm block bg-gray-50 p-2 rounded mb-2 overflow-auto">/tts?api_key={key}&t={text}&v={voice}&r={rate}&p={pitch}&s={style}</code>
              <ul class="list-disc pl-5 text-sm space-y-1">
                <li><span class="text-red-600">api_key</span>: API密钥 [必填]</li>
                <li><span class="text-red-600">t</span>: 文本内容 [必填]</li>
                <li>v: 语音名称 [可选]</li>
                <li>r: 语速调整 (-100~100) [可选]</li>
                <li>p: 音调调整 (-100~100) [可选]</li>
                <li>s: 语音风格 (general, cheerful, sad等) [可选]</li>
              </ul>

              <h4 class="text-base font-medium text-gray-900 mt-6 mb-2">OpenAI 兼容接口</h4>
              <code class="text-sm block bg-gray-50 p-2 rounded mb-2 overflow-auto">/v1/audio/speech 或 /audio/speech</code>
              <p class="text-sm mb-2">使用方式与 OpenAI TTS API 相同，支持以下参数：</p>
              <ul class="list-disc pl-5 text-sm space-y-1">
                <li><span class="text-red-600">model</span>: 模型名称 [必填]</li>
                <li><span class="text-red-600">input</span>: 文本内容 [必填]</li>
                <li>voice: 声音类型 (alloy, echo, fable, onyx, nova, shimmer)</li>
                <li>speed: 语速 (0.25~4.0)</li>
                <li>response_format: 输出格式 (mp3, opus)</li>
              </ul>

              <div class="mt-2 bg-gray-50 p-2 rounded">
                <p class="text-xs text-gray-600 mb-1">示例请求:</p>
                <code class="text-xs block overflow-auto whitespace-pre-wrap">
curl -X POST ${baseUrl}/v1/audio/speech \\
  -H "Authorization: Bearer your-secret-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "tts-1",
    "input": "这是一个语音合成测试",
    "voice": "alloy"
  }' --output output.mp3
                </code>
              </div>

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
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 11-2 0 1 1 12 0zm-1-8a1 1 00-1 1v3a1 1 001 1h1a1 1 100-2v-3a1 1 00-1-1H9z" clip-rule="evenodd" />
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

      <div id="tab3" class="tab-content mt-6" style="display: none;">
        <!-- 关于服务部分 -->
        <div class="w-full lg:w-2/3 mx-auto space-y-6">
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
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0116 0zm-7-4a1 1 11-2 0 1 1 12 0zm-1-8a1 1 00-1 1v3a1 1 001 1h1a1 1 100-2v-3a1 1 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3 flex-1 md:flex md:justify-between">
                    <p class="text-sm text-blue-700">
                      支持 SSML 标签和 OpenAI 兼容接口
                    </p>
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

      // 在表单提交事件监听器之前添加语音选择变更事件监听
      document.addEventListener('DOMContentLoaded', function() {
        // 添加对语音选择变化的监听
        document.getElementById('voice').addEventListener('change', function() {
          updateStyleOptions(this.value);
        });

        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');

        tabLinks.forEach(link => {
          link.addEventListener('click', () => {
            tabLinks.forEach(l => {
              l.classList.remove('text-ms-blue', 'border-ms-blue');
              l.classList.add('text-gray-500');
            });
            link.classList.add('text-ms-blue', 'border-ms-blue');
            link.classList.remove('text-gray-500');

            const targetId = link.getAttribute('data-tab');
            tabContents.forEach(tc => {
              tc.style.display = (tc.id === targetId) ? '' : 'none';
            });
          });
        });

        // 添加获取Reader链接按钮的事件监听
        document.getElementById('getReaderLinkBtn').addEventListener('click', function() {
          const apiKey = document.getElementById('apiKey').value || localStorage.getItem('tts_api_key') || '';
          const voice = document.getElementById('voice').value;
          const rate = document.getElementById('rate').value;
          const pitch = document.getElementById('pitch').value;
          const style = document.getElementById('style').value;
          const displayName = document.getElementById('voice').options[document.getElementById('voice').selectedIndex].text || '微软TTS';

          // 保存当前设置到localStorage
          saveFormValuesToLocalStorage(voice, rate, pitch, style, document.getElementById('text').value);

          // 构建URL参数
          const params = new URLSearchParams();
          if (apiKey) params.append('api_key', apiKey);
          if (voice) params.append('v', voice);
          if (rate) params.append('r', rate);
          if (pitch) params.append('p', pitch);
          if (style) params.append('s', style);
          params.append('n', displayName);

          // 打开新标签页
          window.open(\`\${window.location.origin}/reader.json?\${params.toString()}\`, '_blank');
        });

        // 添加获取IFreeTime链接按钮的事件监听
        document.getElementById('getIFreeTimeLinkBtn').addEventListener('click', function() {
          const apiKey = document.getElementById('apiKey').value || localStorage.getItem('tts_api_key') || '';
          const voice = document.getElementById('voice').value;
          const rate = document.getElementById('rate').value;
          const pitch = document.getElementById('pitch').value;
          const style = document.getElementById('style').value;
          const displayName = document.getElementById('voice').options[document.getElementById('voice').selectedIndex].text || '微软TTS';

          // 保存当前设置到localStorage
          saveFormValuesToLocalStorage(voice, rate, pitch, style, document.getElementById('text').value);

          // 构建URL参数
          const params = new URLSearchParams();
          if (apiKey) params.append('api_key', apiKey);
          if (voice) params.append('v', voice);
          if (rate) params.append('r', rate);
          if (pitch) params.append('p', pitch);
          if (style) params.append('s', style);
          params.append('n', displayName);

          // 打开新标签页
          window.open(\`\${window.location.origin}/ifreetime.json?\${params.toString()}\`, '_blank');
        });
      });

      document.getElementById('ttsForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        // 隐藏先前的错误信息
        document.getElementById('apiErrorAlert').style.display = 'none';

        // 获取API Key (从输入框或localStorage)
        const apiKey = document.getElementById('apiKey').value || localStorage.getItem('tts_api_key') || '';
        const text = encodeURIComponent(document.getElementById('text').value);
        const voice = document.getElementById('voice').value;
        const rate = document.getElementById('rate').value;
        const pitch = document.getElementById('pitch').value;
        const style = document.getElementById('style').value; // 获取选择的风格

        // 保存表单值到localStorage
        saveFormValuesToLocalStorage(voice, rate, pitch, style, document.getElementById('text').value);

        if (!text) {
          showError('请输入要转换的文本', '文本内容不能为空');
          return;
        }

        if (!apiKey) {
          showError('请输入API Key', 'API密钥不能为空');
          return;
        }

        const url = \`${baseUrl}/tts?api_key=\${apiKey}&t=\${text}&v=\${voice}&r=\${rate}&p=\${pitch}&s=\${style}\`;

        try {
          const response = await fetch(url);

          if (!response.ok) {
            // 处理错误响应
            if (response.status === 401) {
              try {
                const errorData = await response.json();
                showError('认证失败', errorData.message || '无效的API密钥，请确保您提供了正确的密钥');
              } catch (e) {
                showError('认证失败', '无效的API密钥，请确保您提供了正确的密钥');
              }
              return;
            } else {
              showError('请求失败');
              return;
            }
          }

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
          showError('生成音频失败', error.message);
        }
      });

      // 保存表单值到localStorage的函数
      function saveFormValuesToLocalStorage(voice, rate, pitch, style, text) {
        localStorage.setItem('tts_voice', voice);
        localStorage.setItem('tts_rate', rate);
        localStorage.setItem('tts_pitch', pitch);
        localStorage.setItem('tts_style', style);
        localStorage.setItem('tts_text', text);
      }

      // 从localStorage加载表单值的函数
      function loadFormValuesFromLocalStorage() {
        const voice = localStorage.getItem('tts_voice');
        const rate = localStorage.getItem('tts_rate');
        const pitch = localStorage.getItem('tts_pitch');
        const style = localStorage.getItem('tts_style');
        const text = localStorage.getItem('tts_text');

        // 设置语音选择（在语音列表加载完成后设置）
        if (voice) {
          const voiceSelect = document.getElementById('voice');
          // 我们将在语音列表加载完成后设置这个值
          voiceSelect.dataset.savedValue = voice;
        }

        // 设置语速
        if (rate) {
          const rateInput = document.getElementById('rate');
          rateInput.value = rate;
          document.getElementById('rateValue').textContent = rate;
        }

        // 设置音调
        if (pitch) {
          const pitchInput = document.getElementById('pitch');
          pitchInput.value = pitch;
          document.getElementById('pitchValue').textContent = pitch;
        }

        // 设置文本（如果有）
        if (text) {
          document.getElementById('text').value = text;
        }

        // 风格将在语音选择后设置
      }

      // 显示错误信息的函数
      function showError(title, message) {
        const errorAlert = document.getElementById('apiErrorAlert');
        document.getElementById('apiErrorTitle').textContent = title;
        document.getElementById('apiErrorMessage').textContent = message;
        errorAlert.style.display = 'block';

        // 滚动到错误信息
        errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // 更新风格选项的函数
      function updateStyleOptions(voiceName) {
        const styleSelect = document.getElementById('style');
        // 清空现有选项
        styleSelect.innerHTML = '';

        // 默认添加标准风格
        const defaultOption = document.createElement('option');
        defaultOption.value = 'general';
        defaultOption.text = '标准';
        styleSelect.appendChild(defaultOption);

        // 查找选定的语音对象
        const selectedVoice = allVoices.find(v => v.ShortName === voiceName);

        if (selectedVoice && selectedVoice.StyleList && selectedVoice.StyleList.length > 0) {
          // 对风格列表进行排序
          const styles = [...selectedVoice.StyleList].sort();

          // 为每个风格创建选项
          styles.forEach(style => {
            // 跳过已经添加的"general"
            if (style.toLowerCase() === 'general') return;

            const option = document.createElement('option');
            option.value = style;
            // 根据风格名称进行本地化显示
            option.text = getStyleDisplayName(style);
            styleSelect.appendChild(option);
          });
        }

        // 添加风格选择变化事件监听器
        styleSelect.addEventListener('change', function() {
          localStorage.setItem('tts_style', this.value);
        });
      }

      // 风格名称本地化显示
      function getStyleDisplayName(styleName) {
        const styleMap = {
          'angry': '愤怒',
          'cheerful': '欢快',
          'sad': '悲伤',
          'fearful': '恐惧',
          'disgruntled': '不满',
          'serious': '严肃',
          'affectionate': '深情',
          'gentle': '温柔',
          'embarrassed': '尴尬',
          'assistant': '助手',
          'calm': '平静',
          'chat': '聊天',
          'excited': '兴奋',
          'friendly': '友好',
          'hopeful': '希望',
          'narration-professional': '专业叙述',
          'newscast': '新闻播报',
          'newscast-casual': '随性新闻',
          'poetry-reading': '诗歌朗诵',
          'shouting': '喊叫',
          'sports-commentary': '体育解说',
          'whispering': '低语'
        };

        return styleMap[styleName.toLowerCase()] || styleName;
      }

      // 加载可用语音列表
      async function loadVoices() {
        try {
          const response = await fetch('${baseUrl}/voices');
          if (response.ok) {
            allVoices = await response.json();

            // 按语言对语音分组并排序
            const zhVoices = allVoices.filter(voice => voice.Locale.startsWith('zh-'));
            const enVoices = allVoices.filter(voice => voice.Locale.startsWith('en-'));
            const jaVoices = allVoices.filter(voice => voice.Locale.startsWith('ja-'));

            // 其他所有语言
            const otherVoices = allVoices.filter(voice =>
              !voice.Locale.startsWith('zh-') &&
              !voice.Locale.startsWith('en-') &&
              !voice.Locale.startsWith('ja-')
            );

            // 清空语音选择下拉框
            const voiceSelect = document.getElementById('voice');
            voiceSelect.innerHTML = '';

            // 添加中文语音组
            if(zhVoices.length > 0) {
              addVoiceGroup(voiceSelect, '中文 (Chinese)', zhVoices);
            }

            // 添加英文语音组
            if(enVoices.length > 0) {
              addVoiceGroup(voiceSelect, '英文 (English)', enVoices);
            }

            // 添加日文语音组
            if(jaVoices.length > 0) {
              addVoiceGroup(voiceSelect, '日文 (Japanese)', jaVoices);
            }

            // 添加其他语音组
            if(otherVoices.length > 0) {
              addVoiceGroup(voiceSelect, '其他语言 (Other Languages)', otherVoices);
            }

            // 尝试恢复保存的语音选择
            const savedVoice = voiceSelect.dataset.savedValue;
            if (savedVoice && voiceSelect.querySelector(\`option[value="\${savedVoice}"]\`)) {
              voiceSelect.value = savedVoice;
            } else {
              // 默认选择晓晓多语言
              const defaultVoice = 'zh-CN-XiaoxiaoMultilingualNeural';
              if (voiceSelect.querySelector(\`option[value="\${defaultVoice}"]\`)) {
                voiceSelect.value = defaultVoice;
              }
            }

            // 加载初始选择语音的风格选项
            updateStyleOptions(voiceSelect.value);

            // 尝试恢复保存的风格选择
            const savedStyle = localStorage.getItem('tts_style');
            if (savedStyle) {
              setTimeout(() => {
                const styleSelect = document.getElementById('style');
                if (styleSelect.querySelector(\`option[value="\${savedStyle}"]\`)) {
                  styleSelect.value = savedStyle;
                }
              }, 100); // 给updateStyleOptions一点时间来填充选项
            }

            // 添加语音选择变化事件监听器，保存选择到localStorage
            voiceSelect.addEventListener('change', function() {
              localStorage.setItem('tts_voice', this.value);
              updateStyleOptions(this.value);
            });

            // 添加语速变化事件监听器
            document.getElementById('rate').addEventListener('change', function() {
              localStorage.setItem('tts_rate', this.value);
            });

            // 添加音调变化事件监听器
            document.getElementById('pitch').addEventListener('change', function() {
              localStorage.setItem('tts_pitch', this.value);
            });

            // 添加文本变化事件监听器
            document.getElementById('text').addEventListener('input', function() {
              localStorage.setItem('tts_text', this.value);
            });

          } else {
            console.error('获取语音列表失败：', response.status);
            showDefaultVoices();
          }
        } catch (error) {
          console.error('加载语音列表失败:', error);
          showDefaultVoices();
        }
      }

      // 添加语音组到下拉框
      function addVoiceGroup(select, groupName, voices) {
        const group = document.createElement('optgroup');
        group.label = groupName;

        // 对语音按名称排序
        voices.sort((a, b) => {
          const nameA = a.LocalName || a.DisplayName;
          const nameB = b.LocalName || b.DisplayName;
          return nameA.localeCompare(nameB);
        });

        voices.forEach(voice => {
          const option = document.createElement('option');
          option.value = voice.ShortName;
          option.text = \`\${voice.LocalName || voice.DisplayName} (\${voice.Gender === 'Female' ? '女' : '男'})\`;
          group.appendChild(option);
        });

        select.appendChild(group);
      }

      // 加载默认语音列表
      function showDefaultVoices() {
        document.getElementById('voiceLoadError').style.display = 'block';
        const voiceSelect = document.getElementById('voice');
        voiceSelect.innerHTML = '';

        const defaultVoices = [
          { value: "zh-CN-XiaoxiaoMultilingualNeural", text: "晓晓多语言(女) - zh-CN-XiaoxiaoMultilingualNeural" },
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

        // 默认选择晓晓多语言
        voiceSelect.value = "zh-CN-XiaoxiaoMultilingualNeural";

        // 设置默认风格
        const styleSelect = document.getElementById('style');
        styleSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = 'general';
        defaultOption.text = '标准';
        styleSelect.appendChild(defaultOption);
      }

      // 页面加载完成后加载语音列表
      window.onload = function() {
        // 先加载保存的表单值
        loadFormValuesFromLocalStorage();

        // 然后加载语音列表
        loadVoices();

        // API Key 相关功能
        const apiKeyInput = document.getElementById('apiKey');
        const saveApiKeyBtn = document.getElementById('saveApiKey');
        const editApiKeyBtn = document.getElementById('editApiKey');
        const savedApiKeyInfo = document.getElementById('savedApiKeyInfo');
        const apiKeyInputGroup = document.getElementById('apiKeyInputGroup');
        const toggleApiKeyVisibilityBtn = document.getElementById('toggleApiKeyVisibility');

        // 显示/隐藏API Key
        toggleApiKeyVisibilityBtn.addEventListener('click', function() {
          const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
          apiKeyInput.setAttribute('type', type);

          // 修改图标
          if (type === 'text') {
            this.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>\`;
          } else {
            this.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 06 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>\`;
          }
        });

        // 保存API Key到localStorage
        saveApiKeyBtn.addEventListener('click', function() {
          const apiKey = apiKeyInput.value.trim();
          if (apiKey) {
            localStorage.setItem('tts_api_key', apiKey);
            apiKeyInputGroup.style.display = 'none';
            saveApiKeyBtn.style.display = 'none';
            savedApiKeyInfo.style.display = 'flex';
          } else {
            alert('请输入有效的API Key');
          }
        });

        // 编辑已保存的API Key
        editApiKeyBtn.addEventListener('click', function() {
          apiKeyInputGroup.style.display = 'flex';
          saveApiKeyBtn.style.display = 'inline-flex';
          savedApiKeyInfo.style.display = 'none';
        });

        // 检查是否有保存的API Key
        const savedApiKey = localStorage.getItem('tts_api_key');
        if (savedApiKey) {
          apiKeyInput.value = savedApiKey;
          apiKeyInputGroup.style.display = 'none';
          saveApiKeyBtn.style.display = 'none';
          savedApiKeyInfo.style.display = 'flex';
        }
      };

    </script>
  </body>
  </html>
  `, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8'}});
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

function getSsml(text, voiceName, rate, pitch, style = 'general') {
  text = escapeSSML(text);
  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="zh-CN"> <voice name="${voiceName}"> <mstts:express-as style="${style}" styledegree="1.0" role="default"> <prosody rate="${rate}%" pitch="${pitch}%" volume="50">${text}</prosody> </mstts:express-as> </voice> </speak>`;
}

function voiceList() {
  // 检查缓存是否有效
  if (voiceListCache && voiceListCacheTime && (Date.now() - voiceListCacheTime) < VOICE_CACHE_DURATION) {
    console.log('使用缓存的语音列表数据，剩余有效期：',
      Math.round((VOICE_CACHE_DURATION - (Date.now() - voiceListCacheTime)) / 60000), '分钟');
    return Promise.resolve(voiceListCache);
  }

  console.log('获取新的语音列表数据');
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.26',
    'X-Ms-Useragent': 'SpeechStudio/2021.05.001',
    'Content-Type': 'application/json',
    'Origin': 'https://azure.microsoft.com',
    'Referer': 'https://azure.microsoft.com'
  };

  return fetch('https://eastus.api.speech.microsoft.com/cognitiveservices/voices/list', {
    headers: headers,
  })
  .then(res => res.json())
  .then(data => {
    // 更新缓存
    voiceListCache = data;
    voiceListCacheTime = Date.now();
    return data;
  });
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
  // 从环境变量获取 API 密钥并进行验证
  const expectedApiKey = API_KEY || '';
  return apiKey === expectedApiKey;
}

async function getVoice(text, voiceName = 'zh-CN-XiaoxiaoMultilingualNeural', rate = 0, pitch = 0, style = 'general', outputFormat='audio-24khz-48kbitrate-mono-mp3', download=false) {
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
  const ssml = getSsml(text, voiceName, rate, pitch, style);

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

// 处理 OpenAI 格式的文本转语音请求
async function handleOpenAITTS(request) {
  // 验证请求方法是否为 POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 验证 API 密钥
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = authHeader.replace('Bearer ', '');
  if (!validateApiKey(apiKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 解析请求体 JSON
    const requestData = await request.json();

    // 验证必要参数
    if (!requestData.model || !requestData.input) {
      return new Response(JSON.stringify({ error: 'Bad request: Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 提取参数
    const text = requestData.input;
    // 映射 voice 参数 (可选择添加 model 到 voice 的映射逻辑)
    let voiceName = 'zh-CN-XiaoxiaoMultilingualNeural'; // 默认声音
    if (requestData.voice) {
      // OpenAI的voice参数有alloy, echo, fable, onyx, nova, shimmer
      // 可以根据需要进行映射
      const voiceMap = {
        'alloy': 'zh-CN-XiaoxiaoMultilingualNeural',
        'echo': 'zh-CN-YunxiNeural',
        'fable': 'zh-CN-XiaomoNeural',
        'onyx': 'zh-CN-YunjianNeural',
        'nova': 'zh-CN-XiaochenNeural',
        'shimmer': 'en-US-AriaNeural'
      };
      voiceName = voiceMap[requestData.voice] || requestData.voice;
    }

    // 速度和音调映射 (OpenAI 使用 0.25-4.0，我们使用 -100 到 100)
    let rate = 0;
    if (requestData.speed) {
      // 映射 0.25-4.0 到 -100 到 100 范围
      // 1.0 是正常速度，对应 rate=0
      rate = Math.round((requestData.speed - 1.0) * 100);
      // 限制范围
      rate = Math.max(-100, Math.min(100, rate));
    }

    // 设置输出格式
    const outputFormat = requestData.response_format === 'opus' ?
      'audio-48khz-192kbitrate-mono-opus' :
      'audio-24khz-48kbitrate-mono-mp3';

    // 调用 TTS API
    const ttsResponse = await getVoice(text, voiceName, rate, 0,requestData.model ,outputFormat, false);

    return ttsResponse;
  } catch (error) {
    console.error('OpenAI TTS API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}