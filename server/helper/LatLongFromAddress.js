import axios from 'axios'
const getLatLongFromAddressNominatim = async (address) => {
    const baseURL = process.env.NOMINATIM_URL; // Already includes /search
    try {
        const response = await axios.get(baseURL, {
            params: {
                q: address,   // Address query
                format: 'json', // JSON format for the response
                limit: 1       // Limit results to 1
            },
        });
        if (response.data && response.data.length > 0) {
            const { lat, lon } = response.data[0];
            return { latitude: lat, longitude: lon };
        } else {
            console.log('No results found for the specified address.');
            return null;
        }
    } catch (error) {
        console.error('Error fetching lat/long from Nominatim:', error);
        throw error;
    }
};
export default getLatLongFromAddressNominatim;