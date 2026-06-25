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

// 从服务器加载投票数据
async function loadVotes() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load votes');
        }
        
        const data = await response.json();
        return data.record || {
            activities: {},
            saturdays: {},
            sundays: {},
            customActivities: []
        };
    } catch (error) {
        console.error('Error loading votes:', error);
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
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            },
            body: JSON.stringify(votes)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save votes');
        }
        
        // 同时保存到 localStorage 作为备份
        localStorage.setItem('votes', JSON.stringify(votes));
        return true;
    } catch (error) {
        console.error('Error saving votes:', error);
        // 降级到 localStorage
        localStorage.setItem('votes', JSON.stringify(votes));
        return false;
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
        successMessage.textContent = '✅ 活动添加成功！';
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
            successMessage.textContent = '✅ 投票成功！感谢参与';
        }, 2000);
        
    } catch (error) {
        alert('添加失败，请重试');
        console.error('Add activity error:', error);
    } finally {
        this.disabled = false;
        this.textContent = '+ 添加';
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

// 处理表单提交
document.getElementById('voteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
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
        
        // 保存投票
        await saveVotes(votes);
        
        // 显示成功消息
        const successMessage = document.getElementById('successMessage');
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);
        
        // 重置表单
        this.reset();
        
        // 如果结果正在显示，更新它们
        if (!document.getElementById('resultsContainer').classList.contains('hidden')) {
            showResults();
        }
    } catch (error) {
        alert('投票失败，请重试');
        console.error('Vote submission error:', error);
    } finally {
        // 恢复提交按钮
        submitBtn.disabled = false;
        submitBtn.textContent = '提交投票';
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
});
