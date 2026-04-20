const API_URL = "http://16.170.250.107:8001";

export const predictMushroom = async (imageUri) => {
  const formData = new FormData();

  formData.append("file", {
    uri: imageUri,
    name: "image.jpg",
    type: "image/jpeg",
  });

  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return await response.json();
};