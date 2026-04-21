export const checkAlerts = (data) => {
  const alerts = [];

  // 🌡 Temperature
  if (data.temperature < 18 || data.temperature > 20) {
    alerts.push({
      id: Date.now().toString(),
      title: "High Temperature",
      description: `Temperature out of range: ${data.temperature}°C`,
      category: "Environmental",
      severity: "warning",
      time: "now",
      read: false,
    });
  }

  // 💧 Humidity
  if (data.humidity > 90) {
    alerts.push({
      id: Date.now().toString(),
      title: "High Humidity",
      description: `Humidity too high: ${data.humidity}%`,
      category: "Environmental",
      severity: "warning",
      time: "now",
      read: false,
    });
  }

  // 🌱 Soil Moisture
  if (data.soilMoisture < 70) {
    alerts.push({
      id: Date.now().toString(),
      title: "Low Soil Moisture",
      description: `Soil moisture low: ${data.soilMoisture}%`,
      category: "Environmental",
      severity: "warning",
      time: "now",
      read: false,
    });
  }

  // 🫁 CO2
  if (data.co2 > 1000) {
    alerts.push({
      id: Date.now().toString(),
      title: "High CO₂ Level",
      description: `CO₂ level high: ${data.co2} ppm`,
      category: "Environmental",
      severity: "critical",
      time: "now",
      read: false,
    });
  }

  return alerts;
};