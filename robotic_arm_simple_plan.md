# Connecting the Robot Arm to MycoTrack (Simple Version)

This explains how to plug the 19-step robot arm project into your existing MycoTrack app (the mobile app, backend server, ESP32, and AWS cloud setup you already have).

---

## ⚠️ Read This First — Safety

- **Power Supply**: The arm's 6 motors (servos) need their own power supply (5–6V, 10A). Never power them from the ESP32 or Raspberry Pi directly — they'll draw too much current and fry your board.
- **Servo Driver**: You need a small driver board (PCA9685) between the servos and your ESP32/Pi — it lets you control 16 servo channels over just 2 wires (I2C).
- **Emergency Stop**: Wire in a physical Emergency Stop button that cuts power to the arm directly. Not optional — if the arm jams or moves wrong, you need a way to kill it instantly by hand.

---

## ⚠️ Camera Setup

- **Hand-Eye Calibration**: The camera needs to be calibrated so it knows how to translate "what it sees" into "where the arm should move." This is a one-time setup step, not something you redo constantly.
- **Distance Estimation**: If you're using one camera (not two, no depth sensor), it estimates distance using known mushroom size + how big it looks in the image. This works but is approximate. If you want it more accurate, add a small distance sensor (VL53L0X) to the gripper tip.

---

## Questions to Decide Before Building

1. **Where does the camera sit?** Fixed above the bed looking down (simpler, recommended) or mounted on the arm itself (harder, but sees closer up)?
2. **Who controls the servos** — ESP32 or Raspberry Pi? This changes which code you write and how it talks to your cloud.
3. **What does the gripper look like?** A soft 3D-printed claw that twists to pick, or a suction cup? *(Claw is more proven for this kind of pick-and-twist harvest.)*

---

## How the 19 Steps Turn Into MycoTrack Features

Think of it as 4 layers, built in this order:

### Layer 1 — The Arm Itself (Hardware + Firmware)
*Covers steps 1–7: basics, planning, buying parts, gripper design, building, wiring, servo setup.*

- **New file**: `robotic_arm_firmware.ino` — this is the code that runs on the ESP32. It listens for movement commands from the cloud and moves the 6 servos smoothly (no sudden jerks).
- It also reports back: is the arm online, what position is it in, is the gripper open/closed, has the E-Stop been hit.

### Layer 2 — The "Brain" (Vision + Math + Motion Planning)
*Covers steps 8–16: kinematics, camera calibration, mushroom detection, distance estimation, coordinate matching, gripper testing, harvest motion.*

- **New file**: `kinematics.py` — does two jobs:
  - **Forward kinematics**: "If the joints are at these angles, where is the gripper?"
  - **Inverse kinematics**: "I want the gripper here — what angles do the joints need?"
  - Also converts camera coordinates into arm coordinates, so "mushroom is at this pixel" becomes "arm should move to this exact spot."
- **Updated file**: `yolov8_mushroom_pipeline.py` — your existing mushroom-detection AI now also outputs the center point of each mushroom and estimates how far away it is.
- **New file**: `harvest_planner.py` — this is the actual pick sequence, broken into 6 simple stages:
  1. Hover just above the mushroom
  2. Line up with the stem
  3. Lower down and grip gently
  4. Twist while lifting (this is how you detach it without damaging it)
  5. Lift clear of the bed
  6. Move over the collection bin and let go
- **Updated file**: `realtime_mushroom.py` — adds new commands your app can call: "solve this position," "plan and run a harvest," "emergency stop now."

### Layer 3 — Connecting to Your Cloud
*Covers step 17: full system integration.*

- **Updated file**: `api.js` — adds functions so your app can ask the arm to move, start an automatic harvest, or stop immediately.
- **Updated file**: `dbService.js` — logs every harvest attempt (when, where, success or not, how long it took) into your existing AWS database, next to your other mushroom-house data.

### Layer 4 — What You See in the App
*Covers steps 17–19: integration, testing, demo.*

- **New screen**: `RoboticArmControl.js` — this is the actual control screen in your app:
  - Manual sliders to move each joint by hand
  - Quick buttons for common positions (home, scan pose, maintenance)
  - Live camera view with boxes around detected mushrooms — tap one to harvest it automatically
  - A big red Emergency Stop button, always visible
  - A readout showing exactly where the gripper currently is in space
- **Updated**: `Dashboard.js` — adds a small card showing "is the arm online" and "how many harvested today," with a link to the full control screen.
- **Updated**: `Monitoring.js` — adds arm health info (motor temperature, voltage, harvest history) next to your existing environment readings.

---

## How You'll Know It Actually Works

### Before touching real mushrooms:
1. **Run the math both ways and check it matches** — if you tell it to solve for a position, then check where that position actually is, they should agree to within half a millimeter.
2. **Sweep each servo through its full range by hand** and make sure nothing physically collides.
3. **Put a marker at a known spot under the camera** and confirm the system correctly figures out where that is in real-world coordinates.

### With real mushrooms:
- Place one, hit "Harvest" in the app, and watch it go through all 6 motion steps — check the mushroom comes out clean, not crushed.
