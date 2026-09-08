/*
  ==============================================================================
  PROJECT: AROGYAVAHINI – SMART EMERGENCY AMBULANCE MANAGEMENT & TRAFFIC PRIORITY
  MODULE:  Arduino Uno Traffic Signal Prototype (Stand-Alone Hardware Controller)
  TARGET:  Arduino Uno / Nano / Mega (ATmega328P)
  ==============================================================================

  CIRCUIT PIN CONNECTIONS:
  ------------------------------------------------------------------------------
  1. RED LED:    Pin 10  --> 220-Ohm Resistor --> Anode (+), Cathode (-) --> GND
  2. YELLOW LED: Pin 9   --> 220-Ohm Resistor --> Anode (+), Cathode (-) --> GND
  3. GREEN LED:  Pin 8   --> 220-Ohm Resistor --> Anode (+), Cathode (-) --> GND
  4. EMERGENCY BUTTON: Pin 2 (Active-LOW, uses internal pull-up) --> Pushbutton --> GND
  5. BUZZER (Optional): Pin 11 --> Piezo Buzzer (+) --> GND

  HOW IT WORKS:
  ------------------------------------------------------------------------------
  1. NORMAL MODE (Automatic Cyclical Sequence):
     - Green LED ON  for 5 seconds (traffic moves)
     - Yellow LED ON for 2 seconds (caution / transition)
     - Red LED ON    for 5 seconds (traffic stops)

  2. EMERGENCY PRIORITY MODE:
     Activated via either:
     a) Serial Command from Computer/Raspberry Pi: sends "PRIORITY_ON" or "1"
     b) Physical Pushbutton pressed on Pin 2 (Simulating RF/IR ambulance trigger)
     
     Behavior:
     - Immediately halts normal cycle
     - If Red was ON, safely flashes Yellow for 1 second
     - Turns GREEN LED ON continuously for ambulance corridor
     - RED and YELLOW LEDs stay strictly OFF
     - Optional siren buzzer beeps
     - Resumes normal cycle upon command "PRIORITY_OFF" or timeout (25 seconds)

  SERIAL BAUD RATE: 9600 bps
  ==============================================================================
*/

// --- Pin Definitions ---
const int PIN_RED_LED       = 10;
const int PIN_YELLOW_LED    = 9;
const int PIN_GREEN_LED     = 8;
const int PIN_EMERGENCY_BTN = 2;   // External trigger button (interrupt-capable)
const int PIN_BUZZER        = 11;  // Siren indicator

// --- Timing Constants (in milliseconds) ---
const unsigned long TIME_GREEN_NORMAL  = 5000;  // 5 seconds
const unsigned long TIME_YELLOW_NORMAL = 2000;  // 2 seconds
const unsigned long TIME_RED_NORMAL    = 5000;  // 5 seconds
const unsigned long PRIORITY_TIMEOUT   = 25000; // 25 seconds auto-fallback

// --- State Machine Enums ---
enum TrafficState {
  STATE_GREEN,
  STATE_YELLOW,
  STATE_RED,
  STATE_EMERGENCY_PRIORITY
};

TrafficState currentState = STATE_GREEN;
TrafficState stateBeforePriority = STATE_GREEN;

unsigned long stateStartTime = 0;
unsigned long priorityStartTime = 0;
bool isEmergencyActive = false;

// --- Helper Functions to Control LEDs ---
void turnAllOff() {
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_YELLOW_LED, LOW);
  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);
}

void setSignalState(bool red, bool yellow, bool green, bool buzzer = false) {
  digitalWrite(PIN_RED_LED, red ? HIGH : LOW);
  digitalWrite(PIN_YELLOW_LED, yellow ? HIGH : LOW);
  digitalWrite(PIN_GREEN_LED, green ? HIGH : LOW);
  digitalWrite(PIN_BUZZER, buzzer ? HIGH : LOW);
}

// --- Activate Emergency Green Corridor ---
void activateEmergencyPriority(const char* reason) {
  if (isEmergencyActive) return; // Already in priority mode

  Serial.println(F("[AROGYAVAHINI] *** EMERGENCY PRIORITY ACTIVATED ***"));
  Serial.print(F("Reason: "));
  Serial.println(reason);

  isEmergencyActive = true;
  stateBeforePriority = currentState;
  currentState = STATE_EMERGENCY_PRIORITY;
  priorityStartTime = millis();

  // If currently RED, provide a quick 1-second cautionary amber before green
  if (digitalRead(PIN_RED_LED) == HIGH) {
    setSignalState(false, true, false, true);
    delay(1000);
  }

  // Turn GREEN for incoming ambulance corridor
  setSignalState(false, false, true, true);
  Serial.println(F("[SIGNAL STATUS] Green Light ACTIVE for Emergency Corridor"));
}

// --- Deactivate Priority and Restore Normal Operation ---
void restoreNormalOperation() {
  if (!isEmergencyActive) return;

  Serial.println(F("[AROGYAVAHINI] Emergency vehicle passed. Restoring normal traffic cycle."));
  
  // Transition safely with amber
  setSignalState(false, true, false, false);
  delay(1500);

  isEmergencyActive = false;
  currentState = STATE_RED; // Safely restart from RED to let cross traffic pass
  stateStartTime = millis();
  setSignalState(true, false, false, false);
}

void setup() {
  // Initialize Serial Monitor
  Serial.begin(9600);
  while (!Serial && millis() < 1000) { /* wait for serial port */ }

  Serial.println(F("=================================================="));
  Serial.println(F(" Arogyavahini - Smart Traffic Signal (Arduino Uno)"));
  Serial.println(F("=================================================="));

  // Configure output pins
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_YELLOW_LED, OUTPUT);
  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Configure input with pull-up resistor (LOW when pressed)
  pinMode(PIN_EMERGENCY_BTN, INPUT_PULLUP);

  // Initial State: Start with Green
  turnAllOff();
  currentState = STATE_GREEN;
  setSignalState(false, false, true, false);
  stateStartTime = millis();

  Serial.println(F("System Ready. Commands: '1' or 'PRIORITY_ON' to trigger priority, '0' or 'PRIORITY_OFF' to cancel."));
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Read Serial Commands (from Node.js backend or Serial Monitor)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.equalsIgnoreCase("PRIORITY_ON") || cmd.equalsIgnoreCase("1") || cmd.equalsIgnoreCase("AMBULANCE_APPROACH")) {
      activateEmergencyPriority("Serial Command from Backend");
    } else if (cmd.equalsIgnoreCase("PRIORITY_OFF") || cmd.equalsIgnoreCase("0") || cmd.equalsIgnoreCase("AMBULANCE_PASSED")) {
      restoreNormalOperation();
    } else if (cmd.equalsIgnoreCase("STATUS")) {
      Serial.print(F("Current Mode: "));
      Serial.println(isEmergencyActive ? F("EMERGENCY_PRIORITY (GREEN)") : F("NORMAL_CYCLE"));
    }
  }

  // 2. Check Physical Hardware Pushbutton (Emergency override)
  if (digitalRead(PIN_EMERGENCY_BTN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(PIN_EMERGENCY_BTN) == LOW) {
      if (!isEmergencyActive) {
        activateEmergencyPriority("Physical Pushbutton Trigger");
      } else {
        restoreNormalOperation();
      }
      while (digitalRead(PIN_EMERGENCY_BTN) == LOW) { /* wait for release */ }
      delay(200);
    }
  }

  // 3. State Machine Engine
  if (isEmergencyActive) {
    // Keep green light ON & pulse buzzer intermittently
    int buzzerTone = ((currentMillis / 500) % 2 == 0) ? HIGH : LOW;
    digitalWrite(PIN_BUZZER, buzzerTone);

    // Auto-timeout safeguard: prevent junction from getting stuck on priority forever
    if (currentMillis - priorityStartTime >= PRIORITY_TIMEOUT) {
      Serial.println(F("[SAFETY WARNING] Priority duration expired (25s). Auto-restoring normal mode."));
      restoreNormalOperation();
    }
  } else {
    // Normal Automated Cyclical State Machine (Non-blocking)
    switch (currentState) {
      case STATE_GREEN:
        setSignalState(false, false, true, false);
        if (currentMillis - stateStartTime >= TIME_GREEN_NORMAL) {
          currentState = STATE_YELLOW;
          stateStartTime = currentMillis;
          Serial.println(F("[CYCLE] Switching to YELLOW (Caution)"));
        }
        break;

      case STATE_YELLOW:
        setSignalState(false, true, false, false);
        if (currentMillis - stateStartTime >= TIME_YELLOW_NORMAL) {
          currentState = STATE_RED;
          stateStartTime = currentMillis;
          Serial.println(F("[CYCLE] Switching to RED (Stop)"));
        }
        break;

      case STATE_RED:
        setSignalState(true, false, false, false);
        if (currentMillis - stateStartTime >= TIME_RED_NORMAL) {
          currentState = STATE_GREEN;
          stateStartTime = currentMillis;
          Serial.println(F("[CYCLE] Switching to GREEN (Go)"));
        }
        break;

      default:
        currentState = STATE_GREEN;
        stateStartTime = currentMillis;
        break;
    }
  }
}
