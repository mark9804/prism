// HSI data structure and types

export interface HSIData {
  data: Float32Array | number[][][]; // [H, W, C] or [C, H, W]
  height: number;
  width: number;
  bands: number;
  wavelengths: number[];
  fieldName: string;
}

export interface HSITemplate {
  name: string;
  bands: number;
  wavelengthStart: number;
  wavelengthEnd: number;
  rgbBands: [number, number, number]; // [R, G, B] band indices
  defaultFieldName: string;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

// Type for image data in [H, W, C] format
export type ImageData3D = number[][][];

// Type for single band image [H, W]
export type ImageData2D = number[][];
