// 全局变量
let experimentData = {
    pretest: {
        vas: 0,
        sai: []
    },
    posttest: {
        vas: 0,
        sai: []
    }
};

// SAI和TAI量表题目
const saiQuestions = [
    { id: 1, text: "我感到心情平静", reverse: true },
    { id: 2, text: "我感到安全", reverse: true },
    { id: 3, text: "我是紧张的", reverse: false },
    { id: 4, text: "我感到紧张束缚", reverse: false },
    { id: 5, text: "我感到安逸", reverse: true },
    { id: 6, text: "我感到烦乱", reverse: false },
    { id: 7, text: "我现在正烦恼，感到这种烦恼超过了可能的不幸", reverse: false },
    { id: 8, text: "我感到满意", reverse: true },
    { id: 9, text: "我感到害怕", reverse: false },
    { id: 10, text: "我感到舒适", reverse: true },
    { id: 11, text: "我有自信心", reverse: true },
    { id: 12, text: "我觉得神经过敏", reverse: false },
    { id: 13, text: "我极度紧张不安", reverse: false },
    { id: 14, text: "我优柔寡断", reverse: false },
    { id: 15, text: "我是轻松的", reverse: true },
    { id: 16, text: "我感到心满意足", reverse: true },
    { id: 17, text: "我是烦恼的", reverse: false },
    { id: 18, text: "我感到慌乱", reverse: false },
    { id: 19, text: "我感觉镇定", reverse: true },
    { id: 20, text: "我感到愉快", reverse: true }
];

const options = [
    { value: 1, text: "完全没有" },
    { value: 2, text: "有些" },
    { value: 3, text: "中等程度" },
    { value: 4, text: "非常明显" }
];

// 焦虑诱发时间节点（秒）
const inductionTimes = [32, 88, 118, 151, 163, 176, 229, 284, 296, 309, 354];
const inductionDuration = 5; // 刺激持续时间（秒）
const totalInductionTime = 380; // 总诱发时间（秒）

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    initializeConsentPage();
    initializeEEGPage();
    initializePretestPage();
    initializeInductionPage();
    initializePosttestPage();
    initializeResultPage();
});

// 页面切换函数
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// 介绍页面
function initializeConsentPage() {
    const agreeBtn = document.getElementById('agree-btn');
    agreeBtn.addEventListener('click', function() {
        showEEGPage('pre');
    });
}

// EEG说明页面
let eegMode = 'pre'; // 'pre' 表示前测前，'post' 表示后测前

function initializeEEGPage() {
    const continueBtn = document.getElementById('eeg-continue-btn');
    continueBtn.addEventListener('click', function() {
        if (eegMode === 'pre') {
            showPage('pretest-page');
        } else if (eegMode === 'post') {
            showPage('posttest-page');
        }
    });
}

function showEEGPage(mode) {
    eegMode = mode;
    const title = document.getElementById('eeg-title');
    const instruction = document.getElementById('eeg-instruction');
    const preSteps = document.getElementById('eeg-pre-steps');
    const postSteps = document.getElementById('eeg-post-steps');
    const note = document.getElementById('eeg-note');
    
    if (mode === 'pre') {
        title.textContent = 'EEG准备说明';
        instruction.textContent = '请按照以下步骤准备EEG设备';
        preSteps.style.display = 'block';
        postSteps.style.display = 'none';
        note.style.display = 'block';
    } else if (mode === 'post') {
        title.textContent = 'EEG监测说明';
        instruction.textContent = '请按照以下步骤进行EEG监测';
        preSteps.style.display = 'none';
        postSteps.style.display = 'block';
        note.style.display = 'none';
    }
    
    showPage('eeg-page');
}

// 生成量表题目HTML
function generateScaleQuestions(questions, containerId, prefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';
        
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.textContent = `${index + 1}. ${question.text}`;
        
        const optionsGroup = document.createElement('div');
        optionsGroup.className = 'options-group';
        
        options.forEach(option => {
            const label = document.createElement('label');
            label.className = 'option-label';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `${prefix}-q${question.id}`;
            radio.value = option.value;
            
            const text = document.createElement('span');
            text.textContent = `${option.value}. ${option.text}`;
            
            label.appendChild(radio);
            label.appendChild(text);
            optionsGroup.appendChild(label);
        });
        
        questionDiv.appendChild(questionText);
        questionDiv.appendChild(optionsGroup);
        container.appendChild(questionDiv);
    });
}

// 计算量表分数
function calculateScaleScore(questions, prefix) {
    let totalScore = 0;
    const answers = [];
    
    questions.forEach(question => {
        const selected = document.querySelector(`input[name="${prefix}-q${question.id}"]:checked`);
        if (selected) {
            let value = parseInt(selected.value);
            if (question.reverse) {
                value = 5 - value; // 反向计分
            }
            totalScore += value;
            answers.push({
                questionId: question.id,
                value: value,
                reverse: question.reverse
            });
        }
    });
    
    return { totalScore, answers };
}

// 前测页面
function initializePretestPage() {
    // 生成量表题目
    generateScaleQuestions(saiQuestions, 'pre-sai-questions', 'pre-sai');
    
    // VAS滑块
    const preVas = document.getElementById('pre-vas');
    const preVasValue = document.getElementById('pre-vas-value');
    preVas.addEventListener('input', function() {
        preVasValue.textContent = this.value;
    });
    
    // 提交按钮
    const submitBtn = document.getElementById('pretest-submit-btn');
    submitBtn.addEventListener('click', function() {
        // 保存VAS分数
        experimentData.pretest.vas = parseInt(preVas.value);
        
        // 计算SAI分数
        const saiResult = calculateScaleScore(saiQuestions, 'pre-sai');
        experimentData.pretest.sai = saiResult.answers;
        
        // 验证是否所有题目都已回答
        if (saiResult.answers.length < saiQuestions.length) {
            alert('请完成所有题目后再提交！');
            return;
        }
        
        showPage('induction-page');
        startInduction();
    });
}

// 焦虑诱发页面
let inductionTimer = null;
let currentTimeouts = [];

function initializeInductionPage() {
    const endBtn = document.getElementById('end-btn');
    endBtn.addEventListener('click', function() {
        if (!this.disabled) {
            clearAllTimeouts();
            endInduction();
        }
    });
}

function startInduction() {
    const stimulusAudio = document.getElementById('stimulus-audio');
    const topText = document.getElementById('induction-top-text');
    const bottomText = document.getElementById('induction-bottom-text');
    const endBtn = document.getElementById('end-btn');
    const stimulusContainer = document.getElementById('stimulus-container');
    const stimulusImage = document.getElementById('stimulus-image');
    const fixationCircle = document.querySelector('.fixation-circle');
    
    // 重置状态
    endBtn.disabled = false;
    stimulusContainer.classList.remove('active');
    fixationCircle.style.visibility = 'visible';
    
    // 获取images目录下的图片文件数量
    const maxFileNumber = 12; // 根据实际文件数量设置
    
    // 生成11个从1到maxFileNumber的随机乱序数字（不重复）
    const randomIndices = generateRandomIndices(11, maxFileNumber);
    
    // 预加载所有要使用的图片
    randomIndices.forEach(fileIndex => {
        const img = new Image();
        const paddedIndex = String(fileIndex).padStart(2, '0');
        img.src = `images/stimulus_${paddedIndex}.png`;
    });
    
    // 设置每个时间节点的刺激
    inductionTimes.forEach((time, index) => {
        const timeout = setTimeout(() => {
            const fileIndex = randomIndices[index];
            const paddedIndex = String(fileIndex).padStart(2, '0');
            
            // 隐藏十字架
            fixationCircle.style.visibility = 'hidden';
            
            // 设置并加载对应的图片
            stimulusImage.src = `images/stimulus_${paddedIndex}.png`;
            stimulusContainer.classList.add('active');
            
            // 设置并加载对应的音频
            stimulusAudio.src = `audio/stimulus_${paddedIndex}.mp3`;
            stimulusAudio.load();
            
            // 播放音频
            const playPromise = stimulusAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => console.log('音频播放失败:', err));
            }
            
            // 5秒后隐藏刺激并显示十字架
            setTimeout(() => {
                stimulusContainer.classList.remove('active');
                fixationCircle.style.visibility = 'visible';
                stimulusAudio.pause();
                stimulusAudio.currentTime = 0;
            }, inductionDuration * 1000);
        }, time * 1000);
        
        currentTimeouts.push(timeout);
    });
    
    // 380秒后结束
    inductionTimer = setTimeout(() => {
        topText.textContent = '请点击结束按钮';
        bottomText.textContent = '请点击结束按钮';
    }, totalInductionTime * 1000);
}

// 生成n个从1到max的随机乱序数字
function generateRandomIndices(n, max) {
    const indices = [];
    for (let i = 1; i <= max; i++) {
        indices.push(i);
    }
    
    // Fisher-Yates洗牌算法
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // 返回前n个数字
    return indices.slice(0, n);
}

function clearAllTimeouts() {
    currentTimeouts.forEach(timeout => clearTimeout(timeout));
    currentTimeouts = [];
    if (inductionTimer) {
        clearTimeout(inductionTimer);
        inductionTimer = null;
    }
}

function endInduction() {
    const stimulusAudio = document.getElementById('stimulus-audio');
    stimulusAudio.pause();
    stimulusAudio.currentTime = 0;
    
    showEEGPage('post');
}

// 后测页面
function initializePosttestPage() {
    // 生成量表题目
    generateScaleQuestions(saiQuestions, 'post-sai-questions', 'post-sai');
    
    // VAS滑块
    const postVas = document.getElementById('post-vas');
    const postVasValue = document.getElementById('post-vas-value');
    postVas.addEventListener('input', function() {
        postVasValue.textContent = this.value;
    });
    
    // 提交按钮
    const submitBtn = document.getElementById('posttest-submit-btn');
    submitBtn.addEventListener('click', function() {
        // 保存VAS分数
        experimentData.posttest.vas = parseInt(postVas.value);
        
        // 计算SAI分数
        const saiResult = calculateScaleScore(saiQuestions, 'post-sai');
        experimentData.posttest.sai = saiResult.answers;
        
        // 验证是否所有题目都已回答
        if (saiResult.answers.length < saiQuestions.length) {
            alert('请完成所有题目后再提交！');
            return;
        }
        
        showPage('result-page');
        displayResults();
    });
}

// 结果页面
function initializeResultPage() {
    const exportBtn = document.getElementById('export-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    exportBtn.addEventListener('click', function() {
        exportData();
    });
    
    restartBtn.addEventListener('click', function() {
        if (confirm('确定要重新开始实验吗？当前数据将丢失。')) {
            resetExperiment();
        }
    });
}

function calculateTotalScore(answers) {
    return answers.reduce((sum, answer) => sum + answer.value, 0);
}

function displayResults() {
    // 计算分数
    const preVasScore = experimentData.pretest.vas;
    const postVasScore = experimentData.posttest.vas;
    const vasChange = postVasScore - preVasScore;
    
    const preSaiScore = calculateTotalScore(experimentData.pretest.sai);
    const postSaiScore = calculateTotalScore(experimentData.posttest.sai);
    const saiChange = postSaiScore - preSaiScore;
    
    // 显示VAS结果
    document.getElementById('result-pre-vas').textContent = preVasScore;
    document.getElementById('result-post-vas').textContent = postVasScore;
    document.getElementById('result-vas-change').textContent = `${vasChange > 0 ? '+' : ''}${vasChange}`;
    
    // 显示SAI结果
    document.getElementById('result-pre-sai').textContent = preSaiScore;
    document.getElementById('result-post-sai').textContent = postSaiScore;
    document.getElementById('result-sai-change').textContent = `${saiChange > 0 ? '+' : ''}${saiChange}`;
    
    // 评估结果
    const evaluation = document.getElementById('result-evaluation');
    let evaluationText = '';
    
    // VAS变化评估（阈值：20%）
    const vasPercentChange = (vasChange / preVasScore) * 100;
    const vasSignificant = vasPercentChange >= 20;
    
    // SAI变化评估（阈值：10分）
    const saiSignificant = saiChange >= 10;
    
    // 综合评估
    if (vasSignificant || saiSignificant) {
        evaluationText = '<p style="color: #e65100; font-weight: 600;">✓ 焦虑水平显著升高</p>';
        evaluationText += `<p>VAS变化: ${vasPercentChange.toFixed(1)}% ${vasSignificant ? '(达到显著水平)' : ''}</p>`;
        evaluationText += `<p>SAI变化: ${saiChange}分 ${saiSignificant ? '(达到显著水平)' : ''}</p>`;
        evaluationText += '<p>焦虑诱发程序成功诱发了参与者的焦虑反应。</p>';
    } else {
        evaluationText = '<p style="color: #4CAF50; font-weight: 600;">○ 焦虑水平变化不显著</p>';
        evaluationText += `<p>VAS变化: ${vasPercentChange.toFixed(1)}%</p>`;
        evaluationText += `<p>SAI变化: ${saiChange}分</p>`;
        evaluationText += '<p>焦虑诱发程序未能显著诱发参与者的焦虑反应。</p>';
    }
    
    evaluation.innerHTML = evaluationText;
    
    // 保存数据到本地存储
    localStorage.setItem('anxietyInductionData', JSON.stringify(experimentData));
}

function exportData() {
    // 计算分数
    const preVasScore = experimentData.pretest.vas;
    const postVasScore = experimentData.posttest.vas;
    const vasChange = postVasScore - preVasScore;
    
    const preSaiScore = calculateTotalScore(experimentData.pretest.sai);
    const postSaiScore = calculateTotalScore(experimentData.posttest.sai);
    const saiChange = postSaiScore - preSaiScore;
    
    // 创建导出数据对象
    const exportData = {
        timestamp: new Date().toLocaleString('zh-CN'),
        pretest: {
            vas: preVasScore,
            sai: {
                totalScore: preSaiScore,
                answers: experimentData.pretest.sai
            }
        },
        posttest: {
            vas: postVasScore,
            sai: {
                totalScore: postSaiScore,
                answers: experimentData.posttest.sai
            }
        },
        changes: {
            vas: vasChange,
            sai: saiChange
        }
    };
    
    // 转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 生成文件名（包含时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const fileName = `anxiety_experiment_${timestamp}.json`;
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 获取下载路径（浏览器通常下载到默认下载文件夹）
    const downloadPath = '默认下载文件夹';
    alert(`数据已保存到 ${downloadPath}\n文件名: ${fileName}`);
}

function resetExperiment() {
    // 重置数据
    experimentData = {
        pretest: {
            vas: 0,
            sai: []
        },
        posttest: {
            vas: 0,
            sai: []
        }
    };
    
    // 重置表单
    document.getElementById('pre-vas').value = 0;
    document.getElementById('pre-vas-value').textContent = '0';
    document.getElementById('post-vas').value = 0;
    document.getElementById('post-vas-value').textContent = '0';
    
    // 清除单选按钮选择
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });
    
    // 重置诱导页面文字
    document.getElementById('induction-top-text').textContent = '在接下来的一段时间里，你可能会在任意时刻接触到令人不适的声音和图像，时间和次数均不确定';
    document.getElementById('induction-bottom-text').textContent = '请注视屏幕中央的十字';
    
    // 返回知情同意页面
    showPage('consent-page');
}