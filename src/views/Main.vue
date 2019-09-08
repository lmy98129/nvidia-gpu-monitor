<template>
  <div id="app" class="flex min-h-screen">
    <Sidebar />
    <div class="flex flex-col bg-brown-background flex-1 text-white ml-56">
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
        class="flex mb-3"
      >
          <div class="iconfont iconxianka text-5xl"></div>
          <div class="right-wrapper flex-col">
            <div class="upper-wrap">
              {{ item.product_name }} 风扇转速: {{ item.fan_speed }} | 温度: {{ temper(item.temperature.gpu_temp) }}
            </div>
            <div class="lower-wrap">
              {{ item.fb_memory_usage.free }} | {{ item.fb_memory_usage.used }} | {{ item.fb_memory_usage.total }}
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