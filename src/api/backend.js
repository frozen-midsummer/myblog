import request from "@/utils/request";

export function login(data) {
  return request({
    url: "/api/authenticate",
    method: "post",
    data,
  });
}

export function validateToken(data) {
  return request({
    url: "/api/validateToken",
    method: "post",
    data,
  });
}
