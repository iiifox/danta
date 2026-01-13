// 全局存储最新链接
let systemHrefs = {};

// 获取系统链接（只请求一次）
async function fetchSystemHrefs() {
    try {
        const resp = await fetch('/config/hyperlink.json');
        if (!resp.ok) throw new Error('接口请求失败');
        systemHrefs = await resp.json();
    } catch (err) {
        console.error('获取系统链接失败', err);
        systemHrefs = {};
    }
}

// ========== 小刀 ==========
function renderXdCards(timeBlocks) {
    const panel = document.getElementById('xd-panel');
    const container = panel.querySelector('.rebate-slides');

    // 清空容器
    container.innerHTML = '';

    if (!timeBlocks || timeBlocks.length === 0) {
        container.innerHTML = '<p>暂无报价</p>';
        return;
    }

    // 渠道太多，按组分好
    const groups = {
        qianbao: {
            label: '钱包',
            channels: ["渠道A", "渠道B", "渠道C", "渠道D", "渠道E", "渠道F", "渠道H（低价）", "Z1000"]
        },
        teshu: {
            label: '特殊',
            channels: ["渠道TA", "渠道TB"]
        },
        weixin: {
            label: '微信',
            channels: ["渠道VA", "VB微信10起", "VC微信50", "VD100", "VE200"]
        }
    };

    // 存储每个渠道上一次的折扣值
    const lastDiscountByChannel = {};

    // === 渲染 折扣slide ===
    timeBlocks.forEach((block, index) => {
        // 创建时间块面板
        const slide = document.createElement('div');
        slide.className = 'rebate-slide';
        slide.dataset.time = block.time;

        const timeTitle = document.createElement('h2');
        timeTitle.className = 'rebate-title';
        // 创建文本节点
        const titleText = document.createTextNode(`小刀返利折扣${(index === 0 && timeBlocks.length === 1) ? '' : `（${block.time}开始）`}`);
        // 创建链接
        const webLink = document.createElement('a');
        webLink.href = systemHrefs.xdWeb;
        webLink.target = '_blank';
        webLink.textContent = '网页入口';
        // 最新客户端下载
        const clientLink = document.createElement("a");
        clientLink.href = systemHrefs.xdClient;
        clientLink.target = '_blank';
        clientLink.textContent = systemHrefs.xdClient;
        // 组装
        timeTitle.appendChild(titleText);
        timeTitle.appendChild(webLink);
        timeTitle.appendChild(clientLink);
        slide.appendChild(timeTitle);

        // 渠道分组进行渲染
        Object.values(groups).forEach(groupInfo => {
            const group = document.createElement('div');
            group.className = 'rebate-group';

            // 渠道标签
            const channelSpan = document.createElement('span');
            channelSpan.className = 'channel-label';
            channelSpan.textContent = groupInfo.label;
            group.appendChild(channelSpan);

            // 渠道列表
            const channelList = document.createElement('div');
            channelList.className = 'channel-list';
            // 渲染标签当中每个渠道（渠道列表）
            groupInfo.channels.forEach(channelName => {
                const item = block.rates.find(i => i.channel === channelName);
                if (!item) return;

                // 颜色判定（默认黑色 涨价红色 降价绿色）
                let color = 'black';
                if (index > 0) {
                    const last = lastDiscountByChannel[channelName];
                    if (last !== undefined) {
                        if (item.discount > last) color = 'red';
                        else if (item.discount < last) color = 'green';
                    }
                }

                const channelItem = document.createElement('div');
                channelItem.className = 'channel-item';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'channel-name';
                nameSpan.textContent = channelName;

                const discountSpan = document.createElement('span');
                discountSpan.className = 'channel-discount';
                discountSpan.textContent = item.discount;
                discountSpan.style.color = color;

                channelItem.appendChild(nameSpan);
                channelItem.appendChild(discountSpan);
                channelList.appendChild(channelItem);

                // 更新当前渠道的 last discount
                lastDiscountByChannel[channelName] = item.discount;
            });

            group.appendChild(channelList);
            slide.appendChild(group);
        });

        container.appendChild(slide);
    });
}

// 初始化复制按钮功能
function initCopyRateButton(templateData) {
    const copyBtn = document.getElementById('copyRatesBtn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', () => {
        if (!templateData) {
            showToast('无可用费率数据（xd.template不存在）', true);
            return;
        }

        // 复制xd.template内容到剪贴板
        navigator.clipboard.writeText(templateData)
            .then(() => showToast('费率已复制到剪贴板', false))
            .catch(err => {
                showToast('复制失败，请手动复制', true);
                console.error('复制失败:', err);
            });
    });
}


// ========== 星悦 ==========
function renderXyCards(timeBlocks) {
    const panel = document.getElementById('xy-panel');
    const container = panel.querySelector('.rebate-slides');

    // 清空容器
    container.innerHTML = '';

    if (!timeBlocks || timeBlocks.length === 0) {
        container.innerHTML = '<p>暂无报价</p>';
        return;
    }

    // 渠道太多，按组分好
    const groups = {
        qianbao: {
            label: '钱包',
            channels: ["普通", "加速", "超速", "极速", "秒拉", "钱包直拉"]
        },
        teshu: {
            label: '特殊',
            channels: ["怪额", "超怪"]
        },
        weixin: {
            label: '微信',
            channels: ["微信速额", "微信点额", "微信小额", "微信固额", "微信通额", "微信扫码"]
        },
        qb: {
            label: '微信QB',
            channels: ["微信单端"]
        }
    };

    // 存储每个渠道上一次的折扣值
    const lastDiscountByChannel = {};

    // === 渲染 折扣slide ===
    timeBlocks.forEach((block, index) => {
        // 创建时间块面板
        const slide = document.createElement('div');
        slide.className = 'rebate-slide';
        slide.dataset.time = block.time;

        const timeTitle = document.createElement('h2');
        timeTitle.className = 'rebate-title';
        // 创建文本节点
        const titleText = document.createTextNode(`星悦返利折扣${(index === 0 && timeBlocks.length === 1) ? '' : `（${block.time}开始）`}`);
        // 创建链接
        const link = document.createElement('a');
        link.href = systemHrefs.xyWeb;
        link.target = '_blank';
        link.textContent = '网页入口';
        // 组装
        timeTitle.appendChild(titleText);
        timeTitle.appendChild(link);
        slide.appendChild(timeTitle);

        // 渠道分组进行渲染
        Object.values(groups).forEach(groupInfo => {
            const group = document.createElement('div');
            group.className = 'rebate-group';

            // 渠道标签
            const channelSpan = document.createElement('span');
            channelSpan.className = 'channel-label';
            channelSpan.textContent = groupInfo.label;
            group.appendChild(channelSpan);

            // 渠道列表
            const channelList = document.createElement('div');
            channelList.className = 'channel-list';
            // 渲染标签当中每个渠道（渠道列表）
            groupInfo.channels.forEach(channelName => {
                const item = block.rates.find(i => i.channel === channelName);
                if (!item) return;

                // 颜色判定（默认黑色 涨价红色 降价绿色）
                let color = 'black';
                if (index > 0) {
                    const last = lastDiscountByChannel[channelName];
                    if (last !== undefined) {
                        if (item.discount > last) color = 'red';
                        else if (item.discount < last) color = 'green';
                    }
                }

                const channelItem = document.createElement('div');
                channelItem.className = 'channel-item';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'channel-name';
                nameSpan.textContent = channelName;

                const discountSpan = document.createElement('span');
                discountSpan.className = 'channel-discount';
                discountSpan.textContent = item.discount;
                discountSpan.style.color = color;

                channelItem.appendChild(nameSpan);
                channelItem.appendChild(discountSpan);
                channelList.appendChild(channelItem);

                // 更新当前渠道的 last discount
                lastDiscountByChannel[channelName] = item.discount;
            });

            group.appendChild(channelList);
            slide.appendChild(group);
        });

        container.appendChild(slide);
    });
}

async function initCopyJsButton(profitParam, dateParam) {
    const copyBtn = document.getElementById('copyJsBtn');
    if (!copyBtn) return;

    // 拼接带 profit date 的接口
    let apiUrl = "/api/xyJsCode";
    const queryParams = new URLSearchParams();
    if (profitParam) queryParams.set('profit', profitParam);
    if (dateParam) queryParams.set('date', dateParam);
    const queryString = queryParams.toString();
    if (queryString) apiUrl += `?${queryString}`;
    // 请求
    const text = await fetch(apiUrl).then(r => r.text());

    copyBtn.addEventListener('click', () => {
        if (!text) {
            showToast('无可用费率数据', true, 'xy-toast');
            return;
        }
        // 复制xy费率脚本代码内容到剪贴板
        navigator.clipboard.writeText(text)
            .then(() => showToast('费率脚本代码已复制到剪贴板', false, 'xy-toast'))
            .catch(err => {
                showToast('复制失败，请手动复制', true, 'xy-toast');
                console.error('复制失败:', err);
            });
    });
}


// ========== GBO ==========
function renderGbo(gbo) {
    const container = document.getElementById('gboChannelList');
    container.innerHTML = '';
    // 校验数据是否存在
    if (!gbo || typeof gbo !== 'object' || Object.keys(gbo).length === 0) {
        container.innerHTML = '<p>暂无报价</p>';
        return;
    }
    const channels = Object.keys(gbo);
    // 渲染每个渠道项
    channels.forEach(channel => {
        const {price, paths} = gbo[channel];
        const channelItem = document.createElement('div');
        channelItem.className = 'channel-item';
        // 悬停提示使用 paths 数组（换行分隔）
        channelItem.setAttribute('data-tooltip', paths.join('\n'));
        // 显示渠道名和价格
        const nameSpan = document.createElement('span');
        nameSpan.className = 'channel-name';
        nameSpan.textContent = channel;

        const discountSpan = document.createElement('span');
        discountSpan.className = 'channel-discount';
        discountSpan.textContent = price;

        channelItem.appendChild(nameSpan);
        channelItem.appendChild(discountSpan);
        container.appendChild(channelItem);
    });
}

// 显示错误信息
function showError(message) {
    const container = document.getElementById('xdContainer');
    container.innerHTML = `
        <div class="error">
            <p>${message}</p>
            <p>请确保服务正常运行</p>
            <button class="refresh-btn" onclick="location.reload()">刷新页面</button>
        </div>
    `;
}

// 显示通知提示
function showToast(message, isError = false, containerId = 'xd-toast') {
    const notification = document.getElementById(containerId);
    if (!notification) return;
    notification.textContent = message;
    notification.className = 'toast';
    if (isError) notification.classList.add('error');
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// === 检测“明天”的折扣文件是否存在，存在则在右上角创建红色“明”FAB ===
async function checkAndCreateTomorrowFab(baseDate) {
    const tomorrowStr = new Date(baseDate.getTime() + 1 * 24 * 3600_000).toISOString().slice(0, 10);            
    let tomorrowDiscountUrl = '/api/discount';
    const qParam = new URLSearchParams();
    qParam.set('date', tomorrowStr);
    tomorrowDiscountUrl += `?${qParam.toString()}`;
    respD = await (await fetch(tomorrowDiscountUrl)).json();

    console.log(respD);
    if (Object.keys(respD.xy).length > 0) {
        const div = document.createElement('div');
        div.className = 'fab-top-right';
        div.id = 'fabTopRight';
        
        const a = document.createElement('a');
        a.className = 'fab fab-red';
        a.id = 'fabTomorrow';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.href = `/?date=${respD.date}`;
        a.textContent = '明';
        
        div.appendChild(a);
        document.body.appendChild(div); // 或指定容器
    }
}

// 主数据加载逻辑
async function loadData() {
    await fetchSystemHrefs();

    try {
        const params = new URLSearchParams(window.location.search);
        const profitParam = params.get('profit');
        const dateParam = params.get('date');
        // 构建请求 URL
        let discountUrl = '/api/discount';
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

        // 设置昨日费率链接
        const baseDate = dateParam ? new Date(dateParam) : new Date(Date.now() + 8 * 3600_000);
        const yesterdayStr = new Date(baseDate.getTime() - 1 * 24 * 3600_000).toISOString().slice(0, 10);
        document.getElementById('yesterday').href = `${window.location.origin}/?date=${yesterdayStr}`;

        // 在 loadData() 中（baseDate 已存在）调用：
        if (!dateParam) {
            checkAndCreateTomorrowFab(baseDate);
        }
        // === end 新增逻辑 ===

        // 动态设置费率展示标题
        if (discountData.date) {
            const rateTitleEl = document.getElementById('rate-title');
            if (rateTitleEl) {
                rateTitleEl.textContent = `${discountData.date} 费率展示`;
            }
        }

        // 渲染小刀数据
        const xdTimeBlocks = Object.entries(discountData.xd || {})
            .filter(([key]) => key !== 'template')
            .map(([time, channels]) => ({
                time,
                rates: Object.entries(channels).map(([channel, discount]) => ({channel, discount}))
            }));
        renderXdCards(xdTimeBlocks);
        // 初始化复制小刀费率按钮
        initCopyRateButton(discountData.xd?.template);

        // 渲染星悦数据
        const xyTimeBlocks = Object.entries(discountData.xy || {})
            .map(([time, channels]) => ({
                time,
                rates: Object.entries(channels).map(([channel, discount]) => ({channel, discount}))
            }));
        renderXyCards(xyTimeBlocks);
        // 初始化复制星悦费率脚本按钮
        await initCopyJsButton(profitParam, dateParam);

        // === 共用 rebate-tabs（只渲染一次） ===
        (function renderSharedTabsOnce(timeBlocks) {
            // 共用容器
            const tabsContainer = document.querySelector('.rebate-tabs');
            if (!tabsContainer) return;

            // 如果只有一个时间块，隐藏并返回
            if (!timeBlocks || timeBlocks.length <= 1) {
                tabsContainer.style.display = 'none';
                return;
            }

            // 清空旧内容
            tabsContainer.style.display = '';
            tabsContainer.innerHTML = '';

            // 创建 tabs
            timeBlocks.forEach((block, index) => {
                const tab = document.createElement('div');
                tab.className = `rebate-tab ${index === timeBlocks.length - 1 ? 'active' : ''}`;
                tab.textContent = block.time;
                tab.dataset.time = block.time;

                tab.addEventListener('click', () => {
                    // 用全局 selector 获取两个 panel 的 slides 列表，再滚动到对应 index
                    const xdSlides = document.querySelectorAll('#xd-panel .rebate-slide');
                    const xySlides = document.querySelectorAll('#xy-panel .rebate-slide');
                    // 尽量通过 index 找对应 slide（timeBlocks 顺序一致）
                    const xdSlide = xdSlides[index];
                    const xySlide = xySlides[index];
                    if (xdSlide) {
                        // 在 .rebate-slides 容器内平滑滚动（比直接 scrollIntoView 更可靠）
                        const xdContainer = document.querySelector('#xd-panel .rebate-slides');
                        if (xdContainer) xdContainer.scrollTo({left: xdSlide.offsetLeft, behavior: 'smooth'});
                        else xdSlide.scrollIntoView({behavior: 'smooth'});
                    }
                    if (xySlide) {
                        const xyContainer = document.querySelector('#xy-panel .rebate-slides');
                        if (xyContainer) xyContainer.scrollTo({left: xySlide.offsetLeft, behavior: 'smooth'});
                        else xySlide.scrollIntoView({behavior: 'smooth'});
                    }
                    // 更新 tabs 高亮
                    tabsContainer.querySelectorAll('.rebate-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                });

                tabsContainer.appendChild(tab);
            });

            // 滚动监听：任一 panel 滚动时，仅更新 tabs 的高亮（不必强制同步另一侧滚动，避免抖动）
            const xdContainer = document.querySelector('#xd-panel .rebate-slides');
            const xyContainer = document.querySelector('#xy-panel .rebate-slides');

            function updateActiveTabByContainer(container) {
                if (!container) return;
                const slides = container.querySelectorAll('.rebate-slide');
                if (!slides.length) return;
                // 取容器中心对应的 slide 作为当前
                const center = container.scrollLeft + container.clientWidth / 2;
                let bestIdx = 0;
                let bestDist = Infinity;
                slides.forEach((s, i) => {
                    const sCenter = s.offsetLeft + s.offsetWidth / 2;
                    const d = Math.abs(sCenter - center);
                    if (d < bestDist) {
                        bestDist = d;
                        bestIdx = i;
                    }
                });
                // 高亮 tab
                const tabs = tabsContainer.querySelectorAll('.rebate-tab');
                tabs.forEach(t => t.classList.remove('active'));
                if (tabs[bestIdx]) tabs[bestIdx].classList.add('active');
            }

            // 绑定（节流简单实现，避免频繁计算）
            let tOut;
            [xdContainer, xyContainer].forEach(c => {
                if (!c) return;
                c.addEventListener('scroll', () => {
                    if (tOut) clearTimeout(tOut);
                    tOut = setTimeout(() => updateActiveTabByContainer(c), 50);
                });
            });

            // 默认滚到最后一个时间块
            setTimeout(() => {
                const lastTab = tabsContainer.querySelectorAll('.rebate-tab')[timeBlocks.length - 1];
                if (lastTab) lastTab.click();
            }, 120);
        })(xdTimeBlocks);

        // 渲染gbo数据
        renderGbo(discountData.gbo || {});

    } catch (error) {
        showError('数据加载失败: ' + error.message);
    }
}

// 页面加载时执行
loadData();
