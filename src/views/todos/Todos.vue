<script setup>
import { ref, reactive, onMounted, onUpdated } from "vue";
import { useStore } from 'vuex';
import axios from "axios";
import { formatDate } from '@/utils/date'
import { findTasks, insertTask } from '@/api/usertasks'
import { ElMessage } from "element-plus";
const store = useStore();
const todosData = ref([])
const form = reactive({
  description: '',
  deadline: '',
  alarm: ''
})
// 保存表单初始状态的一个快照
const initialFormState = { ...form };
// 清空表单的方法
const resetForm = () => {
  // 将表单恢复到初始状态
  Object.keys(initialFormState).forEach(key => {
    form[key] = initialFormState[key];
  });
};
const alarmOptions = [
  {
    value: 'Reminder',
    label: 'Reminder'
  },
  {
    value: 'Warning',
    label: 'Warning'
  },
]
function deleteRow(index) {
  todosData.value.splice(index, 1);
}
async function refreshData() {
  const response = await findTasks({});
  todosData.value = response.result.map(todo => ({
    ...todo,
    createdTime: formatDate(todo.createdTime),
    updatedTime: formatDate(todo.updatedTime),
    deadline: formatDate(todo.deadline),
  }));
}
const onSubmit = async () => {
  const response = await insertTask(form);
  ElMessage({ message: "待办任务提交成功", type: 'success' });
  refreshData();
}
onMounted(() => {
  refreshData();
})
</script>

<template>
  <div>
    <el-row>
      <el-col :span="17">
        <el-scrollbar class="scrollable-table">
          <el-button @click="refreshData">刷新数据</el-button>
          <el-table :data="todosData">
            <el-table-column prop="createdTime" label="Created Time" :width="160" />
            <el-table-column prop="updatedTime" label="Updated Time" :width="160" />
            <el-table-column prop="deadline" label="Deadline" :width="160" />
            <el-table-column prop="description" label="Description" :width="210" />
            <el-table-column prop="alarm" label="Notification" :width="120" />
            <el-table-column fixed="right" label="" :width="120">
              <template #default="scope">
                <el-button type="info" size="default" @click.prevent="deleteRow(scope.$index)">
                  Remove
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-scrollbar>
      </el-col>
      <el-col :span="1">
        <div class="todos-form-border"></div>
      </el-col>
      <el-col :span="6">
        <el-form :model="form" label-width="auto">
          <el-form-item label="Deadline">
            <el-date-picker v-model="form.deadline" type="datetime" placeholder="Select date and time" />
          </el-form-item>
          <el-form-item label="Description">
            <el-input v-model="form.description" />
          </el-form-item>
          <el-form-item label="Alarm Level">
            <el-select v-model="form.alarm" placeholder="Select alarm level" style="width: 240px">
              <el-option v-for="item in alarmOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="default" @click="onSubmit">Sumit</el-button>
            <el-button type="default" @click="resetForm">Cancel</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>

  </div>
</template>

<style lang="css" scoped>
.scrollable-table {
  height: 550px;
  overflow-y: auto;
  /* 当内容超出高度时显示垂直滚动条 */
  overflow-x: hidden;
  /* 禁止水平滚动条（如果不需要） */
}

.todos-form-border {
  position: relative;
  height: 100%;
  border-left: 1px solid var(--color-border);
  margin-left: 50%;
}

@media (min-width: 1024px) {
  .todos {
    /* min-height: 100vh; */
    display: flex;
    align-items: center;
  }
}
</style>
