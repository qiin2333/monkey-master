# monkey-master

黄皮衣，酥麻罪恶滔天，此项目诞生于抢购猴卡 RTX3080、RX6800XT.....。

### 安装 deno

```bash
MAC: brew install deno

windows: deno install -qAf --unstable https://deno.land/x/denon/denon.ts
```

### 启动

```bash
deno run --allow-read --allow-write --allow-net --allow-run index.js

or

denon start
```

### 配置参数说明

在 conf.json 文件中配置必要参数：

| 参数     | 说明                                          | 是否必须 | 数据类型 | 默认值    |
| -------- | --------------------------------------------- | -------- | -------- | --------- |
| timeout  | 请求超时时间 单位毫秒                         |          | Number   | 5000      |
| userPath | 用户信息暂存目录                              |          | string   | ./cookie/ |
| password | 支付密码                                      | required | string   |           |
| eid      | 设备 ID，部分系统可自动获取也可以手动配置     |          | string   |           |
| fp       | fingerprint，部分系统可自动获取也可以手动配置 |          | string   |           |

### TODO

-   ~~auto get fingerprint (e.g. eid,fp).~~ windows 可以不配置
-   seckill
-   GUI?
