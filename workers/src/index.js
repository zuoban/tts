const encoder = new TextEncoder();
let expiredAt = null;
let endpoint = null;
let clientId = '76a75279-2ffa-4c3d-8db8-7b47252aa41c';

async function handleRequest(request) {
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;

  if (path === '/tts') {
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
  <ol>
  <li> /tts?t=[text]&v=[voice]&r=[rate]&p=[pitch]&o=[outputFormat] <a href="${baseUrl}/tts?t=hello, world&v=zh-CN-XiaoxiaoMultilingualNeural&r=0&p=0&o=audio-24khz-48kbitrate-mono-mp3">try</a> </li>
  <li> /voices?l=[locate, like zh|zh-CN]&f=[format, 0/1/empty 0(TTS-Server)|1(MultiTTS)] <a href="${baseUrl}/voices?l=zh&f=1">try</a> </li>
  </ol>
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