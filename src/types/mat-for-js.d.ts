// Type definitions for mat-for-js
declare module "mat-for-js" {
  export function read(data: Uint8Array): Record<string, any>;
  export function write(data: Record<string, any>): Uint8Array;
}
