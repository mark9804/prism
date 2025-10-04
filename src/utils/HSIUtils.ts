/* eslint-env browser, node */

// HSI (Hyperspectral Imaging) utility functions
// Reference: test/visualize.py and test/utils.py

import * as matForJs from "mat-for-js";
import type {
  HSIData,
  RGBColor,
  ImageData3D,
  ImageData2D,
} from "@/types/HSITypes";

/**
 * HSI Utilities Class
 * Provides functions for loading, processing, and visualizing hyperspectral images
 */
export class HSIUtils {
  /**
   * Load .mat file in browser environment
   * Supports auto-detection of field names: 'img', 'truth', 'img_expand'
   */
  static async loadMatFile(
    file: File,
    fieldName?: string
  ): Promise<HSIData | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const matData = matForJs.read(new Uint8Array(arrayBuffer));

      // Auto-detect field name if not provided
      const possibleFields = ["img", "truth", "img_expand", "mask"];
      let dataField: string | undefined = fieldName;

      if (!dataField) {
        for (const field of possibleFields) {
          if (matData[field]) {
            dataField = field;
            break;
          }
        }
      }

      if (!dataField || !matData[dataField]) {
        // eslint-disable-next-line no-undef
        console.error("Could not find HSI data in .mat file");
        return null;
      }

      const rawData = matData[dataField];

      // Determine dimensions - MATLAB format is typically [H, W, C]
      let height: number, width: number, bands: number;
      let data: number[][][];

      if (
        Array.isArray(rawData) &&
        rawData.length > 0 &&
        Array.isArray(rawData[0]) &&
        rawData[0].length > 0 &&
        Array.isArray(rawData[0][0]) &&
        rawData[0][0].length > 0
      ) {
        height = rawData.length;
        width = rawData[0].length;
        bands = rawData[0][0].length;
        data = rawData as number[][][];
      } else {
        // eslint-disable-next-line no-undef
        console.error("Unexpected data format in .mat file");
        return null;
      }

      // Generate wavelength array (will be set properly when template is selected)
      const wavelengths = this.generateWavelengths(bands, 450, 650);

      return {
        data,
        height,
        width,
        bands,
        wavelengths,
        fieldName: dataField,
      };
    } catch (error) {
      // eslint-disable-next-line no-undef
      console.error("Error loading .mat file:", error);
      return null;
    }
  }

  /**
   * Convert HSI data to RGB image
   * Reference: visualize.py lines 54-60
   * @param hsiData - HSI data in [H, W, C] format
   * @param bands - RGB band indices [R, G, B], defaults to [23, 14, 3] for 28-band
   */
  static hsiToRgb(
    hsiData: ImageData3D,
    bands: [number, number, number] = [23, 14, 3]
  ): ImageData3D {
    const [r, g, b] = bands;
    const height = hsiData.length;
    if (height === 0) return [];

    const width = hsiData[0]!.length;

    const rgb: ImageData3D = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => [0, 0, 0])
    );

    // Extract RGB bands
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        rgb[i]![j]![0] = hsiData[i]![j]![r]!;
        rgb[i]![j]![1] = hsiData[i]![j]![g]!;
        rgb[i]![j]![2] = hsiData[i]![j]![b]!;
      }
    }

    // Normalize to 0-1 range
    return this.normalize(rgb);
  }

  /**
   * Convert wavelength (nm) to RGB color
   * Reference: visualize.py lines 62-107
   * Visible spectrum is approximately 380nm to 750nm
   */
  static wavelengthToRgb(wavelength: number): RGBColor {
    let R = 0.0,
      G = 0.0,
      B = 0.0;

    // Color mapping based on wavelength
    if (wavelength >= 380 && wavelength < 440) {
      R = -(wavelength - 440) / (440 - 380);
      G = 0.0;
      B = 1.0;
    } else if (wavelength >= 440 && wavelength < 490) {
      R = 0.0;
      G = (wavelength - 440) / (490 - 440);
      B = 1.0;
    } else if (wavelength >= 490 && wavelength < 510) {
      R = 0.0;
      G = 1.0;
      B = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
      R = (wavelength - 510) / (580 - 510);
      G = 1.0;
      B = 0.0;
    } else if (wavelength >= 580 && wavelength < 645) {
      R = 1.0;
      G = -(wavelength - 645) / (645 - 580);
      B = 0.0;
    } else if (wavelength >= 645 && wavelength <= 750) {
      R = 1.0;
      G = 0.0;
      B = 0.0;
    } else {
      R = 0.0;
      G = 0.0;
      B = 0.0;
    }

    // Intensity correction factor
    let factor = 1.0;
    if (wavelength >= 380 && wavelength < 420) {
      factor = 0.3 + 0.7 * ((wavelength - 380) / (420 - 380));
    } else if (wavelength >= 420 && wavelength < 645) {
      factor = 1.0;
    } else if (wavelength >= 645 && wavelength <= 750) {
      factor = 0.3 + 0.7 * ((750 - wavelength) / (750 - 645));
    }

    R = R * factor;
    G = G * factor;
    B = B * factor;

    return { r: R, g: G, b: B };
  }

  /**
   * Normalize data to [0, 1] range
   */
  static normalize(data: ImageData3D): ImageData3D {
    const height = data.length;
    if (height === 0) return [];

    const width = data[0]!.length;
    const channels = data[0]![0]!.length;

    // Find min and max across all values
    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        for (let k = 0; k < channels; k++) {
          const val = data[i]![j]![k]!;
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
    }

    const range = max - min;
    if (range === 0) return data; // Avoid division by zero

    // Normalize
    const normalized: ImageData3D = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => Array(channels).fill(0))
    );

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        for (let k = 0; k < channels; k++) {
          normalized[i]![j]![k] = (data[i]![j]![k]! - min) / range;
        }
      }
    }

    return normalized;
  }

  /**
   * Calculate difference between reconstructed and ground truth images
   * Returns absolute difference
   */
  static calculateDifference(
    reconstructed: ImageData3D,
    groundTruth: ImageData3D
  ): ImageData3D {
    const height = groundTruth.length;
    if (height === 0) return [];

    const width = groundTruth[0]!.length;
    const bands = groundTruth[0]![0]!.length;

    const diff: ImageData3D = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => Array(bands).fill(0))
    );

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        for (let k = 0; k < bands; k++) {
          diff[i]![j]![k] = Math.abs(
            reconstructed[i]![j]![k]! - groundTruth[i]![j]![k]!
          );
        }
      }
    }

    return diff;
  }

  /**
   * Apply color map to single-band image for visualization
   * Uses a simple hot colormap (black -> red -> yellow -> white)
   */
  static applyColorMap(
    data: ImageData2D,
    colorMap: "hot" | "jet" | "viridis" = "hot"
  ): ImageData3D {
    const height = data.length;
    if (height === 0) return [];

    const width = data[0]!.length;

    // Normalize to [0, 1]
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (data[i]![j]! < min) min = data[i]![j]!;
        if (data[i]![j]! > max) max = data[i]![j]!;
      }
    }

    const range = max - min;
    const rgb: ImageData3D = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => [0, 0, 0])
    );

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const normalized = range === 0 ? 0 : (data[i]![j]! - min) / range;

        if (colorMap === "hot") {
          // Hot colormap: black -> red -> yellow -> white
          if (normalized < 0.33) {
            rgb[i]![j] = [normalized * 3, 0, 0];
          } else if (normalized < 0.67) {
            rgb[i]![j] = [1, (normalized - 0.33) * 3, 0];
          } else {
            rgb[i]![j] = [1, 1, (normalized - 0.67) * 3];
          }
        } else if (colorMap === "jet") {
          // Jet colormap approximation
          const r = Math.max(
            0,
            Math.min(1, 1.5 - Math.abs(4 * normalized - 3))
          );
          const g = Math.max(
            0,
            Math.min(1, 1.5 - Math.abs(4 * normalized - 2))
          );
          const b = Math.max(
            0,
            Math.min(1, 1.5 - Math.abs(4 * normalized - 1))
          );
          rgb[i]![j] = [r, g, b];
        } else {
          // viridis approximation (simple version)
          rgb[i]![j] = [
            normalized * 0.3,
            normalized * 0.8,
            0.3 + normalized * 0.5,
          ];
        }
      }
    }

    return rgb;
  }

  /**
   * Apply wavelength-based color filter to single-band image
   * Reference: visualize.py lines 236-241
   */
  static applyWavelengthColor(
    bandData: ImageData2D,
    wavelength: number
  ): ImageData3D {
    const height = bandData.length;
    if (height === 0) return [];

    const width = bandData[0]!.length;

    // Get color for this wavelength
    const color = this.wavelengthToRgb(wavelength);

    // Normalize band data to act as intensity mask
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        if (bandData[i]![j]! < min) min = bandData[i]![j]!;
        if (bandData[i]![j]! > max) max = bandData[i]![j]!;
      }
    }

    const range = max - min;
    const rgb: ImageData3D = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => [0, 0, 0])
    );

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const intensity = range === 0 ? 0 : (bandData[i]![j]! - min) / range;
        rgb[i]![j] = [
          intensity * color.r,
          intensity * color.g,
          intensity * color.b,
        ];
      }
    }

    return rgb;
  }

  /**
   * Calculate CASSI measurement from HSI data and mask
   * Reference: visualize.py line 145 - init_meas
   * @param hsiData - Ground truth HSI data [H, W, C]
   * @param maskData - Mask data [H, W, C]
   * @returns Compressed measurement image [H, W]
   */
  static calculateMeasurement(
    hsiData: ImageData3D,
    maskData: ImageData3D
  ): ImageData2D {
    const height = hsiData.length;
    if (height === 0) return [];

    const width = hsiData[0]!.length;
    const bands = hsiData[0]![0]!.length;

    const measurement: ImageData2D = Array.from({ length: height }, () =>
      Array(width).fill(0)
    );

    // CASSI measurement: sum(HSI * mask) across spectral dimension
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        let sum = 0;
        for (let k = 0; k < bands; k++) {
          sum += hsiData[i]![j]![k]! * maskData[i]![j]![k]!;
        }
        measurement[i]![j] = sum;
      }
    }

    return measurement;
  }

  /**
   * Extract single band from HSI data [H, W, C] -> [H, W]
   */
  static extractBand(hsiData: ImageData3D, bandIndex: number): ImageData2D {
    const height = hsiData.length;
    if (height === 0) return [];

    const width = hsiData[0]!.length;

    const band: ImageData2D = Array.from({ length: height }, () =>
      Array(width).fill(0)
    );

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        band[i]![j] = hsiData[i]![j]![bandIndex]!;
      }
    }

    return band;
  }

  /**
   * Generate wavelength array for given number of bands
   * @param numBands - Number of spectral bands
   * @param startWl - Starting wavelength in nm
   * @param endWl - Ending wavelength in nm
   */
  static generateWavelengths(
    numBands: number,
    startWl: number,
    endWl: number
  ): number[] {
    const wavelengths: number[] = [];
    const step = (endWl - startWl) / (numBands - 1);

    for (let i = 0; i < numBands; i++) {
      wavelengths.push(startWl + i * step);
    }

    return wavelengths;
  }

  /**
   * Calculate mean spectrum from a patch
   * Reference: visualize.py lines 200-215
   */
  static calculateMeanSpectrum(
    hsiData: ImageData3D,
    centerH: number,
    centerW: number,
    patchSize: number
  ): number[] {
    const height = hsiData.length;
    if (height === 0) return [];

    const width = hsiData[0]!.length;
    const bands = hsiData[0]![0]!.length;

    const halfPatch = Math.floor(patchSize / 2);
    const startH = Math.max(0, centerH - halfPatch);
    const endH = Math.min(height, centerH + halfPatch);
    const startW = Math.max(0, centerW - halfPatch);
    const endW = Math.min(width, centerW + halfPatch);

    const spectrum: number[] = Array(bands).fill(0);
    let count = 0;

    for (let i = startH; i < endH; i++) {
      for (let j = startW; j < endW; j++) {
        for (let k = 0; k < bands; k++) {
          spectrum[k]! += hsiData[i]![j]![k]!;
        }
        count++;
      }
    }

    // Average
    for (let k = 0; k < bands; k++) {
      spectrum[k]! /= count;
    }

    return spectrum;
  }

  /**
   * Convert ImageData3D to ImageData for canvas rendering
   */
  static toImageData(rgb: ImageData3D): ImageData {
    const height = rgb.length;
    if (height === 0) return new ImageData(1, 1);

    const width = rgb[0]!.length;
    const imageData = new ImageData(width, height);

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const idx = (i * width + j) * 4;
        // Ensure values are in [0, 255] range
        imageData.data[idx] = Math.floor(
          Math.min(255, Math.max(0, rgb[i]![j]![0]! * 255))
        );
        imageData.data[idx + 1] = Math.floor(
          Math.min(255, Math.max(0, rgb[i]![j]![1]! * 255))
        );
        imageData.data[idx + 2] = Math.floor(
          Math.min(255, Math.max(0, rgb[i]![j]![2]! * 255))
        );
        imageData.data[idx + 3] = 255; // Alpha
      }
    }

    return imageData;
  }
}
