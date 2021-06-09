/**
 *
 */
import MonkeyMaster from './main.js';
import {
    opine,
    json,
    urlencoded,
} from 'https://deno.land/x/opine@1.4.0/mod.ts';
import { renderFileToString } from 'https://deno.land/x/dejs/mod.ts';
import { open } from "https://deno.land/x/opener/mod.ts";
import loadJsonFile from 'https://deno.land/x/load_json_file@v1.0.0/mod.ts';

const CONFIG = await loadJsonFile('conf.json');
const app = opine();

app.engine('html', renderFileToString);

app.use(json()); // for parsing application/json
app.use(urlencoded()); // for parsing application/x-www-form-urlencoded

app.post('/start', async function (req, res) {
    const options = req.body;

    const skuids = options.skuids.trim().split(',');

    const ins = new MonkeyMaster({
        skuids,
        password: CONFIG.orderDeps.password,
        areaId: CONFIG.orderDeps.area,
        eid: CONFIG.orderDeps.eid,
        fp: CONFIG.orderDeps.fp,
    });

    ins.res = res;

    await ins.init();
    await res.send('成功运行。。。');
    await runByMode(options, skuids, ins);
});

app.get('/', function (req, res) {
    res.render('custom.html');
});

app.listen(CONFIG.port, () =>
    console.log('server has started on http://localhost:' + CONFIG.port + ' 🚀')
);

async function runByMode(options, skuids, ins) {
    switch (options.mode) {
        case '1':
            const buyFunc =
                skuids.length > 1
                    ? 'buyMultiSkusInStock'
                    : 'buySingleSkuInStock';

            if (await ins[buyFunc](options.interval)) {
                await fetch(
                    `https://sc.ftqq.com/${CONFIG.sckey}.send?text=Yes, you got it 🍌🍌🍌🍌🍌`
                );
                Deno.exit();
            }

            break;

        case '2':
            const buyOnTimeFunc =
                prompt('选择下单方式，1: 京东 web, 2: 京东金融 APP', '1') ===
                '1'
                    ? 'buyOnTime'
                    : 'fqkillOnTime';
            const buyTime = (await ins.getBuyTime()) || options.buyTime;

            console.log('请确保购物车中待抢购商品已删除!!!');

            // 自动预约
            if (ins.autoReserve) {
                await ins.reserveAll();
            }
            await ins[buyOnTimeFunc](buyTime);

            prompt('是否立即运行有货下单模式进行捡漏 y/n', 'n') === 'y'
                ? await ins.buySingleSkuInStock()
                : Deno.exit();

            break;

        case '3':
            const secKillTime = (await ins.getBuyTime()) || options.buyTime;

            if (await ins.seckillOnTime(secKillTime)) {
                await fetch(
                    `https://sc.ftqq.com/${CONFIG.sckey}.send?text=Yes, you got it 🍌🍌🍌🍌🍌`
                );
            }

            break;

        default:
            break;
    }
}

await open('http://localhost:' + CONFIG.port);
