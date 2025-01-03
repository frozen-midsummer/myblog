<script setup>
import { ref, reactive } from 'vue'
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
const store = useStore();
const router = useRouter();
const activeName = ref("baseInfo")
const sexOptions = ref([
  {
    value: 'male',
    label: '男'
  },
  {
    value: 'female',
    label: '女'
  },
  {
    value: 'otherSex',
    label: '其他'
  },
])
const form = reactive({
  name: '',
  sex: '',
  description: '',
})
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
              <el-form-item label="姓名">
                <el-input v-model="form.name" />
              </el-form-item>
              <el-form-item label="性别">
                <el-select v-model="form.sex" placeholder="♂, ♀, ...">
                  <el-option v-for="item in sexOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
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
