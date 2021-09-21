import * as tilebelt from "@mapbox/tilebelt";
import TileData from "./TileData";

const baseMapboxUrl = "https://api.mapbox.com/v4/mapbox.terrain-rgb";
const accessToken =
  "pk.eyJ1IjoibXN0YXJyIiwiYSI6ImNrdHU0bjVpbjF3Y2Iyb28yZXp4cmVoZGcifQ.8-2jWyfD910ZNyZepH8jgw";

// const testUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/14/12558/6127.pngraw?access_token=pk.eyJ1IjoibXN0YXJyIiwiYSI6ImNrdHU0bjVpbjF3Y2Iyb28yZXp4cmVoZGcifQ.8-2jWyfD910ZNyZepH8jgw`;

// this should support concurrent requests, create a canvas element for each one,
// figure out debug rendering later
export default class TileRetriever {
  static async retrieveTile(
    longitude: number,
    latitude: number,
    zoom: number
  ): Promise<TileData> {
    const tile = tilebelt.pointToTile(longitude, latitude, zoom);
    const tileUrl = `${baseMapboxUrl}/${tile[2]}/${tile[0]}/${tile[1]}.pngraw?access_token=${accessToken}`;
    const image = await TileRetriever.loadImageFromUrl(tileUrl);
    return TileRetriever.tileDataFromImage(image);
  }

  private static loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.crossOrigin = "Anonymous";

    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  private static tileDataFromImage(image: HTMLImageElement) {
    const canvas = document.getElementById("tile-canvas") as HTMLCanvasElement;
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);

    return new TileData(context.getImageData(0, 0, image.width, image.height));
  }
}
