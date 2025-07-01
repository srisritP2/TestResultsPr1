

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
        meta: {
            framework: jsonData.framework || '',
            frameworkVersion: jsonData.frameworkVersion || '',
            runtime: jsonData.runtime || '',
            runtimeVersion: jsonData.runtimeVersion || '',
            os: jsonData.os || '',
        }
    };

    features.forEach(feature => {
        const featureData = {
            id: feature.id,
            name: feature.name,
            description: feature.description || '',
            tags: Array.isArray(feature.tags) ? feature.tags.map(t => t.name || t) : [],
            scenarios: [],
        };

        // Support both 'elements' and 'children' for scenarios/backgrounds
        const scenarioList = Array.isArray(feature.elements) ? feature.elements : (Array.isArray(feature.children) ? feature.children : []);
        scenarioList.forEach(scenario => {
            if (scenario.type === 'background') return; // skip backgrounds for now, or handle separately
            const scenarioData = {
                id: scenario.id,
                name: scenario.name,
                description: scenario.description || '',
                type: scenario.type,
                tags: Array.isArray(scenario.tags) ? scenario.tags.map(t => t.name || t) : [],
                status: scenario.status,
                steps: [],
                keyword: scenario.keyword,
                line: scenario.line,
            };

            if (Array.isArray(scenario.steps)) {
                scenario.steps.forEach(step => {
                    scenarioData.steps.push({
                        keyword: step.keyword,
                        name: step.name,
                        status: step.result && step.result.status,
                        duration: step.result && step.result.duration,
                        errorMessage: step.result && step.result.error_message || null,
                        embeddings: step.embeddings || [],
                        line: step.line,
                    });
                });
            }

            featureData.scenarios.push(scenarioData);
            parsedResults.totalScenarios++;

            if (scenario.status === 'passed') {
                parsedResults.passed++;
            } else if (scenario.status === 'failed') {
                parsedResults.failed++;
            }

            parsedResults.duration += scenarioData.steps.reduce((total, step) => total + (step.duration || 0), 0);
        });

        parsedResults.features.push(featureData);
    });

    return parsedResults;
}

export default parseCucumberJson;