import request from "@/utils/request";

export function getTaskById(data) {
  return request({
    url: "/userTask/getTaskById",
    method: "post",
    data,
  });
}

export function getTasks(data) {
  return request({
    url: "/userTask/getTasks",
    method: "post",
    data,
  });
}

export function insertTask(data) {
  return request({
    url: "/userTask/insertTask",
    method: "post",
    data,
  });
}

export function deleteTask(data) {
  return request({
    url: "/userTask/deleteTask",
    method: "post",
    data,
  });
}

export function modifyTask(data) {
  return request({
    url: "/userTask/modifyTask",
    method: "post",
    data,
  });
}
