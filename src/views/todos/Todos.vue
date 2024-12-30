<script setup>
import { ref, onMounted, onUpdated } from "vue";
import { useStore } from 'vuex';
import axios from "axios";
import { formatDate } from '@/utils/date'
const store = useStore();
const columWidth = ref(120);
const todosData = ref([])
function deleteRow(index) {
  todosData.value.splice(index, 1);
}
function refreshData() {
  axios
    .post(
      "http://10.188.133.100:8080/userdata/tasks",
      {},
      {
        headers: {
          Authorization: "Bearer " + store.getters["theme/getToken"],
        },
      }
    )
    .then((response) => {
      todosData.value = response.data.map(todo => ({
        ...todo,
        createdTime: formatDate(todo.createdTime),
        updatedTime: formatDate(todo.updatedTime),
        deadline: formatDate(todo.deadline),
      }));
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
}
onMounted(() => {
  refreshData();
})
</script>

<template>
  <div class="table-wrapper">
    <el-button @click="refreshData">刷新数据</el-button>
    <el-table :data="todosData" :height="400" fixed>
      <el-table-column prop="createdTime" label="Created Time" :width="columWidth" />
      <el-table-column prop="updatedTime" label="Updated Time" :width="columWidth" />
      <el-table-column prop="deadline" label="Deadline" :width="columWidth" />
      <el-table-column prop="description" label="Description" :width="200" />
      <el-table-column prop="alarm" label="Notification" :width="columWidth" />
      <el-table-column label="Operations" :width="columWidth">
        <template #default="scope">
          <el-button link type="primary" size="small" @click.prevent="deleteRow(scope.$index)">
            Remove
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="css" scoped>
.table-wrapper :deep(.el-table--fit) {
  padding: 5px 0px 0px 0px;
}

.table-wrapper :deep(.el-table),
.el-table__expanded-cell {
  background-color: transparent;
  --el-table-border-color: black;
  --el-table-header-text-color: rgb(0, 142, 189);
}

.table-wrapper :deep(.el-table tr) {
  background-color: transparent !important;
}

.table-wrapper :deep(.el-table th) {
  background-color: transparent !important;
}

@media (min-width: 1024px) {
  .todos {
    /* min-height: 100vh; */
    display: flex;
    align-items: center;
  }
}
</style>
