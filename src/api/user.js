import request from "@/utils/request";

export function register(data) {
  return request({
    url: "/user/register",
    method: "post",
    data,
    withoutToken: true,
  });
}

export function modify(data) {
  return request({
    url: "/user/modify",
    method: "post",
    data,
  });
}

export function getByUsername(params) {
  return request({
    url: "/user/getByUsername",
    method: "get",
    params,
  });
}
