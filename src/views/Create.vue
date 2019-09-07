<template>
  <div class="bg-brown-background fixed min-h-screen w-full text-white">
    <div id="dragger" class="h-8 w-full"></div>
    <div id="container" class="w-3/5 mx-auto">
      <div id="title" class="text-center text-2xl mt-3 mb-8">
        {{titleAction}}SSH连接
      </div>
      <LabeledInput label="服务器地址" placeholder="请输入IP地址" field="host" @inputEvent="inputListener"/>
      <LabeledInput label="端口地址" placeholder="可选，默认为22" field="port" @inputEvent="inputListener"/>
      <LabeledInput label="用户名" placeholder="可选，默认为root" field="username" @inputEvent="inputListener"/>
      <LabeledInput label="密码" placeholder="请输入登录密码" field="password" @inputEvent="inputListener" type="password"/>
      <div class="flex text-center mt-10">
        <button 
          class="w-1/3 mx-auto text-lg text-center py-2 px-4 border rounded border-gray-400 cursor-pointer"
          @click="onConfirm"
        >
          确定
        </button>
        <button 
          class="w-1/3 mx-auto text-lg text-center py-2 px-4 border rounded border-gray-400 cursor-pointer"
          @click="onCancel"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron");
import LabeledInput from '../components/LabeledInput.vue'
import { mapState } from 'vuex';

export default {
  components: {
    LabeledInput,
  },
  data() {
    return {
      host: "",
      port: 22,
      username: "root",
      password: "",
      id: "",
      action: ""
    };
  },
  computed: mapState({
    titleAction(state) { 
      console.log(state);
      this.action = state.createWindowAction;
      return this.action == "EDIT" ? "编辑" : "创建";
    }
  }),

  methods: {
    inputListener({ field, value }) {
      switch(field) {
        case "port": 
          if (typeof value === "string") {
            value = parseInt(value);
          }
          if (isNaN(value)) value = 22;
          break;
        case "username":
          if (value == "") value = "root";
      }
      this[field] = value;
    },

    onConfirm() {
      ipcRenderer.send('close-create-window', { 
        ...this.$data
      });
    },

    onCancel() {
      ipcRenderer.send('close-create-window', { 
        ...this.$data, action: "CANCEL",
      });
    }
  },

}
</script>

<style>

</style>