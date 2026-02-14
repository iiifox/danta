// 全局存储最新链接
let systemHrefs = {};

// ========== 面板切换状态 ==========
let currentPanelType = 'xd'; // 'xd' 或 'xy'

// ========== 时间标签选中索引（核心新增） ==========
let activeTimeTabIndex = -1; // 记录当前选中的时间标签索引，-1=未初始化


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
    // 只有当前面板是 'xd' 时才渲染
    if (currentPanelType !== 'xd') return;

    const panel = document.getElementById('unified-panel');
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
        const titleText = document.createTextNode("小刀");
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
        // 🔴 新增：创建切换按钮容器并插入标题
        const switchContainer = document.createElement('div');
        switchContainer.className = 'switch-panel-container';
        switchContainer.id = 'switchPanelContainer';
        const switchBtn = document.createElement('button');
        switchBtn.className = 'switch-btn';
        switchBtn.id = 'switchPanelBtn';
        switchBtn.textContent = currentPanelType === 'xd' ? '★ 切换为星悦' : '⭐ 切换为小刀';
        switchContainer.appendChild(switchBtn);

        // 组装标题
        timeTitle.appendChild(titleText);
        timeTitle.appendChild(webLink);
        timeTitle.appendChild(clientLink);
        timeTitle.appendChild(switchContainer); // 🔴 插入按钮
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
    const copyBtn = document.getElementById('copyBtn');
    if (!copyBtn) return;

    copyBtn.addEventListener('click', () => {
        // 根据当前面板类型决定复制内容
        if (currentPanelType === 'xd') {
            if (!templateData) {
                showToast('无可用费率数据（xd.template不存在）', true, 'panel-toast');
                return;
            }
            navigator.clipboard.writeText(templateData)
                .then(() => showToast('费率已复制到剪贴板', false, 'panel-toast'))
                .catch(err => {
                    showToast('复制失败，请手动��制', true, 'panel-toast');
                    console.error('复制失败:', err);
                });
        }
    });
}


// ========== 星悦 ==========
function renderXyCards(timeBlocks) {
    // 只有当前面板是 'xy' 时才渲染
    if (currentPanelType !== 'xy') return;

    const panel = document.getElementById('unified-panel');
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
            channels: ["微信速额", "微信点额", "微信小额", "微信固额", "微信通额"]
        },
        qb: {
            label: '微信QB',
            channels: ["微信单端", "微信扫码"]
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
        const titleText = document.createTextNode("星悦");
        // 创建链接
        const link = document.createElement('a');
        link.href = systemHrefs.xyWeb;
        link.target = '_blank';
        link.textContent = '网页入口';
        // 🔴 新增切换按钮
        const switchContainer = document.createElement('div');
        switchContainer.className = 'switch-panel-container';
        switchContainer.id = 'switchPanelContainer';
        const switchBtn = document.createElement('button');
        switchBtn.className = 'switch-btn';
        switchBtn.id = 'switchPanelBtn';
        switchBtn.textContent = currentPanelType === 'xy' ? '⭐ 切换为小刀' : '★ 切换为星悦';
        switchContainer.appendChild(switchBtn);

        timeTitle.appendChild(titleText);
        timeTitle.appendChild(link);
        timeTitle.appendChild(switchContainer); // 🔴 插入按钮
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
    // 拼接带 profit date 的接口
    let apiUrl = "/api/xyJsCode";
    const queryParams = new URLSearchParams();
    if (profitParam) queryParams.set('profit', profitParam);
    if (dateParam) queryParams.set('date', dateParam);
    const queryString = queryParams.toString();
    if (queryString) apiUrl += `?${queryString}`;
    // 请求
    const xyText = await fetch(apiUrl).then(r => r.text());

    const copyBtn = document.getElementById('copyBtn');
    if (!copyBtn) return;

    // 修改原始监听器，使其同时支持两种复制
    copyBtn.addEventListener('click', () => {
        if (currentPanelType === 'xy') {
            if (!xyText) {
                showToast('无可用费率数据', true, 'panel-toast');
                return;
            }
            navigator.clipboard.writeText(xyText)
                .then(() => showToast('费率脚本代码已复制到剪贴板', false, 'panel-toast'))
                .catch(err => {
                    showToast('复制失败，请手动复制', true, 'panel-toast');
                    console.error('复制失败:', err);
                });
        }
    });
}

// ========== 新的星悦 ==========
function renderXynCards(timeBlocks) {
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
            channels: ["普通", "加速", "超速", "极速", "钱包直拉", "秒拉"]
        },
        teshu: {
            label: '特殊',
            channels: ["超怪", "怪额"]
        },
        weixin: {
            label: '微信',
            channels: ["微信通额", "微信点额", "微信固额", "微信小额", "微信速额"]
        },
        qb: {
            label: '微信QB',
            channels: ["微信单端", "微信扫码"]
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
        const titleText = document.createTextNode("新星悦");
        // 创建链接
        const webLink = document.createElement('a');
        webLink.href = systemHrefs.xyWeb;
        webLink.target = '_blank';
        webLink.textContent = '网页入口';
        // 最新客户端下载
        const clientLink = document.createElement("a");
        clientLink.href = systemHrefs.xyClient;
        clientLink.target = '_blank';
        clientLink.textContent = "Win版客户端";
        // 插件下载
        const chajianLink = document.createElement("a");
        chajianLink.href = systemHrefs.xyChajian;
        chajianLink.target = '_blank';
        chajianLink.textContent = "产码插件";
        // 抓包工具下载
        const zhuabaoLink = document.createElement("a");
        zhuabaoLink.href = systemHrefs.xyZhuabao;
        zhuabaoLink.target = '_blank';
        zhuabaoLink.textContent = "抓包工具";
        // 组装
        timeTitle.appendChild(titleText);
        timeTitle.appendChild(webLink);
        timeTitle.appendChild(clientLink);
        timeTitle.appendChild(chajianLink);
        timeTitle.appendChild(zhuabaoLink);
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

// 标签渲染函数
function renderXyTimeTabs(timeBlocks) {
    const tabsContainer = document.getElementById('xy-tabs');
    if (!tabsContainer) return;

    // 清空旧内容
    tabsContainer.innerHTML = '';

    // 如果只有一个时间块，隐藏标签容器
    if (!timeBlocks || timeBlocks.length <= 1) {
        tabsContainer.style.display = 'none';
        return;
    }

    // 显示标签容器并创建 tabs
    tabsContainer.style.display = '';
    timeBlocks.forEach((block, index) => {
        const tab = document.createElement('div');
        tab.className = `rebate-tab ${index === timeBlocks.length - 1 ? 'active' : ''}`;
        tab.textContent = block.time;
        tab.dataset.time = block.time;

        tab.addEventListener('click', () => {
            // 核心新增：记录当前点击的索引
            activeTimeTabIndex = index;
            // 👉 关键修复：获取当前面板的 slides 容器（不再硬编码）
            const rebateSlides = document.querySelectorAll('#xy-panel .rebate-slide');
            const rebateSlide = rebateSlides[index];
            if (rebateSlide) {
                const rebateContainer = document.querySelector('#xy-panel .rebate-slides');
                if (rebateContainer) rebateContainer.scrollTo({
                    left: rebateSlide.offsetLeft,
                    behavior: 'smooth'
                });
                else rebateSlide.scrollIntoView({behavior: 'smooth'});
            }
            // 更新标签高亮
            tabsContainer.querySelectorAll('.rebate-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });

        tabsContainer.appendChild(tab);
    });

    // 重新绑定滚动监听（先移除旧监听，避免重复）
    const rebateContainer = document.querySelector('#xy-panel .rebate-slides');
    // 移除旧监听（通过命名函数实现）
    if (rebateContainer._tabScrollHandler) {
        rebateContainer.removeEventListener('scroll', rebateContainer._tabScrollHandler);
    }

    // 定义滚动监听函数并挂载到容器上（便于移除）
    rebateContainer._tabScrollHandler = function () {
        let tOut;
        return () => {
            if (tOut) clearTimeout(tOut);
            tOut = setTimeout(() => {
                const slides = rebateContainer.querySelectorAll('.rebate-slide');
                if (!slides.length) return;
                const center = rebateContainer.scrollLeft + rebateContainer.clientWidth / 2;
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
                const tabs = tabsContainer.querySelectorAll('.rebate-tab');
                tabs.forEach(t => t.classList.remove('active'));
                if (tabs[bestIdx]) {
                    tabs[bestIdx].classList.add('active');
                    // 核心新增：滚动时更新选中索引
                    activeTimeTabIndex = bestIdx;
                }
            }, 50);
        };
    }();

    // 绑定新的滚动监听
    rebateContainer.addEventListener('scroll', rebateContainer._tabScrollHandler);

    // 默认选中时间块（首次选最后一个，切换后选记录的索引）
    setTimeout(() => {
        const tabs = tabsContainer.querySelectorAll('.rebate-tab');
        // 首次初始化：选最后一个并记录索引
        if (activeTimeTabIndex === -1) {
            activeTimeTabIndex = tabs.length - 1;
        }
        // 优先选记录的索引，兜底选最后一个
        const targetTab = tabs[activeTimeTabIndex] || tabs[tabs.length - 1];
        if (targetTab) {
            targetTab.click();
        }
    }, 120);
}

async function initXyJsButton(profitParam, dateParam) {
    // 拼接带 profit date 的接口
    let apiUrl = "/api/xynJsCode";
    const queryParams = new URLSearchParams();
    if (profitParam) queryParams.set('profit', profitParam);
    if (dateParam) queryParams.set('date', dateParam);
    const queryString = queryParams.toString();
    if (queryString) apiUrl += `?${queryString}`;
    // 请求
    const xynText = await fetch(apiUrl).then(r => r.text());

    const copyBtn = document.getElementById('xyBtn');
    if (!copyBtn) return;

    // 修改原始监听器，使其同时支持两种复制
    copyBtn.addEventListener('click', () => {
        if (!xynText) {
            showToast('无可用费率数据', true, 'xy-toast');
            return;
        }
        navigator.clipboard.writeText(xynText)
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

// 重构：可复用的标签渲染函数（支持切换面板时更新）
function renderTimeTabs(timeBlocks) {
    const tabsContainer = document.getElementById('xd-tabs');
    if (!tabsContainer) return;

    // 清空旧内容
    tabsContainer.innerHTML = '';

    // 如果只有一个时间块，隐藏标签容器
    if (!timeBlocks || timeBlocks.length <= 1) {
        tabsContainer.style.display = 'none';
        return;
    }

    // 显示标签容器并创建 tabs
    tabsContainer.style.display = '';
    timeBlocks.forEach((block, index) => {
        const tab = document.createElement('div');
        tab.className = `rebate-tab ${index === timeBlocks.length - 1 ? 'active' : ''}`;
        tab.textContent = block.time;
        tab.dataset.time = block.time;

        tab.addEventListener('click', () => {
            // 👉 关键修复：获取当前面板的 slides 容器（不再硬编码）
            const rebateSlides = document.querySelectorAll('#unified-panel .rebate-slide');
            const rebateSlide = rebateSlides[index];
            if (rebateSlide) {
                const rebateContainer = document.querySelector('#unified-panel .rebate-slides');
                if (rebateContainer) rebateContainer.scrollTo({
                    left: rebateSlide.offsetLeft,
                    behavior: 'smooth'
                });
                else rebateSlide.scrollIntoView({behavior: 'smooth'});
            }
            // 更新标签高亮
            tabsContainer.querySelectorAll('.rebate-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });

        tabsContainer.appendChild(tab);
    });

    // 重新绑定滚动监听（先移除旧监听，避免重复）
    const rebateContainer = document.querySelector('#unified-panel .rebate-slides');
    // 移除旧监听（通过命名函数实现）
    if (rebateContainer._tabScrollHandler) {
        rebateContainer.removeEventListener('scroll', rebateContainer._tabScrollHandler);
    }

    // 定义滚动监听函数并挂载到容器上（便于移除）
    rebateContainer._tabScrollHandler = function () {
        let tOut;
        return () => {
            if (tOut) clearTimeout(tOut);
            tOut = setTimeout(() => {
                const slides = rebateContainer.querySelectorAll('.rebate-slide');
                if (!slides.length) return;
                const center = rebateContainer.scrollLeft + rebateContainer.clientWidth / 2;
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
                const tabs = tabsContainer.querySelectorAll('.rebate-tab');
                tabs.forEach(t => t.classList.remove('active'));
                if (tabs[bestIdx]) tabs[bestIdx].classList.add('active');
            }, 50);
        };
    }();

    // 绑定新的滚动监听
    rebateContainer.addEventListener('scroll', rebateContainer._tabScrollHandler);

    // 默认滚到最后一个时间块
    setTimeout(() => {
        const lastTab = tabsContainer.querySelectorAll('.rebate-tab')[timeBlocks.length - 1];
        if (lastTab) lastTab.click();
    }, 120);
}

function initPanelSwitch() {
    // 改为事件委托，监听父容器点击，避免重复绑定
    const panel = document.getElementById('unified-panel');
    panel.addEventListener('click', (e) => {
        if (!e.target.matches('#switchPanelBtn')) return;

        const switchBtn = e.target;
        const copyBtn = document.getElementById('copyBtn');
        const slides = panel.querySelector('.rebate-slides');

        if (currentPanelType === 'xd') {
            // 切换到星悦
            currentPanelType = 'xy';
            switchBtn.textContent = '⭐ 切换为小刀';
            copyBtn.textContent = '复制费率代码';
            slides.innerHTML = '';
            renderXyCards(window.discountData.xyTimeBlocks);
        } else {
            // 切换到小刀
            currentPanelType = 'xd';
            switchBtn.textContent = '★ 切换为星悦';
            copyBtn.textContent = '复制费率';
            slides.innerHTML = '';
            renderXdCards(window.discountData.xdTimeBlocks);
        }

        slides.scrollLeft = 0;
        // 核心修改：根据记录的索引选中对应标签
        const tabsContainer = document.getElementById('xd-tabs');
        const tabs = tabsContainer.querySelectorAll('.rebate-tab');
        // 用记录的索引，无则选最后一个
        const targetIndex = activeTimeTabIndex >= 0 ? activeTimeTabIndex : tabs.length - 1;
        if (tabs[targetIndex]) {
            tabs[targetIndex].click();
        }
    });
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
        // 渲染星悦数据
        const xyTimeBlocks = Object.entries(discountData.xy || {})
            .map(([time, channels]) => ({
                time,
                rates: Object.entries(channels).map(([channel, discount]) => ({channel, discount}))
            }));
        // 存储数据供切换使用
        window.discountData = {
            xdTimeBlocks,
            xyTimeBlocks,
            xdTemplate: discountData.xd?.template
        };
        // 初始化面板切换按钮
        initPanelSwitch();
        // 首次渲染小刀
        currentPanelType = 'xd';
        renderXdCards(xdTimeBlocks);
        initCopyRateButton(discountData.xd?.template);
        await initCopyJsButton(profitParam, dateParam);
        renderTimeTabs(xdTimeBlocks);

        // 渲染新的星悦数据
        const xynTimeBlocks = Object.entries(discountData.xyn || {})
            .map(([time, channels]) => ({
                time,
                rates: Object.entries(channels).map(([channel, discount]) => ({channel, discount}))
            }));
        renderXynCards(xynTimeBlocks);
        await initXyJsButton(profitParam, dateParam);
        renderXyTimeTabs(xynTimeBlocks);

        // 渲染gbo数据
        renderGbo(discountData.gbo || {});

    } catch (error) {
        showError('数据加载失败: ' + error.message);
    }
}

// 页面加载时执行
loadData();
