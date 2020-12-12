# monkey-master

黄皮衣，酥麻罪恶滔天，此项目诞生于抢购猴卡 RTX3080、RX6800XT....., 其实也适用于其它商品。


### 安装 deno

brew install deno

### 启动

``` bash
deno run --allow-read --allow-write --allow-net --allow-run index.js   

or

denox run start
```

### 配置参数说明 conf.json

eid: 设备id, 每个设备唯一， 可在结算页面打开console 输入以下代码获取
``` javascript
$('#eid').val()
```

fp: fingerprint, 获取代码如下，方式同上
``` javascript
$('#fp').val()
```
area: 收货地址编号, 可在任意商品详情页面打开console 输入以下代码获取
``` javascript
$('.ui-area-text').attr('data-id')
```

password: 优惠券使用密码

### TODO

-   auto get fingerprint (e.g. eid,fp).
-   seckill
-   GUI?
