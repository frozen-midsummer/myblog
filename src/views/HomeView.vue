<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { getByUsername, modify } from '@/api/user';
import ChinaCityCodeCascader from '@/components/ChinaCityCodeCascader.vue';
const store = useStore();
const router = useRouter();
const activeName = ref("baseInfo")
const sexOptions = ref([
  {
    value: 'M',
    label: '男'
  },
  {
    value: 'F',
    label: '女'
  },
  {
    value: 'O',
    label: '其他'
  },
])
const form = reactive({
  id: '',
  username: '',
  sex: '',
  birthday: '',
  location: '',
  skills: '',
  feelings: '',
  description: '',
})
onMounted(async () => {
  const response = await getByUsername({ username: store.getters["token/username"] })
  Object.assign(form, response.result)
})
async function onSubmit() {
  const response = await modify(form)
  Object.assign(form, response.result)
}
</script>

<template>
  <div>
    <el-row>
      <el-col :span="12">
        <div style="font-size: large;">{{ store.getters["token/username"] }}</div>
      </el-col>
      <el-col :span="12">
        <el-tabs v-model="activeName" class="personal-info-tabs">
          <el-tab-pane label="基本信息" name="baseInfo">
            <el-form :model="form" label-width="auto" style="max-width: 305px;min-width: 300px">
              <el-form-item label="用户名">
                <el-input v-model="form.username" />
              </el-form-item>
              <el-form-item label="性别">
                <el-select v-model="form.sex" placeholder="♂, ♀, ...">
                  <el-option v-for="item in sexOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="生日">
                <el-date-picker v-model="form.birthday" type="date" :size="size" />
              </el-form-item>
              <el-form-item label="地点">
                <china-city-code-cascader @on-changed="handleCitySelect" placeholder="不修改不用选"></china-city-code-cascader>
              </el-form-item>
              <el-form-item label="</>">
                <el-input v-model="form.skills"></el-input>
              </el-form-item>
              <el-form-item label="个人简介">
                <el-input v-model="form.description" type="textarea" />
              </el-form-item>
              <el-form-item>
                <el-button type="default" @click="onSubmit">保存</el-button>
                <el-button type="default" @click="resetForm">清空</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>
  </div>
</template>
