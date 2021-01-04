import MonkeyMaster from './main.js';
import loadJsonFile from 'https://deno.land/x/load_json_file@v1.0.0/mod.ts';
import {
    validateSkuids
} from './util/validation.js';
import {
    smtp
} from './util/smtp.js';
const CONFIG = await loadJsonFile('conf.json');

// just in case have error
try {
    await smtp();
} catch (err) {
    console.log(err)
}


let skuids = prompt(
    '输入抢购skuid,可以是多个，以逗号(,)分割',
    '100016691566'
).split(',');
// 检验合法性
validateSkuids(skuids);

const ins = new MonkeyMaster({
    skuids,
    password: CONFIG.orderDeps.password,
    areaId: CONFIG.orderDeps.area,
    eid: CONFIG.orderDeps.eid,
    fp: CONFIG.orderDeps.fp,
});

await ins.init();

const mode = prompt(
    '选择运行模式: 1-有货下单，2-按时下单，3-提前秒杀， 默认为1',
    '1'
);

switch (mode) {
    case '1':
        const interval = prompt('库存监控间隔, 单位秒', 5);
        const buyFunc =
            skuids.length > 1 ? 'buyMultiSkusInStock' : 'buySingleSkuInStock';

        if (await ins[buyFunc](interval)) {
            await fetch(
                'https://sc.ftqq.com/${CONFIG.sckey}.send?text=Yes, you got it'
            );
            Deno.exit();
        }

        break;

    case '2':
        const time = prompt('输入抢购开始时间, 格式为 yyyy-MM-dd HH:mm:ss.SSS');
        await ins.buyOnTime(time);
        break;

    default:
        break;
}
