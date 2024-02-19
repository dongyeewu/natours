// import { Loader } from "@googlemaps/js-api-loader"
const Loader = require('@googlemaps/js-api-loader');

const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);

const loader = new Loader({
  apiKey: "YOUR_API_KEY",
  version: "weekly",
  ...additionalOptions,
});

loader.load().then(async () => {
  const { Map } = await google.maps.importLibrary("maps");

  map = new Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 8,
  });
});