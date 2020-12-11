import MonkeyMaster from './main.js';
import loadJsonFile from 'https://deno.land/x/load_json_file@v1.0.0/mod.ts';

const CONFIG = await loadJsonFile('conf.json');

const ins = new MonkeyMaster({
  skuids: prompt('输入抢购skuid,可以是多个，以逗号(,)分割', '100015521042'),
  areaId: CONFIG.orderDeps.area || prompt('未配置 area, 请输入'),
  eid: CONFIG.orderDeps.eid || prompt('未配置 eid, 请输入'),
  fp: CONFIG.orderDeps.fp || prompt('未配置 fp, 请输入'),
});

const mode = prompt('选择运行模式: 1-有货下单，2-按时下单，3-提前秒杀， 默认为1', 1);

switch (mode) {
    case 1:
        await ins.buyInStock();
        break;

    case 2:
        await ins.buyOnTime();
        break;

    default:
        break;
}
