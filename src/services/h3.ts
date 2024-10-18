import { gridDisk, latLngToCell } from "h3-js";

/**
 * Converts latitude and longitude into an H3 geo-index.
 * 
 * @param latitude The geographic latitude of the point, typically ranging between -90 and 90 degrees.
 * @param longitude The geographic longitude of the point, typically ranging between -180 and 180 degrees.
 * @param resolution The resolution level for the H3 index, where lower numbers represent coarser grids (large hexagons), and higher numbers represent finer grids (smaller hexagons). Valid resolution levels are between 0 and 15.
 * @returns The H3 geo-index as a string, representing the hexagon corresponding to the given coordinates at the specified resolution.
 */
export function getGeoIndexFromLatLng(latitude: number, longitude: number, resolution: number): string {
    return latLngToCell(latitude, longitude, resolution);
}

/**
 * Finds all H3 cells connected to the center cell within the given degree.
 * 
 * @param centerIndex The H3 geo-index (hexagonal index) of the center cell from which to start the search.
 * @param degree The "radius" or distance (in hexagonal steps) from the center cell. A degree of 1 finds the immediate neighboring cells, while higher degrees find cells farther out.
 * @returns An array of H3 geo-indices representing the cells connected to the center cell within the specified degree.
 */
export function findConnectedCells(centerIndex: string, degree: number): string[] {
    return gridDisk(centerIndex, degree);
}