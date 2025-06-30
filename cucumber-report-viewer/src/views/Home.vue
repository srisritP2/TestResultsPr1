<template>
  <div class="home">
    <LandingPage @file-uploaded="onFileUploaded" />
  </div>
</template>

<script>
import LandingPage from '@/components/LandingPage.vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import parseCucumberJson from '@/utils/parseCucumberJson';

export default {
  components: {
    LandingPage
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const onFileUploaded = (fileData) => {
      const parsed = parseCucumberJson(fileData);
      console.log('Parsed Cucumber JSON:', parsed); // Debug log
      store.commit('setReportData', parsed);
      router.push('/report');
    };
    return { onFileUploaded };
  }
};
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
</style>