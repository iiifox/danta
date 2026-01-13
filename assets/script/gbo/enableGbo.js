// ==UserScript==
// @name         gbo自动启用
// @namespace    https://luei.me
// @version      1.0.0
// @description  自动检测并每3分钟启用一次被异常停用的账号
// @author       luei
// @match        *://hxmm.vdvg82xr.top/*
// @grant        GM_xmlhttpRequest
// @connect      ggbboo.xyz
// @connect      luei.me
// @updateURL    https://luei.me/assets/script/gbo/enableGbo.js
// @downloadURL  https://luei.me/assets/script/gbo/enableGbo.js
// ==/UserScript==

(function () {
    'use strict';

    // 封装 POST 请求
    function postRequest(url, data) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "POST",
                url: url,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data: new URLSearchParams(data).toString(),
                onload: function (resp) {
                    try {
                        resolve(JSON.parse(resp.responseText));
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: function (err) {
                    reject(err);
                }
            });
        });
    }

    // 封装 GET 请求
    function getRequest(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: function (resp) {
                    try {
                        resolve(JSON.parse(resp.responseText));
                    } catch (e) {
                        reject(e);
                    }
                },
                onerror: function (err) {
                    reject(err);
                }
            });
        });
    }

    async function getAccountExceptIds(username, sid) {
        let ids = [];
        let getAccountListUrl = "http://api.ggbboo.xyz/api_group/Account/getAccountList";
        let disableData = {page: 1, limit: 20, username: username, sid: sid, state: 0};

        while (true) {
            let resp = await postRequest(getAccountListUrl, disableData);
            let items = resp?.data?.list || [];

            for (let item of items) {
                let limit_order_money = item.limit_order_money;
                let limit_order_amount = item.limit_order_amount;

                // 限额到了上限
                if (limit_order_money !== 0 && limit_order_money < item.total_money + item.minimum_limit) {
                    continue;
                }
                // 限笔到了上限
                if (limit_order_amount !== 0 && limit_order_amount <= item.total_amount) {
                    continue;
                }

                // 可以启用了
                ids.push(item.id);
            }

            if (items.length < disableData.limit) {
                break;
            }
            disableData.page++;
        }
        return ids;
    }

    async function enableAccount(username, sid, ids) {
        if (ids.length === 0) {
            console.log("没有需要重新启用的账号~");
            return;
        }

        let enableUrl = "http://api.ggbboo.xyz/api_group/Account/updateAccountState";
        let enableData = {username: username, sid: sid, is_sub: 1, state: 1};
        ids.forEach(id => enableData["ids[]"] = ids); // 多个id

        let resp = await postRequest(enableUrl, enableData);

        if (resp?.msg === "修改成功") {
            ids.forEach(id => console.log(`账号ID: ${id} 被异常停用，已重新启用`));
        } else {
            ids.forEach(id => console.log(`账号ID: ${id} 被异常停用，尝试启用失败~`));
        }
    }

    async function main(username, sid) {
        let ids = await getAccountExceptIds(username, sid);
        await enableAccount(username, sid, ids);
    }

    // 页面加载后执行
    window.addEventListener("load", () => {
        setTimeout(() => {
            let username = localStorage.getItem("username");
            let sid = localStorage.getItem("sid");

            if (!username || !sid) {
                console.log("未找到 localStorage 中的 username 或 sid");
                return;
            }

            getRequest("https://luei.me/config/gbo.json").then(cfg => {
                if (!cfg.enableUser.includes(username)) {
                    return;
                }
                // 启动定时任务，每3分钟执行一次
                main(username, sid); // 先执行一次
                setInterval(() => main(username, sid), 3 * 60 * 1000);
            }).catch(err => {
                console.error("获取白名单配置失败：", err);
            });

        }, 2000);
    });
})();


