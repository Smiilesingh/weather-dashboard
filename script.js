const apiKey = "a69effc8282fd6c87130c8d577135161"; 

const cityElem = document.getElementById("city");
const weatherIcon = document.getElementById("weatherIcon");
const tempElem = document.getElementById("temp");
const descElem = document.getElementById("desc");
const humidityElem = document.getElementById("humidity");
const windElem = document.getElementById("wind");
const forecastContainer = document.getElementById("forecastContainer");

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

async function setBackground() {
  const url = "clear.jpg";

  document.body.style.backgroundImage =
    `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url('${url}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundAttachment = "fixed";
  document.body.style.transition = "background 0.6s ease-in-out";
}

async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed: " + res.status);
  return res.json();
}

async function fetchForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Forecast fetch failed: " + res.status);
  return res.json();
}

async function fetchWeatherByCityName(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&units=metric&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("City not found: " + res.status);
  return res.json();
}

async function fetchForecastByCityName(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&units=metric&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Forecast not found: " + res.status);
  return res.json();
}

function displayWeather(data) {
  cityElem.textContent = `${data.name}, ${data.sys.country}`;
  tempElem.textContent = `${Math.round(data.main.temp)} °C`;
  descElem.textContent = data.weather[0].description;
  humidityElem.textContent = `Humidity: ${data.main.humidity}%`;
  const windKmh = Math.round(
    (data.wind && data.wind.speed ? data.wind.speed : 0) * 3.6
  );
  windElem.textContent = `Wind: ${windKmh} km/h`;

  if (data.weather && data.weather[0] && data.weather[0].icon) {
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.style.display = "inline-block";
  } else {
    weatherIcon.style.display = "none";
  }
}

function displayForecast(forecastData) {
  forecastContainer.innerHTML = "";
  if (!forecastData || !forecastData.list) return;

  const daily = forecastData.list.filter((i) =>
    i.dt_txt.includes("12:00:00")
  );
  const items =
    daily.length >= 5
      ? daily.slice(0, 5)
      : (() => {
          const grouped = {};
          forecastData.list.forEach((it) => {
            const date = it.dt_txt.split(" ")[0];
            if (!grouped[date]) grouped[date] = it;
          });
          return Object.values(grouped).slice(0, 5);
        })();

  items.forEach((day) => {
    const date = new Date(day.dt * 1000);
    const opts = { weekday: "short", month: "short", day: "numeric" };
    const dStr = date.toLocaleDateString(undefined, opts);
    const avgTemp = Math.round(day.main.temp);
    const desc = day.weather[0].description;
    const iconCode = day.weather[0].icon;

    const card = document.createElement("div");
    card.className = "forecast-day";
    card.innerHTML = `
      <h4>${dStr}</h4>
      <img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${desc}" style="width:48px;height:48px;">
      <p>${avgTemp} °C</p>
      <small style="text-transform:capitalize">${desc}</small>
    `;
    forecastContainer.appendChild(card);
  });
}

async function updateByCoords(lat, lon) {
  try {
    const [weatherData, forecastData] = await Promise.all([
      fetchWeather(lat, lon),
      fetchForecast(lat, lon),
    ]);
    displayWeather(weatherData);
    displayForecast(forecastData);
    await setBackground();
  } catch (err) {
    console.error(err);
    cityElem.textContent = "Error loading weather";
    forecastContainer.innerHTML = "";
    setBackground();
  }
}

async function updateByCity(city) {
  try {
    const [weatherData, forecastData] = await Promise.all([
      fetchWeatherByCityName(city),
      fetchForecastByCityName(city),
    ]);
    displayWeather(weatherData);
    displayForecast(forecastData);
    await setBackground();
  } catch (err) {
    console.error(err);
    cityElem.textContent = "City not found.";
    tempElem.textContent = "-- °C";
    descElem.textContent = "--";
    humidityElem.textContent = "Humidity: --%";
    windElem.textContent = "Wind: -- km/h";
    weatherIcon.src = "";
    forecastContainer.innerHTML = "";
    setBackground();
  }
}

searchBtn.addEventListener("click", () => {
  const c = cityInput.value.trim();
  if (!c) return;
  updateByCity(c);
  cityInput.value = "";
});

cityInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") searchBtn.click();
});

window.addEventListener("load", () => {
  if (!navigator.geolocation) {
    cityElem.textContent = "Geolocation not supported.";
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      updateByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    (err) => {
      console.warn("Geolocation error:", err);
      cityElem.textContent = "Location access denied. Search a city.";
      setBackground();
    }
  );
});

