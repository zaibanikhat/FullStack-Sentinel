#!/usr/bin/env node

/**
 * CLI script to run the model evaluation and output a formatted, human-readable report.
 */

// --- Data Simulation ---
const getMockData = () => {
    // This function generates the raw data for the report, simulating a test run.
    return {
        summary: {
            successRate: 95.5,
            totalCases: 200,
            passCount: 191,
            failCount: 9,
        },
        toolPerformance: [
            { tool: 'FetchCustomerData', success: 198, fallback: 2, total: 200 },
            { tool: 'AnalyzeTransactions', success: 200, fallback: 0, total: 200 },
            { tool: 'FraudRulesEngine', success: 185, fallback: 15, total: 200 },
            { tool: 'SynthesizeDecision', success: 191, fallback: 9, total: 200 },
        ],
        agentLatencySamples: Array.from({ length: 200 }, (_, i) => {
            // Generate a realistic distribution of latencies
            const base = 150 + Math.random() * 300; // base latency
            const spike = Math.random() > 0.95 ? 400 + Math.random() * 500 : 0; // occasional spikes
            return base + spike;
        }),
        confusionMatrix: {
            low: { low: 98, medium: 2, high: 0 },
            medium: { low: 3, medium: 75, high: 2 },
            high: { low: 0, medium: 2, high: 18 },
        },
        topPolicyDenials: [
            { caseId: 'case-eval-01', description: 'Complex multi-merchant fraud pattern', predictedRisk: 'medium', actualRisk: 'high' },
            { caseId: 'case-eval-02', description: 'New account bust-out scheme', predictedRisk: 'low', actualRisk: 'high' },
            { caseId: 'case-eval-03', description: 'Benign high-value purchase misflagged', predictedRisk: 'high', actualRisk: 'low' },
        ]
    };
};

// --- Helper Functions ---
const calculatePercentile = (arr, p) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    return Math.round(sorted[Math.floor(index)]);
};

const printHeader = (title) => {
    console.log(`\n🔵 ${title}`);
    console.log(`=====================`);
};

// --- Main Report Generation ---
const main = () => {
    const data = getMockData();

    console.log(`🤖 Sentinel AI Model Evaluation Report`);

    // --- Overall Performance ---
    printHeader('Overall Performance');
    const successRate = data.summary.successRate;
    const successColor = successRate > 90 ? '🟢' : '🟡';
    console.log(`  Task Success Rate: ${successColor} ${successRate.toFixed(1)}% (${data.summary.passCount}/${data.summary.totalCases} passed)`);

    // --- Tool Performance ---
    printHeader('Tool Performance');
    console.log(`  ${'Tool'.padEnd(25)} | ${'Success Rate'.padEnd(15)} | ${'Fallback Rate'.padEnd(15)}`);
    console.log(`  ${'-'.repeat(25)} | ${'-'.repeat(15)} | ${'-'.repeat(15)}`);
    data.toolPerformance.forEach(tool => {
        const successRate = (tool.success / tool.total * 100).toFixed(1);
        const fallbackRate = (tool.fallback / tool.total * 100).toFixed(1);
        console.log(`  ${tool.tool.padEnd(25)} | ${`${successRate}%`.padEnd(15)} | ${`${fallbackRate}%`.padEnd(15)}`);
    });

    // --- Latency ---
    printHeader('Agent Latency');
    const p50 = calculatePercentile(data.agentLatencySamples, 50);
    const p95 = calculatePercentile(data.agentLatencySamples, 95);
    console.log(`  p50 (Median): 🟢 ${p50}ms`);
    console.log(`  p95:          🟡 ${p95}ms`);


    // --- Confusion Matrix ---
    printHeader('Risk Confusion Matrix');
    const riskLevels = ['low', 'medium', 'high'];
    const header = `       | ${riskLevels.map(l => l.toUpperCase().padEnd(8)).join(' | ')}`;
    console.log('Predicted ->');
    console.log(header);
    console.log(`  ${'-'.repeat(header.length - 2)}`);
    
    riskLevels.forEach(actualLevel => {
        const row = riskLevels.map(predictedLevel => {
            const value = data.confusionMatrix[actualLevel][predictedLevel];
            const isDiagonal = actualLevel === predictedLevel;
            const coloredValue = isDiagonal ? `🟢 ${value}` : `🔴 ${value}`;
            return coloredValue.toString().padEnd(8);
        }).join(' | ');
        console.log(`  ${actualLevel.toUpperCase().padEnd(6)} | ${row}`);
    });


    // --- Top Policy Denials ---
    printHeader('Top Policy Denials (Failures)');
    data.topPolicyDenials.forEach(denial => {
        console.log(`\n  🟡 Case: ${denial.caseId}`);
        console.log(`    ${denial.description}`);
        console.log(`    Predicted: 🔴 ${denial.predictedRisk}, Actual: 🟢 ${denial.actualRisk}`);
    });

    console.log();
};

main();