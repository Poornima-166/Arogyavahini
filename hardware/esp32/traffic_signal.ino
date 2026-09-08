/*
  ==============================================================================
  PROJECT: AROGYAVAHINI – SMART EMERGENCY AMBULANCE MANAGEMENT & TRAFFIC SIGNAL PRIORITY
  MODULE:  ESP32 Wi-Fi Traffic Signal Controller Firmware
  AUTHOR:  Final Year Engineering Capstone Project
  ==============================================================================
  
  SYSTEM OVERVIEW:
  This firmware runs on an ESP32 microcontroller connected to an IoT 2-way traffic
  intersection (Route A and Route B). The Node.js Express backend communicates with
  the ESP32 via Wi-Fi HTTP REST requests to grant an emergency green corridor
  whenever an ambulance approaches the intersection.

  HARDWARE PIN CONNECTIONS (Common Cathode LEDs to Ground via 220Ω Resistors):
  -----------------------------------------------------------------------------
  ROUTE A (Primary Emergency Arterial Corridor):
    - RED LED    --> ESP32 GPIO 25
    - YELLOW LED --> ESP32 GPIO 26
    - GREEN LED  --> ESP32 GPIO 27
  
  ROUTE B (Cross Traffic Corridor):
    - RED LED    --> ESP32 GPIO 14
    - YELLOW LED --> ESP32 GPIO 12
    - GREEN LED  --> ESP32 GPIO 13

  SUPPORTED HTTP COMMANDS (POST /traffic-command):
  -----------------------------------------------------------------------------
  1. "GREEN_ROUTE_A"   --> Priority for Route A (A=GREEN, B=RED)
  2. "GREEN_ROUTE_B"   --> Priority for Route B (B=GREEN, A=RED)
  3. "NORMAL_MODE"     --> Restores automated cyclical traffic light sequence
  4. "RESTORE_NORMAL"  --> Alias to safely exit emergency preemption
*/

#include <WiFi.h>
#include <WebServer.h>

// ============================================================================
// 1. NETWORK CREDENTIALS
// ============================================================================
// Replace with your local Wi-Fi Hotspot credentials or router details:
const char* WIFI_SSID     = "Arogyavahini_AP"; 
const char* WIFI_PASSWORD = "Emergency108";

// ============================================================================
// 2. PIN DEFINITIONS
// ============================================================================
// Route A Traffic Signal LEDs
#define A_RED     25
#define A_YELLOW  26
#define A_GREEN   27

// Route B Traffic Signal LEDs
#define B_RED     14
#define B_YELLOW  12
#define B_GREEN   13

// Onboard Status LED (optional debug indicator)
#define STATUS_LED 2

// ============================================================================
// 3. OPERATING MODES & STATE VARIABLES
// ============================================================================
enum TrafficMode {
  MODE_NORMAL_CYCLE,
  MODE_ROUTE_A_PRIORITY,
  MODE_ROUTE_B_PRIORITY
};

TrafficMode currentMode = MODE_NORMAL_CYCLE;
String currentModeString = "NORMAL_CYCLE";

// Non-blocking timer variables for normal cyclic operation
unsigned long previousMillis = 0;
int normalCycleStep = 0;

// Timing intervals in milliseconds
const unsigned long TIME_GREEN_MS  = 8000; // 8 seconds Green
const unsigned long TIME_YELLOW_MS = 2000; // 2 seconds Yellow transition

// Instantiate HTTP WebServer on standard port 80
WebServer server(80);

// ============================================================================
// 4. LOW-LEVEL LED CONTROL FUNCTIONS
// ============================================================================

// Turn OFF all traffic LEDs safely
void allLedsOff() {
  digitalWrite(A_RED, LOW);
  digitalWrite(A_YELLOW, LOW);
  digitalWrite(A_GREEN, LOW);

  digitalWrite(B_RED, LOW);
  digitalWrite(B_YELLOW, LOW);
  digitalWrite(B_GREEN, LOW);
}

// Safe interlock transition: Flash Yellow to alert oncoming traffic before switching
void safeYellowTransition() {
  allLedsOff();
  digitalWrite(A_YELLOW, HIGH);
  digitalWrite(B_YELLOW, HIGH);
  delay(1500); // 1.5s caution phase
  allLedsOff();
}

// Activate Route A Green corridor (Route B locked RED)
void activateRouteAGreen() {
  allLedsOff();
  digitalWrite(A_GREEN, HIGH);
  digitalWrite(B_RED, HIGH);
  
  currentMode = MODE_ROUTE_A_PRIORITY;
  currentModeString = "ROUTE_A_PRIORITY";
  Serial.println("[TRAFFIC PRIORITY] >>> ROUTE A GREEN ACTIVATED (Route B RED) <<<");
}

// Activate Route B Green corridor (Route A locked RED)
void activateRouteBGreen() {
  allLedsOff();
  digitalWrite(A_RED, HIGH);
  digitalWrite(B_GREEN, HIGH);
  
  currentMode = MODE_ROUTE_B_PRIORITY;
  currentModeString = "ROUTE_B_PRIORITY";
  Serial.println("[TRAFFIC PRIORITY] >>> ROUTE B GREEN ACTIVATED (Route A RED) <<<");
}

// ============================================================================
// 5. NON-BLOCKING NORMAL TRAFFIC LIGHT ENGINE
// ============================================================================
// In the absence of an emergency priority request, the intersection cycles safely:
// Step 0: Route A Green (8s), Route B Red
// Step 1: Route A Yellow (2s), Route B Red
// Step 2: Route B Green (8s), Route A Red
// Step 3: Route B Yellow (2s), Route A Red
void runNormalTrafficCycle() {
  if (currentMode != MODE_NORMAL_CYCLE) {
    return; // Emergency priority has preempted the normal cycle
  }

  unsigned long currentMillis = millis();

  switch (normalCycleStep) {
    case 0: // Route A GREEN, Route B RED
      allLedsOff();
      digitalWrite(A_GREEN, HIGH);
      digitalWrite(B_RED, HIGH);
      if (currentMillis - previousMillis >= TIME_GREEN_MS) {
        previousMillis = currentMillis;
        normalCycleStep = 1;
      }
      break;

    case 1: // Route A YELLOW, Route B RED
      allLedsOff();
      digitalWrite(A_YELLOW, HIGH);
      digitalWrite(B_RED, HIGH);
      if (currentMillis - previousMillis >= TIME_YELLOW_MS) {
        previousMillis = currentMillis;
        normalCycleStep = 2;
      }
      break;

    case 2: // Route B GREEN, Route A RED
      allLedsOff();
      digitalWrite(B_GREEN, HIGH);
      digitalWrite(A_RED, HIGH);
      if (currentMillis - previousMillis >= TIME_GREEN_MS) {
        previousMillis = currentMillis;
        normalCycleStep = 3;
      }
      break;

    case 3: // Route B YELLOW, Route A RED
      allLedsOff();
      digitalWrite(B_YELLOW, HIGH);
      digitalWrite(A_RED, HIGH);
      if (currentMillis - previousMillis >= TIME_YELLOW_MS) {
        previousMillis = currentMillis;
        normalCycleStep = 0; // Loop back to start
      }
      break;
  }
}

// ============================================================================
// 6. HTTP REST API HANDLERS
// ============================================================================

// POST /traffic-command
// Body: {"command": "GREEN_ROUTE_A"} or {"command": "GREEN_ROUTE_B"} or {"command": "NORMAL_MODE"}
void handleTrafficCommand() {
  // Enforce POST method
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed. Use HTTP POST.\"}");
    return;
  }

  String requestBody = server.arg("plain");
  Serial.print("[HTTP REST] Received Command Payload: ");
  Serial.println(requestBody);

  // Command 1: Emergency Priority for Route A / NORTH / EAST or JSON payload
  if (requestBody.indexOf("GREEN_ROUTE_A") >= 0 || (requestBody.indexOf("\"priority\":true") >= 0 && (requestBody.indexOf("NORTH") >= 0 || requestBody.indexOf("ROUTE_A") >= 0)) || (requestBody.indexOf("\"priority\": true") >= 0 && (requestBody.indexOf("NORTH") >= 0 || requestBody.indexOf("ROUTE_A") >= 0))) {
    safeYellowTransition();
    activateRouteAGreen();

    String responseJson = "{\"success\":true,\"status\":\"ROUTE_A_GREEN\",\"direction\":\"NORTH\",\"message\":\"Route A emergency corridor activated. Route B locked RED.\",\"timestamp\":" + String(millis()) + "}";
    server.send(200, "application/json", responseJson);
  }
  // Command 2: Emergency Priority for Route B / SOUTH / WEST
  else if (requestBody.indexOf("GREEN_ROUTE_B") >= 0 || (requestBody.indexOf("\"priority\":true") >= 0 && (requestBody.indexOf("SOUTH") >= 0 || requestBody.indexOf("ROUTE_B") >= 0)) || (requestBody.indexOf("\"priority\": true") >= 0 && (requestBody.indexOf("SOUTH") >= 0 || requestBody.indexOf("ROUTE_B") >= 0))) {
    safeYellowTransition();
    activateRouteBGreen();

    String responseJson = "{\"success\":true,\"status\":\"ROUTE_B_GREEN\",\"direction\":\"SOUTH\",\"message\":\"Route B emergency corridor activated. Route A locked RED.\",\"timestamp\":" + String(millis()) + "}";
    server.send(200, "application/json", responseJson);
  }
  // Command 3: Restore Normal Automatic Traffic Cycle
  else if (requestBody.indexOf("NORMAL_MODE") >= 0 || requestBody.indexOf("RESTORE_NORMAL") >= 0 || requestBody.indexOf("\"priority\":false") >= 0 || requestBody.indexOf("\"priority\": false") >= 0) {
    safeYellowTransition();
    currentMode = MODE_NORMAL_CYCLE;
    currentModeString = "NORMAL_CYCLE";
    normalCycleStep = 0;
    previousMillis = millis();

    Serial.println("[TRAFFIC RESTORE] >>> Normal Traffic Cycle Restored <<<");

    String responseJson = "{\"success\":true,\"status\":\"NORMAL_MODE\",\"message\":\"Emergency priority released. Normal traffic cycle resumed.\",\"timestamp\":" + String(millis()) + "}";
    server.send(200, "application/json", responseJson);
  }
  // Unknown Command
  else {
    server.send(400, "application/json", "{\"success\":false,\"error\":\"Unknown Command. Valid commands: GREEN_ROUTE_A, GREEN_ROUTE_B, NORMAL_MODE or JSON priority payload\"}");
  }
}

// GET /status
// Returns current operating mode, active LEDs, and Wi-Fi signal strength
void handleGetStatus() {
  String activeSignalA = "RED";
  if (digitalRead(A_GREEN) == HIGH) activeSignalA = "GREEN";
  else if (digitalRead(A_YELLOW) == HIGH) activeSignalA = "YELLOW";

  String activeSignalB = "RED";
  if (digitalRead(B_GREEN) == HIGH) activeSignalB = "GREEN";
  else if (digitalRead(B_YELLOW) == HIGH) activeSignalB = "YELLOW";

  String jsonResponse = "{";
  jsonResponse += "\"system\":\"Arogyavahini ESP32 Traffic Node\",";
  jsonResponse += "\"hardwareStatus\":\"ONLINE\",";
  jsonResponse += "\"currentMode\":\"" + currentModeString + "\",";
  jsonResponse += "\"routeA_Signal\":\"" + activeSignalA + "\",";
  jsonResponse += "\"routeB_Signal\":\"" + activeSignalB + "\",";
  jsonResponse += "\"ipAddress\":\"" + WiFi.localIP().toString() + "\",";
  jsonResponse += "\"wifiRSSI\":" + String(WiFi.RSSI()) + ",";
  jsonResponse += "\"uptimeMillis\":" + String(millis());
  jsonResponse += "}";

  server.send(200, "application/json", jsonResponse);
}

// Handle Root & Undefined Routes
void handleNotFound() {
  server.send(404, "application/json", "{\"error\":\"Endpoint not found on ESP32 Traffic Node\"}");
}

// ============================================================================
// 7. ARDUINO SETUP & INITIALIZATION
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("🚑 AROGYAVAHINI – ESP32 TRAFFIC SIGNAL PRIORITY 🚑");
  Serial.println("=================================================");

  // Configure LED pins as OUTPUT
  pinMode(A_RED, OUTPUT);
  pinMode(A_YELLOW, OUTPUT);
  pinMode(A_GREEN, OUTPUT);

  pinMode(B_RED, OUTPUT);
  pinMode(B_YELLOW, OUTPUT);
  pinMode(B_GREEN, OUTPUT);

  pinMode(STATUS_LED, OUTPUT);

  // Turn all LEDs off at boot
  allLedsOff();

  // Connect to Local Wi-Fi
  Serial.print("[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED, !digitalRead(STATUS_LED)); // Blink status LED while connecting
    retries++;
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED, HIGH); // Solid ON when connected
    Serial.println("✅ [Wi-Fi] Connected successfully!");
    Serial.print("📡 [ESP32 IP Address]: http://");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("⚠️ [Wi-Fi] Connection timed out. Running in standalone fallback mode.");
  }

  // Register WebServer REST Endpoints
  server.on("/traffic-command", HTTP_POST, handleTrafficCommand);
  server.on("/status", HTTP_GET, handleGetStatus);
  server.onNotFound(handleNotFound);

  // Start HTTP Server
  server.begin();
  Serial.println("🚀 [WebServer] Traffic priority REST endpoint active at /traffic-command");

  // Initialize previousMillis for normal cycle
  previousMillis = millis();
}

// ============================================================================
// 8. MAIN EXECUTION LOOP
// ============================================================================
void loop() {
  // 1. Process incoming HTTP client requests
  server.handleClient();

  // 2. Execute non-blocking normal traffic cycle when not in emergency priority
  runNormalTrafficCycle();

  // 3. Wi-Fi Auto-Reconnect Safeguard
  if (WiFi.status() != WL_CONNECTED && millis() % 10000 == 0) {
    Serial.println("⚠️ Reconnecting to Wi-Fi...");
    WiFi.reconnect();
  }
}
