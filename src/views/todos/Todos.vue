<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { formatDate } from '@/utils/date'
import { getTasks, insertTask, deleteTask, modifyTask } from '@/api/userdata'
import { ElMessage, ElMessageBox } from "element-plus";
import { 
  Plus, 
  Delete, 
  Edit, 
  Refresh, 
  Check, 
  Timer, 
  Warning, 
  CircleCheck, 
  CircleCheckFilled,
  Calendar,
  MoreFilled,
  ArrowDown,
  ArrowUp
} from '@element-plus/icons-vue'

const todosData = ref([])
const loading = ref(false)
const showCompleted = ref(false)

const form = reactive({
  taskId: '',
  description: '',
  deadline: '',
  alarm: 'Reminder',
  status: 0
})

const initialFormState = {
  taskId: '',
  description: '',
  deadline: '',
  alarm: 'Reminder',
  status: 0
};

const alarmOptions = [
  { value: 'Reminder', label: '普通', type: 'info', color: '#909399' },
  { value: 'Warning', label: '紧急', type: 'danger', color: '#f56c6c' },
]

// 分类和排序数据
const pendingTodos = computed(() => {
  return todosData.value
    .filter(t => t.status === 0)
    .sort((a, b) => {
      // 紧急任务排在前面
      if (a.alarm === 'Warning' && b.alarm !== 'Warning') return -1;
      if (a.alarm !== 'Warning' && b.alarm === 'Warning') return 1;
      // 然后按截止日期排序
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    })
})

const completedTodos = computed(() => {
  return todosData.value
    .filter(t => t.status === 1)
    .sort((a, b) => new Date(b.updatedTime) - new Date(a.updatedTime))
})

const resetForm = () => {
  Object.assign(form, initialFormState);
};

const fillForm = (userTask) => {
  const { taskId, description, deadline, alarm, status } = userTask
  Object.assign(form, { taskId, description, deadline, alarm, status })
}

const refreshData = async () => {
  loading.value = true
  try {
    const response = await getTasks({});
    todosData.value = response.result || []
  } catch (error) {
    ElMessage.error('获取待办列表失败')
  } finally {
    loading.value = false
  }
}

const onSubmit = async () => {
  if (!form.description.trim()) {
    ElMessage.warning('请输入任务描述')
    return
  }
  
  try {
    if (form.taskId === '') {
      await insertTask(form);
      ElMessage.success('添加成功');
    } else {
      await modifyTask(form)
      ElMessage.success('修改成功');
    }
    resetForm()
    refreshData();
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleToggleStatus = async (todo) => {
  const newStatus = todo.status === 0 ? 1 : 0
  try {
    // 乐观更新
    todo.status = newStatus
    await modifyTask({
      ...todo,
      status: newStatus
    })
    ElMessage({
      message: newStatus === 1 ? '任务已完成 ✨' : '任务已恢复',
      type: 'success',
      duration: 2000
    })
    refreshData()
  } catch (error) {
    todo.status = todo.status === 0 ? 1 : 0 // 回滚
    ElMessage.error('更新状态失败')
  }
}

const handleEdit = (todo) => {
  fillForm(todo)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleDelete = (todo) => {
  ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    buttonSize: 'default'
  }).then(async () => {
    await deleteTask({ taskId: todo.taskId })
    ElMessage.success('删除成功')
    refreshData()
  }).catch(() => {})
}

const getDeadlineText = (deadline) => {
  if (!deadline) return ''
  const now = new Date()
  const d = new Date(deadline)
  const diff = d.getTime() - now.getTime()
  
  if (diff < 0) return '已逾期'
  if (diff < 3600000) return '1小时内截止'
  if (diff < 86400000) return '今天截止'
  if (diff < 172800000) return '明天截止'
  
  return formatDate(deadline).split(' ')[0] // 只显示日期
}

const getDeadlineClass = (deadline) => {
  if (!deadline) return ''
  const now = new Date()
  const d = new Date(deadline)
  const diff = d.getTime() - now.getTime()
  if (diff < 0) return 'overdue'
  if (diff < 86400000) return 'urgent'
  return ''
}

onMounted(() => {
  refreshData();
})
</script>

<template>
  <div class="modern-todo-container">
    <div class="todo-header">
      <h2 class="title">我的待办</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" circle @click="refreshData" :loading="loading" />
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <el-card shadow="hover" class="input-card">
        <div class="input-wrapper">
          <el-input
            v-model="form.description"
            placeholder="添加一个任务..."
            class="main-input"
            @keyup.enter="onSubmit"
          >
            <template #prefix>
              <el-icon><Plus /></el-icon>
            </template>
          </el-input>
          
          <div class="input-meta">
            <el-date-picker
              v-model="form.deadline"
              type="datetime"
              placeholder="截止时间"
              size="small"
              class="date-picker"
              prefix-icon="Calendar"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
            
            <el-select v-model="form.alarm" size="small" class="priority-select">
              <el-option v-for="item in alarmOptions" :key="item.value" :label="item.label" :value="item.value">
                <span :style="{ color: item.color }">●</span> {{ item.label }}
              </el-option>
            </el-select>

            <el-button type="primary" size="small" @click="onSubmit" :icon="form.taskId ? Check : Plus">
              {{ form.taskId ? '保存' : '添加' }}
            </el-button>
            <el-button v-if="form.taskId" size="small" @click="resetForm">取消</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 列表区域 -->
    <div class="list-section">
      <transition-group name="todo-list" tag="div" class="tasks-container">
        <!-- 待办任务 -->
        <div v-for="todo in pendingTodos" :key="todo.taskId" class="task-item">
          <div class="task-card" :class="{ 'is-urgent': todo.alarm === 'Warning' }">
            <div class="task-checkbox" @click="handleToggleStatus(todo)">
              <el-icon v-if="todo.status === 1"><CircleCheckFilled /></el-icon>
              <el-icon v-else><CircleCheck /></el-icon>
            </div>
            
            <div class="task-content" @click="handleEdit(todo)">
              <div class="task-title">{{ todo.description }}</div>
              <div class="task-info">
                <span v-if="todo.deadline" :class="['task-deadline', getDeadlineClass(todo.deadline)]">
                  <el-icon><Timer /></el-icon>
                  {{ getDeadlineText(todo.deadline) }}
                </span>
                <span v-if="todo.alarm === 'Warning'" class="priority-tag urgent">紧急</span>
              </div>
            </div>

            <div class="task-actions">
              <el-dropdown trigger="click">
                <el-button :icon="MoreFilled" link />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :icon="Edit" @click="handleEdit(todo)">编辑</el-dropdown-item>
                    <el-dropdown-item :icon="Delete" @click="handleDelete(todo)" class="delete-action">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="pendingTodos.length === 0 && !loading" class="empty-state">
          <el-empty description="太棒了！所有任务都已完成" :image-size="200" />
        </div>
      </transition-group>

      <!-- 已完成切换 -->
      <div v-if="completedTodos.length > 0" class="completed-toggle" @click="showCompleted = !showCompleted">
        <el-icon>
          <component :is="showCompleted ? ArrowUp : ArrowDown" />
        </el-icon>
        <span>已完成 ({{ completedTodos.length }})</span>
      </div>

      <!-- 已完成任务列表 -->
      <transition name="fade">
        <div v-if="showCompleted" class="completed-list">
          <div v-for="todo in completedTodos" :key="todo.taskId" class="task-item is-completed">
            <div class="task-card">
              <div class="task-checkbox checked" @click="handleToggleStatus(todo)">
                <el-icon><CircleCheckFilled /></el-icon>
              </div>
              <div class="task-content">
                <div class="task-title">{{ todo.description }}</div>
                <div class="task-info">
                  <span class="completed-at">完成于 {{ formatDate(todo.updatedTime) }}</span>
                </div>
              </div>
              <div class="task-actions">
                <el-button :icon="Delete" link @click="handleDelete(todo)" />
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modern-todo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #2c3e50;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;

  .title {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    color: var(--el-text-color-primary);
  }
}

.input-section {
  margin-bottom: 40px;

  .input-card {
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    
    :deep(.el-card__body) {
      padding: 15px;
    }
  }

  .main-input {
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      font-size: 16px;
      padding-left: 0;
    }
    
    :deep(.el-input__prefix) {
      font-size: 20px;
      color: #409eff;
    }
  }

  .input-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color-extra-light);

    .date-picker {
      width: 180px;
    }

    .priority-select {
      width: 100px;
    }
  }
}

.tasks-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.is-completed {
    .task-title {
      text-decoration: line-through;
      color: var(--el-text-color-placeholder);
    }
    .task-card {
      background-color: var(--el-fill-color-lighter);
      opacity: 0.8;
      border: 1px dashed var(--el-border-color);
    }
  }
}

.task-card {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    background-color: var(--el-fill-color-light);
    
    .task-actions {
      opacity: 1;
    }
  }

  &.is-urgent {
    border-left: 4px solid var(--el-color-danger);
  }
}

.task-checkbox {
  font-size: 24px;
  color: var(--el-text-color-placeholder);
  margin-right: 15px;
  margin-top: 2px;
  transition: color 0.2s;

  &:hover {
    color: var(--el-color-primary);
  }

  &.checked {
    color: var(--el-color-success);
  }
}

.task-content {
  flex: 1;
  min-width: 0;

  .task-title {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 6px;
    word-break: break-all;
    color: var(--el-text-color-primary);
  }

  .task-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .task-deadline {
      display: flex;
      align-items: center;
      gap: 4px;
      
      &.urgent {
        color: var(--el-color-warning);
      }
      &.overdue {
        color: var(--el-color-danger);
        font-weight: bold;
      }
    }

    .priority-tag {
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--el-fill-color-light);
      
      &.urgent {
        background: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }
    }
  }
}

.task-actions {
  opacity: 0;
  transition: opacity 0.2s;
  margin-left: 10px;
}

.delete-action {
  color: #f56c6c !important;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
}

.completed-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 30px 0 15px;
  padding: 8px 12px;
  width: fit-content;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.completed-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// 动画
.todo-list-enter-active,
.todo-list-leave-active {
  transition: all 0.4s ease;
}
.todo-list-enter-from,
.todo-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .modern-todo-container {
    padding: 20px 15px;
  }
  
  .input-meta {
    flex-wrap: wrap;
    
    .date-picker {
      width: 100%;
    }
    
    .priority-select {
      flex: 1;
    }
  }
  
  .task-actions {
    opacity: 1;
  }
}
</style>
