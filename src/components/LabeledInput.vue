<template>
  <div class="input flex justify-between mb-5">
    <div class="label mr-5">{{label}}:</div>
    <input 
      class="text-input bg-transparent font-light text-gray-300 text-base pl-3 border border-gray-600 rounded py-px" 
      :placeholder="placeholder"
      @input="inputValue"
      v-model="value"
      :type="type"
    >
  </div>
</template>

<script>
export default {
  name: "LabeledInput",
  props: ['label', 'placeholder', 'field', 'type'],
  data() {
    return {
      value: ""
    };
  },
  methods: {
    inputValue() {
      this.$emit('inputEvent', { field: this.$props.field, value: this.value });
    }
  }
}
</script>

<style>

</style>