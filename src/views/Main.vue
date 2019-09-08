<template>
  <div id="app" class="flex min-h-screen">
    <Sidebar />
    <div class="flex flex-col bg-brown-background flex-1 text-white ml-56 border-t">
      <div 
        v-if="connectStatus == 'EMPTY'"
        class="min-h-full w-full flex flex-col justify-center"
      >
        <div class="iconfont iconshebeileifuwuqiyichang text-6xl text-center"></div>
        <div class="text-center mt-3">服务器列表为空<br />点击左侧“+”按钮，创建连接</div>
      </div>
      <div 
        v-else-if="connectStatus == 'STOPED'"
        class="min-h-full w-full flex flex-col justify-center"
      >
        <div class="iconfont iconstopo text-6xl text-center"></div>
        <div class="text-center mt-3">连接中断或出错<br />点击对应服务器“···”按钮，重启或配置连接</div>
      </div>
      <div 
        v-else-if="connectStatus == 'CONNECTING'"
        class="min-h-full w-full flex flex-col justify-center"
      >
        <div class="iconfont iconupload text-6xl text-center"></div>
        <div class="text-center mt-1">正在连接中，请稍候</div>
      </div>
      <div 
        v-else 
        v-for="(item, idx) in gpuList(connectStatus)" :key="idx"
        class="flex pt-4 pb-3 border-b items-center"
      >
          <div class="iconfont iconxianka text-5xl mx-8"></div>
          <div class="right-wrapper flex flex-1 items-center justify-between">
            <div class="name text-xl">{{ item.product_name }}</div>
            <div class="other-info flex-col mr-6">
              <div class="upper-wrap flex justify-end">
                <div class="fan-speed flex">
                  <div class="iconfont iconfan text-lg"></div>
                  <div class="content text-lg">{{ item.fan_speed }}</div>
                </div>
                <div class="temperature flex ml-4">
                  <div class="iconfont iconwendu text-lg"></div>
                  <div class="content text-lg">{{ temper(item.temperature.gpu_temp) }}</div>
                </div>
              </div>
              <div class="lower-wrap flex mt-2">
                <div class="mem-free text-center text-3xl px-4 text-green-400">{{ memUsage(item.fb_memory_usage.free) }}</div>
                <div class="mem-used text-center text-3xl px-4 text-orange-400">{{ memUsage(item.fb_memory_usage.used) }}</div>
                <div class="mem-total text-center text-3xl px-4 pr-0 text-blue-500">{{ memUsage(item.fb_memory_usage.total) }}</div>
              </div>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");
import Sidebar from '../components/Sidebar.vue';
import uuid from 'uuid/v4';
import { mapState } from 'vuex';

export default {
  components: {
    Sidebar,
  },
  data() {
    return {
      // userDataPath: "",
    }
  },
  computed: { 
    ...mapState({
      connectStatus(state) {
        let idx = state.task.findIndex((item) => item.id == state.currentUUID);
        if (idx < 0) 
          return "EMPTY"; 
        else if (state.task[idx].status == "STOPED") 
          return "STOPED";
        else if (state.task[idx].status == "STARTED" && (state.task[idx].data == "" || !state.task[idx].data)) 
          return "CONNECTING";
        else 
          return "CONNECTED";
      },
      gpuList(state) {
        return function(status) {
          if (status == "CONNECTED") {
            let idx = state.task.findIndex((item) => item.id == state.currentUUID);
            return state.task[idx].data.nvidia_smi_log.gpu || [];
          } else {
            return [];
          }
        }
      }
    }),
    temper() {
      return function(tempStr) { 
        return tempStr.replace("C", "℃");
      }
    },
    memUsage() {
      return function(memStr) {
        return memStr.replace("MiB", "");
      }
    }
  },

  mounted() {
    ipcRenderer.on("edit-task-list", (event, arg) => {
      let { action, ...currentItem } = arg;
      let finalItem;

      switch(action) {
        case "ADD":
          finalItem = { ...currentItem, id: uuid() }
          this.$store.commit('add', { ...finalItem, status: "STARTED" });
          ipcRenderer.send('start-ssh-task', finalItem);
          break;
        case "EDIT":
          this.$store.commit('edit', { ...currentItem, status: "EDITED" });
          break;
        case "DELETE":
          ipcRenderer.send('stop-ssh-task', { id: this.$store.state.currentUUID });
          this.$store.commit('deleteItem', { ...currentItem });
          break;
        case "STATUS":
          this.$store.commit('changeStatus', { ...currentItem });
          break;
      }
    });

    ipcRenderer.on('remote-ssh-results', (event, { id, data }) => {
      let idx = this.$store.state.task.findIndex((item) => item.id == id);
      if (idx >= 0) {
        this.$store.commit('updateSshResult', { id, data });
      }
    })

    let task = localStorage.getItem('task');
    if (!task) { 
      localStorage.setItem('task', JSON.stringify([])); 
    } else if (task.length > 0) { 
      task = JSON.parse(task);
      this.$store.commit('init', { task });
    }

  },

  beforeDestroy() {
    localStorage.setItem('task', JSON.stringify(this.$store.state.task));
  }
  
}
</script>