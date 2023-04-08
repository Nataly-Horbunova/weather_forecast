class WeatherStorage {
    #baseUrl = 'http://api.openweathermap.org/'
    #appid = '31fdbea09ec46cb0d196ca9d28ad0701'
    currenCity;

    async requestData(url) {
        // const url = `${this.#baseUrl}data/2.5/forecast?id=703448&appid=${this.#appid}`
        const response = await fetch(url);

        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`${response.status}. An error occurred. Please try again later`);
        }
    }

    getFromLocalStorage() {
        let city = localStorage.getItem('city');
        if (city) {
            this.currenCity = city;
        }
        return city;
    }

    setToLocalStorage(city) {
        localStorage.setItem('city', city);
        this.currenCity = city;
    }

    async getCityLocation() {
        const url = `${this.#baseUrl}/geo/1.0/direct?q=${this.currenCity},&appid=${this.#appid}`
        return await this.requestData(url);
    }

    async getCurrentWeatherData(lat, lon) {
        const url = `${this.#baseUrl}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.#appid}`;
        return await this.requestData(url);
    }

   getCurrentLocationData() {
      //   let locationData;
      //
      // navigator.geolocation.getCurrentPosition((pos) => {
      //           locationData = [{
      //           lat: pos.coords.latitude,
      //           lon: pos.coords.longitude
      //       }]
      //   })
      //
      //   console.log(locationData);
      //   return locationData;
    }

}

class WeatherModel {
    cityData = '';

    constructor(storage) {
        this.weatherStorage = storage;
    }

    async getData() {
        localStorage.setItem('city', 'Odessa'); // TEST!!!!!!!!

        let cityLocationData;

        if (!this.weatherStorage.currenCity) {
            const city = this.weatherStorage.getFromLocalStorage();
            if (!city) {
                cityLocationData = this.weatherStorage.getCurrentLocationData();
            } else {
                cityLocationData = await this.weatherStorage.getCityLocation();
            }
        } else {
            cityLocationData = await this.weatherStorage.getCityLocation();
        }

        const data = await this.weatherStorage.getCurrentWeatherData(cityLocationData[0].lat, cityLocationData[0].lon);
        if (data) this.cityData = data;
        console.log('getDataModel');

        // await this.weatherStorage.requestData()
        //     .then(resp => this.data = resp)
        //     .catch(error => alert(error.message));
    }
}

class WeatherView {
    cityNameInput = document.querySelector('.city-input');

    constructor(model) {
        this.weatherModel = model;
    }

    async getData() {
        await this.weatherModel.getData();
        console.log('getDataView')

    }

    getCityOutput() {
        this.cityNameInput.addEventListener('keydown', async (e) => {
            if (e.key === "Enter" && this.cityNameInput.value) {
                this.weatherModel.weatherStorage.setToLocalStorage(this.cityNameInput.value);
                // localStorage.setItem('city', this.cityNameInput.value);
                await this.weatherModel.getData();
                this.render();
            }
        })
        console.log('getCityOutput');

    }

    render() {
        // console.log('render');
        console.log(this.weatherModel.cityData);
    }

    async init() {
        await this.getData();
        this.getCityOutput();
        this.render();
    }
}

let weatherApp = new WeatherView(new WeatherModel(new WeatherStorage));
weatherApp.init();
