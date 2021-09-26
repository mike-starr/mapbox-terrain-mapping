import * as tilebelt from "@mapbox/tilebelt";

const baseMapboxUrl = "https://api.mapbox.com/v4/mapbox.terrain-rgb";
const accessToken =
  "pk.eyJ1IjoibXN0YXJyIiwiYSI6ImNrdHU0bjVpbjF3Y2Iyb28yZXp4cmVoZGcifQ.8-2jWyfD910ZNyZepH8jgw";

/**
 * Retrieves tile data from the MapBox API.
 */
export default class TileRetriever {
  /**
   * @param canvas Canvas element to be used to process the retrieved image.
   */
  constructor(private readonly canvas: HTMLCanvasElement) {}

  /**
   * Requests a tile from the MapBox API for the desired location/zoom
   * and converts it to a {@link ImageData} object.
   *
   * Calling this function successively before a prior request has completed
   * will produce non-deterministic results; the canvas used for processing
   * the image is shared between all requests.
   *
   * @param longitude Longitude of desired location.
   * @param latitude Latitude of desired location.
   * @param zoom Zoom level per MapBox.
   * @returns An {@link ImageData} object for the requested location.
   */
  async retrieveTile(
    longitude: number,
    latitude: number,
    zoom: number
  ): Promise<ImageData> {
    const tile = tilebelt.pointToTile(longitude, latitude, zoom);
    const tileUrl = `${baseMapboxUrl}/${tile[2]}/${tile[0]}/${tile[1]}.pngraw?access_token=${accessToken}`;
    const image = await this.loadImageFromUrl(tileUrl);
    return this.tileDataFromImage(image);
  }

  /**
   * Loads an image from a URL into an image element.
   *
   * @param url The URL.
   * @returns An HTMLImageElement containing the requested image.
   */
  private loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.crossOrigin = "Anonymous";

    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  /**
   * Extracts image data from an HTMLImageElement.
   *
   * @param image HTMLImageElement containing the image.
   * @returns An {@link ImageData} object initialized with the image.
   */
  private tileDataFromImage(image: HTMLImageElement) {
    this.canvas.width = image.width;
    this.canvas.height = image.height;

    const context = this.canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, image.width, image.height)
  }
}
