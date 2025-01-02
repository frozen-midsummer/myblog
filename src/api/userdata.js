import request from "@/utils/request";

export function getTaskById(data) {
  return request({
    url: "/userdata/getTaskById",
    method: "post",
    data,
  });
}

export function getTasks(data) {
  return request({
    url: "/userdata/getTasks",
    method: "post",
    data,
  });
}

export function insertTask(data) {
  return request({
    url: "/userdata/insertTask",
    method: "post",
    data,
  });
}

export function deleteTask(data) {
  return request({
    url: "/userdata/deleteTask",
    method: "post",
    data,
  });
}

export function modifyTask(data) {
  return request({
    url: "/userdata/modifyTask",
    method: "post",
    data,
  });
}
