<template>
  <div id="test-btn">
    <button @click="hello">Testing</button>
  </div>
</template>

<script>
const { ipcRenderer } = window.require("electron")

export default {
  methods: {
    hello() {
      ipcRenderer.send('asynchronous-message', 'ping')
      return;
    }
  },

  mounted() {
    ipcRenderer.on('asynchronous-reply', function(event, arg) {
      console.log(arg); // prints "pong"
    });
  }
}
</script>

<style>
  #test-btn {
    display: flex;
    justify-content: center;
    margin: 0 auto;
  }
</style>