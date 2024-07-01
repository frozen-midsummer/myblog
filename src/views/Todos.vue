<template>
  <div class="table-wrapper">
    <el-table :data="data" :height="400" fixed>
      <el-table-column prop="createdTime" label="Created Time" width="120" />
      <el-table-column prop="updatedTime" label="Updated Time" width="120" />
      <el-table-column prop="deadline" label="Deadline" width="120" />
      <el-table-column prop="description" label="Description" width="120" />
      <el-table-column prop="alarm" label="Notification" width="120" />
      <el-table-column fixed="right" label="Operations" width="120">
        <template #default="scope">
          <el-button
            link
            type="primary"
            size="small"
            @click.prevent="deleteRow(scope.$index)"
          >
            Remove
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      data: [
        {
          createdTime: "2024-07-01",
          updatedTime: "2024-07-01",
          deadline: "2024-07-01",
          description: "抢票抢票抢票抢票抢票抢票抢票抢票",
          alarm: "never",
        },
      ],
    };
  },
  methods: {
    deleteRow(index) {
      this.data.splice(index, 1);
    },
  },
};
</script>

<style lang="css" scoped>
.table-wrapper :deep(.el-table--fit) {
  padding: 5px 0px 0px 0px;
}
.table-wrapper :deep(.el-table),
.el-table__expanded-cell {
  background-color: transparent;
  --el-table-border-color: black;
  --el-table-header-text-color: rgb(0, 142, 189);
  max-width: 1024px;
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
