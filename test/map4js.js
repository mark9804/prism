import fs from "fs";
import { read as readmat } from "mat-for-js";

fs.readFile("test/Truth_scene01.mat", null, (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  try {
    // 'data.buffer' provides the ArrayBuffer needed by mat-for-js
    const matContent = readmat(data.buffer);
    console.log(matContent);
    // Access variables, e.g., matContent.variables[0].data
  } catch (parseError) {
    console.error("Error parsing MAT file:", parseError);
  }
});
