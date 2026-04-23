#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <WebServer.h>
#include <HTTPClient.h>


// Forward declaration for MQTT callback
void messageHandler(char* topic, byte* payload, unsigned int length);

// ─── CAMERA PINS (AI THINKER) ────────────────────────────────────────────────────────
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ─── CONFIGURATION ──────────────────────────────────────────────────────────
const char* WIFI_SSID     = "Hm";
const char* WIFI_PASSWORD = "7novemberrr";

// AWS IoT Core Config
const char* AWS_IOT_ENDPOINT = "a12i78alo13mj4-ats.iot.eu-north-1.amazonaws.com";
const char* AWS_IOT_TOPIC_TRIGGER = "mycotrack/esp32_cam_001/trigger";

// EC2 Backend Config
const char* EC2_UPLOAD_URL = "http://16.170.250.107:8001/iot-upload";

// ─── CERTIFICATES ───────────────────────────────────────────────────────────
// REPLACE THESE WITH YOUR AWS IOT DEVICE CERTS
const char AWS_CERT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
)EOF";

const char AWS_CERT_CRT[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUaDoK5QY2bpXwwNcnBFNslEeUMN8wDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI2MDQyMzAwMjk1
NFoXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAO6zB9yzVK0pAn6bloAP
n4MysGgYzjagF0UqJ1u8LE+7TPW6Uc2gcqiP3vJKjCIYTH8OlfTldO0Cig7JGdmF
IQVU1ijf3hIAcZQU7fubFKDaFior0wAnuC2kTI5LbifNziyRWTfAiAHt3xCC959J
4PJQ442Kx3aR4F6IU0JcqtDIQXNLYvyieYUm5Apebme0ybk5A4Ou8zHGlYP1k95B
7+jMFhY6N1EulrFsjK++DOri1lAx7A9NJqYMAUl/2y/n2zGGA2UI6mEO7ZMvDE2E
Lv31kGYfX7uzPSvQGE3xy1bYuIEWlFJDCdu798+Uq8vQBXhrW8Qo5Wcj3tQ6YiSd
YbsCAwEAAaNgMF4wHwYDVR0jBBgwFoAUUk02IGFmBF78aEoqkq7GC/MeNYMwHQYD
VR0OBBYEFB14TivdYC+Pm+ZDxCZLpVLKA6gzMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQAYKdgK+A6ZHOdFnw464J5lA95K
BlqpojxNG50qoU/TofOigfxtNBNg8JU0W5YyJ0WAdW7hPeUVVPjqXldAliXn9kd9
Vu2mU7er1OHgH9NlLhvrAzyuQFw6zMuxjZ8oiLii66O5qOsFTaBCYlzY1i/X4AwY
dsIdfepCZoWtvTi1/W20HipAd3lEY+XBnFRLSFZqADsgB8oJltYBaPgAk6EUEUdC
VgnX7q5bH+9FVUJoiiWb5r4himm7c6sBNbeLf79/9DT8/isq9iUpv9HEd6E6aJ9S
8CrVlmcrs3c9m5JNnnaIbqXoxYy+kN9mOkJrQf9lJlSydmcsHO+htoBlzGum
-----END CERTIFICATE-----
)EOF";

const char AWS_CERT_PRIVATE[] PROGMEM = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA7rMH3LNUrSkCfpuWgA+fgzKwaBjONqAXRSonW7wsT7tM9bpR
zaByqI/e8kqMIhhMfw6V9OV07QKKDskZ2YUhBVTWKN/eEgBxlBTt+5sUoNoWKivT
ACe4LaRMjktuJ83OLJFZN8CIAe3fEIL3n0ng8lDjjYrHdpHgXohTQlyq0MhBc0ti
/KJ5hSbkCl5uZ7TJuTkDg67zMcaVg/WT3kHv6MwWFjo3US6WsWyMr74M6uLWUDHs
D00mpgwBSX/bL+fbMYYDZQjqYQ7tky8MTYQu/fWQZh9fu7M9K9AYTfHLVti4gRaU
UkMJ27v3z5Sry9AFeGtbxCjlZyPe1DpiJJ1huwIDAQABAoIBAQDhNlWyrBi2kDzk
S9RB23u7A7ZhYRYfgAi0n0MnUHHWgHfqWPMZucq0s5m8rQ1uldKHBrIBsAUUIhM0
RBV5oBw5tYOiaSZTgcun1d98RyO9aEcFXvfj65XgqmX4076JG6rtbe3ppmQsvcx6
/ba4ubHdrugkAc6UVqqFRsaXlGsuNBDkc83aB+DykmOSIB5EqLniUt55/ALhvI60
2Ialh2DCKnZnn/RlnQ3/k+Lyy9xCU5JAgkc5Q+QHQF8hxZ7b9Lz8Frd15YJ7rLsz
YKSanLrAGYA7Xtu/nFVEqeKMaDgf9CyHPrcs0iSZvxGglz5SrocRNB8RRmtXCcsN
zPxPUzXhAoGBAPeg9yd5wW4f3Vw4gIzS/yxKZgPdvR7Iaj1H7LSpY2U/cgzaSvZw
y24Vha4SOUFW2/VoS8UkJrNiS2SwDuLRwSCpfTdY3Fw5kPDRK38Bp8opu5dcccN1
FbdkfMXIqP3o6SijYDUDJatq1SH+er6UoAnXqarri5S3ZAxdukxn8szZAoGBAPbE
ybgt29cpfXjMHP3SUYvMyQJkyzLoGa29GhJxwxVMpCIunlSii2b035jtEEeZSzaB
r4UoZPxKHkSSVW+QQbOlp2xiKyVlaB2YyYhMU85GPGfj1T5I8zPqhR1aH+d4VaOC
WfaQ5U5Lhq3wy15GMiuBYLyGFmk7O8Kh/OrRuZazAoGAalCAbEFY65fgqNxVTKC2
D2TtwZEsxg+TlTXRCYuD8g84Pw5lisLIhD3XQ/HtBQFutEEP7tbjiraT2enAql8V
xJkf+mg7S5kngky7mO60BBbAxG5bJWiaZz9MVnodG84odFsYTgpI3Pyj/tFMD5Ct
2SvvW0N/jNzjpm+DMZSbaJkCgYEAlebW7uYUrLCMgsvjNKEFXlopJSYbdbIenzbH
Vrr6mb6z2fvdvGX9Lq7EAT7I6+WIFfVTrRzrs4JGvrrx4VKNRtbzTFiaAx6Fz6zX
h89t/VkXKrjw+eQQsNHeyQTNaqvjwe7WPXypfxVMG++xanRT16/BFuSRSp1r4QDM
Bc0e4xcCgYACeJa4Bj7QgCfLeWSUlKm9lKPoms9/WjqsOrSpIeIUe7kXRHlvDyLV
6lMDSvTz7xA93KNPpdOV7nwI89f7eTEEzI6t43Z7N3UobV78MpWaQzzisuhIpdMy
kS9Xdq83Jn/j+aYRNMho3a88i6iSvDMYHr5xKuCfoLDc65rutd8K1g==
-----END RSA PRIVATE KEY-----
)EOF";

WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);
WebServer server(80);

void handleCapture() {
  Serial.println("Web request: Capturing photo...");
  camera_fb_t * fb = esp_camera_fb_get();
  if(!fb) {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }
  
  server.setContentLength(fb->len);
  server.send(200, "image/jpeg", "");
  server.sendContent((char *)fb->buf, fb->len);
  
  esp_camera_fb_return(fb);
}

void handleRoot() {
  String html = "<h1>MycoTrack ESP32-CAM</h1>";
  html += "<p>MQTT Status: " + String(mqttClient.connected() ? "Connected" : "Disconnected") + "</p>";
  html += "<p>IP Address: " + WiFi.localIP().toString() + "</p>";
  html += "<a href='/capture' target='_blank'>[ VIEW LIVE PHOTO ]</a><br><br>";
  html += "<small>Trigger MQTT topic <b>mycotrack/esp32_cam_001/trigger</b> to send to EC2</small>";
  server.send(200, "text/html", html);
}

void connectToWiFi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void connectToAWS() {
  secureClient.setCACert(AWS_CERT_CA);
  secureClient.setCertificate(AWS_CERT_CRT);
  secureClient.setPrivateKey(AWS_CERT_PRIVATE);

  mqttClient.setServer(AWS_IOT_ENDPOINT, 8883);
  mqttClient.setCallback(messageHandler);

  Serial.print("Connecting to AWS IoT");
  while (!mqttClient.connect("ESP32_CAM_001")) {
    Serial.print(".");
    delay(1000);
  }

  Serial.println("\nConnected to AWS IoT!");
  mqttClient.subscribe(AWS_IOT_TOPIC_TRIGGER);
}

void initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode    = CAMERA_GRAB_LATEST;
  
  if(psramFound()){
    Serial.println("PSRAM found — using VGA with high quality");
    config.frame_size   = FRAMESIZE_VGA;  // 640x480 — reliable
    config.jpeg_quality = 10;
    config.fb_count     = 2;
    config.fb_location  = CAMERA_FB_IN_PSRAM;
  } else {
    Serial.println("WARNING: No PSRAM! Enable PSRAM in Arduino IDE: Tools > PSRAM > Enabled");
    config.frame_size   = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count     = 1;
    config.fb_location  = CAMERA_FB_IN_DRAM;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init FAILED: 0x%x\n", err);
    Serial.println("Check: PSRAM enabled? Camera ribbon cable seated properly?");
    return;
  }
  Serial.println("Camera init OK");

  // Warm-up: discard first frame (often garbage)
  camera_fb_t *fb = esp_camera_fb_get();
  if (fb) {
    Serial.printf("Warm-up frame: %u bytes\n", fb->len);
    esp_camera_fb_return(fb);
  }
}

void uploadImageToEC2(camera_fb_t *fb) {
  HTTPClient http;
  WiFiClient client;

  http.begin(client, EC2_UPLOAD_URL);
  http.setTimeout(15000); // 15s timeout for large images

  // Build the complete multipart body in a single buffer
  String head = "--ESP32Boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"esp32_cam.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--ESP32Boundary--\r\n";

  uint32_t totalLen = head.length() + fb->len + tail.length();

  // Allocate buffer in PSRAM (External 4MB on AI-Thinker) if available, else use DRAM
  uint8_t *body = NULL;
  if(psramFound()){
    body = (uint8_t *)ps_malloc(totalLen);
    if(body) Serial.println("Using PSRAM for upload buffer");
  }
  
  if (!body) {
    body = (uint8_t *)malloc(totalLen);
    if(body) Serial.println("Using DRAM for upload buffer (PSRAM not found or full)");
  }

  if (!body) {
    Serial.println("CRITICAL: Failed to allocate upload buffer!");
    return; 
  }

  // Copy head + image + tail into body
  memcpy(body, head.c_str(), head.length());
  memcpy(body + head.length(), fb->buf, fb->len);
  memcpy(body + head.length() + fb->len, tail.c_str(), tail.length());

  http.addHeader("Content-Type", "multipart/form-data; boundary=ESP32Boundary");

  int httpResponseCode = http.POST(body, totalLen);
  Serial.printf("EC2 Upload Response Code: %d\n", httpResponseCode);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
  } else {
    Serial.printf("Upload error: %s\n", http.errorToString(httpResponseCode).c_str());
  }

  free(body);
  http.end();
}

void messageHandler(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);
  
  Serial.println("Capturing photo...");
  
  // Retry up to 3 times with a short delay
  camera_fb_t * fb = NULL;
  for (int attempt = 1; attempt <= 3; attempt++) {
    fb = esp_camera_fb_get();
    if (fb) {
      Serial.printf("Capture OK on attempt %d — %u bytes\n", attempt, fb->len);
      break;
    }
    Serial.printf("Capture failed (attempt %d/3), retrying...\n", attempt);
    delay(500);
  }
  
  if (!fb) {
    Serial.println("Camera capture FAILED after 3 attempts");
    return;
  }
  
  uploadImageToEC2(fb);
  esp_camera_fb_return(fb);
}

void setup() {
  Serial.begin(115200);
  initCamera();
  connectToWiFi();
  connectToAWS();

  server.on("/", handleRoot);
  server.on("/capture", handleCapture);
  server.begin();
  Serial.println("Web Server started!");
}

void loop() {
  if (!mqttClient.connected()) {
    connectToAWS();
  }
  mqttClient.loop();
  server.handleClient();
  delay(10);
}
