# Cucumber Report Viewer

This project is a Vue.js application designed to visualize Cucumber JSON test reports. It provides a user-friendly interface for uploading test reports and viewing detailed results, including summaries and individual test scenarios.

## Features

- **Landing Page**: A simple interface for uploading Cucumber JSON test reports.
- **Report Viewer**: Visualizes the test results with detailed information on features, scenarios, and steps.
- **Test Summary**: Displays an overview of the test results, including total scenarios, passed, failed, and duration.
- **Responsive Design**: The application is designed to be responsive and user-friendly across different devices.

## Project Structure

```
cucumber-report-viewer
├── public
│   └── index.html          # Main entry point for the application
├── src
│   ├── assets              # Static assets (images, fonts, etc.)
│   ├── components          # Vue components for various functionalities
│   ├── views               # View components for different pages
│   ├── router              # Vue Router configuration
│   ├── store               # Vuex store for state management
│   ├── utils               # Utility functions for parsing Cucumber JSON
│   ├── App.vue             # Root component of the application
│   └── main.js             # Entry point for the Vue application
├── package.json            # npm configuration file
├── README.md               # Project documentation
└── vue.config.js           # Vue CLI configuration
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd cucumber-report-viewer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the application:
   ```
   npm run serve
   ```

4. Open your browser and navigate to `http://localhost:8080` to view the application.

## Usage

- Use the landing page to upload a Cucumber JSON test report.
- After uploading, navigate to the report viewer to see detailed results and summaries.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.