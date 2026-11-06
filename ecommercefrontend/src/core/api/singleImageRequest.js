export default function singleImageRequest(data, file) {
  if (!file) return data;
  const body = new FormData();
  body.append("request", new Blob([JSON.stringify(data)], { type: "application/json" }));
  body.append("file", file);
  return body;
}
