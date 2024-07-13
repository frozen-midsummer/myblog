<template>
  <div class="table-wrapper">
    <el-button @click="refreshData">刷新数据</el-button>
    <el-table :data="todosData" :height="400" fixed>
      <el-table-column
        prop="createdTime"
        label="Created Time"
        :width="columWidth"
      />
      <el-table-column
        prop="updatedTime"
        label="Updated Time"
        :width="columWidth"
      />
      <el-table-column prop="deadline" label="Deadline" :width="columWidth" />
      <el-table-column
        prop="description"
        label="Description"
        :width="200"
      />
      <el-table-column prop="alarm" label="Notification" :width="columWidth" />
      <el-table-column label="Operations" :width="columWidth">
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
import { ref, onMounted, onUpdated } from "vue";
import axios from "axios";
export default {
  setup() {
    const columWidth = ref(120);
    return {
      columWidth,
    };
  },
  data() {
    return {
      todosData: [
        {
          createdTime: "2024-07-01",
          updatedTime: "2024-07-01",
          deadline: "2024-07-01",
          description: "st.",
          alarm: "never",
        },
      ],
    };
  },
  methods: {
    deleteRow(index) {
      this.todosData.splice(index, 1);
    },
    refreshData() {
      axios
        .post(
          "http://10.188.133.100:8080/userdata/tasks",
          {},
          {
            headers: {
              Authorization: "Bearer " + this.$store.getters.getToken,
            },
          }
        )
        .then((response) => {
          this.todosData = response.data;
        })
        .catch((error) => {
          console.error("请求失败:", error);
        });
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
  /* max-width: 1024px; */
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
