
export interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  isHighRisk: boolean;
  riskLevel: number; // 1-10
}

/**
 * Fetches current weather data from Open-Meteo for a given location.
 * Calculates a weather risk level (1-10) based on wind speed and precipitation.
 */
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.append('latitude', lat.toString());
    url.searchParams.append('longitude', lng.toString());
    url.searchParams.append('current', 'temperature_2m,wind_speed_10m,precipitation,weather_code');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }
    const data = await response.json();

    const current = data.current;
    if (!current) {
      throw new Error('Weather API returned no current observation block.');
    }
    
    // Simple risk calculation
    // Wind speed > 30 km/h is high risk for drones
    // Precipitation > 2mm/h is high risk
    
    const windSpeed = current.wind_speed_10m ?? 0;
    const precipitation = current.precipitation ?? 0;
    
    // Risk level 1-10
    // Wind: 0-50 km/h -> 1-5
    // Precip: 0-10 mm/h -> 1-5
    const windRisk = Math.min(Math.floor(windSpeed / 5), 5);
    const precipRisk = Math.min(Math.floor(precipitation * 2), 5);
    const riskLevel = windRisk + precipRisk;
    
    return {
      temperature: current.temperature_2m ?? 20,
      windSpeed,
      precipitation,
      weatherCode: current.weather_code ?? 0,
      riskLevel,
      isHighRisk: riskLevel >= 7
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Fail closed when weather is unavailable so autonomous delivery stays cautious.
    return {
      temperature: 0,
      windSpeed: 60,
      precipitation: 10,
      weatherCode: -1,
      riskLevel: 10,
      isHighRisk: true
    };
  }
}
