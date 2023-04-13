class WeatherView {
    inputCityName = document.querySelector('.city-input');
    celsiusBtn = document.querySelector('.celsius');
    fahrenheitBtn = document.querySelector('.fahrenheit')

    constructor(model) {
        this.weatherModel = model;
        this.weatherStorage = model.weatherStorage;
    }

    getCityOutput() {
        this.inputCityName.addEventListener('keydown', async (e) => {
            if (e.key === "Enter" && this.inputCityName.value) {
                try {
                    await this.weatherModel.getDataByCityName(this.inputCityName.value);
                    this.weatherStorage.setToLocalStorage('city', this.inputCityName.value);
                    this.hideError();
                    this.renderAll();
                } catch (error) {
                    if (error.message === 'Not found') {
                        this.showError();
                    } else {
                        alert(error.message);
                    }
                } finally {
                    this.inputCityName.value = '';
                }
            }
        })
    }

    renderAll() {
        this.weatherModel.cityData && this.renderCurrentData(this.weatherModel.cityData, 0);
        this.weatherModel.modifiedForecastData && this.renderForecastData();
    }

    renderCurrentData(data, id) {
        document.querySelector('.current-info-wrapper').classList.remove('hidden');
        document.querySelector('.current-weather-wrapper').classList.remove('hidden');

        document.querySelector('.current-city-name').innerText = this.weatherModel.cityData.name;

        if (this.weatherModel.units === "metric") {
            this.celsiusBtn.classList.add('active');
        } else if (this.weatherModel.units === "imperial") {
            this.fahrenheitBtn.classList.add('active');
        }

        const currentDate = document.querySelector('.current-weather-day');
        currentDate.innerText = this.weatherModel.getFormattedDate(this.weatherModel.modifiedForecastData[id].dt);

        const currentImg = document.querySelector('.current-weather-img');
        currentImg.src = this.weatherModel.findImgSrc(data.weather[0].icon);

        const temperature = document.querySelector('.current-weather-temperature');
        const temp = typeof data.main.temp === 'number' ? data.main.temp.toFixed(0) : data.main.temp;
        const tempUnits = this.weatherModel.units === 'metric' ? '°C' : '°F'
        temperature.innerText = temp + tempUnits;

        const weather = document.querySelector('.current-weather-description');
        weather.innerHTML = data.weather[0].main;

        const sunrise = document.querySelector('.sunrise-value');
        sunrise.innerText = this.weatherModel.convertTime(data.sys.sunrise);

        const sunset = document.querySelector('.sunset-value');
        sunset.innerText = this.weatherModel.convertTime(data.sys.sunset);

        const wind = document.querySelector('.wind-value');
        const windUnits = this.weatherModel.units === 'metric' ? 'm/s' : 'm/h'
        wind.innerHTML = data.wind.speed + windUnits;

        const pressure = document.querySelector('.pressure-value');
        pressure.innerHTML = data.main.pressure + ' hPa';
    }

    renderForecastData() {
        const forecastWrapper = document.querySelector('.next-forecast-wrapper');
        forecastWrapper.innerHTML = '';

        for (let i = 0; i < this.weatherModel.modifiedForecastData.length; i++) {
            const fragment = new DocumentFragment();
            const forecastDiv = this.createElem('DIV', fragment, ['next-day-forecast'], [{type: 'data-id', value: i}]);
            if (i === 0) forecastDiv.classList.add('active');

            forecastDiv.addEventListener('click', (e) => {
                document.querySelectorAll('.next-day-forecast').forEach(item => item.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const index = e.currentTarget.dataset.id;
                if(i === 0) {
                    this.renderCurrentData(this.weatherModel.cityData, index);
                } else {
                    this.renderCurrentData(this.weatherModel.modifiedForecastData[index], index);
                }
            });

            const dateText = this.weatherModel.getFormattedDate(this.weatherModel.modifiedForecastData[i].dt);
            this.createElem('DIV', forecastDiv, ['next-forecast-date'], null, dateText);

            this.createElem(
                'IMG',
                forecastDiv,
                ['next-forecast-img'],
                [{
                    type: 'src',
                    value: this.weatherModel.findImgSrc(this.weatherModel.modifiedForecastData[i].weather[0].icon)
                },
                    {type: 'alt', value: 'forecast-icon'}]);

            const minTemp = (this.weatherModel.modifiedForecastData[i].main.temp_min).toFixed(0);
            const maxTemp = (this.weatherModel.modifiedForecastData[i].main.temp_max).toFixed(0);
            const tempUnits = this.weatherModel.units === 'metric' ? '°C' : '°F'
            this.createElem('DIV', forecastDiv, ['next-forecast-temperature'], null, `${minTemp}/${maxTemp}${tempUnits}`);
            forecastWrapper.append(fragment);
        }

    }

    createElem(tag, parent, classLists, attrs, text) {
        const el = document.createElement(tag);
        parent && parent.appendChild(el);

        if (classLists) {
            for (const classList of classLists) {
                el.classList.add(classList);
            }
        }

        if (attrs) {
            for (const attr of attrs) {
                el.setAttribute(attr.type, attr.value);
            }
        }

        if (text) {
            el.innerText = text;
        }
        return el;
    }

    changeUnits() {
        document.querySelector('.degrees-scale-wrapper').addEventListener('click', async (e) => {
            if (e.target.classList.contains('fahrenheit') && this.weatherModel.units !== 'imperial') {

                try {
                    this.celsiusBtn.classList.remove('active');
                    e.target.classList.add('active');
                    this.weatherModel.setUnits('imperial');
                    await this.weatherModel.getDataByCityName(this.weatherModel.cityData.name);
                } catch (error) {
                    alert(error.message);
                }

            } else if (e.target.classList.contains('celsius') && this.weatherModel.units !== 'metric') {

                try {
                    this.fahrenheitBtn.classList.remove('active');
                    e.target.classList.add('active');
                    this.weatherModel.setUnits('metric');
                    await this.weatherModel.getDataByCityName(this.weatherModel.cityData.name);
                } catch (error) {
                    alert(error.message);
                }

            }
            this.renderAll();
        })
    }

    showError() {
        document.querySelector('.current-city-wrapper').classList.add('hidden');
        document.querySelector('.error').classList.remove('hidden');
    }
    hideError() {
        document.querySelector('.current-city-wrapper').classList.remove('hidden');
        document.querySelector('.error').classList.add('hidden');
    }

    init() {
        this.weatherModel.initRequest()
            .then( () => {
                this.renderAll();
                this.getCityOutput();
                this.changeUnits();
            });
    }
}