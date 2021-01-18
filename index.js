import MonkeyMaster from './main.js';
import loadJsonFile from 'https://deno.land/x/load_json_file@v1.0.0/mod.ts';
import { Webview } from 'https://deno.land/x/webview/mod.ts';

const CONFIG = await loadJsonFile('conf.json');
const html = await Deno.readTextFile('./ui/custom.html');

const webview = new Webview({
    title: 'Hello Monkey 🐒🐒🐒',
    width: 640,
    height: 420,
    url: `data:text/html,${encodeURIComponent(html)}`,
});

for await (const event of webview.iter()) {
    Object.assign(CONFIG, JSON.parse(event));
    webview.drop();
}

if (!CONFIG.skuids) {
    Deno.exit();
}

let skuids = CONFIG.skuids.split(',');

const ins = new MonkeyMaster({
    skuids,
    password: CONFIG.orderDeps.password,
    areaId: CONFIG.orderDeps.area,
    eid: CONFIG.orderDeps.eid,
    fp: CONFIG.orderDeps.fp,
});

await ins.init();

switch (CONFIG.mode) {
    case '1':
        const buyFunc =
            skuids.length > 1 ? 'buyMultiSkusInStock' : 'buySingleSkuInStock';

        if (await ins[buyFunc](CONFIG.interval)) {
            await fetch(
                `https://sc.ftqq.com/${CONFIG.sckey}.send?text=Yes, you got it 🍌🍌🍌🍌🍌`
            );
            Deno.exit();
        }

        break;

    case '2':
        // const buyTime = prompt(
        //     '输入抢购开始时间, 格式为 yyyy-MM-dd HH:mm:ss.SSS'
        // );
        await ins.buyOnTime(CONFIG.buyTime);
        break;

    case '3':
        const killFunc = CONFIG.app === '1' ? 'seckillOnTime' : 'fqkillOnTime';
        await ins[killFunc](CONFIG.buyTime, 1);
        break;

    default:
        break;
}
