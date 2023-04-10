class WeatherModel {
    cityData = '';
    respForecastData = '';
    modifiedForecastData = [];
    units = 'metric';
    defaultCity = 'Kyiv';
    icons = {
        '01d': './assets/clear_sky.png',
        '01n': './assets/clear_sky.png',
        '02d': './assets/few_clouds.png',
        '02n': './assets/few_clouds.png',
        '03d': './assets/scattered_clouds.png',
        '03n': './assets/scattered_clouds.png',
        '04n': './assets/broken_clouds.png',
        '04d': './assets/broken_clouds.png',
        '09d': './assets/shower_rain.png',
        '09n': './assets/shower_rain.png',
        '10d': './assets/rain.png',
        '10n': './assets/rain.png',
        '11d': './assets/thunderstorm.png',
        '11n': './assets/thunderstorm.png',
        '13d': './assets/snow.png',
        '13n': './assets/snow.png',
        '50d': './assets/mist.png',
        '50n': './assets/mist.png',
    }

    constructor(storage) {
        this.weatherStorage = storage;
    }

    async initRequest() {
        const city = this.weatherStorage.getFromLocalStorage('city');
        const units = this.weatherStorage.getFromLocalStorage('units');

        if (!units) {
            this.setUnits('metric');
        } else {
            this.units = units;
        }

        if (!city) {
            try {
                const locationData = await this.weatherStorage.getCurrentLocationData();
                if (locationData) await this.getDataByLocation(locationData);
                this.weatherStorage.setToLocalStorage('city', this.cityData.name);

            } catch (error) {
                if (error.code === error.PERMISSION_DENIED) {
                    try {
                        await this.getDataByCityName(this.defaultCity);
                        this.weatherStorage.setToLocalStorage('city', this.defaultCity);
                    } catch (error) {
                        alert(error.message);
                    }
                } else {
                    alert(`An error occurred. Please try again.`);
                }
            }
        } else {
            try {
                await this.getDataByCityName(city);
            } catch (error) {
                alert(error.message);
            }
        }
    }

    async getDataByCityName(city) {
        const data = await this.weatherStorage.getCurrentWeatherByCity(city, this.units);
        if (data) this.cityData = data;

        const forecast = await this.weatherStorage.getForecastWeatherByCity(city, this.units);
        if (forecast) this.respForecastData = forecast;
        this.modifyForecastData();
    }

    async getDataByLocation(cityLocationData) {
        const data = await this.weatherStorage.getCurrentWeatherByLocation(cityLocationData[0].lat, cityLocationData[0].lon, this.units);
        if (data) this.cityData = data;

        const forecast = await this.weatherStorage.getForecastWeatherByLocation(cityLocationData[0].lat, cityLocationData[0].lon, this.units);
        if (forecast) this.respForecastData = forecast;
        this.modifyForecastData();
    }

    setUnits(unitsValue) {
        this.weatherStorage.setToLocalStorage('units', unitsValue);
        this.units = unitsValue;
    }

    modifyForecastData() {
        const forecastSorted = this.respForecastData.list.reduce(function (acc, el) {
            let date = el.dt_txt.split(' ')[0];

            if (!acc[date]) acc[date] = {
                temp_max: [],
                temp_min: [],
                pressure: [],
                windSpeed: [],
                weather: [],
                icon: []
            };

            acc[date].temp_max.push(el.main.temp_max);
            acc[date].temp_min.push(el.main.temp_min);
            acc[date].pressure.push(el.main.pressure);
            acc[date].windSpeed.push(el.wind.speed);
            acc[date].weather.push(el.weather[0].main);
            acc[date].icon.push(el.weather[0].icon);

            return acc;
        }, {});
        this.modifiedForecastData = [];

        for (let date in forecastSorted) {
            const tempMax = this.findMaxValue(forecastSorted[date].temp_max);
            const tempMin = this.findMinValue(forecastSorted[date].temp_min);
            const pressure = this.findAvgValue(forecastSorted[date].pressure, 0);
            const windSpeed = this.findAvgValue(forecastSorted[date].windSpeed, 2);
            const weather = this.findMostRepeatedValue(forecastSorted[date].weather);
            const icon = this.findMostRepeatedValue(forecastSorted[date].icon);

            const forecastForDay = {
                dt: date,
                weather: [{main: weather, icon}],
                main: {
                    temp: `${tempMin.toFixed(0)}/${tempMax.toFixed(0)}`,
                    temp_max: tempMax,
                    temp_min: tempMin,
                    pressure
                },
                wind: {speed: windSpeed},
                sys: {
                    sunrise: this.respForecastData.city.sunrise,
                    sunset: this.respForecastData.city.sunset
                },
                name: this.respForecastData.city.name
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

    findImgSrc(img) {
        for (let icon in this.icons) {
            if (img === icon) return this.icons[icon];
        }
    }

    convertTime(unixTimestamp) {
        return new Date(unixTimestamp * 1000).toLocaleTimeString("en-US");
    }

    getFormattedDate(dateStr) {
        const date = new Date(Date.parse(dateStr));
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayOfWeek = weekdays[date.getUTCDay()];
        const month = months[date.getUTCMonth()];

        return `${dayOfWeek}, ${date.getUTCDate()} ${month}`;
    }
}