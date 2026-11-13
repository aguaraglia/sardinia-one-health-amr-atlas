#!/usr/bin/env python3
"""Pack rendered outreach slides into PPTX decks.

The existing twelve decks are full-bleed 1280×720 PNGs on a 13.333×7.5 in
widescreen slide, with speaker notes and transparent hyperlink shapes over
the source line. This reuses that package (masters, theme, notes master)
and sets the publisher to CodexVitae ETS.
"""
import json
import os
import shutil
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "public/outreach/presentations/11-leggere-atlante-video-slide.pptx"
MANIFEST = Path("/tmp/outreach-slides/manifest.json")
EMU = 9525  # 12192000 / 1280
SITE = "https://aguaraglia.github.io/sardinia-one-health-amr-atlas/"


def absolute_url(url: str) -> str:
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return SITE + url.lstrip("/")


def notes_xml(text: str) -> str:
    body = escape(text)
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="it-IT"/><a:t>{body}</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="4" name="Slide Number Placeholder 3"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldNum" idx="5"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="it-IT"/></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>'''


def link_shape(shape_id: int, name: str, rel: str, x: float, y: float, w: float, h: float) -> str:
    return f'''<p:sp><p:nvSpPr><p:cNvPr id="{shape_id}" name="{escape(name)}" descr="{escape(name)}"><a:hlinkClick r:id="{rel}"/></p:cNvPr><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="{int(x)}" y="{int(y)}"/><a:ext cx="{max(int(w), 1)}" cy="{max(int(h), 1)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="it-IT"/></a:p></p:txBody></p:sp>'''


def slide_xml(links) -> str:
    shapes = []
    for n, link in enumerate(links, start=1):
        shapes.append(link_shape(
            2 + n,
            link["name"][:80],
            f"rId{3 + n}",
            link["x"] * EMU,
            link["y"] * EMU,
            link["w"] * EMU,
            link["h"] * EMU,
        ))
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr><p:pic><p:nvPicPr><p:cNvPr id="2" name="Immagine 1"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId3"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="6858000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>{''.join(shapes)}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'''


def rels_xml(links) -> str:
    rows = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide{n}.xml"/>',
        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image{n}.png"/>',
    ]
    # placeholder, filled per slide
    return rows


def slide_rels(n: int, links) -> str:
    parts = [
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>',
        f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide{n}.xml"/>',
        f'<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image{n}.png"/>',
    ]
    for i, link in enumerate(links):
        parts.append(
            f'<Relationship Id="rId{4 + i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{escape(absolute_url(link["url"]))}" TargetMode="External"/>'
        )
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ''.join(parts) + '</Relationships>'


def notes_rels(n: int) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide{n}.xml"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/></Relationships>'''


def speaker_notes(module_title: str, slide: dict) -> str:
    lines = [
        slide["label"].upper(),
        "",
        slide["title"],
        "",
        slide["intro"],
        "",
        slide["visualText"].strip(),
        "",
        "i",
        slide["takeaway"],
        "",
        "Fonti della scheda",
    ]
    for name, url in slide["sources"]:
        lines.append(f"{name} ↗")
    lines += ["", "Fonti cliccabili:"]
    for name, url in slide["sources"]:
        lines.append(f"{name} ↗: {absolute_url(url)}")
    lines += ["", f"Modulo: {module_title}", "Editore: CodexVitae ETS"]
    return "\n".join(lines)


def core_xml(title: str) -> str:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>{escape(title)}</dc:title><dc:subject>Divulgazione AMR · Sardinia One Health AMR Atlas</dc:subject><dc:creator>CodexVitae ETS</dc:creator><cp:lastModifiedBy>CodexVitae ETS</cp:lastModifiedBy><cp:revision>1</cp:revision><dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified></cp:coreProperties>'''


def pack_one(module: dict, template_names: set[str], template_zip: zipfile.ZipFile) -> None:
    number = f"{module['number']:02d}"
    dest = ROOT / "public/outreach/presentations" / f"{number}-{module['slug']}-video-slide.pptx"
    skip_prefixes = (
        "ppt/slides/",
        "ppt/notesSlides/",
        "ppt/media/",
        "docProps/",
    )
    fd, tmp_name = tempfile.mkstemp(suffix=".pptx")
    os.close(fd)
    with zipfile.ZipFile(tmp_name, "w", compression=zipfile.ZIP_DEFLATED) as out:
        for info in template_zip.infolist():
            name = info.filename
            if name.startswith(skip_prefixes):
                continue
            if name in {"ppt/presentation.xml", "ppt/_rels/presentation.xml.rels", "[Content_Types].xml"}:
                out.writestr(name, template_zip.read(name))
                continue
            out.writestr(name, template_zip.read(name))
        for n, slide in enumerate(module["slides"], start=1):
            png = Path(slide["file"]).read_bytes()
            out.writestr(f"ppt/media/image{n}.png", png)
            links = slide["links"]
            out.writestr(f"ppt/slides/slide{n}.xml", slide_xml(links))
            out.writestr(f"ppt/slides/_rels/slide{n}.xml.rels", slide_rels(n, links))
            out.writestr(f"ppt/notesSlides/notesSlide{n}.xml", notes_xml(speaker_notes(module["title"], slide)))
            out.writestr(f"ppt/notesSlides/_rels/notesSlide{n}.xml.rels", notes_rels(n))
        out.writestr("docProps/core.xml", core_xml(f"{number} · {module['title']}"))
        app = template_zip.read("docProps/app.xml")
        out.writestr("docProps/app.xml", app)
    shutil.move(tmp_name, dest)
    print(dest.name, dest.stat().st_size)


def main() -> None:
    manifest = json.loads(MANIFEST.read_text())
    with zipfile.ZipFile(TEMPLATE) as template:
        names = set(template.namelist())
        for module in manifest:
            pack_one(module, names, template)


if __name__ == "__main__":
    main()
