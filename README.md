# OpenLamp Studio

**Design your own 3D-printable table lamp.** A free, open-source, browser-based parametric designer for decorative lamp shades and modular bases.

> Status: experimental beta — not certified as a safe electrical product. The generator provides geometric models; electrical compatibility, heat dissipation, and mechanical fit require physical verification.

## Product vision

OpenLamp Studio helps makers, designers, and hobbyists customize aesthetically curated table-lamp shades without installing CAD software or creating an account. Users choose a classic silhouette, refine a Bézier profile, preview the result, and export printable parts.

- **Free and open source:** no paywall, mandatory account, or vendor lock-in.
- **Browser-first:** geometry computation and STL export run locally on the user's device.
- **Design-led:** classic silhouettes, careful proportions, controllable surface details.
- **Functional boundaries:** keep shade, base, mounting dimensions and STL export independently testable.
- **Commercial sustainability:** optional printing services, customization and compatible lighting kits; the core tool remains free.

## Documentation

- [Product vision and target users](docs/PRODUCT.md)
- [Business model and validation strategy](docs/BUSINESS.md)
- [MVP scope and acceptance criteria](docs/MVP.md)
- [Technical architecture and reuse policy](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Branching, releases and contribution workflow](CONTRIBUTING.md)
- [Open-source attribution and safety limits](docs/LEGAL_AND_SAFETY.md)

## Branch policy

| Branch | Purpose |
| --- | --- |
| `master` | Product documentation, business decisions, stable public documentation and approved releases only. |
| `develop` | All application source code, automated tests, demo assets and active development. |

Work on `develop`; use pull requests for controlled promotion to `master` only when a release is approved. `master` starts documentation-only, and will not contain experimental code.

## MVP

A lightweight website where a visitor can select a classic desk-lamp shade, customize proportions/surface in a 3D editor and download the shade/base as separate STL models. The installation for LED/E27 remains **unverified** until a real commercial kit has been measured and tested.

## Prior art

The project reuses established open-source ideas rather than rebuilding an entire CAD engine. The current local prototype is inspired by [VaseMaker](https://github.com/dcityorg/vasemaker) (MIT) and uses [Plotly.js](https://github.com/plotly/plotly.js) (MIT). External assets must retain their respective licenses and attributions.

## License

MIT — see [LICENSE](LICENSE). Contributions are welcome under the repository license.
