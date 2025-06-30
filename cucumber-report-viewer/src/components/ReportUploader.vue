<template>
  <div class="report-uploader">
    <h2>Upload Cucumber JSON Report</h2>
    <input type="file" @change="onFileChange" accept=".json" />
    <button @click="uploadReport" :disabled="!selectedFile">Upload</button>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedFile: null,
      errorMessage: ''
    };
  },
  methods: {
    onFileChange(event) {
      const file = event.target.files[0];
      if (file && file.type === 'application/json') {
        this.selectedFile = file;
        this.errorMessage = '';
      } else {
        this.errorMessage = 'Please select a valid JSON file.';
      }
    },
    uploadReport() {
      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const jsonData = JSON.parse(e.target.result);
          this.$emit('report-uploaded', jsonData);
          this.selectedFile = null; // Reset the file input
        };
        reader.readAsText(this.selectedFile);
      }
    }
  }
};
</script>

<style scoped>
.report-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.error {
  color: red;
}
</style>