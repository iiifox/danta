---
layout: default
title: GBO系统教程
---

* 目录
{:toc}


## 登录下载

**进入登录页面**

首页网址
```
http://hxmm.vdvg82xr.top/main.html
```

![](img/gbo1.png)

设置答题都不见了；电脑点那两个地方没反应；www.baidu.com拒绝连接。等所有情况，都只需要调出开发者工具（Ctrl+Shift+I或F12），点开Console(控制面板)，输入以下代码后回车即可
```javascript
showLogin()
```

**绑定身份验证器**

![](assets/img/gbo2.png)

**下载提CK软件**

![](assets/img/gbo3.png)

## 通道区分

用我的查价网址 [https://luei.me](https://luei.me) 可看到每个价格对应哪些通道可挂（鼠标悬停会显示）。

正常情况下：qb去qb通道；游戏有单独通道的去单独通道；游戏无单独通道的手游去腾讯综合、端游去腾讯端游。

## 卡密教程

首页或者通道管理当中找到你要挂的通道，如果右上角有**生成卡密**就说明该通道支持卡密，只需要点击生成卡密，随后复制卡密发给客户，让客户扫码录入即可

注意：卡密最后的ddh参数为**订单号**，所以批量添加卡密也是可以配合阿奇索自动发货的（与旧返利系统一样，订单号放在卡密链接最后）

![](assets/img/gbo-kami1.png)
![](assets/img/gbo-kami2.png)

## 自动启用

该系统有点抽风，长时间不拉单或者多次不支付都可能被自动停用，因此特地编写一个脚本（每3分钟自动检测一轮），可以自动启用那些没到限额限笔就被异常关闭的的账号id，脚本url如下：

```
https://luei.me/assets/script/gbo/enableGbo.js
```

你只需要使用[篡改猴](https://www.tampermonkey.net/)：**管理面板——实用工具——从URL导入**，输入上面的url地址即可。

![](assets/img/cuangaihou.png)

需要注意的是，最新版本的Chrome浏览器默认关闭了篡改猴的**允许运行用户脚本**，你需要进入管理扩展程序——点击篡改猴详情，然后打开这个开关。

![](assets/img/cuangaihou-allow.png)
