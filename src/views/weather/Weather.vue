<script setup>
import { ref } from 'vue'
import { MapLocation, Clock, Location } from '@element-plus/icons-vue'
import { getWeatherInfo, getIpLocation } from '@/api/weather'
import ChinaCityCodeCascader from '@/components/ChinaCityCodeCascader.vue';
import { ElMessage } from 'element-plus'

const cityCode = ref('')
const location = ref('天气定位')
const reportTime = ref('报告时间')
const weatherData = ref([])
const loading = ref(false)

//杭州城市代码
async function queryWeather() {
    if (!cityCode.value) {
        ElMessage.warning('请先选择城市')
        return
    }
    loading.value = true
    try {
        const response = await getWeatherInfo({
            city: cityCode.value,
            extensions: 'all'
        })
        const result = response.result.forecasts.find(forecast => forecast.adcode === cityCode.value)
        if (result) {
            weatherData.value = result.casts
            location.value = result.province + result.city
            reportTime.value = result.reporttime
        } else {
            ElMessage.error('未获取到该城市的天气信息')
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('获取天气信息失败')
    } finally {
        loading.value = false
    }
}

async function autoLocation() {
    loading.value = true
    try {
        const response = await getIpLocation()
        if (response.result.status === '1' && response.result.adcode && typeof response.result.adcode === 'string') {
            cityCode.value = response.result.adcode
            ElMessage.success(`自动定位成功：${response.result.city || '未知城市'}`)
            await queryWeather()
            loading.value = false
        } else {
            console.warn('IP location failed or returned no adcode, trying browser geolocation...')
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        ElMessage.warning('无法通过 IP 识别精确城市，请手动选择')
                        loading.value = false
                    },
                    (error) => {
                        console.error('Geolocation error:', error)
                        ElMessage.error('自动定位失败，请手动选择城市')
                        loading.value = false
                    },
                    { timeout: 5000 }
                )
            } else {
                ElMessage.error('自动定位失败，请手动选择城市')
                loading.value = false
            }
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('自动定位服务不可用')
        loading.value = false
    }
}

const handleCitySelect = (cityCode1, pathLabels) => {
    cityCode.value = cityCode1
}
</script>

<template>
    <div v-loading="loading">
        <el-row :gutter="20">
            <el-col :xs="24" :sm="8" :md="6">
                <china-city-code-cascader v-model="cityCode" @on-changed="handleCitySelect"
                    style="width: 100%"></china-city-code-cascader>
            </el-col>
            <el-col :xs="24" :sm="16" :md="18" class="button-container">
                <el-button-group>
                    <el-button type="primary" :icon="Location" @click="autoLocation">自动定位</el-button>
                    <el-button type="success" @click="queryWeather">获取天气</el-button>
                </el-button-group>
            </el-col>
        </el-row>
        <el-row class="info-row">
            <el-col :span="24" class="info-content">
                <div class="info-item">
                    <el-icon><map-location /></el-icon>
                    <span>{{ location }}</span>
                </div>
                <div class="info-item">
                    <el-icon><clock /></el-icon>
                    <span>{{ reportTime }}</span>
                </div>
            </el-col>
        </el-row>
        <el-row class="table-row">
            <el-table :data="weatherData" border style="width: 100%">
                <el-table-column prop="date" label="日期" min-width="100" />
                <el-table-column prop="week" label="星期" min-width="70">
                    <template #default="scope">
                        星期{{ scope.row.week }}
                    </template>
                </el-table-column>
                <el-table-column label="白/晚天气" min-width="150">
                    <template #default="scope">
                        {{ scope.row.dayweather }} / {{ scope.row.nightweather }}
                    </template>
                </el-table-column>
                <el-table-column label="温度" min-width="100">
                    <template #default="scope">
                        {{ scope.row.daytemp_float }}℃ / {{ scope.row.nighttemp_float }}℃
                    </template>
                </el-table-column>
                <el-table-column label="风力风向" min-width="150" class-name="hidden-xs-only">
                    <template #default="scope">
                        {{ scope.row.daywind }}{{ scope.row.daypower }}级
                    </template>
                </el-table-column>
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

.button-container {
    display: flex;
    align-items: center;
}

.info-row {
    background-color: var(--bg-color-mute);
    padding: 10px 15px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
}

.info-content {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--text-color-secondary);
}

.info-item .el-icon {
    font-size: 18px;
    color: #409eff;
}

.table-row {
    margin-top: 10px;
}

@media (max-width: 768px) {
    .button-container {
        margin-top: 10px;
        justify-content: flex-start;
    }
    
    .info-content {
        gap: 10px;
    }
    
    .info-item {
        width: 100%;
    }
}
</style>