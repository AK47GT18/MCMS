/**
 * MCMS Weather Service (Client-Side)
 * Uses Open-Meteo API (no API key required)
 * Fetches current weather conditions based on project GPS coordinates
 */

const WeatherService = {
    _cache: null,
    _cacheTime: 0,
    CACHE_DURATION: 30 * 60 * 1000, // 30 minutes

    WMO_CODES: {
        0: { label: 'Clear Sky', icon: 'fa-sun', color: '#f59e0b' },
        1: { label: 'Mostly Clear', icon: 'fa-sun', color: '#f59e0b' },
        2: { label: 'Partly Cloudy', icon: 'fa-cloud-sun', color: '#6b7280' },
        3: { label: 'Overcast', icon: 'fa-cloud', color: '#6b7280' },
        45: { label: 'Foggy', icon: 'fa-smog', color: '#9ca3af' },
        48: { label: 'Rime Fog', icon: 'fa-smog', color: '#9ca3af' },
        51: { label: 'Light Drizzle', icon: 'fa-cloud-rain', color: '#3b82f6' },
        53: { label: 'Moderate Drizzle', icon: 'fa-cloud-rain', color: '#3b82f6' },
        55: { label: 'Dense Drizzle', icon: 'fa-cloud-showers-heavy', color: '#2563eb' },
        61: { label: 'Slight Rain', icon: 'fa-cloud-rain', color: '#3b82f6' },
        63: { label: 'Moderate Rain', icon: 'fa-cloud-showers-heavy', color: '#2563eb' },
        65: { label: 'Heavy Rain', icon: 'fa-cloud-showers-heavy', color: '#1d4ed8' },
        71: { label: 'Slight Snow', icon: 'fa-snowflake', color: '#93c5fd' },
        73: { label: 'Moderate Snow', icon: 'fa-snowflake', color: '#60a5fa' },
        75: { label: 'Heavy Snow', icon: 'fa-snowflake', color: '#3b82f6' },
        80: { label: 'Rain Showers', icon: 'fa-cloud-showers-heavy', color: '#2563eb' },
        81: { label: 'Mod. Showers', icon: 'fa-cloud-showers-heavy', color: '#1d4ed8' },
        82: { label: 'Violent Showers', icon: 'fa-cloud-showers-heavy', color: '#1e40af' },
        95: { label: 'Thunderstorm', icon: 'fa-bolt', color: '#7c3aed' },
        96: { label: 'Thunderstorm + Hail', icon: 'fa-bolt', color: '#6d28d9' },
        99: { label: 'Severe Thunderstorm', icon: 'fa-bolt', color: '#5b21b6' },
    },

    /**
     * Fetch current weather for given coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Promise<Object>} Weather data
     */
    async fetchWeather(lat, lng) {
        // Return cache if fresh
        if (this._cache && (Date.now() - this._cacheTime) < this.CACHE_DURATION) {
            return this._cache;
        }

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=3`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
            
            const data = await response.json();
            
            const current = data.current;
            const daily = data.daily;
            const weatherInfo = this.WMO_CODES[current.weather_code] || { label: 'Unknown', icon: 'fa-question', color: '#6b7280' };

            const result = {
                current: {
                    temperature: Math.round(current.temperature_2m),
                    feelsLike: Math.round(current.apparent_temperature),
                    humidity: current.relative_humidity_2m,
                    precipitation: current.precipitation,
                    windSpeed: Math.round(current.wind_speed_10m),
                    windGusts: Math.round(current.wind_gusts_10m),
                    windDirection: current.wind_direction_10m,
                    weatherCode: current.weather_code,
                    ...weatherInfo
                },
                forecast: daily ? daily.time.map((date, i) => ({
                    date,
                    maxTemp: Math.round(daily.temperature_2m_max[i]),
                    minTemp: Math.round(daily.temperature_2m_min[i]),
                    precipitation: daily.precipitation_sum[i],
                    rainChance: daily.precipitation_probability_max[i],
                    weatherCode: daily.weather_code[i],
                    ...(this.WMO_CODES[daily.weather_code[i]] || { label: 'Unknown', icon: 'fa-question', color: '#6b7280' })
                })) : [],
                fetchedAt: new Date().toISOString(),
                latitude: data.latitude,
                longitude: data.longitude
            };

            this._cache = result;
            this._cacheTime = Date.now();
            return result;

        } catch (err) {
            console.error('[Weather] Failed to fetch:', err.message);
            return null;
        }
    },

    /**
     * Returns weather severity for site work safety
     */
    getSiteSafety(weather) {
        if (!weather) return { level: 'unknown', message: 'Weather data unavailable', color: '#6b7280' };
        
        const code = weather.current.weatherCode;
        const wind = weather.current.windSpeed;
        const gusts = weather.current.windGusts;

        if ([95, 96, 99].includes(code) || gusts > 80) {
            return { level: 'danger', message: 'Suspend site operations — severe weather', color: '#ef4444', icon: 'fa-triangle-exclamation' };
        }
        if ([65, 82].includes(code) || wind > 50) {
            return { level: 'warning', message: 'Caution — heavy rain or strong winds', color: '#f59e0b', icon: 'fa-exclamation-circle' };
        }
        if ([61, 63, 80, 81].includes(code)) {
            return { level: 'caution', message: 'Light to moderate rain — reduce earthworks', color: '#3b82f6', icon: 'fa-cloud-rain' };
        }
        return { level: 'clear', message: 'Good conditions for site work', color: '#10b981', icon: 'fa-check-circle' };
    },

    /**
     * Render weather widget HTML for the FS dashboard
     */
    renderWidget(weather) {
        if (!weather) {
            return `
                <div style="padding: 20px; text-align: center; color: var(--slate-400); font-size: 12px;">
                    <i class="fas fa-cloud-bolt" style="font-size: 20px; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                    Weather data unavailable
                </div>
            `;
        }

        const c = weather.current;
        const safety = this.getSiteSafety(weather);
        const windArrow = this._getWindDirection(c.windDirection);

        return `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- Current Conditions -->
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background: ${c.color}15; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas ${c.icon}" style="font-size: 24px; color: ${c.color};"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 28px; font-weight: 900; color: var(--slate-900); line-height: 1;">${c.temperature}°C</div>
                        <div style="font-size: 11px; color: var(--slate-500); font-weight: 600; margin-top: 2px;">${c.label}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 11px; color: var(--slate-500);">Feels like <strong>${c.feelsLike}°C</strong></div>
                        <div style="font-size: 11px; color: var(--slate-500);">${windArrow} ${c.windSpeed} km/h</div>
                    </div>
                </div>

                <!-- Detail Chips -->
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <div style="padding: 4px 10px; background: var(--slate-50); border-radius: 20px; font-size: 10px; font-weight: 700; color: var(--slate-600); border: 1px solid var(--slate-100);">
                        <i class="fas fa-droplet" style="color: var(--blue);"></i> ${c.humidity}%
                    </div>
                    <div style="padding: 4px 10px; background: var(--slate-50); border-radius: 20px; font-size: 10px; font-weight: 700; color: var(--slate-600); border: 1px solid var(--slate-100);">
                        <i class="fas fa-wind" style="color: var(--slate-400);"></i> Gusts ${c.windGusts} km/h
                    </div>
                    ${c.precipitation > 0 ? `
                        <div style="padding: 4px 10px; background: var(--blue-light); border-radius: 20px; font-size: 10px; font-weight: 700; color: var(--blue); border: 1px solid var(--blue)22;">
                            <i class="fas fa-cloud-rain"></i> ${c.precipitation} mm
                        </div>
                    ` : ''}
                </div>

                <!-- Safety Advisory -->
                <div style="padding: 10px 14px; border-radius: 8px; background: ${safety.color}10; border: 1px solid ${safety.color}30; display: flex; align-items: center; gap: 10px;">
                    <i class="fas ${safety.icon || 'fa-shield'}" style="color: ${safety.color}; font-size: 14px;"></i>
                    <div style="font-size: 11px; font-weight: 700; color: ${safety.color};">${safety.message}</div>
                </div>

                <!-- 3-Day Forecast (Hidden on Mobile for Space) -->
                ${weather.forecast.length > 1 ? `
                    <div class="hidden-mobile" style="display: flex; gap: 8px;">
                        ${weather.forecast.slice(1).map(day => {
                            const dayName = new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short' });
                            return `
                                <div style="flex: 1; padding: 10px 8px; background: var(--slate-50); border-radius: 8px; border: 1px solid var(--slate-100); text-align: center;">
                                    <div style="font-size: 10px; font-weight: 700; color: var(--slate-500); text-transform: uppercase;">${dayName}</div>
                                    <i class="fas ${day.icon}" style="color: ${day.color}; font-size: 16px; margin: 6px 0;"></i>
                                    <div style="font-size: 12px; font-weight: 800; color: var(--slate-900);">${day.maxTemp}°</div>
                                    <div style="font-size: 10px; color: var(--slate-400);">${day.minTemp}°</div>
                                    ${day.rainChance > 30 ? `<div style="font-size: 9px; color: var(--blue); font-weight: 700; margin-top: 2px;"><i class="fas fa-droplet"></i> ${day.rainChance}%</div>` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Render a compact mini-widget for form integration
     */
    renderMiniWidget(weather) {
        if (!weather) return `<div style="font-size:11px; color:var(--slate-400);">Weather data unavailable</div>`;
        const c = weather.current;
        return `
            <div id="mini-weather-container" style="display: flex; align-items: center; gap: 12px; padding: 10px; background: white; border: 1px solid var(--slate-200); border-radius: 12px; box-shadow: var(--shadow-sm);">
                <div style="width: 32px; height: 32px; border-radius: 50%; background: ${c.color}15; display: flex; align-items: center; justify-content: center;">
                    <i class="fas ${c.icon}" style="font-size: 14px; color: ${c.color};"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 13px; font-weight: 800; color: var(--slate-900); line-height: 1.2;">${c.temperature}°C</div>
                    <div style="font-size: 10px; color: var(--slate-500); font-weight: 600;">${c.label}</div>
                </div>
                <input type="hidden" id="daily-weather" value="${c.label}">
                <div style="font-size: 10px; color: var(--emerald); font-weight: 700; background: #ECFDF5; padding: 2px 8px; border-radius: 10px;">
                    <i class="fas fa-satellite"></i> LIVE
                </div>
            </div>
        `;
    },

    renderUltraMiniWidget(weather) {
        if (!weather) return `<div style="font-size:11px; color:var(--slate-400);">Weather data unavailable</div>`;
        const c = weather.current;
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); border: 1px solid #BAE6FD; border-radius: 16px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                        <i class="fas ${c.icon}" style="font-size: 18px; color: ${c.color};"></i>
                    </div>
                    <div>
                        <div style="font-size: 16px; font-weight: 900; color: #0C4A6E;">${c.temperature}°C</div>
                        <div style="font-size: 11px; font-weight: 700; color: #0369A1; text-transform: uppercase; letter-spacing: 0.5px;">${c.label}</div>
                    </div>
                </div>
                <input type="hidden" id="daily-weather" value="${c.label}">
                <div style="text-align: right;">
                    <div style="font-size: 9px; font-weight: 800; color: #0EA5E9; margin-bottom: 2px;">LOCAL SYNC</div>
                    <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #0369A1; font-weight: 600;">
                        <i class="fas fa-location-dot" style="font-size: 8px;"></i> 
                        ${weather.latitude ? Math.round(weather.latitude * 100) / 100 : '—'}, 
                        ${weather.longitude ? Math.round(weather.longitude * 100) / 100 : '—'}
                    </div>
                </div>
            </div>
        `;
    },

    _getWindDirection(degrees) {
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const idx = Math.round(degrees / 45) % 8;
        return `${dirs[idx]} ↗`;
    }
};

window.WeatherService = WeatherService;
export default WeatherService;
