import * as tilebelt from "@mapbox/tilebelt";
import TileData from "./TileData";

const baseMapboxUrl = "https://api.mapbox.com/v4/mapbox.terrain-rgb";
const accessToken =
  "pk.eyJ1IjoibXN0YXJyIiwiYSI6ImNrdHU0bjVpbjF3Y2Iyb28yZXp4cmVoZGcifQ.8-2jWyfD910ZNyZepH8jgw";

export default class TileRetriever {
  constructor(private readonly canvas: HTMLCanvasElement) {}

  async retrieveTile(
    longitude: number,
    latitude: number,
    zoom: number
  ): Promise<TileData> {
    const tile = tilebelt.pointToTile(longitude, latitude, zoom);
    const tileUrl = `${baseMapboxUrl}/${tile[2]}/${tile[0]}/${tile[1]}.pngraw?access_token=${accessToken}`;
    const image = await this.loadImageFromUrl(tileUrl);
    return this.tileDataFromImage(image);
  }

  private loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.crossOrigin = "Anonymous";

    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  private tileDataFromImage(image: HTMLImageElement) {
    this.canvas.width = image.width;
    this.canvas.height = image.height;

    const context = this.canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);

    return new TileData(context.getImageData(0, 0, image.width, image.height));
  }
}
