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

// EEG计时相关变量
let eegTimer = {
    startTime: null,        // EEG测量开始时间
    inductionStartTime: null,  // 焦虑诱发开始时间
    inductionEndTime: null,    // 焦虑诱发结束时间
    endTime: null,         // EEG测量结束时间
    timerInterval: null,   // 计时器间隔ID
    isRecording: false     // 是否正在记录
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

// 焦虑诱发参数
const inductionDuration = 5; // 刺激持续时间（秒）
const minTotalTime = 300; // 最小总时间（5分钟 = 300秒）
const maxTotalTime = 420; // 最大总时间（7分钟 = 420秒）
const minStimulusCount = 8; // 最小刺激次数
const maxStimulusCount = 14; // 最大刺激次数
const minInterval = 10; // 最小间隔（秒）
const maxInterval = 60; // 最大间隔（秒）

// 五种刺激分布模式配置(简化版,优先实现容易的模式)
const distributionPatterns = {
    // 模式一：前密后疏（前期密集，后期稀疏）
    'front_dense': {
        name: '前密后疏',
        description: '快速建立焦虑基线，后期减少刺激让焦虑持续但不确定',
        zones: [
            { percent: 0.33, stimulusPercent: [0.40, 0.50] },  // 前1/3时间，40-50%刺激
            { percent: 0.33, stimulusPercent: [0.30, 0.35] },  // 中间1/3时间，30-35%刺激
            { percent: 0.34, stimulusPercent: [0.20, 0.25] }   // 后1/3时间，20-25%刺激
        ]
    },
    // 模式二：前疏后密（前期稀疏，后期密集）
    'front_sparse': {
        name: '前疏后密',
        description: '先让被试放松警惕，后期突然密集刺激',
        zones: [
            { percent: 0.33, stimulusPercent: [0.20, 0.25] },  // 前1/3时间，20-25%刺激
            { percent: 0.33, stimulusPercent: [0.30, 0.35] },  // 中间1/3时间，30-35%刺激
            { percent: 0.34, stimulusPercent: [0.40, 0.50] }   // 后1/3时间，40-50%刺激
        ]
    },
    // 模式三：均匀随机
    'uniform_random': {
        name: '均匀随机',
        description: '纯粹的不可预测性，完全随机分布',
        zones: [
            { percent: 0.33, stimulusPercent: [0.30, 0.40] },  // 前1/3时间，30-40%刺激
            { percent: 0.33, stimulusPercent: [0.30, 0.40] },  // 中间1/3时间，30-40%刺激
            { percent: 0.34, stimulusPercent: [0.30, 0.40] }   // 后1/3时间，30-40%刺激
        ]
    }
};

// 难以实现的模式(待讨论)
const difficultPatterns = {
    // 模式四：中间密集（中间阶段密集，两端稀疏）
    'middle_dense': {
        name: '中间密集',
        description: '模拟焦虑的自然累积和消退过程',
        reason: '在5-7分钟时间范围内,中间50%时间需要容纳50-60%的刺激,导致间隔过小(<10秒)',
        zones: [
            { percent: 0.25, stimulusPercent: [0.15, 0.20] },
            { percent: 0.50, stimulusPercent: [0.50, 0.60] },
            { percent: 0.25, stimulusPercent: [0.15, 0.20] }
        ]
    },
    // 模式五：双峰密集（两个密集阶段）
    'double_peak': {
        name: '双峰密集',
        description: '模拟焦虑的波浪式起伏',
        reason: '需要两个密集区,每个30-40%刺激,导致密集区间隔过小(<10秒)',
        zones: [
            { percent: 0.25, stimulusPercent: [0.30, 0.40] },
            { percent: 0.25, stimulusPercent: [0.10, 0.20] },
            { percent: 0.25, stimulusPercent: [0.30, 0.40] },
            { percent: 0.25, stimulusPercent: [0.10, 0.20] }
        ]
    }
};

// 根据总时间映射刺激数量范围
function getStimulusCountRange(totalTime) {
    // 计算理论最小和最大刺激数
    const minPossible = Math.ceil(totalTime / (maxInterval + inductionDuration)); // 最大间隔
    const maxPossible = Math.floor(totalTime / (minInterval + inductionDuration)); // 最小间隔

    // 返回与8-14要求的交集
    return {
        min: Math.max(minStimulusCount, minPossible),
        max: Math.min(maxStimulusCount, maxPossible)
    };
}

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
        showPage('pretest-page');
    });
}

// EEG说明页面
let eegMode = 'pre'; // 'pre' 表示前测前，'post' 表示后测前

function initializeEEGPage() {
    const startBtn = document.getElementById('eeg-start-btn');
    const continueBtn = document.getElementById('eeg-continue-btn');
    const endBtn = document.getElementById('eeg-end-btn');
    const goPosttestBtn = document.getElementById('eeg-go-posttest-btn');
    const timerDisplay = document.getElementById('eeg-timer-display');
    const timeNodesDisplay = document.getElementById('eeg-time-nodes');

    // 开始EEG计时按钮
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            startEGGTimer();
            this.style.display = 'none';
            continueBtn.style.display = 'inline-block';
        });
    }

    // 继续按钮（前测后进入诱发）
    if (continueBtn) {
        continueBtn.addEventListener('click', function() {
            if (eegMode === 'pre') {
                showPage('induction-page');
                startInduction();
            } else if (eegMode === 'post') {
                showPage('posttest-page');
            }
        });
    }

    // 结束计时按钮（后测后）
    if (endBtn) {
        endBtn.addEventListener('click', function() {
            stopEGGTimer();
            displayTimeNodes();
            this.style.display = 'none';
            goPosttestBtn.style.display = 'inline-block';
        });
    }

    // 进入后测按钮
    if (goPosttestBtn) {
        goPosttestBtn.addEventListener('click', function() {
            showPage('posttest-page');
        });
    }
}

// 开始EEG计时
function startEGGTimer() {
    eegTimer.startTime = Date.now();
    eegTimer.isRecording = true;

    // 更新计时器显示
    const timerDisplay = document.getElementById('eeg-timer-display');
    if (timerDisplay) {
        timerDisplay.style.display = 'block';
    }

    // 启动计时器
    eegTimer.timerInterval = setInterval(updateTimerDisplay, 100);
}

// 更新计时器显示
function updateTimerDisplay() {
    if (!eegTimer.startTime) return;

    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - eegTimer.startTime) / 1000);

    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    const timerDisplay = document.getElementById('eeg-timer-display');
    if (timerDisplay) {
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (eegTimer.isRecording) {
            timerDisplay.textContent = `计时中: ${timeStr} (已过 ${elapsedTime} 秒)`;
        } else {
            timerDisplay.textContent = `计时结束: ${timeStr} (总计 ${elapsedTime} 秒)`;
        }
    }
}

// 停止EEG计时
function stopEGGTimer() {
    eegTimer.endTime = Date.now();
    eegTimer.isRecording = false;

    // 清除计时器
    if (eegTimer.timerInterval) {
        clearInterval(eegTimer.timerInterval);
        eegTimer.timerInterval = null;
    }

    // 保存EEG计时数据到实验数据
    experimentData.eegTiming = {
        startTime: eegTimer.startTime,
        inductionStartTime: eegTimer.inductionStartTime,
        inductionEndTime: eegTimer.inductionEndTime,
        endTime: eegTimer.endTime,
        totalDuration: eegTimer.endTime - eegTimer.startTime,
        inductionDuration: eegTimer.inductionEndTime - eegTimer.inductionStartTime
    };
}

// 显示时间节点
function displayTimeNodes() {
    const timeNodesDisplay = document.getElementById('eeg-time-nodes');
    if (!timeNodesDisplay) return;

    const formatTime = (timestamp) => {
        if (!timestamp) return '未记录';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', { hour12: false });
    };

    const formatDuration = (ms) => {
        if (!ms) return '未计算';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}分${remainingSeconds}秒`;
    };

    const formatRelativeTime = (timestamp, baseTime) => {
        if (!timestamp || !baseTime) return '未记录';
        const elapsedSeconds = Math.floor((timestamp - baseTime) / 1000);
        return `第 ${elapsedSeconds} 秒`;
    };

    let html = '<div class="time-nodes-container"><h3>时间节点记录</h3>';
    html += `<div class="time-node"><span>EEG测量开始：</span><span>${formatTime(eegTimer.startTime)} (第 0 秒)</span></div>`;
    html += `<div class="time-node"><span>焦虑诱发开始：</span><span>${formatTime(eegTimer.inductionStartTime)} (${formatRelativeTime(eegTimer.inductionStartTime, eegTimer.startTime)})</span></div>`;
    html += `<div class="time-node"><span>焦虑诱发结束：</span><span>${formatTime(eegTimer.inductionEndTime)} (${formatRelativeTime(eegTimer.inductionEndTime, eegTimer.startTime)})</span></div>`;
    html += `<div class="time-node"><span>EEG测量结束：</span><span>${formatTime(eegTimer.endTime)} (${formatRelativeTime(eegTimer.endTime, eegTimer.startTime)})</span></div>`;
    html += '<div class="time-separator"></div>';
    html += `<div class="time-node highlight"><span>总测量时长：</span><span>${formatDuration(eegTimer.totalDuration)} (${Math.floor(eegTimer.totalDuration / 1000)} 秒)</span></div>`;
    html += `<div class="time-node highlight"><span>焦虑诱发时长：</span><span>${formatDuration(eegTimer.inductionDuration)} (${Math.floor(eegTimer.inductionDuration / 1000)} 秒)</span></div>`;
    html += '</div>';

    timeNodesDisplay.innerHTML = html;
    timeNodesDisplay.style.display = 'block';
}

function showEEGPage(mode) {
    eegMode = mode;
    const title = document.getElementById('eeg-title');
    const instruction = document.getElementById('eeg-instruction');
    const preSteps = document.getElementById('eeg-pre-steps');
    const postSteps = document.getElementById('eeg-post-steps');
    const note = document.getElementById('eeg-note');
    const startBtn = document.getElementById('eeg-start-btn');
    const continueBtn = document.getElementById('eeg-continue-btn');
    const endBtn = document.getElementById('eeg-end-btn');
    const timerDisplay = document.getElementById('eeg-timer-display');
    const timeNodesDisplay = document.getElementById('eeg-time-nodes');

    // 重置显示状态
    timerDisplay.style.display = 'none';
    timeNodesDisplay.style.display = 'none';

    if (mode === 'pre') {
        title.textContent = 'EEG测量准备';
        instruction.textContent = '请按照以下步骤准备EEG设备，然后开始计时';
        preSteps.style.display = 'block';
        postSteps.style.display = 'none';
        note.style.display = 'block';
        startBtn.style.display = 'inline-block';
        continueBtn.style.display = 'none';
        endBtn.style.display = 'none';
    } else if (mode === 'post') {
        title.textContent = 'EEG测量结束';
        instruction.textContent = 'EEG测量已完成，请查看时间节点记录';
        preSteps.style.display = 'none';
        postSteps.style.display = 'block';
        note.style.display = 'none';
        startBtn.style.display = 'none';
        continueBtn.style.display = 'none';
        endBtn.style.display = 'inline-block';
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

        // 前测完成后，进入EEG准备页面
        showEEGPage('pre');
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

    // 记录焦虑诱发开始时间
    eegTimer.inductionStartTime = Date.now();

    // 重置状态
    endBtn.disabled = false;
    stimulusContainer.classList.remove('active');
    fixationCircle.style.visibility = 'visible';

    // 获取images目录下的图片文件数量
    const maxFileNumber = 20; // 根据实际文件数量设置

    // 随机生成刺激次数（9-13次）
    const stimulusCount = Math.floor(Math.random() * (maxStimulusCount - minStimulusCount + 1)) + minStimulusCount;

    // 生成stimulusCount个从1到maxFileNumber的随机乱序数字（不重复）
    const randomIndices = generateRandomIndices(stimulusCount, maxFileNumber);

    // 预加载所有要使用的图片
    randomIndices.forEach(fileIndex => {
        const img = new Image();
        const paddedIndex = String(fileIndex).padStart(2, '0');
        img.src = `images/stimulus_${paddedIndex}.png`;
    });

    // 随机生成总时间（5-7分钟）
    const totalInductionTime = Math.floor(Math.random() * (maxTotalTime - minTotalTime + 1)) + minTotalTime;

    // 生成刺激时间节点
    const inductionTimes = generateInductionTimes(stimulusCount, totalInductionTime);

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

    // 总时间后结束
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

// 生成刺激时间节点（基于分布模式）
function generateInductionTimes(stimulusCount, totalTime) {
    // 根据总时间获取刺激数量范围
    const countRange = getStimulusCountRange(totalTime);

    // 检查请求的刺激数量是否在可行范围内
    if (stimulusCount < countRange.min) {
        console.warn(`刺激数量${stimulusCount}小于最小可行数量${countRange.min},自动调整为${countRange.min}`);
        stimulusCount = countRange.min;
    } else if (stimulusCount > countRange.max) {
        console.warn(`刺激数量${stimulusCount}大于最大可行数量${countRange.max},自动调整为${countRange.max}`);
        stimulusCount = countRange.max;
    }

    // 随机选择一种分布模式(只使用容易实现的)
    const patternKeys = Object.keys(distributionPatterns);
    const selectedPatternKey = patternKeys[Math.floor(Math.random() * patternKeys.length)];
    const pattern = distributionPatterns[selectedPatternKey];

    console.log(`选择的分布模式: ${pattern.name}`);
    console.log(`总时间: ${totalTime}秒, 刺激数量: ${stimulusCount}个`);

    // 第二阶段：区块划分与刺激分配
    const zones = allocateStimuliToZones(stimulusCount, totalTime, pattern);

    // 第三阶段：为每个区块生成时间点
    let allTimes = [];
    let lastStimulusEnd = 0;

    zones.forEach((zone, zoneIndex) => {
        const zoneTimes = generateTimesForZone(
            zone.start,
            zone.end,
            zone.stimulusCount,
            lastStimulusEnd
        );

        allTimes = allTimes.concat(zoneTimes);

        // 更新最后一个刺激的结束时间
        if (zoneTimes.length > 0) {
            lastStimulusEnd = zoneTimes[zoneTimes.length - 1] + inductionDuration;
        }
    });

    // 第四阶段：整体调整与验证
    const validatedTimes = validateAndAdjustTimes(allTimes, totalTime);

    return validatedTimes;
}

// 为区块分配刺激数量
function allocateStimuliToZones(totalStimuli, totalTime, pattern) {
    const zones = [];
    let currentTime = 0;
    let allocatedStimuli = 0;

    pattern.zones.forEach((zoneConfig, index) => {
        const isLastZone = index === pattern.zones.length - 1;

        // 计算区块持续时间
        const zoneDuration = isLastZone
            ? totalTime - currentTime
            : Math.floor(totalTime * zoneConfig.percent);

        // 随机确定该区块的刺激百分比
        const minPercent = zoneConfig.stimulusPercent[0];
        const maxPercent = zoneConfig.stimulusPercent[1];
        const stimulusPercent = Math.random() * (maxPercent - minPercent) + minPercent;

        // 计算该区块的刺激数量
        let zoneStimulusCount;
        if (isLastZone) {
            // 最后一个区块分配剩余的所有刺激
            zoneStimulusCount = totalStimuli - allocatedStimuli;
        } else {
            zoneStimulusCount = Math.floor(totalStimuli * stimulusPercent);
        }

        // 确保至少分配1个刺激（如果不是最后一个区块）
        if (!isLastZone && zoneStimulusCount < 1) {
            zoneStimulusCount = 1;
        }

        // 计算区块结束时间
        const zoneEnd = currentTime + zoneDuration;

        zones.push({
            start: currentTime,
            end: zoneEnd,
            stimulusCount: zoneStimulusCount,
            duration: zoneDuration
        });

        allocatedStimuli += zoneStimulusCount;
        currentTime = zoneEnd;
    });

    // 调整确保刺激总数正确
    const difference = totalStimuli - allocatedStimuli;
    if (difference !== 0) {
        // 将差异分配到最后一个区块
        zones[zones.length - 1].stimulusCount += difference;
    }

    return zones;
}

// 为单个区块生成时间点
function generateTimesForZone(zoneStart, zoneEnd, stimulusCount, lastStimulusEnd) {
    const times = [];

    if (stimulusCount === 0) {
        return times;
    }

    // 计算第一个刺激的最早和最晚时间
    const earliestFirst = Math.max(zoneStart, lastStimulusEnd + minInterval);
    const minTimeNeeded = (stimulusCount - 1) * (inductionDuration + minInterval) + inductionDuration;
    const latestFirst = zoneEnd - minTimeNeeded;

    // 如果无法放置所有刺激，尝试动态调整
    if (latestFirst < earliestFirst) {
        console.warn(`警告: 区块[${zoneStart}, ${zoneEnd}]无法容纳${stimulusCount}个刺激`);
        console.warn(`  最早开始时间: ${earliestFirst}, 最晚开始时间: ${latestFirst}`);
        console.warn(`  最小需要时间: ${minTimeNeeded}, 实际可用时间: ${zoneEnd - zoneStart}`);

        // 尝试尽可能多地放置刺激
        const maxPossibleStimuli = Math.floor((zoneEnd - earliestFirst) / (inductionDuration + minInterval));
        const adjustedStimulusCount = Math.max(1, maxPossibleStimuli);

        console.warn(`  调整刺激数量: ${stimulusCount} -> ${adjustedStimulusCount}`);

        return generateTimesForZone(zoneStart, zoneEnd, adjustedStimulusCount, lastStimulusEnd);
    }

    // 生成第一个刺激时间
    let currentTime = Math.random() * (latestFirst - earliestFirst) + earliestFirst;
    times.push(Math.round(currentTime));

    // 生成后续刺激
    for (let i = 1; i < stimulusCount; i++) {
        const prevEnd = times[i - 1] + inductionDuration;

        // 计算剩余需要放置的刺激数
        const remainingStimuli = stimulusCount - i;

        // 计算最小需要时间
        const minTimeNeeded = (remainingStimuli - 1) * (inductionDuration + minInterval) + inductionDuration;

        // 计算实际最大间隔
        const remainingTime = zoneEnd - prevEnd;
        const maxAllowedInterval = minInterval + (remainingTime - minTimeNeeded) / remainingStimuli;
        const actualMaxInterval = Math.min(maxInterval, maxAllowedInterval);

        // 在范围内随机选择间隔
        const interval = Math.random() * (actualMaxInterval - minInterval) + minInterval;
        currentTime = prevEnd + interval;

        // 确保不超过区块结束时间
        if (currentTime + inductionDuration > zoneEnd) {
            currentTime = zoneEnd - inductionDuration;
        }

        times.push(Math.round(currentTime));
    }

    return times;
}

// 验证和调整时间序列
function validateAndAdjustTimes(times, totalTime) {
    let adjustedTimes = [...times];

    console.log(`验证时间序列, 总时间: ${totalTime}秒, 刺激数量: ${adjustedTimes.length}`);

    // 1. 检查并调整超时的刺激（从后向前处理）
    let outOfRangeCount = 0;
    for (let i = adjustedTimes.length - 1; i >= 0; i--) {
        if (adjustedTimes[i] + inductionDuration > totalTime) {
            // 尝试将刺激移动到允许的范围内
            const latestValidTime = totalTime - inductionDuration;

            // 检查移动后是否会与前面一个刺激冲突
            if (i > 0) {
                const prevEnd = adjustedTimes[i - 1] + inductionDuration;
                const minValidTime = prevEnd + minInterval;

                if (minValidTime <= latestValidTime) {
                    adjustedTimes[i] = latestValidTime;
                    console.log(`  调整刺激 ${i+1}: ${times[i]} -> ${latestValidTime}`);
                } else {
                    adjustedTimes.splice(i, 1);
                    outOfRangeCount++;
                    console.log(`  移除超时刺激 ${i+1}: ${times[i]}`);
                }
            } else {
                adjustedTimes.splice(i, 1);
                outOfRangeCount++;
                console.log(`  移除超时刺激 ${i+1}: ${times[i]}`);
            }
        }
    }

    if (outOfRangeCount > 0) {
        console.warn(`警告: 移除了 ${outOfRangeCount} 个超时的刺激`);
    }

    // 2. 检查并调整间隔（严格要求10-60秒）
    let intervalAdjustCount = 0;
    for (let i = 1; i < adjustedTimes.length; i++) {
        const prevEnd = adjustedTimes[i - 1] + inductionDuration;
        const currentStart = adjustedTimes[i];
        const interval = currentStart - prevEnd;

        if (interval < minInterval) {
            const newTime = prevEnd + minInterval;

            let conflict = false;
            if (i < adjustedTimes.length - 1) {
                const nextStart = adjustedTimes[i + 1];
                const newEnd = newTime + inductionDuration;
                if (newEnd + minInterval > nextStart) {
                    conflict = true;
                }
            }

            if (!conflict) {
                adjustedTimes[i] = newTime;
                intervalAdjustCount++;
                console.log(`  调整刺激 ${i+1}的间隔: ${interval} -> ${minInterval}`);
            } else {
                adjustedTimes.splice(i, 1);
                intervalAdjustCount++;
                console.log(`  移除刺激 ${i+1}: 间隔${interval}秒太小且无法调整`);
                i--;
            }
        } else if (interval > maxInterval) {
            const newTime = prevEnd + maxInterval;
            adjustedTimes[i] = newTime;
            intervalAdjustCount++;
            console.log(`  调整刺激 ${i+1}的间隔: ${interval} -> ${maxInterval}`);
        }
    }

    if (intervalAdjustCount > 0) {
        console.warn(`警告: 调整/移除了 ${intervalAdjustCount} 个刺激的间隔`);
    }

    // 3. 确保时间序列是递增的
    adjustedTimes.sort((a, b) => a - b);

    // 4. 再次验证最后一个刺激是否在总时间内
    if (adjustedTimes.length > 0) {
        const lastTime = adjustedTimes[adjustedTimes.length - 1];
        if (lastTime + inductionDuration > totalTime) {
            adjustedTimes.splice(adjustedTimes.length - 1, 1);
            console.log(`  移除最后一个刺激: 超出时间限制`);
        }
    }

    // 5. 最终验证
    const finalValidation = validateTimeSequence(adjustedTimes, totalTime);
    if (!finalValidation.valid) {
        console.error(`严重错误: 最终验证失败`);
        console.error(`  原因: ${finalValidation.reason}`);
        console.error(`  当前刺激数量: ${adjustedTimes.length}`);
    } else {
        console.log(`验证通过: ${adjustedTimes.length}个刺激, 间隔范围: ${finalValidation.minInterval}-${finalValidation.maxInterval}秒`);
    }

    return adjustedTimes;
}

// 辅助函数:验证时间序列的有效性
function validateTimeSequence(times, totalTime) {
    if (times.length === 0) {
        return { valid: false, reason: '没有生成任何刺激' };
    }

    // 检查第一个刺激
    if (times[0] < 0) {
        return { valid: false, reason: '第一个刺激时间为负' };
    }

    // 检查间隔(严格要求:10-60秒)
    let minIntervalFound = Infinity;
    let maxIntervalFound = -Infinity;
    let violations = [];
    for (let i = 1; i < times.length; i++) {
        const prevEnd = times[i - 1] + inductionDuration;
        const interval = times[i] - prevEnd;

        if (interval < 10) {
            violations.push(`刺激${i+1}的间隔${interval}秒过小(要求≥10秒)`);
        }
        if (interval > 60) {
            violations.push(`刺激${i+1}的间隔${interval}秒过大(要求≤60秒)`);
        }

        minIntervalFound = Math.min(minIntervalFound, interval);
        maxIntervalFound = Math.max(maxIntervalFound, interval);
    }

    // 检查最后一个刺激
    const lastTime = times[times.length - 1];
    if (lastTime + inductionDuration > totalTime) {
        violations.push(`最后一个刺激超出总时间限制`);
    }

    // 如果有违规,返回失败
    if (violations.length > 0) {
        return { valid: false, reason: violations.join('; ') };
    }

    return {
        valid: true,
        minInterval: Math.round(minIntervalFound),
        maxInterval: Math.round(maxIntervalFound)
    };
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

    // 记录焦虑诱发结束时间
    eegTimer.inductionEndTime = Date.now();

    // 跳转到EEG结束页面
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

// 添加从EEG页面跳转到后测页面的函数
function goToPosttestPage() {
    showPage('posttest-page');
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