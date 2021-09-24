export default class TileData {
  private readonly heightData: Float32Array;
  private readonly _minHeight: number;
  private readonly _maxHeight: number;

  constructor(imageData: ImageData) {
    this.heightData = new Float32Array(imageData.width * imageData.height);

    this._minHeight = this._maxHeight = this.heightFromPixels(
      imageData.data[0],
      imageData.data[1],
      imageData.data[2]
    );

    for (let i = 0; i < this.heightData.length; ++i) {
      const imageDataArrayOffset = i * 4;

      this.heightData[i] = this.heightFromPixels(
        imageData.data[imageDataArrayOffset],
        imageData.data[imageDataArrayOffset + 1],
        imageData.data[imageDataArrayOffset + 2]
      );

      this._minHeight = Math.min(this.minHeight, this.heightData[i]);
      this._maxHeight = Math.max(this.maxHeight, this.heightData[i]);
    }
  }

  get minHeight() {
    return this._minHeight;
  }

  get maxHeight() {
    return this._maxHeight;
  }

  copyTo(target: Float32Array) {
    if (target.length !== this.heightData.length) {
      throw new Error("TileData#copyTo array size mismatch.");
    }

    target.set(this.heightData);
  }

  // Calculates height per the MapBox API:
  // https://docs.mapbox.com/help/troubleshooting/access-elevation-data/
  private heightFromPixels(r: number, g: number, b: number): number {
    return -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
  }
}
