import request from "@/utils/request";

export function login(data) {
  return request({
    url: "/userInfo/login",
    method: "post",
    data,
    withoutToken: true,
  });
}

export function validateToken(data) {
  return request({
    url: "/userInfo/validateToken",
    method: "post",
    data,
  });
}
