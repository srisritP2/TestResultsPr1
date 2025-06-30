function parseCucumberJson(jsonData) {
    const parsedResults = {
        features: [],
        totalScenarios: 0,
        passed: 0,
        failed: 0,
        duration: 0,
    };

    jsonData.forEach(feature => {
        const featureData = {
            name: feature.name,
            scenarios: [],
        };

        feature.elements.forEach(scenario => {
            const scenarioData = {
                name: scenario.name,
                status: scenario.status,
                steps: [],
            };

            scenario.steps.forEach(step => {
                scenarioData.steps.push({
                    name: step.name,
                    status: step.result.status,
                    duration: step.result.duration,
                    errorMessage: step.result.error_message || null,
                });
            });

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