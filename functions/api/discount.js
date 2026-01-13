// /api/discount?profit=利润&date=日期（YYYY-MM-DD格式）


// 辅助函数：格式化费率值 映射到区间 {0}∪[0.2,2)
function formatRateValue(value) {
    const num = Number(value);
    if (Number.isNaN(num) || num <= 0) return 0;
    if (num < 2) return num;
    if (num < 20) return +(num / 10).toFixed(3);
    if (num < 200) return +(num / 100).toFixed(3);
    return +(num / 1000).toFixed(3);
}

// 先用辅助函数格式化，再加上浮动参数profit后四舍五入：自动去除末尾多余的零
function formatAndRound(value, profit = 0, decimalPlaces = 4) {
    return Number((formatRateValue(value) + profit).toFixed(decimalPlaces));
}


// ========== 解析小刀折扣 ==========
function parseXd(lines, profit) {
    const xd = {};
    const timeOrder = [];
    let currentTimeKey = '';

    const specialMap = {"H": "渠道H（低价）", "Z": "Z1000", VB: "VB微信10起", VC: "VC微信50", VD: "VD100", VE: "VE200"};

    const channelsFirstIndex = new Map();

    for (const line of lines) {
        // 时间匹配
        if (line.includes('过点') || line.includes('号')) currentTimeKey = '00:00';
        else if (line.match(/^(\d{2}):(\d{2})$/)) currentTimeKey = line;
        if (currentTimeKey && !(currentTimeKey in xd)) {
            xd[currentTimeKey] = {};
            timeOrder.push(currentTimeKey);
            continue;
        }

        // 渠道行匹配
        const m = line.match(/^(.*?)\s*(\d+(?:\.\d+)?)\s*(?:，|$)/);
        if (m && currentTimeKey) {
            let channel = m[1].toUpperCase();
            const matchedKey = Object.keys(specialMap).find(k => channel.includes(k));
            if (matchedKey) channel = specialMap[matchedKey];
            xd[currentTimeKey][channel] = formatAndRound(m[2], profit);

            if (!channelsFirstIndex.has(channel)) {
                channelsFirstIndex.set(channel, timeOrder.indexOf(currentTimeKey));
            }
        }
    }
    
    const channelsOrder = Array.from(channelsFirstIndex.keys());

    // 补全缺失值（按时间填充）
    timeOrder.forEach((time, timeIndex) => {
        const newObj = {};
        channelsOrder.forEach(channel => {
            if (timeIndex < channelsFirstIndex.get(channel)) {
                newObj[channel] = 1;
            } else {
                newObj[channel] = xd[time][channel] ?? xd[timeOrder[timeIndex - 1]][channel];
            }
        });
        xd[time] = newObj;
    });

    // 生成 template（按渠道优先，时间次序），去除与上一个时间折扣相同的重复项
    const templateItems = [];
    channelsOrder.forEach(channel => {
        let prevValue = undefined;
        timeOrder.forEach(time => {
            const value = xd[time][channel];
            if (value !== prevValue) {
                templateItems.push(`${channel}${time}/${xd[time][channel]}`);
                prevValue = value;
            }
        });
    });
    xd.template = templateItems.join('\n');

    return xd;
}


// ========== 解析星悦折扣 ==========
function parseXy(lines, profit, xd) {
    const xy = {};
    const timeOrder = [];
    let currentTimeKey = '';

    const specialMap = {"直拉": "钱包直拉", "单端": "微信单端", "通额": "微信通额", "小额": "微信小额", "点额": "微信点额", "扫码": "微信扫码"};
    const channelsFirstIndex = new Map();

    const xdToXy = {"渠道A": "普通", "渠道B": "加速", "渠道C": "超速", "渠道D": "极速", "渠道E": "秒拉", "渠道F": "钱包直拉", "渠道TA": "怪额", "渠道TB": "超怪",
                   "渠道VA": "微信速额", "VB微信10起": "微信点额", "VC微信50": "微信小额", "VD100": "微信固额", "VE200": "微信通额"}

    for (const line of lines) {
        // 时间匹配
        if (line.includes('星悦')) currentTimeKey = '00:00';
        else if (line.match(/^(\d{2}):(\d{2})$/)) currentTimeKey = line;
        if (currentTimeKey && !(currentTimeKey in xy)) {
            xy[currentTimeKey] = {};
            timeOrder.push(currentTimeKey);
            // 自动同步小刀折扣（如果星悦没报折扣一般都是默认同步小刀）
            for (const [channel, speedType] of Object.entries(xdToXy)) {
                xy[currentTimeKey][speedType] = xd[currentTimeKey][channel];
                if (!channelsFirstIndex.has(speedType)) {
                    channelsFirstIndex.set(speedType, timeOrder.indexOf(currentTimeKey));
                }
            }
            continue;
        }

        // 渠道行匹配
        const m = line.match(/^(.*?)\s*(\d+(?:\.\d+)?)/);
        if (m && currentTimeKey) {
            let channel = m[1];
            const matchedKey = Object.keys(specialMap).find(k => channel.includes(k));
            if (matchedKey) channel = specialMap[matchedKey];
            xy[currentTimeKey][channel] = formatAndRound(m[2], profit);

            if (!channelsFirstIndex.has(channel)) {
                channelsFirstIndex.set(channel, timeOrder.indexOf(currentTimeKey));
            }
        }
    }

    // 补全缺失值（按时间填充）
    const channelsOrder = Array.from(channelsFirstIndex.keys());
    timeOrder.forEach((time, timeIndex) => {
        const newObj = {};
        channelsOrder.forEach(channel => {
            if (timeIndex < channelsFirstIndex.get(channel)) {
                newObj[channel] = 1;
            } else {
                newObj[channel] = xy[time][channel] ?? xy[timeOrder[timeIndex - 1]][channel];
            }
        });
        xy[time] = newObj;
    });
    
    return xy;
}


// ========== 解析gbo折扣 ==========
async function parseGbo(lines, request, profit) {
    const resp = await fetch(new URL('/config/gbo.json', new URL(request.url).origin));
    if (!resp.ok) throw new Error('GBO配置数据源获取失败');

    const {channelConfig} = await resp.json();

    const discountMap = new Map();
    for (const line of lines.map(l => l.trim()).filter(Boolean)) {
        let cleanLine = line.replace(/^(.*\d).*/, '$1')
            .replace(/(?:综合、端游|端游、综合)/g, "点券")
            .replace(/(\d+)\s+([^\d\s])/g, '$1$2');
        const m = cleanLine.match(/^(.*?)(\d+(?:\.\d+)?)$/);
        if (!m) continue;

        const discount = formatAndRound(m[2], profit);
        const channels = m[1].split(/[、,，]/).map(s => s.trim()).filter(Boolean);
        channels.forEach(channel => {
            const name = channelConfig.nameMap[channel] || channel;
            const paths = (channelConfig.channelMap[name] || '').split('\n').filter(Boolean);
            discountMap.set(name, {price: discount, paths});
        });
    }
    
    const gbo = Object.fromEntries(
        [...new Set([...Object.keys(channelConfig.channelMap), ...discountMap.keys()])]
            .filter(channel => discountMap.has(channel) && channelConfig.channelMap[channel])
            .map(channel => [channel, discountMap.get(channel)])
    );

    return gbo;
}


export async function onRequest({request}) {
    const profit = Number(new URL(request.url).searchParams.get("profit") || 0);
    
    // 获取日期参数或默认今天（东八区）
    const dateParam = new URL(request.url).searchParams.get("date");
    const date = dateParam || new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    // 发起请求
    const resp = await fetch(new URL(`/discount/${date.replace(/-/g, '/')}.txt`, new URL(request.url).origin));
    
    if (!resp.ok) return new Response(JSON.stringify({error: '数据源获取失败'}), {
        status: 502,
        headers: {'Content-Type': 'application/json'}
    });
    const lines = (await resp.text()).split('\n').map(s => s.trim()).filter(Boolean);

    let xdLines = [], gboLines = [], xyLines = [];
    let currentSystem = "xd";
    for (const line of lines) {
        if (currentSystem === "xd") {
            if (line.startsWith('微信')) {
                currentSystem = "gbo";
                continue;
            }
            xdLines.push(line);
        } else if (currentSystem === "gbo") {
            if (line.includes("星悦")) {
                currentSystem = "xy";
                xyLines.push(line);
                continue;
            }
            gboLines.push(line);
        } else if (currentSystem === "xy" || currentSystem === "xy-gai") {
            // 时间匹配
            const t = line.match(/(\d{1,2})(?::|：)?(\d{2})?点?开始/);
            if (t) {
                const temp_line = `${String(t[1]).padStart(2, '0')}:${t[2] || '00'}`;
                currentSystem = "xd-gai";
                xdLines.push(temp_line)
                xyLines.push(temp_line);
                // 一行带改价判断，直接存小刀价格
                if (line.includes("，")) {
                    const m = line.replace(/^[^，]*，/, '').trim()
                        .match(/^(.*?)(?=\s*(?:，\s*)?(?:改(?:价)?为\s*)?\d)(?:\s*，?\s*(?:改(?:价)?为\s*)?)?(\d+(?:\.\d+)?)(?:，|$)/);
                    if (m) xdLines.push(m[1] + m[2]);
                }
                continue;
            }
            xyLines.push(line);
        } else if (currentSystem === "xd-gai") {
            if (line.includes("星悦")) {
                currentSystem = "xy-gai";
                // 一行带改价判断，直接存星悦价格
                const m = line.replace(/^.*?星悦/, '').trim()
                    .match(/^(.*?)(?=\s*(?:，\s*)?(?:改(?:价)?为\s*)?\d)(?:\s*，?\s*(?:改(?:价)?为\s*)?)?(\d+(?:\.\d+)?)(?:，|$)/);
                if (m) xyLines.push(m[1] + m[2]);
                // 同步小刀
                if (line === "价格同步星悦系统") {
                    xyLines.push("同步")
                }
                continue;
            }
            xdLines.push(line);
        }
    }

    const xd = parseXd(xdLines, profit);
    const xy = parseXy(xyLines, profit, xd);
    const gbo = await parseGbo(gboLines, request, profit);

    return new Response(JSON.stringify({ date, xd, xy, gbo}), {headers: {'Content-Type': 'application/json'}});
}
