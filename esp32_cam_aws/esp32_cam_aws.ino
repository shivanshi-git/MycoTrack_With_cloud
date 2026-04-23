#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <HTTPClient.h>

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
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// AWS IoT Core Config
const char* AWS_IOT_ENDPOINT = "a12i78alo13mj4-ats.iot.eu-north-1.amazonaws.com";
const char* AWS_IOT_TOPIC_TRIGGER = "mycotrack/esp32_cam_001/trigger";

// EC2 Backend Config
const char* EC2_UPLOAD_URL = "http://16.170.250.107:8001/iot-upload";

// ─── CERTIFICATES ───────────────────────────────────────────────────────────
// REPLACE THESE WITH YOUR AWS IOT DEVICE CERTS
const char AWS_CERT_CA[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
)EOF";

const char AWS_CERT_CRT[] PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
)EOF";

const char AWS_CERT_PRIVATE[] PROGMEM = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
)EOF";

WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);

void connectToWiFi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi");
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
  
  if(psramFound()){
    config.frame_size = FRAMESIZE_UXGA; // 1600x1200
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
  }
}

void uploadImageToEC2(camera_fb_t *fb) {
  HTTPClient http;
  
  // Use WiFiClient for standard HTTP (not secureClient since EC2 is http://)
  WiFiClient client;
  http.begin(client, EC2_UPLOAD_URL);
  
  String head = "--ESP32Boundary\r\nContent-Disposition: form-data; name=\"file\"; filename=\"esp32_cam.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
  String tail = "\r\n--ESP32Boundary--\r\n";
  
  uint32_t totalLen = head.length() + fb->len + tail.length();
  
  http.addHeader("Content-Type", "multipart/form-data; boundary=ESP32Boundary");
  http.addHeader("Content-Length", String(totalLen));
  
  // Start stream
  int streamResult = http.sendRequest("POST", (uint8_t*)head.c_str(), head.length());
  
  // Stream body (the image)
  WiFiClient* stream = http.getStreamPtr();
  stream->write(fb->buf, fb->len);
  
  // Stream tail
  stream->write((uint8_t*)tail.c_str(), tail.length());
  
  int httpResponseCode = http.GET(); // GET the response after streaming POST
  Serial.printf("EC2 Upload Response Code: %d\n", httpResponseCode);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
  } else {
    Serial.printf("Error occurred: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  
  http.end();
}

void messageHandler(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);
  
  // We don't really care about payload contents for a simple trigger, just the event
  Serial.println("Capturing photo...");
  camera_fb_t * fb = esp_camera_fb_get();
  if(!fb) {
    Serial.println("Camera capture failed");
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
}

void loop() {
  if (!mqttClient.connected()) {
    connectToAWS();
  }
  mqttClient.loop();
  delay(10);
}
