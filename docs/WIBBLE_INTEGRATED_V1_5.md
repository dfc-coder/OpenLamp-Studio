# OpenLamp Studio v1.5 — Wibble integrated Shade support

The unwanted **green adapter has been removed entirely** from OpenLamp's Wibble path. It is not rendered, generated as a third mesh, or offered as a separate STL.

## What the generator does

- **Taller Stand:** retains the exact former internal cylindrical shade socket and Taller's unmodified original geometry. No change to its coupling or its shading silhouette.
- **Wibble Stand:** analyzes the original four highest sculptural lobe tips with `topLobes()`. No Wibble stand vertices or triangles are changed. The selected basic shade is rebuilt from its source parametric profile, with:
  - an organic lower skirt that widens only as much as required to pass around the four Wibble tips;
  - a smooth transition back to the chosen silhouette between roughly 22 and 63 mm above the lower edge;
  - a shallow internal *annular landing shelf*, not a third external adapter;
  - an annular underside 0.4 mm CAD above the highest tip and a lower skirt that extends 3 mm below the highest tip to visually conceal the joint.
- The original Wibble's four tips have a radius around 73 mm at their highest points (the specific radius and height are recomputed from the actual loaded stand mesh). The minimum ergonomic lower-skirt radius is derived from the maximum measured tip radius plus 8.5 mm. This may make the **effective lower diameter larger than the nominal body diameter**, particularly for compact designs. The UI reports the actual bounding diameter of the generated mesh.

The integrated shelf is part of the **same connected, watertight shade STL**. The stand remains an unchanged independent second STL. No filler bridge, green mesh or extra file is created.

## Geometry/assembly checks

1. `tests/mount-adapters.cjs` verifies four tips, exact source immutability, stand surface sampling, contact distances, Wibble saddle and manifold shape STLs.
2. `tests/hidden-socket.cjs` checks all 14 basic-shade/base combinations, Taller unchanged, Wibble-specific geometry, exterior continuity, and actual tip separation.
3. `tests/browser_shade.py` switches Taller → Wibble → Taller, checks the correct integrated socket contract, verifies the Wibble vs Taller shade STL bytes differ, and ensures no adapter download exists.
4. `tests/compatibility.cjs` keeps the integrated Wibble saddle at **CAD prototype**, never presenting it as physically proven.

## Physical limitation

This is a **gravity-supported, untested CAD fit**, not a proven detachable snap-fit, bayonet lock or anti-tip retention mechanism. The 0.4-mm nominal clearance is intentionally approximate: under gravity a printed version needs an actual support surface, so measure the real printer's error and adjust the shelf contact in a fit coupon. The new lower Wibble flare and underside may require different slicer orientation/supports from Taller.

No LED/portalámparas compatibility, thermal insulation, electrical safety, fatigue life, overturning resistance or physical fit is certified. Do not sell or operate a finished electrical luminaire on the basis of these CAD checks alone.

**Data and history:** `master` is unchanged; all changes live in `develop`. Historical v1.3/v1.4 documents describe superseded green-adapter behavior and remain only as release history.
