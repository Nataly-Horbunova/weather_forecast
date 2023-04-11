class WeatherStorage {
    #baseUrl = 'https://api.openweathermap.org/';
    #appid = '31fdbea09ec46cb0d196ca9d28ad0701';

    async requestData(url) {
        const response = await fetch(url);

        if (response.ok) {
            return await response.json();
        } else if (response.status === 404) {
            throw new Error('Not found');
        } else {
            throw new Error(`${response.status}. An error occurred. Please try again later`);
        }
    }

    getFromLocalStorage(key) {
        return localStorage.getItem(key);
    }

    setToLocalStorage(key, value) {
        localStorage.setItem(key, value);
    }

    async getCurrentWeatherByCity(city, units) {
        const url = `${this.#baseUrl}/data/2.5/weather?q=${city}&appid=${this.#appid}&units=${units}`;
        return await this.requestData(url);
    }

    async getCurrentWeatherByLocation(lat, lon, units) {
        const url = `${this.#baseUrl}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.#appid}&units=${units}`;
        return await this.requestData(url);
    }

    async getForecastWeatherByCity(city, units) {
        const url = `${this.#baseUrl}data/2.5/forecast?q=${city}&appid=${this.#appid}&units=${units}`;
        return await this.requestData(url);
    }

    async getForecastWeatherByLocation(lat, lon, units) {
        const url = `${this.#baseUrl}data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.#appid}&units=${units}`;
        return await this.requestData(url);
    }

    async getCurrentLocationData() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition((pos) => {
                    resolve([{
                        lat: pos.coords.latitude,
                        lon: pos.coords.longitude
                    }])
                },
                function (error) {
                    reject(error)
                })
        })
    }
}