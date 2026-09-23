# Asset manifest

Assets render only when the file exists **and** it is marked authorised in content. Otherwise the page omits the image (portraits fall back to initials). No "pending" box ever appears publicly.

| File (under `src/`) | Registered in | Subject | Caption or alt (from content) | Status |
|---|---|---|---|---|
| assets/img/people/scott-woods.jpg | people.json | Dr Scott W. Woods | alt: empty (the name is adjacent) | Missing |
| assets/img/people/john-kane.jpg | people.json | Dr John M. Kane | as above | Missing |
| assets/img/people/grace-blest-hopley.jpg | people.json | Dr Grace Blest-Hopley | as above | Missing |
| assets/img/people/filipp-korentsvit.jpg | people.json | Filipp Korentsvit | as above | Missing |
| assets/img/people/daud-gutseriev.jpg | people.json | Daud Gutseriev | as above | Missing |
| assets/img/people/william-jarosz.jpg | people.json | William Jarosz | as above | Missing |
| assets/img/people/richard-barker.jpg | people.json | Prof. Richard Barker OBE | as above | Missing |
| assets/img/people/gillian-cannon.jpg | people.json | Dr Gillian Cannon | as above | Missing |
| assets/img/renders/nwpt-sm32300-softgel.jpg | assets.json `softgel-render` | Corporate softgel render | "NWPT-SM32300 300 mg oral softgel. Computer-generated render supplied by NWPharmaTech; not to scale. Investigational medicine." | Missing; caption approval needed |
| assets/img/renders/micellar-dispersion.jpg | assets.json `micelle-render` | Micellar dispersion illustration | "Illustration of self-emulsification… Schematic; not to scale, and not an image of the body." | Missing; caption approval needed. Not yet placed on a page |
| assets/media/interview-*.mp4, .vtt, transcript | interviews.json | Woods, Kane, Blest-Hopley | Titles in interviews.json | Missing (outlines in docs/interviews) |
| assets/img/mark.svg | header | Interim mark in brand colours | none | Replace with the official NW monogram |

**Specifications:**
- **Portraits:** square JPEG, at least 400×400 px, with written consent to publish.
- **Renders:** JPEG or WebP, at least 1200×900 px. They must be actual corporate renders; do not use AI-generated likenesses.
- **Video:** MP4 H.264, with WebVTT captions checked by a human and a full transcript.
