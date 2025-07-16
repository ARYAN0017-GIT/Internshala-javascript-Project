document.addEventListener('DOMContentLoaded', () => {

    // API KEY 
    const API_KEY = "7a8abe0f1d3b447b844123111251607"; 

    // ELEMENT REFERENCES
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const currentLocationBtn = document.getElementById('current-location-btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const weatherDisplay = document.getElementById('weather-display');
    const currentWeatherCard = document.getElementById('current-weather-card');
    const forecastCardsContainer = document.getElementById('forecast-cards');
    const recentList = document.getElementById('recent-list');
    const weatherApp = document.getElementById('weather-container');

    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    currentLocationBtn.addEventListener('click', getCurrentLocationWeather);

    // HANDLER SEARCH
    function handleSearch() {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        } else {
            showError("Please enter a city name.");
        }
    }

    // CURRENT LOCATION HANDLER

    function getCurrentLocationWeather() {
        if (!navigator.geolocation) {
            showError("Geolocation is not supported by your browser.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherData(`${latitude},${longitude}`);
            },
            () => {
                showError("Unable to retrieve your location. Please grant permission.");
            }
        );
    }
    
    // FETCH DATA
    async function fetchWeatherData(query) {
        showLoading(true);
        try {
            const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${query}&days=5`);
            
            if (!response.ok) {
                
                const errorData = await response.json().catch(() => ({})); // JSON OR EMPTY
                const message = errorData?.error?.message || `Error: ${response.statusText}`;
                throw new Error(message);
            }
            
            const data = await response.json();

            // VALIDATION

            const isCityNameQuery = isNaN(query.charAt(0));
            if (isCityNameQuery && !data.location.name.toLowerCase().includes(query.toLowerCase())) {
                 throw new Error(`City not found. Please check the spelling and try again.`);
            }

            updateUI(data);
            addToRecentSearches(data.location.name);

        } catch (error) {
            // ERROR HANDLING
            console.log('An error was caught!', error);
            showError(error.message);
        } finally {
            
            showLoading(false);
        }
    }


    // UI FUNCTION
    function updateUI(data) {
        errorMessage.classList.add('hidden'); // HIDE PREVIOUS ERROR
        const { location, current, forecast } = data;

        // 1. Update Current Weather
        currentWeatherCard.innerHTML = `
            <div class="text-center">
                <h2 class="text-2xl font-bold">${location.name}, ${location.country}</h2>
                <p class="text-gray-600">${new Date(location.localtime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <img src="https:${current.condition.icon}" alt="${current.condition.text}" class="mx-auto w-24 h-24">
                <p class="text-5xl font-extrabold">${Math.round(current.temp_c)}°C</p>
                <p class="text-lg font-semibold">${current.condition.text}</p>
                <div class="flex justify-around mt-4 text-gray-700">
                    <span><i class="fa-solid fa-wind mr-1"></i> ${current.wind_kph} kph</span>
                    <span><i class="fa-solid fa-droplet mr-1"></i> ${current.humidity}%</span>
                </div>
            </div>
        `;

        // 2. Update 5-Day Forecast
        forecastCardsContainer.innerHTML = ''; // Clear old forecast
        forecast.forecastday.forEach(day => {
            const forecastDate = new Date(day.date_epoch * 1000); 
            
            const card = document.createElement('div');
            card.className = 'bg-white/70 p-4 rounded-lg text-center hover:scale-105 transition-transform duration-300';
            card.innerHTML = `
                <p class="font-bold">${forecastDate.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}" class="mx-auto w-12 h-12">
                <p class="font-semibold">${Math.round(day.day.maxtemp_c)}° / ${Math.round(day.day.mintemp_c)}°</p>
            `;
            forecastCardsContainer.appendChild(card);
        });

        // 3. Update Background
        updateBackground(current.condition.code);
        
        // 4. Animate the display
        weatherDisplay.classList.remove('hidden');
        currentWeatherCard.classList.add('fade-in');
        forecastCardsContainer.classList.add('fade-in');
    }
    
    
    // UPDATING BACKGROUND
    // AS THE CONDITION THAT THE DAY IS RAINY , CLOUDY BASED ON THE DATA CALCULATION AND API
    // WE GET THE UPDATED BACKGROUND

    function updateBackground(conditionCode) {
        let imageUrl = 'https://images.unsplash.com/photo-1691739263748-7b502866d43a?q=80&w=2070&auto=format&fit=crop'; //DEFAULT
        if (conditionCode === 1000) {
            imageUrl = 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1974&auto=format&fit=crop'; //SUNNY
        } else if ([1003, 1006, 1009].includes(conditionCode)) {
            imageUrl = 'https://images.unsplash.com/photo-1748251736653-b658a4a2b642?q=80&w=1170&auto=format&fit=crop'; //CLOUDY
        } else if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(conditionCode)) {
            imageUrl = 'https://images.unsplash.com/photo-1736098740424-dd4e4e3b7fa0?q=80&w=1188&auto=format&fit=crop'; //RAINY
        } else if ([1087, 1273, 1276].includes(conditionCode)) {
            imageUrl = 'https://images.unsplash.com/photo-1663877024534-234d6fe2c423?q=80&w=1170&auto=format&fit=crop'; //THUNDERSTROM
        } else if ([1066, 1114, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(conditionCode)) {
            imageUrl = 'https://images.unsplash.com/photo-1612864197149-686b29cb4bea?q=80&w=1170&auto=format&fit=crop'; // SNOW
        }
        weatherApp.style.backgroundImage = `url('${imageUrl}')`;
    }

    // LOADER CODE
    function showLoading(isLoading) {
        loader.classList.toggle('hidden', !isLoading);
        if (isLoading) {
            errorMessage.classList.add('hidden');
            weatherDisplay.classList.add('hidden');
        }
    }

    function showError(message) {
        console.log('The showError function is running with message:', message);
        console.log('The error message element is:', errorMessage); 
        
        if (errorMessage) {
            errorMessage.textContent = `⚠️ ${message}`;
            errorMessage.classList.remove('hidden');
        }
        weatherDisplay.classList.add('hidden');
    }
    
    
    //RECENT SEARCHES
    function getRecentSearches() {
        return JSON.parse(localStorage.getItem('recentSearches')) || [];
    }

    // ADD RECENT SEARCH TO A COLUMN
    // LOGIC BEHIND THAT
    // USING LOCAL STORAGE AND WHEN CLICKED THE BUTTON 
    // OF THE RECENT SEARCH CITY/AREA I FEED TO THE 
    // FETCH WEATHER DATA FUNCTION
    function addToRecentSearches(city) {
        let searches = getRecentSearches();
        searches = searches.filter(s => s.toLowerCase() !== city.toLowerCase());
        searches.unshift(city);
        localStorage.setItem('recentSearches', JSON.stringify(searches.slice(0, 5)));
        displayRecentSearches();
    }


    function displayRecentSearches() {
        recentList.innerHTML = '';
        const searches = getRecentSearches();
        if (searches.length === 0) {
            recentList.innerHTML = `<li class="text-gray-500">No recent searches.</li>`;
            return;
        }
        searches.forEach(city => {
            const li = document.createElement('li');
            li.className = 'cursor-pointer p-2 rounded-md hover:bg-gray-200';
            li.textContent = city;
            li.addEventListener('click', () => fetchWeatherData(city));
            recentList.appendChild(li);
        });
    }

    // --- INITIALIZATION ---
    function init() {
        displayRecentSearches();
    }

    init();
});