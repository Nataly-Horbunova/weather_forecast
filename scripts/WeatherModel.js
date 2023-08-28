class WeatherModel {
    cityData = '';
    respForecastData = '';
    modifiedForecastData = [];
    units = 'metric';
    defaultCity = 'Kyiv';

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
                mostRepeatedVal = val; 
            }
        });

        return mostRepeatedVal;
    }

    findImgSrc(img) {
        let iconName;
        switch (img) {
            case '01d':
            case '01n':
                iconName = 'clear_sky.png';
                break;
            case '02d':
            case '02n':
                iconName = 'few_clouds.png';
                break;
            case '03d':
            case '03n':
                iconName = 'scattered_clouds.png';
                break;
            case '04d':
            case '04n':
                iconName = 'broken_clouds.png';
                break;
            case '09d':
            case '09n':
                iconName = 'shower_rain.png';
                break;
            case '10d':
            case '10n':
                iconName = 'rain.png';
                break;
            case '11d':
            case '11n':
                iconName = 'thunderstorm.png';
                break;
            case '13d':
            case '13n':
                iconName = 'snow.png';
                break;
            case '50d':
            case '50n':
                iconName = 'mist.png';
                break;
        }

        return `./assets/${iconName}`;
    }

    convertTime(unixTimestamp) {
        return new Date(unixTimestamp * 1000).toLocaleTimeString("en-US");
    }

    getFormattedDate(dateStr) {
        const date = new Date(Date.parse(dateStr));
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dayOfWeek = weekdays[date.getDay()];
        const month = months[date.getMonth()];
        return `${dayOfWeek}, ${date.getDate()} ${month}`;
    }

    getCurrentHours(){
        return new Date().getHours();
    }
}