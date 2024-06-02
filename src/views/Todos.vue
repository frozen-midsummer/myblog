<template>
  <el-checkbox class="todolist" v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">
    Check all
  </el-checkbox>
  <el-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange">
    <el-checkbox class="todolist" v-for="city in cities" :key="city" :label="city" :value="city">
      {{ city }}
    </el-checkbox>
  </el-checkbox-group>
</template>

<script setup>
import { ref } from "vue";

const checkAll = ref(false);
const isIndeterminate = ref(true);
const checkedCities = ref(["Shanghai", "Beijing"]);
const cities = ["Shanghai", "Beijing", "Guangzhou", "Shenzhen"];

const handleCheckAllChange = (val) => {
  checkedCities.value = val ? cities : [];
  isIndeterminate.value = false;
};
const handleCheckedCitiesChange = (value) => {
  const checkedCount = value.length;
  checkAll.value = checkedCount === cities.length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < cities.length;
};
</script>

<style>
.todolist {
  display: flex;
  place-items: start;
}

@media (min-width: 1024px) {
  .todos {
    /* min-height: 100vh; */
    display: flex;
    align-items: center;
  }
}
</style>