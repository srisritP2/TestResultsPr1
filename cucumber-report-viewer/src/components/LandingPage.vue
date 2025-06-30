<template>
  <div class="landing-bg">
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-brand">
          <img src="https://cucumber.io/img/cucumber-logo.svg" alt="Cucumber Logo" class="logo" />
          <span class="brand-title">Cucumber Reports</span>
        </div>
        <a href="https://cucumber.io" target="_blank" class="navbar-link">cucumber.io</a>
      </div>
    </nav>
    <main class="main-content">
      <div class="upload-card">
        <h1 class="main-title">Publish and share your test results, straight from Cucumber.</h1>
        <p class="subtitle">Upload your <span class="accent">Cucumber JSON</span> test report to visualize the results.</p>
        <div class="upload-area">
          <ReportUploader @report-uploaded="handleFileUpload" />
          <div class="upload-hint">
            <svg class="upload-icon" viewBox="0 0 24 24"><path fill="#00a818" d="M12 16V4m0 0l-4 4m4-4l4 4"/><path fill="#64748b" d="M20 16.5A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5V16a8 8 0 0 1 16 0v.5z" opacity=".3"/></svg>
            <span>Drag & drop your file here, or click to browse</span>
          </div>
        </div>
      </div>
      <div class="howto-section">
        <h2>Start publishing <span class="highlight">in seconds</span></h2>
        <div class="howto-cards">
          <div class="howto-card">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg" alt="Ruby" class="howto-icon" />
            <div class="howto-title">cucumber-ruby</div>
            <code>$ cucumber --publish</code>
          </div>
          <div class="howto-card">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" alt="JVM" class="howto-icon" />
            <div class="howto-title">cucumber-jvm</div>
            <code>cucumber.publish.enabled=true</code>
          </div>
          <div class="howto-card">
            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JS" class="howto-icon" />
            <div class="howto-title">cucumber-js</div>
            <code>$ cucumber-js --publish</code>
          </div>
        </div>
      </div>
    </main>
    <footer class="footer">
      Copyright © 2025 The Cucumber Open Source Project
      <br />
      <a href="#" class="footer-link">Terms & Privacy</a>
    </footer>
  </div>
</template>

<script>
import ReportUploader from './ReportUploader.vue';

export default {
  components: {
    ReportUploader
  },
  methods: {
    handleFileUpload(fileData) {
      this.$emit('file-uploaded', fileData);
    }
  }
}
</script>

<style scoped>
.landing-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e6f9ee 100%);
  font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.navbar-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  height: 32px;
  width: 32px;
}

.brand-title {
  font-weight: bold;
  font-size: 1.2rem;
  color: #1e293b;
  letter-spacing: 0.5px;
}

.navbar-link {
  color: #64748b;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.2s;
}
.navbar-link:hover {
  color: #00a818;
  text-decoration: underline;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem 0 1rem;
}

.upload-card {
  background: #fff;
  border-radius: 1.2rem;
  box-shadow: 0 6px 32px rgba(0,168,24,0.07), 0 1.5px 6px rgba(0,0,0,0.03);
  padding: 2.5rem 2rem 2rem 2rem;
  max-width: 520px;
  width: 100%;
  margin-bottom: 2.5rem;
  text-align: center;
  border-top: 4px solid #00a818;
}

.main-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1e293b;
}

.subtitle {
  font-size: 1.1rem;
  color: #64748b;
  margin-bottom: 2rem;
}
.accent {
  color: #00a818;
  font-weight: 600;
}

.upload-area {
  border: 2px dashed #00a818;
  border-radius: 0.8rem;
  padding: 2rem 1rem 1.5rem 1rem;
  background: #f6fff9;
  margin-bottom: 0.5rem;
  transition: border-color 0.2s;
  position: relative;
}
.upload-area:hover {
  border-color: #059c1b;
}

.upload-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  color: #64748b;
  font-size: 1rem;
  margin-top: 1rem;
  opacity: 0.85;
}
.upload-icon {
  width: 28px;
  height: 28px;
}

.howto-section {
  text-align: center;
  margin-top: 2rem;
}

.howto-section h2 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
}

.highlight {
  color: #00a818;
}

.howto-cards {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.howto-card {
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  padding: 1.2rem 1.5rem;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s;
}
.howto-card:hover {
  box-shadow: 0 4px 16px rgba(0,168,24,0.09);
}

.howto-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 0.5rem;
}

.howto-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

code {
  background: #f1f5f9;
  border-radius: 0.3rem;
  padding: 0.2rem 0.5rem;
  font-size: 0.95em;
  color: #334155;
}

.footer {
  background: #f1f5f9;
  color: #64748b;
  text-align: center;
  padding: 1.5rem 0 1rem 0;
  font-size: 0.95rem;
  margin-top: auto;
}

.footer-link {
  color: #64748b;
  text-decoration: underline;
  margin-left: 0.5rem;
}
</style>