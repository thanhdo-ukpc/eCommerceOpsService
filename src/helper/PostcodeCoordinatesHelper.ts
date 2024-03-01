import axios from 'axios';
const https = require('https');

axios.defaults.timeout = 60 * 1000;
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });

export class PostcodeCoordinatesHelper {
    private readonly apiPath = 'https://api.promaptools.com/service/uk/postcode-lat-lng/get';
    private readonly apiKey = '17o8dysaCDrgvlc';

    getCoordinatesFromPostcodes = async (postcodes: string[]) => {
        if (postcodes.length === 0) return [];

        const coordinates = await Promise.all(
            postcodes.map(async (postcode) => {
                return await axios
                    .get(this.apiPath, {
                        headers: {
                            origin: 'https://www.freemaptools.com',
                        },
                        params: {
                            postcode,
                            key: this.apiKey,
                        },
                    })
                    .then((res) => {
                        if (!res.data.output) return null;

                        return {
                            Postcode: res.data.output[0].postcode as string,
                            Latitude: Number(res.data.output[0].latitude),
                            Longitude: Number(res.data.output[0].longitude),
                        };
                    });
            })
        );

        return coordinates.filter((c) => c);
    };
}

export const postcodeCoordinatesHelper = new PostcodeCoordinatesHelper();
