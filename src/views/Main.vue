<template>
  <div id="app" class="flex min-h-screen">
    <Sidebar />
    <div class="bg-brown-background flex-1 text-white ml-56">
      <p>
        <!-- Hello, it's me. -->
      </p>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");
import Sidebar from '../components/Sidebar.vue';
import uuid from 'uuid/v4';

export default {
  components: {
    Sidebar,
  },
  data() {
    return {
      userDataPath: "",
    }
  },
  mounted() {
    ipcRenderer.on("edit-task-list", (event, arg) => {
      let { action, ...currentItem } = arg;
      switch(action) {
        case "ADD":
          this.$store.commit('add', { ...currentItem, id: uuid(), status: "STARTED" });
          break;
        case "EDIT":
          this.$store.commit('edit', { ...currentItem, status: "EDITED" });
          break;
        case "DELETE":
          this.$store.commit('deleteItem', { ...currentItem });
          break;
      }
    });

    ipcRenderer.on("before-show-create-window", (event, arg) => {
      this.$store.commit('setCreateWindowAction', { ...arg });
    })

    let task = localStorage.getItem('task');
    if (!task) { 
      localStorage.setItem('task', JSON.stringify([])); 
    } else if (task.length > 0) { 
      task = JSON.parse(task);
      this.$store.commit('init', { task });
    }
  }
  
}
</script>