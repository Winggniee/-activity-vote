// 生成接下来4个周六和周日的日期
function generateWeekends() {
    const saturdayOptions = document.getElementById('saturdayOptions');
    const sundayOptions = document.getElementById('sundayOptions');
    const today = new Date();
    
    // 找到接下来的周六
    let currentDate = new Date(today);
    let daysUntilSaturday = (6 - currentDate.getDay() + 7) % 7;
    if (daysUntilSaturday === 0 && currentDate.getDay() === 6) {
        daysUntilSaturday = 0;
    } else if (daysUntilSaturday === 0) {
        daysUntilSaturday = 7;
    }
    currentDate.setDate(currentDate.getDate() + daysUntilSaturday);
    
    // 生成接下来4个周末
    for (let i = 0; i < 4; i++) {
        const saturday = new Date(currentDate);
        const sunday = new Date(currentDate);
        sunday.setDate(sunday.getDate() + 1);
        
        // 添加周六选项
        const satLabel = document.createElement('label');
        satLabel.className = 'option';
        satLabel.innerHTML = `
            <input type="checkbox" name="saturday" value="${formatDate(saturday)}">
            <span>📅 ${formatDate(saturday)}</span>
        `;
        saturdayOptions.appendChild(satLabel);
        
        // 添加周日选项
        const sunLabel = document.createElement('label');
        sunLabel.className = 'option';
        sunLabel.innerHTML = `
            <input type="checkbox" name="sunday" value="${formatDate(sunday)}">
            <span>📅 ${formatDate(sunday)}</span>
        `;
        sundayOptions.appendChild(sunLabel);
        
        currentDate.setDate(currentDate.getDate() + 7);
    }
}

function formatDate(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[date.getDay()];
    return `${month}/${day}(${weekday})`;
}

// JSONbin.io 配置
const JSONBIN_CONFIG = {
    binId: '6a3bb505f5f4af5e29284c2c', // 需要替换为你的 Bin ID
    apiKey: '$2a$10$sCYe2MnnGdZIVNU9bRwEYuDu0EPl7/Zq.WesyOpmYx94GO6.Ch2MC' // 需要替换为你的 API Key
};

// 投票设置
const VOTE_SETTINGS = {
    allowMultipleVotes: true, // 允许多次投票
    showVoteCount: false // 不显示投票次数提示
};

// 检查是否启用了云存储
const USE_CLOUD_STORAGE = JSONBIN_CONFIG.binId && 
                          JSONBIN_CONFIG.binId !== 'YOUR_BIN_ID' && 
                          JSONBIN_CONFIG.apiKey && 
                          JSONBIN_CONFIG.apiKey !== 'YOUR_API_KEY';

// 从服务器加载投票数据
async function loadVotes() {
    // 如果未配置云存储，直接使用本地存储
    if (!USE_CLOUD_STORAGE) {
        console.log('使用本地存储模式');
        const votes = localStorage.getItem('votes');
        if (!votes) {
            return {
                activities: {},
                saturdays: {},
                sundays: {},
                customActivities: []
            };
        }
        return JSON.parse(votes);
    }
    
    // 尝试从云端加载
    try {
        console.log('尝试从云端加载数据...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('云端加载失败:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('云端数据加载成功');
        
        // 同步到本地存储
        const record = data.record || {
            activities: {},
            saturdays: {},
            sundays: {},
            customActivities: []
        };
        localStorage.setItem('votes', JSON.stringify(record));
        return record;
    } catch (error) {
        console.error('云端加载错误，使用本地存储:', error);
        // 降级到 localStorage
        const votes = localStorage.getItem('votes');
        if (!votes) {
            return {
                activities: {},
                saturdays: {},
                sundays: {},
                customActivities: []
            };
        }
        return JSON.parse(votes);
    }
}

// 保存投票数据到服务器
async function saveVotes(votes) {
    // 总是保存到本地存储
    localStorage.setItem('votes', JSON.stringify(votes));
    
    // 如果未配置云存储，只使用本地
    if (!USE_CLOUD_STORAGE) {
        console.log('数据已保存到本地存储');
        return true;
    }
    
    // 尝试保存到云端
    try {
        console.log('尝试保存到云端...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            },
            body: JSON.stringify(votes)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('云端保存失败:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        console.log('数据已成功保存到云端');
        return true;
    } catch (error) {
        console.error('云端保存错误，已保存到本地:', error);
        // 虽然云端失败，但本地已保存，所以不抛出错误
        return true;
    }
}

// 添加自定义活动
document.getElementById('addActivityBtn').addEventListener('click', async function() {
    const input = document.getElementById('customActivity');
    const activityName = input.value.trim();
    
    if (!activityName) {
        alert('请输入活动名称');
        return;
    }
    
    // 禁用按钮
    const originalText = this.textContent;
    this.disabled = true;
    this.textContent = '添加中...';
    
    try {
        const votes = await loadVotes();
        
        // 确保 customActivities 数组存在
        if (!votes.customActivities) {
            votes.customActivities = [];
        }
        
        // 检查是否已存在
        if (votes.customActivities.includes(activityName)) {
            alert('这个活动已经存在了！');
            this.disabled = false;
            this.textContent = originalText;
            return;
        }
        
        // 添加到列表
        votes.customActivities.push(activityName);
        
        // 保存到服务器
        await saveVotes(votes);
        
        // 添加到页面
        addCustomActivityOption(activityName);
        
        // 清空输入框
        input.value = '';
        
        // 显示成功消息
        const successMessage = document.getElementById('successMessage');
        if (USE_CLOUD_STORAGE) {
            successMessage.textContent = '✅ 活动添加成功！';
        } else {
            successMessage.textContent = '✅ 活动已添加（本地模式）';
        }
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
            successMessage.textContent = '✅ 投票成功！感谢参与';
        }, 2000);
        
    } catch (error) {
        console.error('Add activity error:', error);
        // 即使出错，也尝试添加到页面（本地模式）
        addCustomActivityOption(activityName);
        input.value = '';
        
        const successMessage = document.getElementById('successMessage');
        successMessage.textContent = '✅ 活动已添加到本地';
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 2000);
    } finally {
        this.disabled = false;
        this.textContent = originalText;
    }
});

// 添加自定义活动选项到页面
function addCustomActivityOption(activityName) {
    const container = document.getElementById('customActivitiesOptions');
    
    // 检查是否已存在
    const existing = Array.from(container.querySelectorAll('input[name="customActivity"]'))
        .find(input => input.value === activityName);
    if (existing) return;
    
    const label = document.createElement('label');
    label.className = 'option';
    label.innerHTML = `
        <input type="checkbox" name="customActivity" value="${activityName}">
        <span>🎯 ${activityName}</span>
    `;
    container.appendChild(label);
}

// 加载已有的自定义活动
async function loadCustomActivities() {
    try {
        const votes = await loadVotes();
        if (votes.customActivities && votes.customActivities.length > 0) {
            votes.customActivities.forEach(activity => {
                addCustomActivityOption(activity);
            });
        }
    } catch (error) {
        console.error('Error loading custom activities:', error);
    }
}

// 检查是否已投票
function hasVoted() {
    if (VOTE_SETTINGS.allowMultipleVotes) {
        return false; // 允许多次投票
    }
    return localStorage.getItem('hasVoted') === 'true';
}

// 标记已投票
function markAsVoted() {
    if (VOTE_SETTINGS.allowMultipleVotes) {
        // 记录投票次数
        const count = parseInt(localStorage.getItem('voteCount') || '0') + 1;
        localStorage.setItem('voteCount', count.toString());
        localStorage.setItem('lastVotedAt', new Date().toISOString());
    } else {
        localStorage.setItem('hasVoted', 'true');
        localStorage.setItem('votedAt', new Date().toISOString());
    }
}

// 检查并显示已投票状态
function checkVotedStatus() {
    if (hasVoted()) {
        const votedAt = localStorage.getItem('votedAt');
        const date = votedAt ? new Date(votedAt).toLocaleString('zh-CN') : '未知时间';
        
        // 显示已投票提示
        const form = document.getElementById('voteForm');
        const notice = document.createElement('div');
        notice.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 10px; margin-bottom: 20px; color: #856404;';
        notice.innerHTML = `
            <strong>📌 您已经投过票了</strong><br>
            投票时间: ${date}<br>
            <small>如需修改投票，请点击下方"修改投票"按钮</small><br>
            <button type="button" id="allowRevoteBtn" style="margin-top: 10px; padding: 8px 16px; background: #ffc107; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                修改投票
            </button>
        `;
        form.insertBefore(notice, form.firstChild);
        
        // 禁用表单
        const inputs = form.querySelectorAll('input, button[type="submit"]');
        inputs.forEach(input => input.disabled = true);
        
        // 添加修改投票功能
        document.getElementById('allowRevoteBtn').addEventListener('click', function() {
            if (confirm('确定要修改投票吗？这将清除您之前的投票记录。')) {
                localStorage.removeItem('hasVoted');
                localStorage.removeItem('votedAt');
                location.reload();
            }
        });
        
        return true;
    } else if (VOTE_SETTINGS.allowMultipleVotes && VOTE_SETTINGS.showVoteCount) {
        // 显示已投票次数
        const count = parseInt(localStorage.getItem('voteCount') || '0');
        if (count > 0) {
            const form = document.getElementById('voteForm');
            const notice = document.createElement('div');
            notice.style.cssText = 'background: #e3f2fd; border: 2px solid #2196f3; padding: 15px; border-radius: 10px; margin-bottom: 20px; color: #0d47a1;';
            notice.innerHTML = `
                <strong>ℹ️ 投票提示</strong><br>
                您已投票 ${count} 次。最后投票时间: ${new Date(localStorage.getItem('lastVotedAt')).toLocaleString('zh-CN')}<br>
                <small>您可以继续投票</small>
            `;
            form.insertBefore(notice, form.firstChild);
        }
    }
    return false;
}

// 处理表单提交
document.getElementById('voteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 检查是否已投票
    if (hasVoted()) {
        alert('您已经投过票了！如需修改，请点击上方的"修改投票"按钮。');
        return;
    }
    
    const activities = Array.from(document.querySelectorAll('input[name="activity"]:checked'))
        .map(cb => cb.value);
    const customActivities = Array.from(document.querySelectorAll('input[name="customActivity"]:checked'))
        .map(cb => cb.value);
    const allActivities = [...activities, ...customActivities];
    
    const saturdays = Array.from(document.querySelectorAll('input[name="saturday"]:checked'))
        .map(cb => cb.value);
    const sundays = Array.from(document.querySelectorAll('input[name="sunday"]:checked'))
        .map(cb => cb.value);
    
    if (allActivities.length === 0 && saturdays.length === 0 && sundays.length === 0) {
        alert('请至少选择一个活动或一个时间');
        return;
    }
    
    // 禁用提交按钮
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '提交中...';
    
    try {
        // 加载现有投票
        const votes = await loadVotes();
        
        // 更新活动投票
        allActivities.forEach(activity => {
            votes.activities[activity] = (votes.activities[activity] || 0) + 1;
        });
        
        // 更新周六投票
        saturdays.forEach(saturday => {
            votes.saturdays[saturday] = (votes.saturdays[saturday] || 0) + 1;
        });
        
        // 更新周日投票
        sundays.forEach(sunday => {
            votes.sundays[sunday] = (votes.sundays[sunday] || 0) + 1;
        });
        
        // 保存投票（现在总是成功，因为至少会保存到本地）
        await saveVotes(votes);
        
        // 标记已投票
        markAsVoted();
        
        // 显示成功消息
        const successMessage = document.getElementById('successMessage');
        if (USE_CLOUD_STORAGE) {
            successMessage.textContent = '✅ 投票成功！感谢参与';
        } else {
            successMessage.textContent = '✅ 投票已保存（本地模式）';
        }
        successMessage.classList.remove('hidden');
        
        if (VOTE_SETTINGS.allowMultipleVotes) {
            // 允许多次投票时不刷新页面
            setTimeout(() => {
                successMessage.classList.add('hidden');
            }, 3000);
            
            // 重置表单
            this.reset();
        } else {
            // 单次投票模式才刷新页面
            setTimeout(() => {
                successMessage.classList.add('hidden');
                location.reload();
            }, 2000);
        }
        
        // 如果结果正在显示，更新它们
        if (!document.getElementById('resultsContainer').classList.contains('hidden')) {
            showResults();
        }
    } catch (error) {
        console.error('Vote submission error:', error);
        // 即使出错，因为已经保存到本地，也显示成功
        const successMessage = document.getElementById('successMessage');
        successMessage.textContent = '✅ 投票已保存到本地';
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);
        
        // 重置表单
        this.reset();
    } finally {
        // 恢复提交按钮
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// 显示结果
async function showResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    const showResultsBtn = document.getElementById('showResults');
    
    // 显示加载状态
    showResultsBtn.disabled = true;
    showResultsBtn.textContent = '加载中...';
    
    const votes = await loadVotes();
    
    showResultsBtn.disabled = false;
    showResultsBtn.textContent = '刷新结果';
    
    let html = '';
    
    // 活动结果
    if (Object.keys(votes.activities).length > 0) {
        html += '<div class="result-category"><h3>🎯 活动投票结果</h3>';
        const sortedActivities = Object.entries(votes.activities)
            .sort((a, b) => b[1] - a[1]);
        const maxActivityVotes = Math.max(...Object.values(votes.activities));
        
        sortedActivities.forEach(([activity, count]) => {
            const percentage = maxActivityVotes > 0 ? (count / maxActivityVotes * 100) : 0;
            html += `
                <div class="result-item">
                    <div class="result-label">${activity}</div>
                    <div class="result-bar-container">
                        <div class="result-bar" style="width: ${percentage}%">
                            ${percentage > 20 ? count + ' 票' : ''}
                        </div>
                    </div>
                    <div class="result-count">${count} 票</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // 周六结果
    if (Object.keys(votes.saturdays || {}).length > 0) {
        html += '<div class="result-category"><h3>📅 周六投票结果</h3>';
        const sortedSaturdays = Object.entries(votes.saturdays)
            .sort((a, b) => b[1] - a[1]);
        const maxSaturdayVotes = Math.max(...Object.values(votes.saturdays));
        
        sortedSaturdays.forEach(([saturday, count]) => {
            const percentage = maxSaturdayVotes > 0 ? (count / maxSaturdayVotes * 100) : 0;
            html += `
                <div class="result-item">
                    <div class="result-label">${saturday}</div>
                    <div class="result-bar-container">
                        <div class="result-bar" style="width: ${percentage}%">
                            ${percentage > 20 ? count + ' 票' : ''}
                        </div>
                    </div>
                    <div class="result-count">${count} 票</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // 周日结果
    if (Object.keys(votes.sundays || {}).length > 0) {
        html += '<div class="result-category"><h3>📅 周日投票结果</h3>';
        const sortedSundays = Object.entries(votes.sundays)
            .sort((a, b) => b[1] - a[1]);
        const maxSundayVotes = Math.max(...Object.values(votes.sundays));
        
        sortedSundays.forEach(([sunday, count]) => {
            const percentage = maxSundayVotes > 0 ? (count / maxSundayVotes * 100) : 0;
            html += `
                <div class="result-item">
                    <div class="result-label">${sunday}</div>
                    <div class="result-bar-container">
                        <div class="result-bar" style="width: ${percentage}%">
                            ${percentage > 20 ? count + ' 票' : ''}
                        </div>
                    </div>
                    <div class="result-count">${count} 票</div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    if (html === '') {
        html = '<p style="text-align: center; color: #666; padding: 20px;">暂无投票数据</p>';
    }
    
    resultsContainer.innerHTML = html;
    resultsContainer.classList.remove('hidden');
}

// 查看结果按钮
document.getElementById('showResults').addEventListener('click', function() {
    showResults();
});

// 页面加载时生成周末选项和加载自定义活动
document.addEventListener('DOMContentLoaded', function() {
    generateWeekends();
    loadCustomActivities();
    checkVotedStatus(); // 检查是否已投票
});
