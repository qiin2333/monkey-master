# monkey-master

黄皮衣，酥麻罪恶滔天，此项目诞生于抢购猴卡 RTX3080、RX6800XT....., 其实也适用于其它商品。


### 安装 deno
``` bash
brew install deno

deno install -qAf --unstable https://deno.land/x/denon/denon.ts
```
### 启动

``` bash
deno run --allow-read --allow-write --allow-net --allow-run index.js   

or

denon start
```

### 配置参数说明 conf.json

password: 优惠券使用密码

### TODO

-   ~~auto get fingerprint (e.g. eid,fp).~~ 暂不支持 windows
-   seckill
-   GUI?
