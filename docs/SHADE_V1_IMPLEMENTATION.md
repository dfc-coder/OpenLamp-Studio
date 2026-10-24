# OpenLamp Studio — Shade v1.0 implementation and gates

## Scope completed on develop

The **original 684,792-triangle Taller Top OBJ is still the sole master**. No replacement geometry, no new ribs, and no changes to Taller Stand or Wibble Stand.

### New source files

- `shade-design.js`: three restrained profile grammars (Vertical, Soft, Flared); normalized, clamped, monotone cubic Hermite radial-offset curves; percentile-derived source outer-envelope measurements.
- `shade-editor.js`: SVG side-profile editor with constrained horizontal semantic control points, source silhouette reference, family selection, undo/redo and keyboard arrows.
- `shade-editor.css`: local editor styles, no new UI framework.
- `app.js`: the family offsets are applied to the **original triangle-indexed source mesh**, with the bottom mounting area protected. JSON v7 stores the new `shadeDesign` object while reading previous project versions. Shade reset preserves the Surface stage settings.
- `OpenLampBridge.getShadeInterface()`: measured final envelope + immutable mounting interface exposed to Bulb, with the explicit physical-validation status.

### Original vs variants

- `original`: original coordinates and original triangle indices, including ribs, when the dimensions and surface intensity are at default.
- `vertical`: a dominant vertical volume, moderate waist, small shoulder.
- `soft`: rounded dominant body volume, smooth profile.
- `flared`: expanding shoulder and upper termination.

Each family has specific permitted height/nominal-diameter ranges and limited radial offsets at five semantically meaningful points. The first mounting point is permanently fixed. The spline does not have free-form control points. No designer can move the montage.

### Automated tests

- `tests/shade-design.cjs`: family definitions, bounds, no overshoot, G1 tangent continuity, envelope extraction.
- `tests/shade-mesh.cjs`: validates the original OBJ and all three family variations, unchanged mounting vertex coordinates and unchanged original faces.
- Historical `tests/parametric_original.cjs` and `tests/assembly.cjs` remain in CI.
- `tests/browser_shade.py` and `.github/workflows/shade-browser.yml`: Chromium workflow smoke and SVG family-sheet screenshots for review.

The GitHub Pages workflow requires these tests before publishing. Existing five-step navigation and STL output are retained.

## Not completed / not certified

1. **G2 continuity / curvature-comb design review:** G1 continuity is exercised; G2 is not guaranteed globally, nor is every smooth transition required to be G2.
2. **Shell wall thickness** under all combinations: not yet measured by robust surface-to-surface proximity; triangle-index preservation and positive volume alone are insufficient.
3. **Global self-intersection certification** for all allowable designs: not yet implemented using a mesh boolean/geometry library.
4. **Browser E2E:** Chromium smoke checks navigation, family selection, Surface isolation, reset and mounting interface. It runs with WebGL disabled to isolate UI; full WebGL rendering, pointer drag gestures, pixel regression and Firefox remain unverified. Four SVG profile captures are saved as CI artifacts.
5. **Curatorial review** and printed-test acceptance: the three initial family curves are prototype design seeds; they are not user-approved final consumer styles.
6. **Mechanical carrier, thermal and electrical safety**: handled in Bulb; not claims of Shade acceptance.

Do not present Shade v1.0 as manufactured-product certified or these prototype families as final award-quality designs until reviewed. The original geometry remains the source of truth.

## Implementation invariants

- No new base or hardware models.
- No regeneration of the source's vertical ribs.
- No geometry mutation accumulated from previous deformation outputs.
- On `shadeDesign.family='original'` with original dimensions and surface intensity 1.00, return the exact source mesh buffer.
- Protected mounting coordinates must be identical across all family variants.
- Do not silently replace a metric with one that has different meaning. The geometry-derived diameter is shown in the viewer; the slider diameter remains a nominal design input.
- `master` contains approved business/documentation material and is unchanged; `develop` contains the implementation.

## Next quality gate

Build robust wall-thickness/self-intersection checks, browser E2E capture and visual approval of at least one shape per family. These must be completed before claiming a full production-ready Shade stage.
