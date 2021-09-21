export default class TileData {
  constructor(private readonly imageData: ImageData) {}

  get width() {
    return this.imageData.width;
  }

  get height() {
    return this.imageData.height;
  }

  heightAtCoords(x: number, y: number): number {
    // Convert the x/y coordinate into a one-dimensional pixel index.
    const pixelIndex = x + y * this.imageData.width;

    // Calculate the offset into the array: pixelIndex * elements per pixel.
    const arrayOffset = pixelIndex * 4;

    if (arrayOffset >= this.imageData.data.length) {
      console.warn(`Requested pixel x:${x} y:${y} is out of range.`);
      return 0;
    }

    // Calculate elevation as specified in the MapBox API:
    // https://docs.mapbox.com/help/troubleshooting/access-elevation-data/
    return (
      -10000 +
      (this.imageData.data[arrayOffset] * 256 * 256 +
        this.imageData.data[arrayOffset + 1] * 256 +
        this.imageData.data[arrayOffset + 2]) *
        0.1
    );
  }
}
