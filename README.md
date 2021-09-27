# Terrain Mapping using MapBox and three.js

## Overview

[Demo](https://mike-starr.github.io/mapbox-terrain-mapping/example/index.html)

A visualization tool for MapBox terrain data. Retrieves elevation data from the [MapBox API](https://docs.mapbox.com/help/troubleshooting/access-elevation-data/), converts it to a height map, and applies it to a plane mesh.

Four shading modes are provided:

**Gradient**: Colors the mesh by height. Blue at lower elevations, red at higher elevations.

![Gradient](https://mike-starr.github.io/mapbox-terrain-mapping/gradient.png?)

**Source Texture**: Textures the mesh with the source image from MapBox.

![Gradient](https://mike-starr.github.io/mapbox-terrain-mapping/texture.png?)

**Normals**: Computes (approximate) normals from the height map and visualizes them as color values.

![Gradient](https://mike-starr.github.io/mapbox-terrain-mapping/normals.png?)

**Lighting**: Lights the mesh with a single directional light.

![Gradient](https://mike-starr.github.io/mapbox-terrain-mapping/lighting.png?)

## Building / Running
```npm install```

```npm run serve```
