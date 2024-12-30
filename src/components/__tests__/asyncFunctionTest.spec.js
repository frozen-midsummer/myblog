const resolveAfter2Seconds = function () {
    console.log("starting slow promise");
    return new Promise(resolve => {
        setTimeout(function () {
            resolve("slow");
            console.log("slow promise function is done");
        }, 2000)
    })
};

const resolveAfter1Seconds = function () {
    console.log("starting fast promise");
    return new Promise(resolve => {
        setTimeout(function () {
            resolve("fast");
            console.log("fast promise function is done");
        }, 1000)
    })
};

const parallel = async function () {
    console.log("等待两个Promise函数执行完成...")
    await Promise.all([(async () => console.log(await resolveAfter2Seconds()))(), (async () => console.log(await resolveAfter1Seconds()))()])
}

const __main__ = async function () {
    await parallel();
    const promise = await resolveAfter1Seconds();
    console.log(promise);
}

__main__();
