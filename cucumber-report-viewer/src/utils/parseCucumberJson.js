
function parseCucumberJson(jsonData) {
    // Accept either an array or an object with a features array
    let features = [];
    if (Array.isArray(jsonData)) {
        features = jsonData;
    } else if (jsonData && Array.isArray(jsonData.features)) {
        features = jsonData.features;
    } else {
        throw new Error('Input is not a valid Cucumber JSON array or object with a features array.');
    }

    const parsedResults = {
        features: [],
        totalScenarios: 0,
        passed: 0,
        failed: 0,
        duration: 0,
    };

    features.forEach(feature => {
        const featureData = {
            name: feature.name,
            scenarios: [],
        };

        if (!Array.isArray(feature.elements)) return; // skip if no scenarios
        feature.elements.forEach(scenario => {
            const scenarioData = {
                name: scenario.name,
                status: scenario.status,
                steps: [],
            };

            if (Array.isArray(scenario.steps)) {
                scenario.steps.forEach(step => {
                    scenarioData.steps.push({
                        name: step.name,
                        status: step.result && step.result.status,
                        duration: step.result && step.result.duration,
                        errorMessage: step.result && step.result.error_message || null,
                    });
                });
            }

            featureData.scenarios.push(scenarioData);
            parsedResults.totalScenarios++;

            if (scenario.status === 'passed') {
                parsedResults.passed++;
            } else {
                parsedResults.failed++;
            }

            parsedResults.duration += scenarioData.steps.reduce((total, step) => total + (step.duration || 0), 0);
        });

        parsedResults.features.push(featureData);
    });

    return parsedResults;
}

export default parseCucumberJson;