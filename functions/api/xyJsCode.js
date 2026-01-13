export async function onRequest({request}) {
    try {
        // 读取 xyWeb (动态域名)
        const hyper = await fetch(new URL("/config/hyperlink.json", request.url));
        const hyperJson = await hyper.json();
        const xyWeb = hyperJson.xyWeb;

        const params = new URL(request.url).searchParams;
        const profitParam = params.get('profit');
        const dateParam = params.get('date');
        // 构建请求 URL
        let discountUrl = new URL('/api/discount', request.url).toString();
        const queryParams = new URLSearchParams();
        if (profitParam) queryParams.set('profit', profitParam);
        if (dateParam) queryParams.set('date', dateParam);
        const queryString = queryParams.toString();
        if (queryString) discountUrl += `?${queryString}`;
        // 请求
        const discountResp = await fetch(discountUrl);
        if (!discountResp.ok) throw new Error('折扣数据接口请求失败');
        const discountData = await discountResp.json();

        if (discountData.error) throw new Error(discountData.error);
        
        // 从同域获取折扣数据
        const date = discountData.date;

        // === 只保留变化的字段 ===
        const timeKeys = Object.keys(discountData.xy).sort();
        const xy = discountData.xy;

        // speed_mode 映射表
        const modeMap = {
            "普通": "qq",
            "加速": "fast",
            "超速": "sup",
            "极速": "very",
            "秒拉": "ml",
            "钱包直拉": "zl",
            "怪额": "odd",
            "超怪": "cg",
            "微信单端": "wx",
            "微信通额": "bz",
            "微信固额": "ge",
            "微信小额": "xe",
            "微信点额": "de",
            "微信速额": "se",
            "微信扫码": "qr"
        };

        // 生成时间分段
        const timeRanges = [];
        for (let i = 0; i < timeKeys.length; i++) {
            const start = timeKeys[i];
            const end = i < timeKeys.length - 1 ? timeKeys[i + 1] : null;
            const startFull = `${start}:00`;
            const endFull = end
                ? (() => {
                    const [eh, em] = end.split(":").map(Number);
                    // 若下一段起始分钟是 00，则回到上一小时 59 分
                    const hour = em === 0 ? eh - 1 : eh;
                    const minute = em === 0 ? 59 : em - 1;
                    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:59`;
                })()
                : "23:59:59";
            timeRanges.push({start_time: startFull, end_time: endFull, rates: xy[start]});
        }

        // 构造 rateConfigs
        const rateConfigs = Object.entries(modeMap)
            .filter(([name]) => timeRanges.some(t => t.rates && t.rates[name] != null))
            .map(([name, speed_mode]) => ({
                speed_mode,
                time_rates: timeRanges
                    .filter(t => t.rates && t.rates[name] != null)
                    .map(t => ({
                        start_time: t.start_time,
                        end_time: t.end_time,
                        rate: t.rates[name]
                    }))
            }));

        // 生成 JavaScript 文本
        const jsCode =
            `fetch("${xyWeb}/api/v1/system/qr-dealers/reckon/configs",{method:"POST",body:JSON.stringify({id:null,date:"${date}",rateConfigs:${JSON.stringify(rateConfigs)}})})
        .then(r=>r.json())
        .then(d=>console.log(d))
        .catch(e=>console.error("请求失败:",e));`;

        // 返回纯文本
        return new Response(jsCode, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8"
            }
        });
    } catch (err) {
        return new Response("生成失败: " + err.message, {status: 500});
    }
}
