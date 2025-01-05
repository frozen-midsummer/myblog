<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { MapLocation, Clock } from '@element-plus/icons-vue'
import { getAllProvince, getCityByProvince, getCountyByCity, getWeatherInfo } from '@/api/weather'
const cityCode = ref('')
const location = ref('天气定位')
const reportTime = ref('报告时间')
const props = {
    lazy: true,
    emitPath: false,
    async lazyLoad(node, resolve) {
        const { level } = node
        if (level === 0) {
            const response = await getAllProvince();
            const nodes = response.result.map((item) => ({
                value: item.adCode,
                label: item.name,
                leaf: item.adCode === '710000',
            }))
            resolve(nodes)
        } else if (level === 1) {
            const response = await getCityByProvince({ adCode: node.data.value.substring(0, 2) })
            const nodes = response.result.map((item) => ({
                value: item.adCode,
                label: item.name,
                leaf: item.adCode.substring(4, 6) !== '00',
            }))
            resolve(nodes)
        } else if (level === 2) {
            const response = await getCountyByCity({ adCode: node.data.value.substring(0, 4) })
            const nodes = response.result.map((item) => ({
                value: item.adCode,
                label: item.name,
                leaf: true,
            }))
            resolve(nodes)
        }
    },
}
const weatherData = ref([])
//杭州城市代码
async function queryWeather() {
    const response = await getWeatherInfo({
        city: cityCode.value,
        extensions: 'all',
        key: '0affb83a73e4ee58a53273155355e6ea'
    })
    const result = response.forecasts.find(forecast => forecast.adcode === cityCode.value)
    weatherData.value = result.casts
    location.value = result.province + result.city
    reportTime.value = result.reporttime
}
</script>

<template>
    <div>
        <el-row>
            <el-cascader v-model="cityCode" :props="props" />
            <el-button @click="queryWeather">获取天气</el-button>
        </el-row>
        <el-row>
            <el-col span="2">
                <el-icon class="el-icon--left">
                    <map-location />
                </el-icon>
            </el-col>
            <el-col span="3">
                {{ location }}
            </el-col>
            <el-col span="2">
                <el-icon class="el-icon--left">
                    <clock />
                </el-icon>
            </el-col>
            <el-col span="3">
                {{ reportTime }}
            </el-col>
        </el-row>
        <el-row style="max-width:890px">
            <el-table :data="weatherData" :max-height="500">
                <el-table-column prop="date" label="日期" :width="100" />
                <el-table-column prop="week" label="星期X" :width="70" />
                <el-table-column prop="dayweather" label="白天天气现象" :width="120" />
                <el-table-column prop="nightweather" label="晚上天气现象" :width="120" />
                <el-table-column prop="daytemp_float" label="白天温度" :width="80" />
                <el-table-column prop="nighttemp_float" label="晚上温度" :width="80" />
                <el-table-column prop="daywind" label="白天风向" :width="80" />
                <el-table-column prop="nightwind" label="晚上风向" :width="80" />
                <el-table-column prop="daypower" label="白天风力" :width="80" />
                <el-table-column prop="nightpower" label="晚上风力" :width="80" />
            </el-table>
        </el-row>
    </div>
</template>

<style scoped>
.el-row {
    margin-bottom: 20px;
}

.el-row:last-child {
    margin-bottom: 0;
}
</style>