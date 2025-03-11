import request from "@/utils/request";

export function register(data) {
  return request({
    url: "/userInfo/register",
    method: "post",
    data,
    withoutToken: true,
  });
}

export function modify(data) {
  return request({
    url: "/userInfo/modify",
    method: "post",
    data,
  });
}

export function getByUsername(params) {
  return request({
    url: "/userInfo/getUserInfo",
    method: "post",
    params,
  });
}
