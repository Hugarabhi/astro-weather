// --- OpenWeatherMap API Key ---
const API_KEY = "d7c5ddb203cbc7d5499ee46e7c547ae5";

// --- DOM Elements ---
const mainAppContainer = document.getElementById('main-app-container');
const aboutPageContainer = document.getElementById('about-page-container');
const aboutLink = document.getElementById('about-link');
const backToAppBtn = document.getElementById('back-to-app-btn');
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const statusMessage = document.getElementById('status-message');
const mainWeather = document.getElementById('main-weather');
const forecastContainer = document.getElementById('forecast-container');
const recentSearchesContainer = document.getElementById('recent-searches-container');
const body = document.body;

// --- Weather Icon and Background Mapping ---
const weatherMap = {
    Clear: { icon: '☀️', gradient: 'var(--bg-sunny)' },
    Clouds: { icon: '☁️', gradient: 'var(--bg-cloudy)' },
    Rain: { icon: '🌧️', gradient: 'var(--bg-rainy)' },
    Drizzle: { icon: '🌧️', gradient: 'var(--bg-rainy)' },
    Thunderstorm: { icon: '⛈️', gradient: 'var(--bg-rainy)' },
    Snow: { icon: '❄️', gradient: 'var(--bg-snowy)' },
    Mist: { icon: '🌫️', gradient: 'var(--bg-cloudy)' },
    Smoke: { icon: '🌫️', gradient: 'var(--bg-cloudy)' },
    Haze: { icon: '🌫️', gradient: 'var(--bg-cloudy)' },
    Dust: { icon: '🌫️', gradient: 'var(--bg-cloudy)' },
    Fog: { icon: '🌫️', gradient: 'var(--bg-cloudy)' },
    Sand: { icon: '🌫️', gradient: 'var(--bg-cloudy)' },
    Ash: { icon: '🌫️', gradient: 'var(--bg-cloudy)' },
    Squall: { icon: '🌬️', gradient: 'var(--bg-rainy)' },
    Tornado: { icon: '🌪️', gradient: 'var(--bg-cloudy)' },
};

// --- Helper Functions ---
const showMessage = (msg, isError = true) => {
    statusMessage.textContent = msg;
    statusMessage.style.display = 'block';
    statusMessage.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 128, 0, 0.2)';
    setTimeout(() => { statusMessage.style.display = 'none'; }, 5000);
};

const setWeatherTheme = (condition) => {
    const theme = weatherMap[condition]?.gradient || 'var(--bg-default)';
    body.style.background = theme;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
};

const updateRecentSearches = (city) => {
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    searches = searches.filter(c => c.toLowerCase() !== city.toLowerCase());
    searches.unshift(city);
    localStorage.setItem('recentSearches', JSON.stringify(searches.slice(0, 5)));
    displayRecentSearches();
};

const displayRecentSearches = () => {
    recentSearchesContainer.innerHTML = '';
    const searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    if (searches.length === 0) {
        recentSearchesContainer.innerHTML = '<span style="opacity:0.7;">No recent searches.</span>';
    } else {
        searches.forEach(city => {
            const tag = document.createElement('div');
            tag.className = 'search-tag';
            tag.textContent = city;
            tag.addEventListener('click', () => fetchWeatherByCity(city));
            recentSearchesContainer.appendChild(tag);
        });
    }
};

// --- Fetching Data ---
async function fetchWeatherByCity(city) {
    if (!city) return;
    showMessage('Fetching weather...', false);
    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`)
        ]);

        if (!currentRes.ok || !forecastRes.ok) {
            throw new Error('City not found. Please try again.');
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        displayCurrentWeather(currentData);
        displayForecast(forecastData);
        updateRecentSearches(currentData.name);
        
        showMessage('Weather updated successfully!', false);
    } catch (error) {
        showMessage(error.message);
        console.error('Error fetching data:', error);
    }
}

const getWeatherByLocation = () => {
    if (!navigator.geolocation) {
        showMessage('Geolocation not supported by your browser.');
        return;
    }

    showMessage('Finding your location...', false);
    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`);
            const data = await res.json();
            if (!res.ok) throw new Error('Could not get weather for your location.');
            fetchWeatherByCity(data.name);
        } catch (error) {
            showMessage('Could not retrieve weather for your location.');
            console.error('Geolocation error:', error);
        }
    }, (error) => {
        showMessage('Geolocation failed. Please enter a city manually.');
        console.error('Geolocation permission denied or error:', error);
    });
};

// --- Displaying Data ---
const displayCurrentWeather = (data) => {
    const { name, sys, main, weather, wind } = data;
    const mainCondition = weather[0]?.main;
    const icon = weatherMap[mainCondition]?.icon || '❓';
    setWeatherTheme(mainCondition);

    mainWeather.innerHTML = `
        <div class="flex items-center justify-between flex-wrap">
            <div>
                <h2 class="text-4xl font-bold">${name}, ${sys.country}</h2>
                <p class="text-xl mt-1 opacity-70">${getGreeting()}</p>
            </div>
        </div>
        <div class="my-6 text-center">
            <div class="weather-icon">${icon}</div>
            <p class="text-8xl font-bold">${Math.round(main.temp)}°C</p>
            <p class="text-2xl font-light capitalize opacity-90">${weather[0].description}</p>
        </div>
        <div class="details-grid">
            <div class="detail-card">
                <span>Humidity</span>
                <p>${main.humidity}%</p>
            </div>
            <div class="detail-card">
                <span>Wind Speed</span>
                <p>${wind.speed} m/s</p>
            </div>
            <div class="detail-card">
                <span>Feels Like</span>
                <p>${Math.round(main.feels_like)}°C</p>
            </div>
        </div>
    `;
};

const displayForecast = (data) => {
    forecastContainer.innerHTML = '';
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const mainCondition = day.weather[0]?.main;
        const icon = weatherMap[mainCondition]?.icon || '❓';

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <h4>${dayName}</h4>
            <div class="forecast-icon">${icon}</div>
            <p>${Math.round(day.main.temp)}°C</p>
            <p class="text-sm opacity-80 mt-1 capitalize">${day.weather[0]?.description}</p>
        `;
        forecastContainer.appendChild(card);
    });
};

// --- Page Navigation Functions ---
const showWeatherApp = () => {
    mainAppContainer.style.display = 'block';
    aboutPageContainer.style.display = 'none';
};

const showAboutPage = () => {
    mainAppContainer.style.display = 'none';
    aboutPageContainer.style.display = 'block';
};


// --- Event Listeners and Initial Load ---
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherByCity(city);
    else showMessage("Please enter a city name.");
});

cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeatherByCity(city);
        else showMessage("Please enter a city name.");
    }
});

locationBtn.addEventListener('click', getWeatherByLocation);

themeToggleBtn.addEventListener('click', () => {
    if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '🌙';
    } else {
        body.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '☀️';
    }
});

aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    showAboutPage();
});

backToAppBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showWeatherApp();
});

window.onload = () => {
    showAboutPage(); // Ensure the About page is shown first
    const searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    const lastCity = searches[0] || 'London';
    cityInput.value = lastCity;
    fetchWeatherByCity(lastCity);
    displayRecentSearches();
};
