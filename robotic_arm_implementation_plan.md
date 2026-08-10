# Robotic Arm Implementation Plan: MycoTrack Extension

This implementation plan maps the 19-stage robotic arm development lifecycle (from hardware setup and kinematics to AI vision and automated mushroom harvesting) into the existing **MycoTrack** ecosystem (Expo React Native mobile app, FastAPI PyTorch backend, ESP32 firmware, and AWS IoT Core).

---

## Technical Mapping of the 19-Step Workflow to MycoTrack

The diagram below illustrates how each task from your workflow maps to the software, hardware, and AI layers of MycoTrack:

```mermaid
graph TD
    subgraph Tasks 1-7: Hardware & Microcontroller Layer
        T1[1-3. Basics, Plan & Parts]
        T4[4. Soft Gripper Design]
        T6[6. Build Arm & Wire Servos]
        T7[7. Servo Limits & Calibration]
        ESP[ESP32 / RPi Firmware: arm_controller.ino / py]
    end

    subgraph Tasks 8-13: Math, Kinematics & AI Vision Backend
        T8[8. Forward Kinematics] --> IK[9. Inverse Kinematics Engine]
        T10[10. Camera Calibration] --> CAM[11-12. YOLOv8 Detection & Depth]
        CAM --> TRANS[13. Match Camera to Arm Coordinates]
        API[FastAPI Backend: backend/realtime_mushroom.py]
    end

    subgraph Tasks 14-16: Harvesting Trajectory & Motion Control
        T14[14-16. Gripper Attach, Harvest Sequence & Grip Test]
        PLANNER[6-Stage Motion Planner: Approach -> Align -> Grip -> Twist -> Lift -> Deposit]
    end

    subgraph Tasks 17-19: Full System Integration & Mobile UI
        T17[17-19. Integration, Testing & Demo]
        MQTT[AWS IoT Core MQTT Bridge]
        APP[MycoTrack React Native App: RoboticArmControl.js]
    end

    ESP <-->|MQTT: mycotrack/arm/telemetry & cmd| MQTT
    API <-->|REST / Kinematics API| APP
    APP <-->|AWS IoT Core MQTT| MQTT
    TRANS --> PLANNER
    PLANNER -->|Servo Angles Array| ESP
```

---

## Hardware & Safety Requirements

- **Power Supply**: 6DOF metallic arm requires 6 high-torque digital servos (e.g., MG996R / DS3218) powered by an external 5V–6V 10A DC power supply. Do not power servos directly from the ESP32/Raspberry Pi 5V header.
- **Servo Driver**: PCA9685 16-Channel PWM I2C servo driver module connected to ESP32 (`SDA: GPIO 21`, `SCL: GPIO 22`).
- **Emergency Stop (E-Stop)**: Hardware cut-off switch on the main servo power line + software MQTT E-Stop topic (`mycotrack/arm/estop`).

---

## Detailed System Changes by Layer

### Layer 1: Hardware Control & Microcontroller Firmware

#### `esp32_cam_aws/robotic_arm_firmware.ino`
- ESP32 sketch using `Adafruit_PWMServoDriver` library to control 6 servos via PCA9685 over I2C.
- Subscribes to AWS IoT MQTT topic `mycotrack/arm/control` to receive target joint angle vectors `[θ1, θ2, θ3, θ4, θ5, θ6]` and execution speeds.
- Implements servo pulse constraints and multi-axis smooth PWM interpolation to prevent sudden jerky movements.
- Publishes telemetry (`mycotrack/arm/status`) including current joint positions, grip state, and E-Stop status.

---

### Layer 2: AI Vision, Kinematics & Motion Planning Backend

#### `backend/kinematics.py`
- **Forward Kinematics (FK)**: Computes $(X, Y, Z, \text{roll}, \text{pitch}, \text{yaw})$ end-effector pose from 6 joint angles using Denavit-Hartenberg (DH) matrix multiplication.
- **Inverse Kinematics (IK)**: Solves target 3D spatial coordinate $(X, Y, Z)$ into required servo angles $(\theta_1, \dots, \theta_6)$ with joint angle clamping and singularity detection.
- **Coordinate Transformation Matrix**: Maps camera pixel $(u, v)$ + estimated distance $Z$ to robot base origin frame:
  $$\begin{bmatrix} X_a \\ Y_a \\ Z_a \\ 1 \end{bmatrix} = T_{camera \rightarrow arm} \cdot \begin{bmatrix} X_c \\ Y_c \\ Z_c \\ 1 \end{bmatrix}$$

#### `backend/yolov8_mushroom_pipeline.py`
- Update YOLOv8 detection pipeline to return bounding box center coordinates $(c_x, c_y)$, stem base orientation, and distance estimation $Z = \frac{f \cdot W}{w}$ (where $f$ is camera focal length, $W$ is estimated mushroom cap width in mm, and $w$ is bounding box width in pixels).

#### `backend/harvest_planner.py`
- Implements the **6-Stage Harvest Motion Strategy**:
  1. `Hover`: Move arm to $20\text{mm}$ directly above target mushroom.
  2. `Align`: Rotate wrist to match mushroom stem orientation.
  3. `Descend & Grip`: Lower gripper over stem and actuate soft fingers.
  4. `Twist & Pull`: Apply a $15^\circ$ twisting motion while lifting vertically (breaks mycelial attachment cleanly without damaging cap).
  5. `Retract`: Lift mushroom $100\text{mm}$ clear of bed.
  6. `Deposit`: Move to collection container and release gripper.

#### `backend/realtime_mushroom.py`
- Expose new FastAPI endpoints:
  - `POST /arm/solve-ik`: Solves IK for target coordinate $(x, y, z)$.
  - `POST /arm/plan-harvest`: Takes camera detection payload, calculates 3D bed coordinates, generates harvest trajectory, and publishes MQTT commands to AWS IoT.
  - `POST /arm/estop`: Instantly triggers emergency stop command.

---

### Layer 3: Services & AWS Cloud Integration

#### `services/api.js`
- Add frontend API methods:
  - `solveArmIK(jointTargets)`
  - `triggerAutomatedHarvest(mushroomId, cameraCoords)`
  - `sendArmManualCommand(jointArray)`
  - `triggerArmEStop()`

#### `src/AWS/dbService.js`
- Add DynamoDB helpers to record robotic arm operations in `MycoTrack_HarvestLogs`:
  - `logHarvestEvent(harvestData)` (stores harvest timestamp, target mushroom coordinates, success status, and cycle duration).

---

### Layer 4: Mobile App UI & Interactive Controls

#### `app/screens/RoboticArmControl.js`
- Dedicated Expo React Native screen for the robotic arm:
  - **Manual Servo Controls**: Sliders for Base, Shoulder, Elbow, Wrist Pitch, Wrist Roll, and Gripper with live degree readout.
  - **Preset Pose Buttons**: `Home Position`, `Camera Scan Pose`, `Maintenance Pose`.
  - **AI Harvest Mode**: Displays live camera stream with bounding boxes; pressing a detected mushroom triggers automated IK trajectory.
  - **Emergency Stop Button**: Prominent red E-Stop button visible at all times.
  - **Live Kinematics Display**: Real-time $(X, Y, Z)$ spatial coordinate readout of the end-effector.

#### `app/screens/Dashboard.js`
- Add a new "Robotic Arm Status & Quick Control" card to the main dashboard displaying arm connection status (Online/Offline), recent harvest count, and quick link to `RoboticArmControl.js`.

#### `app/screens/Monitoring.js`
- Add robotic arm telemetry (Current servo temperatures, motor voltage, harvest logs) to the environmental monitoring dashboard.

---

## Verification & Testing Strategy

1. **Kinematics Unit Tests**:
   - Verify Forward/Inverse Kinematics accuracy in Python (`backend/kinematics.py`).
2. **Servo Sweep & Bounds Verification**:
   - Verify PWM limits ($500\mu s - 2500\mu s$) for each servo motor.
3. **Camera-to-Arm Hand-Eye Calibration**:
   - Test spatial alignment between detected mushroom centroids and robot 3D space.
4. **End-to-End Automated Harvest Trial**:
   - Trigger full harvest cycle from MycoTrack mobile app and verify 6-stage motion sequence.
