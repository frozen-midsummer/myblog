import request from "@/utils/request";

export function login(data) {
  return request({
    url: "/token/login",
    method: "post",
    data,
  });
}

export function validateToken(data) {
  return request({
    url: "/token/validateToken",
    method: "post",
    data,
  });
}
