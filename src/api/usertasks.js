import request from "@/utils/request";

export function findTasks(data) {
  return request({
    url: "/userdata/tasks",
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
