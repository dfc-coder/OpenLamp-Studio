# OpenLamp Studio v1.6 — Wibble conformal four-pocket contact

## What was actually wrong in v1.5

The former solution used a single, planar annular seat with one global Z value and a roughly circular lower skirt. It cleared Wibble's four tips but **did not reproduce their different curved contact surfaces**. This was a geometric mismatch, not simply a preview or color issue.

## Morphology-driven correction

The original Wibble stand is **left entirely unchanged**.

1. `mount-adapters.js` locates the highest point of each of the **four original lobes** and indexes its original upper triangles for barycentric XY→Z queries.
2. `visualRadiusAt(t, p, mount, theta)` obtains a **measured angular envelope** from the original upper CAD. The lower skirt is allowed to grow only where necessary for those lobes, with a smooth blend returning to the selected base Shade profile by the upper end of the transition region.
3. `basic-shade.js` generates a **nonplanar conformal underside** with 19 annular rings and 192 angular vertices per ring. Each position receives a Z value from the corresponding XY coordinate on Wibble, offset by a nominal 0.4-mm contact clearance; sectors that have no physical upper Wibble surface do not receive fictional bearing pads.
4. The inner contact is part of the SAME closed shade mesh. There is no adapter solid, attachment file, flat green bridge, or source-Wibble deformation.
5. A facet-refinement step checks angular/radial edge midpoints, diagonal edges, and triangle centroids against the source surface and lifts **only the underside vertices** where linear STL interpolation would otherwise penetrate Wibble. The minimum target mesh-interior clearance at these sampled sites is 0.15 mm, preserving a manufacturable opening rather than interpenetrating the original solid.
6. Taller Stand still uses its original unchanged circular female socket and original CAD seat; this Wibble-specific fit does not alter it.
7. The 7 Shade families inherit the same directly measured Wibble interface; projects continue to save selection and parameters as JSON v9. The actual exported Wibble Shade STL changes with the chosen base.

## Validations

- `tests/mount-adapters.cjs`: four original tips and source mesh preservation; verifies that the shade has four distinct, nonplanar pockets rather than a flat annular underside.
- `tests/hidden-socket.cjs`: all fourteen base/shape combinations; verifies source-driven lower envelope, no extra adapter and correct lower-support geometry.
- `tests/morphological-contact.cjs`: samples the actual negative contact against original Wibble triangles at mesh vertices and within STL facets. Rejects source penetration and checks that there are multiple near-contact regions and nonplanar relief.
- `tests/browser_shade.py`: selecting Taller → Wibble → Taller updates the exported Shade STL without creating any adapter download.

## Important limitation

This is a **geometry-based complement with print clearance**, not proof of perfect physical snap-fit, precise mating tolerance, stable retention, or finished electrical safety. The sampled pockets are formed using 2.5D heightfield contact from above: complex side undercuts (if any) are intentionally not copied, because a detachable slip-on shade must be able to install vertically. The 0.4-mm nominal spacing and the 0.15-mm sampled STL facet minimum target need **real printed fit coupons** for the printer, material and print orientation before production. No complete independent boolean/BVH triangle-to-triangle collision certificate is claimed.

Earlier v1.3–v1.5 documents describe obsolete adapter/flat-seat versions. This document supersedes them for Wibble.
