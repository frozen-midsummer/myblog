<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { MapLocation } from '@element-plus/icons-vue'
let id = 0
const cityCode = ref('')
const props = {
    lazy: true,
    async lazyLoad(node, resolve) {
        const { level } = node
        if (level === 0) {
            console.log(node)
            const response = await axios.get('http://10.188.133.100:8080/weather/getAllProvince', {
                params: {}
            })
            const nodes = response.data.result.map((item) => ({
                value: item.adCode,
                label: item.name,
                leaf: false,
            }))
            resolve(nodes)
        } else if (level === 1) {
            console.log(node.data.value)
            const response = await axios.get('http://10.188.133.100:8080/weather/getCityByProvince', {
                params: { adCode: node.data.value.substring(0, 2) }
            })
            const nodes = response.data.result.map((item) => ({
                value: item.adCode,
                label: item.name,
                leaf: item.adCode.substring(4, 6) !== '00',
            }))
            resolve(nodes)
        } else if (level === 2) {
            console.log(cityCode.value)
            const response = await axios.get('http://10.188.133.100:8080/weather/getCountyByCity', {
                params: { adCode: node.data.value.substring(0, 4) }
            })
            const nodes = response.data.result.map((item) => ({
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
const cityAdcode = '330102'
async function queryWeather() {
    const response = await axios.get('https://restapi.amap.com/v3/weather/weatherInfo', {
        params: {
            city: cityAdcode,
            extensions: 'all',
            key: '0affb83a73e4ee58a53273155355e6ea'
        }
    })
    console.log(response)
    weatherData.value = response.data.forecasts.find(forecast => forecast.adcode === cityAdcode).casts
}
</script>

<template>
    <div>
        <div>
            <el-cascader v-model="cityCode" :props="props" />{{ cityCode }}
        </div>
        <div style="display:flex;align-items: center;">
            <el-icon style="font-size:large">
                <map-location />
            </el-icon>
            <span style="margin-left:0.5em;margin-right:2em">浙江省-杭州市-上城区</span>
            <el-button @click="queryWeather">获取天气</el-button>
        </div>
        <div style="max-width:890px">
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
        </div>
    </div>
</template>