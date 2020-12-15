import loadJsonFile from 'https://deno.land/x/load_json_file@v1.0.0/mod.ts';
const CONFIG = await loadJsonFile('conf.json');

export default function (url, options = {}) {
  const timeoutPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(new Response(new ReadableStream(), { status: 504, statusText: 'timeout!' }));
    }, options.timeout || CONFIG.timeout);
  });
  return Promise.race([timeoutPromise, fetch(url, options)]);
}
