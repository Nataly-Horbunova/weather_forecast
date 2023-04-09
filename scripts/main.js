class WeatherStorage {
    #baseUrl = 'http://api.openweathermap.org/';
    #appid = '31fdbea09ec46cb0d196ca9d28ad0701';

    async requestData(url) {
        const response = await fetch(url);

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`${response.status}. An error occurred. Please try again later`);
        }
    }

    getFromLocalStorage() {
        return localStorage.getItem('city');
    }

    setToLocalStorage(city) {
        localStorage.setItem('city', city);
    }

    async getCityLocation(city) {
        const url = `${this.#baseUrl}/geo/1.0/direct?q=${city},&appid=${this.#appid}`
        return await this.requestData(url);
    }

    async getCurrentWeatherData(lat, lon) {
        const url = `${this.#baseUrl}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.#appid}`;
        return await this.requestData(url);
    }

    async getForecastWeatherData(lat, lon) {
        const url = `${this.#baseUrl}data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.#appid}`;
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

class WeatherModel {
    cityData = '';
    respForecastData = '';
    modifiedForecastData = [];

    constructor(storage) {
        this.weatherStorage = storage;
    }

    async initRequest() {
        const city = this.weatherStorage.getFromLocalStorage();

        if (!city) {
            try {
                const locationData = await this.weatherStorage.getCurrentLocationData();
                if (locationData) await this.getDataByLocation(locationData);
                this.weatherStorage.setToLocalStorage(this.cityData.name)

            } catch (error) {
                console.error(error);
            }
        } else {
            await this.getDataByCityName(city);
        }
    }

    async getDataByCityName(city) {
        const locationData = await this.weatherStorage.getCityLocation(city);
        if (locationData) await this.getDataByLocation(locationData);
    }

    async getDataByLocation(cityLocationData) {
        const data = await this.weatherStorage.getCurrentWeatherData(cityLocationData[0].lat, cityLocationData[0].lon);
        if (data) this.cityData = data;

        const forecast = await this.weatherStorage.getForecastWeatherData(cityLocationData[0].lat, cityLocationData[0].lon);
        if (forecast) this.respForecastData = forecast;
        this.modifyForecastData();


        // await this.weatherStorage.requestData()
        //     .then(resp => this.data = resp)
        //     .catch(error => alert(error.message));
    }

    modifyForecastData() {
        const forecastSorted = this.respForecastData.list.reduce(function (acc, el) {
            let date = el.dt_txt.split(' ')[0];

            if (!acc[date]) acc[date] = {
                temp_max: [],
                temp_min: [],
                pressure: [],
                windSpeed: [],
                weather: []
            };

            acc[date].temp_max.push(el.main.temp_max);
            acc[date].temp_min.push(el.main.temp_min);
            acc[date].pressure.push(el.main.pressure);
            acc[date].windSpeed.push(el.wind.speed);
            acc[date].weather.push(el.weather[0].main);

            return acc;
        }, {});

        for (let date in forecastSorted) {
            const tempMax = this.findMaxValue(forecastSorted[date].temp_max);
            const tempMin = this.findMinValue(forecastSorted[date].temp_min);
            const pressure = this.findAvgValue(forecastSorted[date].pressure, 0);
            const windSpeed = this.findAvgValue(forecastSorted[date].windSpeed, 2);
            const weather = this.findMostRepeatedValue(forecastSorted[date].weather);

            const forecastForDay = {
                weather: `[{main: ${weather}}]`,
                main: {
                    temp_max: tempMax,
                    temp_min: tempMin,
                    pressure
                },
                wind: {speed: windSpeed},
                sys: {
                    sunrise: this.respForecastData.city.sunrise,
                    sunset: this.respForecastData.city.sunset
                }
            };

            this.modifiedForecastData.push(forecastForDay);
        }
    }

    findMinValue(arr) {
        let minValue = arr[0];

        for (let i = 1; i < arr.length; i++) {
            if (arr[i] < minValue) {
                minValue = arr[i];
            }
        }
        return minValue;
    }

    findMaxValue(arr) {
        let maxVal = arr[0];

        for (let i = 1; i < arr.length; i++) {
            if (arr[i] > maxVal) {
                maxVal = arr[i];
            }
        }
        return maxVal;
    }

    findAvgValue(arr, decimalPlaces) {
        const sum = arr.reduce((acc, val) => acc + val, 0);
        const avg = sum / arr.length;
        return +avg.toFixed(decimalPlaces);
    }

   findMostRepeatedValue(arr) {
        const counts = {};
        let mostRepeatedVal = arr[0];

        arr.forEach((val) => {
            counts[val] = (counts[val] || 0) + 1;
            if (counts[val] > counts[mostRepeatedVal]) {
                mostRepeatedVal = val; // обновляем наиболее повторяющееся значение
            }
        });

        return mostRepeatedVal;
    }
}

class WeatherView {
    inputCityName = document.querySelector('.city-input');

    constructor(model) {
        this.weatherModel = model;
        this.weatherStorage = model.weatherStorage;
    }

    getCityOutput() {
        this.inputCityName.addEventListener('keydown', async (e) => {
            if (e.key === "Enter" && this.inputCityName.value) {
                await this.weatherModel.getDataByCityName(this.inputCityName.value);
                this.weatherStorage.setToLocalStorage(this.inputCityName.value);
                this.render();
            }
        })
    }

    render() {
        if (!this.weatherModel.cityData) {
            // !!!!!! Show Kiev data
        }
        // !!! shw current city data
        console.log(this.weatherModel.cityData);
        console.log(this.weatherModel.respForecastData);
        console.log(this.weatherModel.modifiedForecastData);
    }

    async init() {
        await this.weatherModel.initRequest();
        this.render();
        this.getCityOutput();
    }
}

let weatherApp = new WeatherView(new WeatherModel(new WeatherStorage));
weatherApp.init();
