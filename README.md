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

deno install -qAf --unstable https://deno.land/x/denon/denon.ts
```

### 启动

```bash
deno run --allow-env --allow-read --allow-write --allow-net --allow-run --allow-plugin --unstable --no-check index.js

or

denon start
```

### 配置参数说明

在 conf.json 文件中配置必要参数：

| 参数         | 说明                                                           | 是否必须 | 数据类型 | 默认值    |
| ------------ | -------------------------------------------------------------- | -------- | -------- | --------- |
| timeout      | 请求超时时间 单位毫秒                                          |          | Number   | 5000      |
| useRandomUA  | 启动随机 user-agent                                           |          | Boolean  | false     |
| intersection | 提交订单请求重叠时间                                           |          | Number   | 0.4       |
| userPath     | 用户信息暂存目录                                               |          | string   | ./cookie/ |
| password     | 支付密码                                                       | required | string   |           |
| eid          | 设备 ID，部分系统可自动获取也可以手动配置                      |          | string   |           |
| fp           | fingerprint，部分系统可自动获取也可以手动配置                  |          | string   |           |
| sckey        | 用于下单成功的消息推送，这里借用第三方工具 http://sc.ftqq.com/ |          | string   |           |
| autoReserve  | 在定时下单时是否开启自动预约(当需要输入验证码时会跳过预约)      |          | Boolean    |   true    |
| openQrInNewWindow  | 在新窗口中打开二维码，为false时会在terminal中打开二维码 |         | Boolean  |   false    |

### 最佳实践

-   操作之前删除购物车内的相关物品
-   抢购时间的设置使用精确的实际时间即可，本公举通过客户端网络延迟计算了最后下单秒杀需要提前的时间
-   增加金融分期商城接口，可从秒杀模式进入（听说这个方式节省步骤成功率较高)
-   关于抢购模式的问题可以看看这里 [issue #30](https://github.com/chou0212/monkey-master/issues/30)
-   还有问题？[![follow us](http://pub.idqqimg.com/wpa/images/group.png 'follow us')](https://qm.qq.com/cgi-bin/qm/qr?k=sgAvZ_SsEL1h0r6sgPkBn89eD0-TOmgV&jump_from=webapi)

### TODO

-   [x] auto get fingerprint (e.g. eid,fp).
-   [x] 秒杀商品
-   [ ] GUI - 部分完成
