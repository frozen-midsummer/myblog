<template>
  <div class="table-wrapper">
    <el-table :columns="columns" :data="data" :width="700" :height="400" fixed>
      <el-table-column prop="createdTime" label="Created Time" width="120" />
      <el-table-column prop="updatedTime" label="Updated Time" width="120" />
      <el-table-column prop="deadline" label="Deadline" width="120" />
      <el-table-column prop="description" label="Description" width="120" />
      <el-table-column prop="alarm" label="Alarm?" width="120" />
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      data: [
        {
          createdTime: "2024",
          updatedTime: "2024",
          deadline: "2024",
          description: "抢票",
          alarm: "never",
        },
      ],
    };
  },
};
</script>

<style lang="css" scoped>
.todolist {
  display: flex;
  place-items: start;
}
.table-wrapper :deep(.el-table--fit) {
  padding: 20px;
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
/* .table-wrapper :deep(.el-table--enable-row-transition .el-table__body td),
  .el-table .cell {
    background-color: transparent;
  } */

@media (min-width: 1024px) {
  .todos {
    /* min-height: 100vh; */
    display: flex;
    align-items: center;
  }
}
</style>
