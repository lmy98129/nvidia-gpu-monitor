import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    task: [],
    currentUUID: "",
  },
  mutations: {
    init(state, { task }) {
      state.task = task;
      if (task instanceof Array && task.length > 0) {
        state.currentUUID = task[0].id;
      }
    },
    
    add(state, currentItem) {
      state.task.push(currentItem);
      if (state.currentUUID == "") {
        state.currentUUID = state.task[0].id;
      }
    },

    edit(state, currentItem) {
      let idx = state.task.findIndex((item) => item.id == currentItem.id);
      if (idx >= 0) {
        state.task[idx] = currentItem;
      }
    },

    selectItem(state, { id }) {
      state.currentUUID = id;
    },

    deleteItem(state, { id }) {
      let idx = state.task.findIndex((item) => item.id == id);
      state.task.splice(idx, 1);
      if (state.task.length <= 0) {
        state.currentUUID = "";
        return;
      }
      if (idx == 0) {
        state.currentUUID = state.task[0].id;
      } else {
        state.currentUUID = state.task[idx - 1].id;
      }
    },

    updateSshResult(state, { id, data }) {
      let idx = state.task.findIndex((item) => item.id == id);
      if (idx >= 0) {
        state.task.splice(idx, 1, { ...state.task[idx], data });
      }
    },

    changeStatus(state, { id, status }) {
      let idx = state.task.findIndex((item) => item.id == id);
      if (idx >= 0) {
        state.task.splice(idx, 1, { ...state.task[idx], status });
      }
    }

  },
  actions: {

  }
})
