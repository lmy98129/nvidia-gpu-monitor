<template>
  <!-- 侧边栏 -->
  <div 
    :class="(isFullScreen ? 'pt-2' : 'pt-8') + ' bg-gray-transparent w-56 text-white fixed min-h-screen'"
    style="-webkit-app-region: drag"
  >
    <div class="flex text-center p-2 relative justify-around items-center">
      <input 
        type="text" 
        placeholder="搜索" 
        v-model="searchQuery"
        class="clickable font-light bg-transparent text-gray-500 text-sm px-2 py-1 pl-3 border border-gray-600 rounded"
      >
      <button 
        @click="showCreateWindow"
        class="
          clickable text-base font-bold text-gray-500 
          iconfont iconaui-icon-plus 
          border h-fit text-center w-8 ml-1 border-gray-600 rounded py-05 cursor-pointer"
      >
      </button>
    </div>
    <div id="container" class="flex flex-col mt-3">
      <div 
        v-for="(item, idx) in task" :key="idx" :data-id="item.id"
        :class="(item.id == currentUUID ? 'bg-gray-500 text-black' : 'text-white font-hairline') + ' clickable flex flex-row justify-between min-w-full pl-4 pr-3 py-1 my-1 text-base'"
        @click="selectItem"
      >
        <div 
          class="truncate pr-1 leading-relaxed" 
          :data-id="item.id"
        >
          {{ item.host || "服务器 "+ (idx + 1) }}
        </div> 
        <div v-if="item.id == currentUUID" id="right-wrapper" class="flex">
          <div 
            class="clickable text-xl iconfont iconmore cursor-pointer mr-1 leading-snug" 
            :data-id="item.id"
            @click="showRightClickMenu"
          >
          </div>
          <div 
            class="clickable text-lg iconfont iconclose cursor-pointer"
            :data-id="item.id"
            @click="deleteItem"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");
import { mapState } from 'vuex';

export default {
  name: 'Sidebar',
  data() {
    return {
      isFullScreen: false,
      searchQuery: "",
    }
  },

  computed: mapState({
    task(state) {
      return this.searchQuery != "" ?
        state.task.filter((item) => item.host.indexOf(this.searchQuery) >= 0)
        : state.task;
    }, 
    currentUUID: 'currentUUID'
  }),

  mounted() {
    ipcRenderer.on("render-full-screen", (event, arg) => {
      // 全屏时修改侧边栏的顶部距离
      this.isFullScreen = arg == "ENTER_FULL_SCREEN";
    });
  },

  methods: {
    showCreateWindow() {
      ipcRenderer.send('show-create-window', { action: "ADD" });
    },
    showRightClickMenu(e) {
      let { id } = e.target.dataset;
      let idx = this.$store.state.task.findIndex((item) => item.id == id);
      ipcRenderer.send('show-right-click-menu', { ...this.$store.state.task[idx] });
      e.stopPropagation();
    },
    selectItem(e) {
      let { id } = e.target.dataset;
      this.$store.commit('selectItem', { id });
      e.stopPropagation();
    },
    deleteItem(e) {
      let { id } = e.target.dataset;
      ipcRenderer.send('stop-ssh-task', { id: this.$store.state.currentUUID });
      this.$store.commit('deleteItem', { id });
      e.stopPropagation();
    },
  }
}
</script>

<style>

</style>