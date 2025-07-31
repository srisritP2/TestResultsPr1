import { createStore } from 'vuex';
import theme from './modules/theme';

export default createStore({
  state: {
    reportData: null,
  },
  mutations: {
    setReportData(state, data) {
      state.reportData = data;
    },
  },
  actions: {
    uploadReport({ commit }, report) {
      commit('setReportData', report);
    },
  },
  getters: {
    getReportData: (state) => state.reportData,
  },
  modules: {
    theme
  }
});