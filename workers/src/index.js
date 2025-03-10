const encoder = new TextEncoder();
let expiredAt = null;
let endpoint = null;
let clientId = '76a75279-2ffa-4c3d-8db8-7b47252aa41c';
const API_KEY = 'your-secret-api-key'; // 添加 API 密钥常量，可以修改为你想要的值

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
  <html>
  <head>
    <title>Microsoft TTS API</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
      h1, h2 { color: #0078d7; }
      .endpoint { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
      .param { margin-left: 20px; }
      .param-name { font-weight: bold; color: #333; }
      .required { color: #d13438; }
      .example { margin-top: 10px; background-color: #e6f3ff; padding: 10px; border-radius: 3px; }
      .note { background-color: #fff4e5; padding: 10px; border-radius: 3px; margin-top: 20px; }
    </style>
  </head>
  <body>
    <h1>Microsoft TTS API 接口说明</h1>

    <div class="endpoint">
      <h2>1. 文本转语音 API</h2>
      <p><code>/tts</code> - 将文本转换为语音</p>

      <div class="param">
        <p><span class="param-name">api_key</span> <span class="required">[必填]</span>: API访问密钥</p>
        <p><span class="param-name">t</span> <span class="required">[必填]</span>: 要转换的文本内容</p>
        <p><span class="param-name">v</span> <span>[可选]</span>: 语音名称，默认为 'zh-CN-XiaoxiaoMultilingualNeural'</p>
        <p><span class="param-name">r</span> <span>[可选]</span>: 语速调整，范围-100到100，默认为0</p>
        <p><span class="param-name">p</span> <span>[可选]</span>: 音调调整，范围-100到100，默认为0</p>
        <p><span class="param-name">o</span> <span>[可选]</span>: 输出格式，默认为 'audio-24khz-48kbitrate-mono-mp3'</p>
        <p><span class="param-name">d</span> <span>[可选]</span>: 是否作为下载文件返回，设为任意值时启用</p>
      </div>

      <div class="example">
        <p>示例: <a href="${baseUrl}/tts?api_key=api-key&t=你好，世界&v=zh-CN-XiaoxiaoMultilingualNeural&r=0&p=0">尝试</a></p>
        <code>${baseUrl}/tts?api_key=api-key&t=你好，世界&v=zh-CN-XiaoxiaoMultilingualNeural&r=0&p=0</code>
      </div>
    </div>

    <div class="endpoint">
      <h2>2. 获取可用语音列表</h2>
      <p><code>/voices</code> - 获取所有可用的语音列表</p>

      <div class="param">
        <p><span class="param-name">l</span> <span>[可选]</span>: 按区域筛选，如 'zh'、'zh-CN'、'en' 等</p>
        <p><span class="param-name">f</span> <span>[可选]</span>: 返回格式，0=TTS-Server格式，1=MultiTTS格式，默认=完整JSON</p>
      </div>

      <div class="example">
        <p>示例 (中文语音): <a href="${baseUrl}/voices?l=zh">尝试</a></p>
        <code>${baseUrl}/voices?l=zh</code>
      </div>
    </div>

    <div class="note">
      <p><strong>重要提示:</strong></p>
      <ul>
        <li>所有对 <code>/tts</code> 接口的请求必须提供有效的 <code>api_key</code> 参数</li>
        <li>语音合成结果会直接作为音频流返回，除非指定了 <code>d</code> 参数</li>
        <li>请注意中文文本需要进行 URL 编码</li>
      </ul>
    </div>
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
    'X-UserId': '0f04d16a175c411e',
    'X-HomeGeographicRegion': 'zh-Hans-CN',
    'X-ClientTraceId': clientId,

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
    resp = new Response(response.body,response)
    resp.headers.set('Content-Disposition', `attachment; filename="${uuid()}.mp3"`);
    return resp;
  }else {
    return new Response(response.statusText, { status: response.status });
  }
}

function escapeXml(unsafe) {
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

function getSsml(text, voiceName, rate, pitch) {
  text = escapeXml(text);
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


function uuid(){
  return crypto.randomUUID().replace(/-/g, '')
}

// API 密钥验证函数
function validateApiKey(apiKey) {
  return apiKey === API_KEY;
}