# OpenLamp Studio v1.4 — Hidden Internal Socket

## Geometric model

The visual lower edge is now the **actual design shape** (Cylinder, Cone, Dome, Bell, Sphere, Pear or Disc). The old `radiusAt()` lower-radius blend into a narrow external collar has been **removed**.

Every new basic Shade STL is one closed, orientable solid of revolution. The cross-section follows:

1. Exterior skirt at z=0, rising continuously along the selected silhouette.
2. Upper rim and interior shell.
3. Interior structural web at z=20 mm.
4. Female socket interior at radius 35.044 mm, opening from below.
5. Socket radial wall thickness 2.4 mm.
6. Socket underside structural web at z=17 mm.
7. Lower interior wall of the shade.
8. Bottom visual skirt lip back to the exterior.

The 3-mm-separated radial webs produce a connected manifold solid, not overlapping disconnected cylinders. The skirt remains part of the same shade mesh and the downloaded binary STL. These are **CAD prototype dimensions**, not proven FDM tolerances.

The formula `minimumDiameter(params)` rejects combinations too small to contain the female socket, the wall and at least 1.5 mm radial ligament. In particular Sphere/Disc can demand larger minimum widths. The editor limits the corresponding diameter slider; increasing wall thickness raises the minimum permissible width rather than tapering the visible exterior.

## Selected-base behavior

**Taller Stand** remains the unmodified CAD source. Its male seat radius is 34.880 mm; nominal radial clearance inside the shade socket is 0.164 mm. The exterior skirt is positioned to leave a nominal 0.9-mm visual shadow gap to the mount platform; actual male insertion overlap is reduced accordingly and checked by tests.

**Wibble Stand** remains the unmodified source. Its earlier four-lobe adapter is still a separate STL, with an upper male ring that is now hidden inside the shade's socket. The four lower arms belong to the base-side adapter and may remain visible outside narrow silhouettes. The adapter upper plate sits nominally 0.9 mm below the shade skirt.

When switching bases, the shade's **exterior profile does not change**. The mount type, adapter, position, preview, status and STL selection change automatically. Existing vintage Taller OBJ and old JSON projects remain readable. New projects save as JSON v9.

## Verification

- `tests/basic-shade.cjs` ensures seven true exteriors, fixed internal female ring, manifold STL, caps, surface variants and rejection of undersized socket cavities.
- `tests/hidden-socket.cjs` exercises all seven shapes with both base mechanisms, including insertion overlaps, socket-to-male clearance and interior structural web.
- `tests/mount-adapters.cjs` validates the source Wibble geometry and conformal bridge.
- `tests/browser_shade.py` covers actual Chrome/Chromium transitions, the exported STL and JSON v9.
- Pages uses a CI gate before deploying `develop`.

## Not yet physically validated

No dimensional simulation proves printed retention, stability, insertion/release forces, true FDM clearances or thermal/electrical safety. Tests ensure nominal radial/axial alignment and manifoldness; they do **not** constitute an exhaustive 3D triangle-triangle collision certificate for every printer or parameter combination.

The internal radial web may create challenging overhangs in FDM; review print orientation, potential supports and cooling/material effects in OrcaSlicer. Print and measure actual fit coupons for both bases before claiming a production-ready lamp or an adhesive-free joint.

Source stands, original Taller Top and prior user models have not been rewritten.
