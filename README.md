# monkey-master

黄皮衣，酥麻罪恶滔天，此项目诞生于抢购猴卡 RTX3080、RX6800XT.....。

## 目录结构

```bash
monkey-master
├── order/
├── util/
├── conf.json               配置文件，可修改
├── index.js                入口
├── main.js
├── install.bat             安装脚本
├── start.bat               运行脚本
└── README.md
```

### 安装

安装 deno:

Shell (Mac, Linux):

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

PowerShell (Windows):

```bash
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

安装依赖插件：

```bash

deno install -qAf --unstable --no-check  https://deno.land/x/denon/denon.ts
deno run -A --unstable https://deno.land/x/puppeteer/install.ts
```

### 启动

```bash
deno run --allow-env --allow-read --allow-write --allow-net --allow-run --unstable --no-check index.js

or

denon start
```

第一次运行会下载依赖资源包，如果下载不成功可以多试几次。

### 配置参数说明

在 conf.json 文件中配置必要参数：

| 参数              | 说明                                                                        | 是否必须 | 数据类型 | 默认值 |
| ----------------- | --------------------------------------------------------------------------- | -------- | -------- | ------ |
| timeout           | 请求超时时间 单位毫秒                                                       |          | Number   | 5000   |
| useRandomUA       | 启动随机 user-agent                                                         |          | Boolean  | false  |
| intersection      | 提交订单请求重叠时间                                                        |          | Number   | 0.5    |
| eid               | ~~设备 ID，部分系统可自动获取也可以手动配置~~                               |          | string   |        |
| fp                | ~~fingerprint，部分系统可自动获取也可以手动配置~~                           |          | string   |        |
| sckey             | 用于下单成功的消息推送，这里借用第三方工具 http://sc.ftqq.com/ , 请自行注册 |          | string   |        |
| autoReserve       | 在定时下单时是否开启自动预约(当需要输入验证码时会跳过预约)                  |          | Boolean  | true   |
| openQrInNewWindow | 在新窗口中打开二维码，为 false 时会在 terminal 中打开二维码                 |          | Boolean  | false  |

支持多实例多账号运行，具体帐号相关配置在运行时填写。

### 最佳实践

-   操作之前建议删除购物车内的相关物品
-   网络延迟、服务器与本地时间差异的问题已为你考虑，抢购时间不必修改。
-   同一账号 web 和金融通道可同时运行，不冲突。
-   关于抢购模式的问题可以看看这里 [issue #30](https://github.com/chou0212/monkey-master/issues/30)
-   还有问题？[![follow us](http://pub.idqqimg.com/wpa/images/group.png 'follow us')](https://qm.qq.com/cgi-bin/qm/qr?k=sgAvZ_SsEL1h0r6sgPkBn89eD0-TOmgV&jump_from=webapi)

### TODO

-   [x] auto get fingerprint (e.g. eid,fp).
-   [x] 秒杀商品
-   [ ] GUI - 改为 server 支持实现

### 喜茶

BTC: 1Gon1RGC12yhwaU2Cv56rLonuKCB5e4bR8
