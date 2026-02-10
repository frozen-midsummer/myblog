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
    url: "/weather/weatherInfo",
    method: "get",
    params,
    withoutToken: true,
  });
}

export function getIpLocation() {
  return request({
    url: "/weather/getIpLocation",
    method: "get",
    withoutToken: true,
  });
}
