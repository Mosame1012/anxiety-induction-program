// 测试脚本:验证修改后的随机刺激生成算法

// 复制必要的参数和函数
const inductionDuration = 5;
const minTotalTime = 300;
const maxTotalTime = 420;
const minStimulusCount = 8;
const maxStimulusCount = 14;
const minInterval = 10;
const maxInterval = 60;

const distributionPatterns = {
    'front_dense': {
        name: '前密后疏',
        zones: [
            { percent: 0.33, stimulusPercent: [0.40, 0.50] },
            { percent: 0.33, stimulusPercent: [0.30, 0.35] },
            { percent: 0.34, stimulusPercent: [0.20, 0.25] }
        ]
    },
    'front_sparse': {
        name: '前疏后密',
        zones: [
            { percent: 0.33, stimulusPercent: [0.20, 0.25] },
            { percent: 0.33, stimulusPercent: [0.30, 0.35] },
            { percent: 0.34, stimulusPercent: [0.40, 0.50] }
        ]
    },
    'uniform_random': {
        name: '均匀随机',
        zones: [
            { percent: 0.33, stimulusPercent: [0.30, 0.40] },
            { percent: 0.33, stimulusPercent: [0.30, 0.40] },
            { percent: 0.34, stimulusPercent: [0.30, 0.40] }
        ]
    }
};

// 添加时间-刺激数量映射函数
function getStimulusCountRange(totalTime) {
    const minPossible = Math.ceil(totalTime / (maxInterval + inductionDuration));
    const maxPossible = Math.floor(totalTime / (minInterval + inductionDuration));
    return {
        min: Math.max(minStimulusCount, minPossible),
        max: Math.min(maxStimulusCount, maxPossible)
    };
}

// 简化版的生成函数(用于测试)
function generateInductionTimes(stimulusCount, totalTime, patternKey) {
    const pattern = distributionPatterns[patternKey];

    // 根据总时间获取刺激数量范围
    const countRange = getStimulusCountRange(totalTime);

    // 调整刺激数量
    if (stimulusCount < countRange.min) {
        stimulusCount = countRange.min;
    } else if (stimulusCount > countRange.max) {
        stimulusCount = countRange.max;
    }

    // 区块划分与刺激分配
    const zones = allocateStimuliToZones(stimulusCount, totalTime, pattern);

    // 为每个区块生成时间点
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

        if (zoneTimes.length > 0) {
            lastStimulusEnd = zoneTimes[zoneTimes.length - 1] + inductionDuration;
        }
    });

    // 验证和调整时间序列
    const validatedTimes = validateAndAdjustTimes(allTimes, totalTime);

    return { times: validatedTimes, zones: zones };
}

function allocateStimuliToZones(totalStimuli, totalTime, pattern) {
    const zones = [];
    let currentTime = 0;
    let allocatedStimuli = 0;

    pattern.zones.forEach((zoneConfig, index) => {
        const isLastZone = index === pattern.zones.length - 1;

        const zoneDuration = isLastZone
            ? totalTime - currentTime
            : Math.floor(totalTime * zoneConfig.percent);

        const minPercent = zoneConfig.stimulusPercent[0];
        const maxPercent = zoneConfig.stimulusPercent[1];
        const stimulusPercent = Math.random() * (maxPercent - minPercent) + minPercent;

        let zoneStimulusCount;
        if (isLastZone) {
            zoneStimulusCount = totalStimuli - allocatedStimuli;
        } else {
            zoneStimulusCount = Math.floor(totalStimuli * stimulusPercent);
        }

        if (!isLastZone && zoneStimulusCount < 1) {
            zoneStimulusCount = 1;
        }

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

    const difference = totalStimuli - allocatedStimuli;
    if (difference !== 0) {
        zones[zones.length - 1].stimulusCount += difference;
    }

    return zones;
}

function generateTimesForZone(zoneStart, zoneEnd, stimulusCount, lastStimulusEnd) {
    const times = [];

    if (stimulusCount === 0) {
        return times;
    }

    const earliestFirst = Math.max(zoneStart, lastStimulusEnd + minInterval);
    const minTimeNeeded = (stimulusCount - 1) * (inductionDuration + minInterval) + inductionDuration;
    const latestFirst = zoneEnd - minTimeNeeded;

    if (latestFirst < earliestFirst) {
        const maxPossibleStimuli = Math.floor((zoneEnd - earliestFirst) / (inductionDuration + minInterval));
        const adjustedStimulusCount = Math.max(1, maxPossibleStimuli);
        return generateTimesForZone(zoneStart, zoneEnd, adjustedStimulusCount, lastStimulusEnd);
    }

    let currentTime = Math.random() * (latestFirst - earliestFirst) + earliestFirst;
    times.push(Math.round(currentTime));

    for (let i = 1; i < stimulusCount; i++) {
        const prevEnd = times[i - 1] + inductionDuration;
        const remainingStimuli = stimulusCount - i;
        const minTimeNeeded = (remainingStimuli - 1) * (inductionDuration + minInterval) + inductionDuration;
        const remainingTime = zoneEnd - prevEnd;
        const maxAllowedInterval = minInterval + (remainingTime - minTimeNeeded) / remainingStimuli;
        const actualMaxInterval = Math.min(maxInterval, maxAllowedInterval);

        const interval = Math.random() * (actualMaxInterval - minInterval) + minInterval;
        currentTime = prevEnd + interval;

        if (currentTime + inductionDuration > zoneEnd) {
            currentTime = zoneEnd - inductionDuration;
        }

        times.push(Math.round(currentTime));
    }

    return times;
}

function validateAndAdjustTimes(times, totalTime) {
    let adjustedTimes = [...times];

    // 移除超时的刺激
    for (let i = adjustedTimes.length - 1; i >= 0; i--) {
        if (adjustedTimes[i] + inductionDuration > totalTime) {
            const latestValidTime = totalTime - inductionDuration;
            if (i > 0 && adjustedTimes[i - 1] + inductionDuration + minInterval < latestValidTime) {
                adjustedTimes[i] = latestValidTime;
            } else {
                adjustedTimes.splice(i, 1);
            }
        }
    }

    // 调整间隔(允许轻微偏差)
    for (let i = 1; i < adjustedTimes.length; i++) {
        const prevEnd = adjustedTimes[i - 1] + inductionDuration;
        const currentStart = adjustedTimes[i];
        const interval = currentStart - prevEnd;

        if (interval < 10) {
            // 间隔太小,调整或移除
            adjustedTimes[i] = prevEnd + minInterval;
        } else if (interval > 60) {
            // 间隔太大,调整
            adjustedTimes[i] = prevEnd + maxInterval;
        }
    }

    adjustedTimes.sort((a, b) => a - b);

    if (adjustedTimes.length > 0) {
        const lastTime = adjustedTimes[adjustedTimes.length - 1];
        if (lastTime + inductionDuration > totalTime) {
            adjustedTimes[adjustedTimes.length - 1] = totalTime - inductionDuration;
        }
    }

    return adjustedTimes;
}

// 运行测试
console.log('=== 开始测试修改后的算法 ===\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (let stimulusCount = minStimulusCount; stimulusCount <= maxStimulusCount; stimulusCount++) {
    for (let totalTime = minTotalTime; totalTime <= maxTotalTime; totalTime += 60) {
        Object.keys(distributionPatterns).forEach(patternKey => {
            totalTests++;

            const result = generateInductionTimes(stimulusCount, totalTime, patternKey);
            const times = result.times;

            // 验证条件
            let valid = true;
            let reasons = [];

            // 检查1: 刺激数量是否在合理范围内(允许少量损失)
            if (times.length < stimulusCount * 0.8) {
                valid = false;
                reasons.push(`刺激数量过少: ${times.length}/${stimulusCount}`);
            }

            // 检查2: 间隔是否在范围内
            for (let i = 1; i < times.length; i++) {
                const interval = times[i] - times[i - 1] - inductionDuration;
                if (interval < minInterval || interval > maxInterval) {
                    valid = false;
                    reasons.push(`间隔超出范围: ${interval}秒`);
                    break;
                }
            }

            // 检查3: 所有刺激是否在总时间内
            if (times.length > 0 && times[times.length - 1] + inductionDuration > totalTime) {
                valid = false;
                reasons.push(`最后一个刺激超出时间限制`);
            }

            if (valid) {
                passedTests++;
                console.log(`✓ ${distributionPatterns[patternKey].name} - ${stimulusCount}个刺激, ${totalTime}秒 - 成功生成${times.length}个刺激`);
            } else {
                failedTests++;
                console.log(`✗ ${distributionPatterns[patternKey].name} - ${stimulusCount}个刺激, ${totalTime}秒 - 失败: ${reasons.join(', ')}`);
            }
        });
    }
}

console.log(`\n=== 测试结果 ===`);
console.log(`总测试数: ${totalTests}`);
console.log(`通过: ${passedTests}`);
console.log(`失败: ${failedTests}`);
console.log(`成功率: ${(passedTests / totalTests * 100).toFixed(2)}%`);

if (failedTests === 0) {
    console.log(`\n✓ 所有测试通过!算法改进成功。`);
} else {
    console.log(`\n✗ 仍有${failedTests}个测试失败,需要进一步调整。`);
}