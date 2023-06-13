import loadJsonFile from 'https://deno.land/x/load_json_file@v1.0.0/mod.ts';
const CONFIG = await loadJsonFile('conf.json');

export function fetchOnce(url, options = {}) {
    const controller = new AbortController();
    const signal = controller.signal;

    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(
                new Response(new ReadableStream(), {
                    status: 504,
                    statusText: 'timeout!',
                })
            );
            controller.abort();
        }, options.timeout || CONFIG.timeout);
    });

    return Promise.race([timeoutPromise, fetch(url, { signal, ...options })]);
}

export async function fetchAndRetry(url, options = {}, times = 3) {
    let resp = {};
    while (times > 0 && !resp.ok) {
        times -= 1;
        resp = await fetchOnce(url, options);
    }
    return resp;
}
