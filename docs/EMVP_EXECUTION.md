# Desk Lamp Generator — implementation status (develop, v0.9)

## What is live in the experimental browser MVP

| Stage | Implemented | Explicitly not yet validated |
| --- | --- | --- |
| 01 Shade | Taller Top original OBJ, height, width, waist, curvature, protected mount, optional separate top caps | Physical print and fit of extreme variants; constrained 2D free-form editor |
| 02 Bulb | Commercial kit identification form, body/cable dimensions, conservative compatibility contract, checks for missing data | Mechanical carrier generation, certified holder, real kit measurements, thermal/electrical tests |
| 03 Base | Existing exact Taller Stand and original Wibble selection | Wibble mount compatibility and physical fit |
| 04 Surface | Original, Soft (0.91×) and Defined (1.05×) radial relief based on original OBJ surface, with immutable lower mount | Physical assessment of all wall sections, printed samples |
| 05 Make | Individual original/deformed shade STL, base STL, optional separate cap STL, JSON v6 project with hardware/surface selection; compatibility checklist | Complete assembled kit STL/3MF; verified carrier; slicer testing of every variation |

## Design contract

- Never substitute Taller Top or Taller Stand with approximate replacements.
- All geometry modifications start from the original OBJ; changing controls does not accumulate deformation.
- Protected shade vertices below the assembly lock remain bitwise identical.
- `baseId:flat` remains Taller Stand for backwards compatibility.
- `wibble` is a separate selectable original stand, not an assumed interchangeable mechanical part.
- Only stage Make exports STL individual parts. These are clearly prototypes unless all physical checks have been carried out.
- Bulb profiles are keyed by commercial manufacturer/model and measured external dimensions. **E27 threads alone do not define a compatible product**.
- User-entered measurements or a manually entered test ID cannot convert a profile to “production-ready.”

## Technical arrangement

- `app.js`: existing OBJ loaders, geometry deformation, visor and STL/JSON.
- `compatibility.js`: pure, testable nominal interfaces + conservative safety status.
- `wizard.js`: 5-stage UI and per-stage state.
- `workflow.css`: desktop three-column and mobile responsive layout.
- `tests/compatibility.cjs`: no false certification, incomplete geometry and legacy checks.
- `tests/parametric_original.cjs`: shade parameter variants, cap STL, preserve protected vertices, surface intensity presets.

## Pending before a full functional desk lamp (not just experimental preview)

1. Receive exact commercial **LED low-voltage lighting kit** identifier and technical drawing, including its light-emitter package, housing, holder, connector, cable and strain relief.
2. Measure the physical kit using calipers; add source and test results.
3. Derive a mechanical carrier design constrained by exact interfaces for Taller and, separately, Wibble.
4. 3D print dimension coupons and prove both installation and removal, cable routing, mechanical retention and stability.
5. Thermal operation tests on printed material and electrical safety assessment by competent personnel.
6. Only then allow a combination into the production-compatible matrix and provide complete assembly export.

The two current stands are **not** automatically interchangeable. Physical installation validation is a gate, not a UI flag.

## Development checks

```sh
node --check app.js
node --check compatibility.js
node --check wizard.js
node tests/verify.cjs
node tests/taller_top.cjs
node tests/original_top.cjs
node tests/parametric_original.cjs
node tests/compatibility.cjs
node tests/stand.cjs
node tests/taller_base.cjs
node tests/assembly.cjs
node tests/export.cjs
```

GitHub Pages publishes **only from develop** after build/tests succeed. Master is kept for business vision and approved documentation.
