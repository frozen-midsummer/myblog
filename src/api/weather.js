import request from "@/utils/request";

export function getAllProvince() {
  return request({
    url: "/weather/getAllProvince",
    method: "get",
    withoutToken: true,
  });
}

export function getCityByProvince(params) {
  return request({
    url: "/weather/getCityByProvince",
    method: "get",
    params,
    withoutToken: true,
  });
}

export function getCountyByCity(params) {
  return request({
    url: "/weather/getCountyByCity",
    method: "get",
    params,
    withoutToken: true,
  });
}

export function getWeatherInfo(params) {
  return request({
    url: "https://restapi.amap.com/v3/weather/weatherInfo",
    method: "get",
    params,
    withoutToken: true,
  });
}
