// 小说推文文案生成器 - 前端交互脚本

// 全局变量
let currentResult = null;
let generationCount = 0;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 应用初始化
function initializeApp() {
    // 初始化风格描述
    updateStyleDescription(1);
    
    // 初始化数量显示
    updateCountDisplay(1);
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 添加页面加载动画
    document.querySelectorAll('.card').forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in-up');
        }, index * 200);
    });
    
    // 更新页脚时间
    updateFooterTime();
}

// 绑定事件监听器
function bindEventListeners() {
    // 表单提交
    document.getElementById('generateForm').addEventListener('submit', handleFormSubmit);
    
    // 风格选择变化
    document.getElementById('style1').addEventListener('change', () => updateStyleDescription(1));
    
    // 添加键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        style1: formData.get('style1'),
        count1: parseInt(formData.get('count1'))
    };
    
    // 验证数据
    if (!validateFormData(data)) {
        showAlert('请检查配置参数', 'warning');
        return;
    }
    
    generateContent(data);
}

// 验证表单数据
function validateFormData(data) {
    return data.style1 && data.count1 >= 6 && data.count1 <= 15;
}

// 生成内容
async function generateContent(data) {
    try {
        // 显示加载状态
        showLoadingState();
        
        // 设置更长的超时时间（2分钟）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        
        // 发送API请求
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            if (response.status === 504) {
                throw new Error('服务器超时，请稍后重试。如果问题持续，请尝试减少工具数量。');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            currentResult = result;
            generationCount++;
            displayResult(result);
            showAlert('🎉 文案生成成功！', 'success');
        } else {
            throw new Error(result.error || '生成失败');
        }
        
    } catch (error) {
        console.error('Generation error:', error);
        
        if (error.name === 'AbortError') {
            showAlert('⏰ 生成超时，请稍后重试或减少工具数量', 'warning');
        } else if (error.message.includes('504')) {
            showAlert('🔄 服务器处理时间较长，请稍后重试', 'warning');
        } else {
            showAlert(`❌ 生成失败: ${error.message}`, 'danger');
        }
    } finally {
        hideLoadingState();
    }
}

// 显示加载状态
function showLoadingState() {
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('generateBtn').disabled = true;
    
    // 添加脉冲动画
    document.getElementById('generateBtn').classList.add('pulse-animation');
    
    // 更新加载文本内容
    updateLoadingText();
    
    // 滚动到加载区域
    document.getElementById('loadingSection').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
    
    // 启动进度模拟
    startProgressSimulation();
}

// 隐藏加载状态
function hideLoadingState() {
    document.getElementById('loadingSection').style.display = 'none';
    document.getElementById('generateBtn').disabled = false;
    document.getElementById('generateBtn').classList.remove('pulse-animation');
    
    // 清理所有加载相关的定时器和状态
    cleanupLoadingState();
}

// 显示结果
function displayResult(result) {
    // 显示标题
    displayTitles(result.热门标题);
    
    // 显示文案内容
    displayContents(result.主体文案);
    
    // 显示配图建议
    displayImageSuggestions(result.配图建议);
    
    // 更新时间戳
    updateFooterTime(result.生成时间);
    
    // 显示结果区域
    document.getElementById('resultSection').style.display = 'block';
    
    // 滚动到结果区域
    setTimeout(() => {
        document.getElementById('resultSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 300);
    
    // 添加动画效果
    animateResultCards();
}

// 显示标题
function displayTitles(titles) {
    const container = document.getElementById('titlesContainer');
    container.innerHTML = '';
    
    titles.forEach((title, index) => {
        const titleElement = createTitleElement(title, index + 1);
        container.appendChild(titleElement);
    });
}

// 创建标题元素
function createTitleElement(title, index) {
    const col = document.createElement('div');
    col.className = 'col-12 mb-3';
    
    const titleDiv = document.createElement('div');
    titleDiv.className = 'title-item';
    titleDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <span class="badge bg-warning text-dark me-2">${index}</span>
                <span class="fw-bold">${title}</span>
            </div>
            <button class="btn btn-sm btn-outline-primary btn-copy" 
                    onclick="copyText('${title.replace(/'/g, "\\'")}')"
                    title="复制标题">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `;
    
    col.appendChild(titleDiv);
    return col;
}

// 显示文案内容
function displayContents(content) {
    const container = document.getElementById('contentsContainer');
    container.innerHTML = '';
    
    // 处理单个文案对象
    const contentElement = createContentElement(content, 1);
    container.appendChild(contentElement);
}

// 创建文案内容元素
function createContentElement(content, index) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'content-item mb-4';
    
    const toolsList = content.选中工具.join('、');
    
    contentDiv.innerHTML = `
        <div class="content-header">
            <div>
                <h6 class="mb-1">
                    <i class="fas fa-magic me-2"></i>
                    生成的小说推文文案
                </h6>
                <div class="d-flex gap-2 align-items-center">
                    <span class="style-badge">${content.风格}</span>
                    <span class="tool-count">${content.工具数量}个工具</span>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn btn-sm btn-outline-success btn-copy me-2" 
                        onclick="copyText(this.dataset.content)"
                        data-content="${content.内容.replace(/"/g, '&quot;').replace(/'/g, "\\'")}"
                        title="复制文案">
                    <i class="fas fa-copy me-1"></i>复制
                </button>
                <button class="btn btn-sm btn-outline-info" 
                        onclick="showContentModal('${content.风格}', '${toolsList}', this.dataset.content)"
                        data-content="${content.内容.replace(/"/g, '&quot;').replace(/'/g, "\\'")}"
                        title="全屏查看">
                    <i class="fas fa-expand me-1"></i>详情
                </button>
            </div>
        </div>
        <div class="mb-3">
            <small class="text-muted">
                <i class="fas fa-tools me-1"></i>
                包含工具: ${toolsList}
            </small>
        </div>
        <div class="content-text">${content.内容}</div>
    `;
    
    return contentDiv;
}

// 显示配图建议
function displayImageSuggestions(suggestions) {
    const container = document.getElementById('imagesContainer');
    container.innerHTML = '';
    
    suggestions.forEach((suggestion, index) => {
        const suggestionElement = createImageSuggestionElement(suggestion, index + 1);
        container.appendChild(suggestionElement);
    });
}

// 创建配图建议元素
function createImageSuggestionElement(suggestion, index) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6 mb-3';
    
    const suggestionDiv = document.createElement('div');
    suggestionDiv.className = 'image-suggestion h-100';
    suggestionDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="text-success mb-0">
                <i class="fas fa-image me-2"></i>
                配图建议 ${index}
            </h6>
            <button class="btn btn-sm btn-outline-success btn-copy" 
                    onclick="copyText('${suggestion.replace(/'/g, "\\'")}')"
                    title="复制建议">
                <i class="fas fa-copy"></i>
            </button>
        </div>
        <p class="mb-0 text-muted">${suggestion}</p>
    `;
    
    col.appendChild(suggestionDiv);
    return col;
}

// 更新风格描述
function updateStyleDescription(num) {
    const select = document.getElementById('style1');
    const descElement = document.getElementById('style1-desc');
    
    const selectedOption = select.options[select.selectedIndex];
    const description = selectedOption.dataset.description;
    const tone = selectedOption.dataset.tone;
    
    descElement.innerHTML = `<i class="fas fa-info-circle text-primary me-1"></i>${description} (${tone})`;
}

// 更新数量显示
function updateCountDisplay(num) {
    const range = document.getElementById('count1');
    const display = document.getElementById('count1-display');
    display.textContent = `${range.value}个`;
}

// 复制文本到剪贴板
async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        showCopySuccess();
    } catch (error) {
        console.error('复制失败:', error);
        // 降级处理
        fallbackCopyText(text);
    }
}

// 降级复制方法
function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (error) {
        console.error('降级复制也失败了:', error);
        showAlert('复制失败，请手动复制', 'warning');
    }
    
    document.body.removeChild(textArea);
}

// 显示复制成功提示
function showCopySuccess() {
    const modal = new bootstrap.Modal(document.getElementById('copyModal'));
    modal.show();
    
    // 3秒后自动关闭
    setTimeout(() => {
        modal.hide();
    }, 2000);
}

// 复制所有内容
function copyAllContent() {
    if (!currentResult) {
        showAlert('没有可复制的内容', 'warning');
        return;
    }
    
    let allContent = '🔥 小说推文文案生成结果\n\n';
    
    // 添加标题
    allContent += '📝 热门标题建议:\n';
    currentResult.热门标题.forEach((title, index) => {
        allContent += `${index + 1}. ${title}\n`;
    });
    
    // 添加文案
    allContent += '\n📖 主体文案:\n';
    currentResult.主体文案.forEach((content, index) => {
        allContent += `\n--- 文案 ${index + 1} (${content.风格}) ---\n`;
        allContent += `${content.内容}\n`;
    });
    
    // 添加配图建议
    allContent += '\n🖼️ 配图建议:\n';
    currentResult.配图建议.forEach((suggestion, index) => {
        allContent += `${index + 1}. ${suggestion}\n`;
    });
    
    allContent += `\n⏰ 生成时间: ${currentResult.生成时间}`;
    
    copyText(allContent);
}

// 下载内容为文档
function downloadContent() {
    if (!currentResult) {
        showAlert('没有可下载的内容', 'warning');
        return;
    }
    
    const content = generateDownloadContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `小说推文文案_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('文档下载成功！', 'success');
}

// 生成下载内容
function generateDownloadContent() {
    let content = '小说推文文案生成结果\n';
    content += '=' .repeat(50) + '\n\n';
    
    content += `生成时间: ${currentResult.生成时间}\n`;
    content += `生成次数: 第${generationCount}次\n\n`;
    
    // 热门标题
    content += '热门标题建议:\n';
    content += '-'.repeat(20) + '\n';
    currentResult.热门标题.forEach((title, index) => {
        content += `${index + 1}. ${title}\n`;
    });
    
    // 主体文案
    content += '\n主体文案:\n';
    content += '-'.repeat(20) + '\n';
    currentResult.主体文案.forEach((item, index) => {
        content += `\n[文案 ${index + 1} - ${item.风格}]\n`;
        content += `工具数量: ${item.工具数量}个\n`;
        content += `包含工具: ${item.选中工具.join('、')}\n\n`;
        content += `${item.内容}\n`;
        content += '\n' + '='.repeat(30) + '\n';
    });
    
    // 配图建议
    content += '\n配图建议:\n';
    content += '-'.repeat(20) + '\n';
    currentResult.配图建议.forEach((suggestion, index) => {
        content += `${index + 1}. ${suggestion}\n`;
    });
    
    return content;
}

// 重新生成内容
function regenerateContent() {
    const form = document.getElementById('generateForm');
    const formData = new FormData(form);
    
    const data = {
        style1: formData.get('style1'),
        style2: formData.get('style2'),
        count1: parseInt(formData.get('count1')),
        count2: parseInt(formData.get('count2'))
    };
    
    generateContent(data);
}

// 显示警告信息
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    const icon = {
        'success': 'fas fa-check-circle',
        'danger': 'fas fa-exclamation-triangle',
        'warning': 'fas fa-exclamation-circle',
        'info': 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';
    
    alertDiv.innerHTML = `
        <i class="${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 5秒后自动移除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// 键盘快捷键处理
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + Enter: 生成内容
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('generateForm').requestSubmit();
    }
    
    // Ctrl/Cmd + C: 复制全部内容（当有结果时）
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && currentResult && !e.target.matches('input, textarea')) {
        e.preventDefault();
        copyAllContent();
    }
}

// 动画效果
function animateResultCards() {
    const cards = document.querySelectorAll('#resultSection .card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }, index * 200);
    });
}

// 更新页脚时间
function updateFooterTime(customTime = null) {
    const timeElement = document.getElementById('footerTime');
    if (timeElement) {
        const time = customTime || new Date().toLocaleString('zh-CN');
        timeElement.textContent = time;
    }
}

// 显示内容详情模态框
function showContentModal(style, tools, content) {
    // 创建模态框HTML
    const modalHtml = `
        <div class="modal fade" id="contentModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-file-alt me-2"></i>
                            ${style} - 详细内容
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <small class="text-muted">
                                <i class="fas fa-tools me-1"></i>
                                包含工具: ${tools}
                            </small>
                        </div>
                        <div class="content-text" style="max-height: 60vh; overflow-y: auto;">${content}</div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" onclick="copyText('${content.replace(/'/g, "\\'")}')">复制内容</button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('contentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 添加新模态框
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('contentModal'));
    modal.show();
    
    // 模态框关闭时清理
    document.getElementById('contentModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// 页面卸载前清理
window.addEventListener('beforeunload', function() {
    // 清理可能的定时器和事件监听器
});

// 更新加载文本
function updateLoadingText() {
    const loadingTexts = [
        'AI正在分析文案风格...',
        '正在智能组合推荐工具...',
        '生成热门标题中...',
        '创作主体文案内容...',
        '制作配图建议...',
        '最后优化和整理...'
    ];
    
    let currentIndex = 0;
    const textElement = document.querySelector('#loadingSection h5');
    
    const interval = setInterval(() => {
        if (textElement && currentIndex < loadingTexts.length) {
            textElement.textContent = loadingTexts[currentIndex];
            currentIndex++;
        } else {
            clearInterval(interval);
        }
    }, 8000); // 每8秒更换一次文本
    
    // 存储interval ID用于清理
    window.loadingTextInterval = interval;
}

// 启动进度模拟
function startProgressSimulation() {
    const progressBar = document.querySelector('#loadingSection .progress-bar');
    if (!progressBar) return;
    
    let progress = 0;
    const interval = setInterval(() => {
        if (progress < 90) { // 最多到90%，剩下10%等实际完成
            progress += Math.random() * 3;
            progressBar.style.width = `${Math.min(progress, 90)}%`;
        }
    }, 1000);
    
    // 存储interval ID用于清理
    window.progressInterval = interval;
}

// 清理加载状态
function cleanupLoadingState() {
    if (window.loadingTextInterval) {
        clearInterval(window.loadingTextInterval);
        window.loadingTextInterval = null;
    }
    if (window.progressInterval) {
        clearInterval(window.progressInterval);
        window.progressInterval = null;
    }
    
    // 重置进度条
    const progressBar = document.querySelector('#loadingSection .progress-bar');
    if (progressBar) {
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 500);
    }
}

console.log('🚀 小说推文文案生成器已就绪！');
console.log('💡 快捷键提示:');
console.log('   - Ctrl/Cmd + Enter: 生成文案');
console.log('   - Ctrl/Cmd + C: 复制全部内容（有结果时）');
