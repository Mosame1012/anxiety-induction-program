// 模拟程序:生成20轮刺激的时间序列

// 参数配置
const inductionDuration = 5;
const minTotalTime = 300;
const maxTotalTime = 420;
const minStimulusCount = 8;
const maxStimulusCount = 14;
const minInterval = 10;
const maxInterval = 60;

// 分布模式
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

// 时间-刺激数量映射
function getStimulusCountRange(totalTime) {
    const minPossible = Math.ceil(totalTime / (maxInterval + inductionDuration));
    const maxPossible = Math.floor(totalTime / (minInterval + inductionDuration));
    return {
        min: Math.max(minStimulusCount, minPossible),
        max: Math.min(maxStimulusCount, maxPossible)
    };
}

// 生成随机数
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// 生成随机整数
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 区块刺激分配
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
        const stimulusPercent = randomRange(minPercent, maxPercent);

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

// 为区块生成时间点
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

    let currentTime = randomRange(earliestFirst, latestFirst);
    times.push(Math.round(currentTime));

    for (let i = 1; i < stimulusCount; i++) {
        const prevEnd = times[i - 1] + inductionDuration;
        const remainingStimuli = stimulusCount - i;
        const minTimeNeeded = (remainingStimuli - 1) * (inductionDuration + minInterval) + inductionDuration;
        const remainingTime = zoneEnd - prevEnd;
        const maxAllowedInterval = minInterval + (remainingTime - minTimeNeeded) / remainingStimuli;
        const actualMaxInterval = Math.min(maxInterval, maxAllowedInterval);

        const interval = randomRange(minInterval, actualMaxInterval);
        currentTime = prevEnd + interval;

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

    for (let i = adjustedTimes.length - 1; i >= 0; i--) {
        if (adjustedTimes[i] + inductionDuration > totalTime) {
            const latestValidTime = totalTime - inductionDuration;

            if (i > 0) {
                const prevEnd = adjustedTimes[i - 1] + inductionDuration;
                const minValidTime = prevEnd + minInterval;

                if (minValidTime <= latestValidTime) {
                    adjustedTimes[i] = latestValidTime;
                } else {
                    adjustedTimes.splice(i, 1);
                }
            } else {
                adjustedTimes.splice(i, 1);
            }
        }
    }

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
            } else {
                adjustedTimes.splice(i, 1);
                i--;
            }
        } else if (interval > maxInterval) {
            const newTime = prevEnd + maxInterval;
            adjustedTimes[i] = newTime;
        }
    }

    adjustedTimes.sort((a, b) => a - b);

    if (adjustedTimes.length > 0) {
        const lastTime = adjustedTimes[adjustedTimes.length - 1];
        if (lastTime + inductionDuration > totalTime) {
            adjustedTimes.splice(adjustedTimes.length - 1, 1);
        }
    }

    return adjustedTimes;
}

// 生成刺激时间节点
function generateInductionTimes(stimulusCount, totalTime, patternKey) {
    const pattern = distributionPatterns[patternKey];
    const countRange = getStimulusCountRange(totalTime);

    if (stimulusCount < countRange.min) {
        stimulusCount = countRange.min;
    } else if (stimulusCount > countRange.max) {
        stimulusCount = countRange.max;
    }

    const zones = allocateStimuliToZones(stimulusCount, totalTime, pattern);

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

    const validatedTimes = validateAndAdjustTimes(allTimes, totalTime);

    return { times: validatedTimes, pattern: pattern.name };
}

// 主模拟函数
function simulate(rounds = 20) {
    console.log('='.repeat(100));
    console.log('焦虑诱发程序 - 刺激时间模拟');
    console.log('='.repeat(100));
    console.log('');

    const patternKeys = Object.keys(distributionPatterns);
    const results = [];

    for (let round = 1; round <= rounds; round++) {
        // 随机生成参数
        const totalTime = randomInt(minTotalTime, maxTotalTime);
        const stimulusCount = randomInt(minStimulusCount, maxStimulusCount);
        const patternKey = patternKeys[randomInt(0, patternKeys.length - 1)];

        // 生成时间序列
        const result = generateInductionTimes(stimulusCount, totalTime, patternKey);

        // 计算间隔
        const intervals = [];
        for (let i = 1; i < result.times.length; i++) {
            intervals.push(result.times[i] - result.times[i - 1] - inductionDuration);
        }

        results.push({
            round: round,
            totalTime: totalTime,
            stimulusCount: result.times.length,
            pattern: result.pattern,
            times: result.times,
            intervals: intervals,
            minInterval: intervals.length > 0 ? Math.min(...intervals) : 0,
            maxInterval: intervals.length > 0 ? Math.max(...intervals) : 0
        });
    }

    // 输出结果
    results.forEach(result => {
        console.log(`第 ${result.round} 轮:`);
        console.log(`  总时间: ${result.totalTime}秒 (${Math.round(result.totalTime/60)}分钟)`);
        console.log(`  刺激数量: ${result.stimulusCount}个`);
        console.log(`  模式: ${result.pattern}`);
        console.log(`  刺激时间: [${result.times.join(', ')}]`);
        console.log(`  间隔时间: [${result.intervals.map(i => Math.round(i)).join(', ')}]`);
        console.log(`  间隔范围: ${Math.round(result.minInterval)}-${Math.round(result.maxInterval)}秒`);
        console.log('');
    });

    // 统计信息
    console.log('='.repeat(100));
    console.log('统计信息:');
    console.log('='.repeat(100));

    const patternStats = {};
    results.forEach(result => {
        if (!patternStats[result.pattern]) {
            patternStats[result.pattern] = { count: 0, totalTime: 0, stimulusCount: 0 };
        }
        patternStats[result.pattern].count++;
        patternStats[result.pattern].totalTime += result.totalTime;
        patternStats[result.pattern].stimulusCount += result.stimulusCount;
    });

    Object.entries(patternStats).forEach(([pattern, stats]) => {
        console.log(`${pattern}:`);
        console.log(`  出现次数: ${stats.count}轮`);
        console.log(`  平均总时间: ${Math.round(stats.totalTime / stats.count)}秒`);
        console.log(`  平均刺激数: ${Math.round(stats.stimulusCount / stats.count)}个`);
        console.log('');
    });

    // 验证间隔范围
    let validCount = 0;
    results.forEach(result => {
        const allValid = result.intervals.every(i => i >= minInterval && i <= maxInterval);
        if (allValid) validCount++;
    });

    console.log(`验证结果:`);
    console.log(`  符合间隔要求(10-60秒)的轮数: ${validCount}/${rounds}`);
    console.log(`  成功率: ${(validCount / rounds * 100).toFixed(2)}%`);
}

// 运行模拟
simulate(20);