<script setup>
import { ref } from 'vue'
import { getAllProvince, getCityByProvince, getCountyByCity } from '@/api/weather'
const cityCode = ref('')
// 获取级联选择器实例
const cascaderRef = ref(null);
const emit = defineEmits(['onChanged'])
defineProps({
    placeholder: String,
})
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
const handleChange = (value) => {
    emit('onChanged', value, cascaderRef.value.cascaderPanelRef.checkedNodes[0].pathLabels)
};
</script>

<template>
    <div>
        <el-cascader v-model="cityCode" :props="props" @change="handleChange" ref="cascaderRef"
            :placeholder="placeholder" />
    </div>
</template>