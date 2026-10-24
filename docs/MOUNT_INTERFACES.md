# OpenLamp Studio — Selected-base mounting contracts (v1.3)

## Goal
The physical joint is selected by **Base**, not by changing the decorative shape. The same Cylinder, Sphere, Pear, etc. can be reused with either original stand without scaling the stand. Switching Base recalculates alignment and automatically includes the appropriate joint in the 3D scene and in Make.

## Taller Stand: direct joint
- The unmodified original mesh remains the mounting reference.
- Taller ring seat nominal outer radius: **34.880 mm**.
- Shade inner ring radius: **35.044 mm**.
- Nominal radial clearance: **0.164 mm**, before FDM and material tolerances.
- Insertion depth: **14.17 mm**.
- Shade placement: stand top minus 14.17 mm.
- The shade STL remains standalone; no extra adapter file.

This uses the measured CAD coordinates established by the original Taller Top / Taller Stand assembly. It is NOT a certificate of physical printed fit.

## Wibble Stand: four-lobe conformal bridge (prototype)
The Wibble mesh is a sculptural upper termination with **four high curved lobes**. It has no equivalent verified circular male seat; applying the Taller collar directly would be incorrect.

`mount-adapters.js`:
1. Loads the **unchanged Wibble source mesh**.
2. Finds the highest tip in each quarter of its four-lobed top.
3. Builds a spatial index of original stand triangles near the crown.
4. Queries the true upper surface height at selected radial/angle positions.
5. Generates a **closed four-armed conformal adapter** with 0.6-mm relief over the CAD top surface.
6. Extends a standard **34.880-mm** seat for the existing **35.044-mm** shade socket.
7. Aligns the shade above the adapter plate, retaining nominal insertion.
8. Reuses the generated adapter for subsequent shade changes with the same Wibble source.
9. Exports a separate `openlamp-wibble-acople-prototipo.stl` file in Make.
10. Displays the adapter as a separate visible solid in the 3D assembly.

The original Wibble STL and shade body geometry remain untouched. The adapter changes when changing the selected base, and disappears for Taller.

### Critical limitations
- This bridge is a **CAD prototype**, not an approved friction-fit, snap, retention or load-bearing joint.
- Its sampled underside is matched to the input triangle mesh, but printed dimensional deviation, surface roughness, local side clearances, stable retention, load and heat must be **physically tested**.
- Contact at the top lobes alone is NOT evidence of captive mechanical retention under tipping or vibration.
- No kit, lampholder, LED thermal envelope or electrical installation is certified.
- Do not present this in Make as a production-ready complete desk lamp.

## Validation and tests
- `tests/mount-adapters.cjs` checks four detected stand tips, the source's top surface height, CAD-separated mount types, a closed adapter STL, and source mesh preservation.
- `tests/compatibility.cjs` prevents prototype flags from being elevated to certified fit.
- `tests/browser_shade.py` changes Taller → Wibble → Taller and checks the generated adapter STL appears and disappears.
- All existing Shade/Stand STL exports and prior JSON project versions remain available.

## Physical acceptance steps
Print a four-lobe fit coupon (or the full adapter) on the target printer and material. Inspect contact, install/remove cycling, measured dimensional error, tipping resistance and collision-free mount. Revise clearance and retention geometry based on those measurements before calling it a validated mechanical assembly.
