import { Webview } from 'https://deno.land/x/webview/mod.ts';

const html = await Deno.readTextFile('./ui/qrcode.html');

const webview = new Webview({
    width: 480,
    height: 400,
    title: '🍌🍌 Hello Monkey 🍌🍌',
    url: `data:text/html,${encodeURIComponent(html)}`,
});

webview.run();
