#!/usr/bin/env python3
"""NWPT-048 Science expansion: builds the four /science/ pages, the Science overview's two-route landing, the new
Evidence library section and the new glossary terms. Idempotent (content between NWPT-048 markers is replaced).

Content rules (from the research brief of 27 Sep 2026):
- keep laboratory mechanisms, human results and product-specific evidence apart;
- CBD and THC are not presented as simple opposites, and CBD is not presented as reliably cancelling THC;
- existing checked psychiatric wording is reused verbatim from the Evidence library cards;
- sources not yet checked against the original records carry "Source check in progress" in the Evidence library.
    python3 tools/build-science.py
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent / "release-032"
SITE = ROOT / "site"
V = "nwpt053"
CANON = "https://www.nwpharmatech.org/"
UPDATED = "27 September 2026"

# ---------------------------------------------------------------- shared evidence (existing cards, reused verbatim)
EVID = (SITE / "evidence.html").read_text()


def card(i):
    k = EVID.index(f'id="ref-{i}"')
    art = EVID[k:EVID.index("</article>", k)]
    d = dict(re.findall(r"<dt>(.*?)</dt><dd>(.*?)</dd>", art))
    d["title"] = re.findall(r"<h3>(.*?)</h3>", art)[0]
    return d


# ---------------------------------------------------------------- new Evidence library entries (NWPT-048)
# status: primary-source pass by Web Boss, 27 Sep 2026 (records/SCIENCE-EXPANSION-NWPT-048.md). IUPHAR/BPS and FDA were
# unresolved and uncited, so they are withdrawn from the public library (history kept in content/references.json, public: false).
# The Health Canada entries rest on Web Boss's captured passages (27 Sep 2026), reviewed by Claude; see the record.
NEW = [
    dict(id="health-canada-hcp-2018", kicker="Cannabinoid science", flag=("nwpt-tag-company", "Official information"),
         title="Information for Health Care Professionals: Cannabis (marihuana, marijuana) and the cannabinoids",
         pop="Not applicable", prod="Not applicable", design="Health Canada reference for health care professionals (Spring 2018)",
         finding="Describes the components of the endocannabinoid system: the cannabinoid receptors CB1 and CB2, endocannabinoids such as anandamide and 2-AG, and the enzymes that make and break them down.",
         limit="A 2018 reference, used here only for basic biology; not current clinical, dosing or regulatory guidance.",
         src='Health Canada. Information for Health Care Professionals: Cannabis (marihuana, marijuana) and the cannabinoids. Spring 2018. Section 1.0, The Endocannabinoid System: Components of the endocannabinoid system. <a href="https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/information-medical-practitioners/information-health-care-professionals-cannabis-cannabinoids.html" rel="external">Official source</a>'),
    dict(id="health-canada-about-cannabis", kicker="Cannabinoid science", flag=("nwpt-tag-company", "Official information"),
         title="About cannabis",
         pop="Not applicable", prod="THC and CBD, two of the chemical substances in cannabis", design="Health Canada public information",
         finding="States that THC causes the high and intoxication, and that, unlike THC, CBD does not produce a high or intoxication.",
         limit="General information; not evidence about a particular product, dose or condition.",
         src='Health Canada. About cannabis. Sections: THC; CBD. <a href="https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/about.html" rel="external">Official source</a>'),
    dict(id="health-canada-cbd", kicker="Cannabinoid science", flag=("nwpt-tag-company", "Official information"),
         title="Cannabidiol (CBD)",
         pop="Not applicable", prod="Cannabidiol (CBD)", design="Health Canada public information",
         finding="States that CBD is not intoxicating but does have an effect on the brain.",
         limit="General information about CBD and its regulation in Canada; not evidence about a particular product, dose or condition.",
         src='Health Canada. Cannabidiol (CBD). Section: Where CBD comes from. <a href="https://www.canada.ca/en/health-canada/services/drugs-medication/cannabis/about/cannabidiol.html" rel="external">Official source</a>'),
    dict(id="laprairie-2015", kicker="Cannabinoid science", flag=("nwpt-result-flag nwpt-result-inconclusive", "Laboratory"),
         title="Cannabidiol is a negative allosteric modulator of the cannabinoid CB1 receptor",
         pop="Cells expressing CB1 receptors (laboratory)", prod="Cannabidiol applied to cells", design="Laboratory (cell) experiments",
         finding="In cell experiments, CBD reduced CB1 signalling in response to THC and to 2-AG (2-arachidonylglycerol), consistent with negative allosteric modulation of CB1.",
         limit="A laboratory mechanism, not evidence of clinical protection in people.",
         src='Laprairie RB, et al. Cannabidiol is a negative allosteric modulator of the cannabinoid CB1 receptor. <em>Br J Pharmacol</em>. 2015. <a href="https://doi.org/10.1111/bph.13250" rel="external">DOI 10.1111/bph.13250</a>'),
    dict(id="englund-2013", kicker="Cannabinoid science", flag=("nwpt-result-flag nwpt-result-mixed", "Mixed finding"),
         title="Cannabidiol inhibits THC-elicited paranoid symptoms and hippocampal-dependent memory impairment",
         pop="48 healthy participants", prod="Oral CBD or placebo before intravenous THC (experimental challenge)", design="Randomised, placebo-controlled, between-subjects experiment",
         finding="CBD pretreatment reduced selected paranoia and memory outcomes after THC. The difference in the average positive-symptom (PANSS) score was not statistically significant.",
         limit="Healthy volunteers; route and timing differ from ordinary cannabis use.",
         src='Englund A, et al. Cannabidiol inhibits THC-elicited paranoid symptoms and hippocampal-dependent memory impairment. <em>J Psychopharmacol</em>. 2013. <a href="https://doi.org/10.1177/0269881112460109" rel="external">DOI 10.1177/0269881112460109</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/23042808/" rel="external">PubMed 23042808</a>'),
    dict(id="englund-2023", kicker="Cannabinoid science", flag=("nwpt-result-flag nwpt-result-negative", "No protective effect"),
         title="Does cannabidiol make cannabis safer? A randomised, double-blind, cross-over trial of cannabis with four different CBD:THC ratios",
         pop="46 healthy, infrequent cannabis users", prod="Inhaled (vaporised) cannabis: a fixed THC dose with increasing amounts of CBD", design="Randomised, double-blind, cross-over trial",
         finding="Adding more CBD to a fixed THC dose did not protect against the acute adverse effects measured.",
         limit="An acute experiment with particular CBD:THC ratios; not every possible regimen.",
         src='Englund A, et al. Does cannabidiol make cannabis safer? A randomised, double-blind, cross-over trial of cannabis with four different CBD:THC ratios. <em>Neuropsychopharmacology</em>. 2023. <a href="https://doi.org/10.1038/s41386-022-01478-z" rel="external">DOI 10.1038/s41386-022-01478-z</a>'),
    dict(id="zamarripa-2023", kicker="Cannabinoid science", flag=("nwpt-result-flag nwpt-result-negative", "Greater impairment"),
         title="Assessment of orally administered Δ9-tetrahydrocannabinol when coadministered with cannabidiol on Δ9-tetrahydrocannabinol pharmacokinetics and pharmacodynamics in healthy adults: a randomized clinical trial",
         pop="18 healthy adults", prod="Oral cannabis extract: the same THC dose with or without a high dose of CBD", design="Randomised clinical trial (single doses)",
         finding="Giving a high oral CBD dose with THC increased THC exposure and impairment compared with the same THC dose alone.",
         limit="Small, single doses; participants also took a mix of probe drugs used to measure drug-metabolising enzymes.",
         src='Zamarripa CA, et al. Assessment of orally administered Δ9-tetrahydrocannabinol when coadministered with cannabidiol on Δ9-tetrahydrocannabinol pharmacokinetics and pharmacodynamics in healthy adults: a randomized clinical trial. <em>JAMA Netw Open</em>. 2023. <a href="https://doi.org/10.1001/jamanetworkopen.2022.54752" rel="external">DOI 10.1001/jamanetworkopen.2022.54752</a>'),
    dict(id="chesney-2025", kicker="Cannabinoid science", flag=("nwpt-result-flag nwpt-result-negative", "No protective effect"),
         title="Does cannabidiol reduce the adverse effects of cannabis in schizophrenia? A randomised, double-blind, cross-over trial",
         pop="30 people with schizophrenia or schizoaffective disorder and cannabis use disorder", prod="Oral CBD or placebo before inhaled (vaporised) cannabis", design="Randomised, double-blind, placebo-controlled, cross-over trial",
         finding="CBD given before cannabis did not reduce its acute effects on memory or psychotic symptoms, and appeared to worsen them.",
         limit="A combination experiment; it does not establish the effects of CBD alone, or of longer treatment, in another population.",
         src='Chesney E, et al. Does cannabidiol reduce the adverse effects of cannabis in schizophrenia? A randomised, double-blind, cross-over trial. <em>Neuropsychopharmacology</em>. 2025. <a href="https://doi.org/10.1038/s41386-025-02175-3" rel="external">DOI 10.1038/s41386-025-02175-3</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/40702165/" rel="external">PubMed 40702165</a>'),
    dict(id="sativex-smpc", kicker="Medicines and regulation", flag=("nwpt-tag-company", "Product information"),
         title="Sativex oromucosal spray: Summary of Product Characteristics",
         pop="Adults with moderate to severe spasticity due to multiple sclerosis", prod="Sativex, a THC and CBD oromucosal spray (a different product; not NWPT-SM32300)", design="Regulatory product information",
         finding="The UK product information lists Sativex for symptom improvement in adults with moderate to severe spasticity due to multiple sclerosis who have not responded adequately to other anti-spasticity medicines and who show clinically significant improvement during an initial trial of treatment.",
         limit="One product and one indication; not evidence about psychosis.",
         src='Sativex Oromucosal Spray: Summary of Product Characteristics. <em>Electronic Medicines Compendium</em>. <a href="https://www.medicines.org.uk/emc/product/602/smpc" rel="external">Official source</a>'),
    dict(id="nabilone-smpc", kicker="Medicines and regulation", flag=("nwpt-tag-company", "Product information"),
         title="Nabilone 1 mg capsules: Summary of Product Characteristics",
         pop="Patients receiving cancer chemotherapy", prod="Nabilone, a synthetic cannabinoid (a different product; not NWPT-SM32300)", design="Regulatory product information",
         finding="The UK product information lists nabilone for nausea and vomiting caused by cancer chemotherapy in patients who have not responded adequately to conventional anti-sickness treatments.",
         limit="One product and one indication; not evidence about psychosis.",
         src='Nabilone 1 mg Capsules: Summary of Product Characteristics. <em>Electronic Medicines Compendium</em>. <a href="https://www.medicines.org.uk/emc/product/12767/smpc" rel="external">Official source</a>'),
    dict(id="mhra-specials", kicker="Medicines and regulation", flag=("nwpt-tag-company", "Official guidance"),
         title="The supply of unlicensed medicinal products (“specials”)",
         pop="Not applicable", prod="Unlicensed medicinal products", design="UK regulatory guidance (MHRA)",
         finding="Explains the framework under which unlicensed medicinal products can be supplied in the UK, which is separate from a marketing authorisation.",
         limit="A category-level explanation; not patient eligibility or prescribing guidance.",
         src='Medicines and Healthcare products Regulatory Agency. The supply of unlicensed medicinal products (“specials”). <em>GOV.UK</em>. <a href="https://www.gov.uk/government/publications/supply-unlicensed-medicinal-products-specials" rel="external">Official source</a>'),
    dict(id="nhs-cbpm", kicker="Medicines and regulation", flag=("nwpt-tag-company", "Official guidance"),
         title="Cannabis-based products for medicinal use (CBPMs)",
         pop="Not applicable", prod="Cannabis-based products for medicinal use", design="NHS England guidance",
         finding="Explains how cannabis-based products for medicinal use are described and supplied within the NHS in England.",
         limit="A category-level explanation; not patient eligibility or prescribing guidance.",
         src='NHS England. Cannabis-based products for medicinal use (CBPMs). <a href="https://www.england.nhs.uk/long-read/cannabis-based-products-for-medicinal-use-cbpms/" rel="external">Official source</a>'),
]
NEW_BY_ID = {n["id"]: n for n in NEW}
PENDING = set()   # entries whose source check is still in progress (none at present)
SHORT = {  # citation labels
    "health-canada-hcp-2018": "Health Canada 2018", "health-canada-about-cannabis": "Health Canada: about cannabis", "health-canada-cbd": "Health Canada: CBD", "laprairie-2015": "Laprairie et al. 2015",
    "englund-2013": "Englund et al. 2013", "englund-2023": "Englund et al. 2023", "zamarripa-2023": "Zamarripa et al. 2023",
    "chesney-2025": "Chesney et al. 2025", "sativex-smpc": "Sativex SmPC", "nabilone-smpc": "Nabilone SmPC",
    "mhra-specials": "MHRA: unlicensed medicines", "nhs-cbpm": "NHS England: CBPMs",
    "epidyolex-smpc": "Epidyolex SmPC", "devinsky-2017": "Devinsky et al. 2017", "mcguire-2018": "McGuire et al. 2018",
    "boggs-2018": "Boggs et al. 2018", "leweke-2012": "Leweke et al. 2012", "bhattacharyya-2024": "Bhattacharyya et al. 2024",
    "bhattacharyya-2018": "Bhattacharyya et al. 2018", "diforti-2019": "Di Forti et al. 2019", "perucca-2020": "Perucca and Bialer 2020",
    "taylor-2018": "Taylor et al. 2018", "nice-cg178": "NICE CG178", "nice-cg155": "NICE CG155", "salazar-2021": "Salazar de Pablo et al. 2021",
}


def cites(*ids, pre="../"):
    links = ", ".join(f'<a class="nwpt-cite" href="{pre}evidence.html#ref-{i}">{SHORT[i]}</a>' for i in ids)
    return f'<span class="sci-cites">Sources: {links}</span>'


def evidence_card(n):
    fcls, ftxt = n["flag"]
    tag = '<span class="nwpt-tag nwpt-tag-pending">Source check in progress</span>' if n["id"] in PENDING else ""
    flags = f'<span class="{fcls}">{ftxt}</span>{tag}'
    if fcls.startswith("nwpt-tag"):
        flags = f'<span class="nwpt-tag {fcls}">{ftxt}</span>{tag}'
    dl = "".join(f"<div><dt>{a}</dt><dd>{b}</dd></div>" for a, b in (("Population", n["pop"]), ("Product", n["prod"]), ("Design", n["design"]), ("Finding", n["finding"]), ("Limitations", n["limit"])))
    return (f'<article class="nwpt-study-card" id="ref-{n["id"]}" data-category="cannabinoids"><div class="nwpt-study-card-head"><p class="nwpt-card-kicker">{n["kicker"]}</p>'
            f'<div class="nwpt-card-flags">{flags}</div></div><h3>{n["title"]}</h3><dl class="nwpt-card-dl">{dl}</dl>'
            f'<p class="nwpt-source-line"><span class="nwpt-src-label">Source:</span> {n["src"]}</p></article>')


# ---------------------------------------------------------------- shared page parts
SCI_NAV = [("science.html", "Overview"), ("science/psychiatry.html", "Psychiatry &amp; evidence"), ("science/cannabinoids.html", "Understanding cannabinoids"),
           ("science/cbd-thc.html", "CBD and THC"), ("science/cannabinoid-medicines.html", "From cannabis to medicines"), ("science/formulation.html", "NWPT formulation"),
           ("evidence.html", "Evidence library"), ("glossary.html", "Glossary")]


AC = ' aria-current="page"'


def sci_nav(current, pre):
    return ('<nav class="secondary-nav sci-nav" aria-label="Science">'
            + "".join(f'<a href="{pre}{h}"{AC if h == current else ""}>{t}</a>' for h, t in SCI_NAV) + "</nav>")


REVIEW = ('<aside class="sci-review" aria-label="Review status"><p><strong>Ongoing review.</strong> This content remains under ongoing review by the '
          'NWPharmaTech team and may be updated as the evidence develops. It is educational information, not individual medical advice, '
          'and it is not independent scientific validation.</p><p class="sci-review__meta">Page updated ' + UPDATED + '.'
          + (' Sources marked “Source check in progress” in the Evidence library are still being checked against the original publications.' if PENDING else '')
          + '</p></aside>')


def further_reading(pre):
    return f'''<aside class="sci-further" aria-labelledby="further-{pre and 'x' or 'o'}">
          <p class="eyebrow">Further reading</p>
          <h2 id="further-{pre and 'x' or 'o'}">Explore the wider cannabinoid evidence</h2>
          <p>CannabinoidEvidence.org provides an indication-based overview of cannabinoid research. Its development and hosting are funded by NW PharmaTech Ltd. The resource currently describes itself as a working draft, with independent scientific and regulatory review in progress. Read the original sources alongside its summaries; the citations on our own pages are listed in the <a href="{pre}evidence.html">Evidence library</a>.</p>
          <p class="sci-further__links"><a class="btn btn-secondary" href="https://cannabinoidevidence.org/" rel="external noopener">Explore CannabinoidEvidence.org — external resource</a> <a href="https://cannabinoidevidence.org/about" rel="external noopener">Funding and editorial disclosures</a></p>
        </aside>'''


def programme_note(pre):
    return f'''<div class="callout caution sci-programme">
          <p><strong>Our programme.</strong> NWPT-SM32300 is investigational. General cannabinoid research does not establish that it is effective. The <a href="{pre}programme-room.html">Programme Room</a> explains what has been studied, what is planned and what remains unknown; the <a href="{pre}science/formulation.html">NWPT formulation</a> page explains what the formulation is designed to do and what has been measured.</p>
        </div>'''


def hero(eyebrow, h1, lede, current, pre, fig=""):
    return f'''<header class="page-hero sci-hero">
      <div class="wrap">
        <p class="eyebrow">{eyebrow}</p>
        <h1>{h1}</h1>
        <p class="lede">{lede}</p>
        {sci_nav(current, pre)}{fig}
      </div>
    </header>'''


# ---------------------------------------------------------------- NWPT-049 illustrations (Manus web-ready pack, 27 Sep 2026)
# Conceptual images only: every caption states what the image does not show. Selection and exclusions are recorded in
# records/VISUAL-INTEGRATION-NWPT-049.md. Only the page's LCP image is eager; the rest load lazily.
VIS = {
    "uncertainty": dict(file="17-uncertainty-map", focal="78% 50%", kind="scene",
        alt="An abstract dark landscape of glowing turquoise fibre clusters separated by unlit gaps, with a few amber points.",
        cap="Conceptual illustration of open research questions. It is not an anatomical model and does not depict a treatment effect."),
    "synapse": dict(file="07-synaptic-cleft-observatory", focal="80% 50%", kind="scene",
        alt="Two long translucent membrane shapes face each other across a narrow gap holding two small signalling-molecule forms, in a bright room.",
        cap="Conceptual illustration of signalling between cells. It is not a molecular model and does not show where any compound binds or what it does."),
    "molecules": dict(file="01-cbd-thc-molecular-architecture", focal="50% 50%", kind="diagram",
        alt="Two panels, CBD and delta-9-THC, each showing a two-dimensional structure and a three-dimensional ball-and-stick shape; both are labelled with the formula C21H30O2.",
        cap="Same molecular formula. Different three-dimensional architecture. CBD and delta-9-THC drawn from their PubChem records (CID 644019 and 16078): two-dimensional structures with computed three-dimensional shapes. The shapes are illustrations, not receptor-bound poses, and say nothing about effects."),
}


# ---------------------------------------------------------------- NWPT-052 labelled ECS animation (Manus web-ready pack)
# Corrected render from Manus (NWPT-dynamic-ECS-hero-labeled-CORRECTED-v2.zip), unmodified, 1280x720, 6 s, silent: no
# "central region"/"peripheral region" sub-labels, no molecule inside or docked at CB1/CB2, every pointer on its target.
# Published as ...-v2-* so no browser keeps the earlier draft's artwork (poster included). ECS_LABELS_CORRECTED = False
# restores the draft preview note.
ECS_LABELS_CORRECTED = True
ECS_BASE = "assets/ecs-video/NWPT-dynamic-ECS-hero-labeled-v2"


def ecs_video(pre):
    c = lambda *ids: cites(*ids, pre=pre)
    note = "" if ECS_LABELS_CORRECTED else ('<p class="sci-preview-note" role="note"><strong>Preview only.</strong> In this draft animation the '
        '“central region” and “peripheral region” sub-labels under Δ9-THC and CBD, and the molecules’ positions, suggest binding sites. '
        'A corrected version has been requested; this draft is not for publication.</p>')
    return f'''
        <figure class="ecs-video" data-ecs-video aria-labelledby="ecs-video-cap">
          <div class="ecs-video__media">
            <img class="ecs-video__poster" src="{pre}{ECS_BASE}-poster.webp" width="1280" height="720" alt="Conceptual labelled illustration: CB1 and CB2 receptors, the endocannabinoid messengers AEA and 2-AG, and THC and CBD molecules." loading="eager" fetchpriority="high" decoding="async" />
            <video class="ecs-video__video" muted playsinline loop preload="none" aria-hidden="true" tabindex="-1" width="1280" height="720"
              data-webm="{pre}{ECS_BASE}-web.webm" data-mp4="{pre}{ECS_BASE}-web.mp4"></video>
          </div>
          <div class="ecs-video__controls">
            <button type="button" class="hero-motion__toggle ecs-video__toggle" aria-pressed="false" hidden><span class="hero-motion__icon" aria-hidden="true"></span><span class="hero-motion__label">Pause animation</span></button>
          </div>
          <figcaption id="ecs-video-cap">Conceptual illustration of endocannabinoid-system components. It is not a molecular model and does not show a demonstrated mechanism of NWPT-SM32300.</figcaption>
          {note}
          <div class="ecs-labels">
            <p class="ecs-labels__title">What the labels show</p>
            <ul>
              <li><strong>CB1 receptor, CB2 receptor:</strong> cannabinoid receptors, part of the endocannabinoid system. {c("health-canada-hcp-2018")}</li>
              <li><strong>AEA + 2-AG:</strong> anandamide (AEA) and 2-AG, signalling molecules the body makes, called endocannabinoids. {c("health-canada-hcp-2018")}</li>
              <li><strong>Δ9-THC:</strong> a cannabinoid. In cell experiments it activated CB1 signalling. {c("laprairie-2015")}</li>
              <li><strong>CBD:</strong> a different cannabinoid. In cell experiments it reduced CB1 signalling; that is a laboratory finding, not a clinical effect. {c("laprairie-2015")}</li>
            </ul>
            <p class="ecs-labels__note">Where each molecule appears in the animation is illustrative, not a binding site.</p>
          </div>
        </figure>'''


def figure(key, pre, lcp=False):
    v = VIS[key]
    base = f"{pre}assets/visuals-049/{v['file']}"
    load = 'loading="eager" fetchpriority="high"' if lcp else 'loading="lazy"'
    sizes = "(max-width: 600px) calc(100vw - 2rem), 1040px" if v["kind"] == "diagram" else "(max-width: 600px) 160vw, 1040px"
    return (f'<figure class="sci-figure sci-figure--{v["kind"]}"><img src="{base}-1600w.webp" srcset="{base}-640w.webp 640w, {base}-1600w.webp 1600w" '
            f'sizes="{sizes}" width="1600" height="686" alt="{v["alt"]}" style="object-position: {v["focal"]};" {load} decoding="async" />'
            f'<figcaption>{v["cap"]}</figcaption></figure>')


def study_table(rows, caption, pre):
    """rows: (level, study_id, who, prep, found, limit). Table on desktop, stacked cards on phones."""
    head = "<tr><th scope=\"col\">Study</th><th scope=\"col\">Evidence type</th><th scope=\"col\">Who or what was studied</th><th scope=\"col\">Preparation and route</th><th scope=\"col\">What was found</th><th scope=\"col\">Limit</th></tr>"
    body = "".join(
        f'<tr><th scope="row" data-label="Study"><a href="{pre}evidence.html#ref-{i}">{SHORT[i]}</a></th><td data-label="Evidence type"><span class="sci-level sci-level--{lv.split()[0].lower()}">{lv}</span></td>'
        f'<td data-label="Who or what was studied">{who}</td><td data-label="Preparation and route">{prep}</td><td data-label="What was found">{found}</td><td data-label="Limit">{lim}</td></tr>'
        for lv, i, who, prep, found, lim in rows)
    return f'<div class="table-wrap table-wrap--stack sci-studies"><table><caption class="sci-caption">{caption}</caption><thead>{head}</thead><tbody>{body}</tbody></table></div>'


ICONS = {
    "plant": '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M24 42V20M24 26c-7 0-12-5-13-12 7 0 12 4 13 12zm0-4c1-8 6-12 13-12-1 7-6 12-13 12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    "compound": '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="14" cy="16" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="34" cy="14" r="4" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="26" cy="34" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18.5 18.5l4.5 10M18.8 15l11.3-.8M31.5 17.5l-3 11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    "formulation": '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="8" y="17" width="32" height="14" rx="7" fill="none" stroke="currentColor" stroke-width="2.4" transform="rotate(-30 24 24)"/><path d="M20 31l8-14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    "evidence": '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="11" y="8" width="26" height="33" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M17 17h14M17 24h14M17 31h9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
}


# ---------------------------------------------------------------- pages
def page_psychiatry():
    pre = "../"
    rows = []
    for i, lv in (("mcguire-2018", "Human trial"), ("leweke-2012", "Human trial"), ("boggs-2018", "Human trial"), ("bhattacharyya-2024", "Human trial"), ("bhattacharyya-2018", "Brain imaging")):
        c = card(i)
        rows.append((lv, i, c["Population"], c["Product"], c["Finding"], c["Limitations"]))
    sal = card("salazar-2021")
    body = f'''
    {hero("Science · Psychiatry &amp; evidence", "Understanding the clinical question",
          "Psychiatry studies mental health conditions, their causes, their effects on people’s lives and how care can help. This section focuses on psychosis and clinical high risk, the setting for NWPharmaTech’s current public research programme.",
          "science/psychiatry.html", pre, fig=figure("uncertainty", pre, lcp=True))}

    <section class="section section-light" aria-labelledby="risk-title">
      <div class="wrap prose-measure">
        <h2 id="risk-title">Risk is not a diagnosis</h2>
        <p>Being considered at clinical high risk is not a diagnosis of schizophrenia. Risk, present symptoms, functioning and longer-term outcomes are different things. A useful research summary makes clear which of these a study measures.</p>
        <p>An updated meta-analysis estimated that about one in four people identified as CHR-P (pooled estimate, 25%) developed psychosis within three years; most do not. {cites("salazar-2021", pre=pre)}</p>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="questions-title">
      <div class="wrap">
        <h2 id="questions-title">Choose a question</h2>
        <ul class="sci-questions" role="list">
          <li><a class="sci-question" href="{pre}updates/why-early-intervention-matters.html"><span class="sci-question__q">What does clinical high risk of psychosis mean?</span><span class="sci-question__to">The clinical-need explainer</span></a></li>
          <li><a class="sci-question" href="{pre}updates/why-early-intervention-matters.html#current-care"><span class="sci-question__q">What does current guidance recommend?</span><span class="sci-question__to">Current care, with the NICE guidance entries</span></a></li>
          <li><a class="sci-question" href="#cbd-studies"><span class="sci-question__q">What have CBD studies in psychiatry found?</span><span class="sci-question__to">Positive, negative and inconclusive results together</span></a></li>
          <li><a class="sci-question" href="{pre}phase-1.html"><span class="sci-question__q">What has NWPharmaTech studied?</span><span class="sci-question__to">The Phase 1 study, and the Programme Room</span></a></li>
          <li><a class="sci-question" href="{pre}programme.html#design-title"><span class="sci-question__q">What would the planned study establish?</span><span class="sci-question__to">The proposed Phase 2B design and its limits</span></a></li>
        </ul>
        <p class="sci-guidance">In England, psychological therapy is the recommended first step. NICE advises against antipsychotics to prevent psychosis in this group. {cites("nice-cg178", pre=pre)}</p>
      </div>
    </section>

    <section class="section section-light" id="cbd-studies" aria-labelledby="cbd-studies-title">
      <div class="wrap">
        <div class="prose-measure">
          <h2 id="cbd-studies-title">CBD studies in psychiatry: small, mixed and product-specific</h2>
          <p>Small trials of other CBD preparations have produced mixed results. These are different trials, not proof that one dose always works and another does not. They studied other products and populations, not NWPT-SM32300 in people at clinical high risk. A reason to investigate a treatment is not an established benefit.</p>
        </div>
        {study_table(rows, "Selected CBD studies in psychiatry, from the Evidence library", pre)}
        <p class="fineprint">Summaries are taken from the <a href="{pre}evidence.html#cat-cbd">Evidence library</a> entries. McGuire et al. 2018 and Boggs et al. 2018 are supported at abstract level.</p>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="reading-title">
      <div class="wrap prose-measure">
        <h2 id="reading-title">Reading a result</h2>
        <p>A change in a brain scan is not the same as improved daily functioning. A short-term symptom change does not prove prevention of a future illness. A study in healthy volunteers cannot establish treatment benefit in people with a psychiatric condition.</p>
        <p>When reading a study, look for:</p>
        <ul class="sci-checklist">
          <li><strong>Population:</strong> who took part?</li>
          <li><strong>Treatment:</strong> which product, dose and route?</li>
          <li><strong>Comparison:</strong> compared with what?</li>
          <li><strong>Duration:</strong> for how long?</li>
          <li><strong>Outcome:</strong> which measure changed?</li>
          <li><strong>Uncertainty:</strong> how large, and how certain, was the difference?</li>
        </ul>
        <p>The <a href="{pre}evidence.html">Evidence library</a> uses a consistent format to make these easier to compare.</p>
        {programme_note(pre)}
        {REVIEW}
      </div>
    </section>'''
    return dict(path="science/psychiatry.html", title="Psychiatry & evidence", h1="Understanding the clinical question",
                desc="Psychosis and clinical high risk: what risk means, what current guidance recommends, and what small CBD studies in psychiatry have and have not shown.",
                body=body)


def chain(pre):
    steps = [
        ("plant", "Cannabis", "The plant and, in everyday usage, preparations made from it. Their composition varies widely.", "Which plant material or preparation?"),
        ("compound", "Cannabinoid", "A compound in this area of pharmacology, such as CBD or THC. The compounds do not all have the same effects.", "Which compound, at what dose?"),
        ("formulation", "Formulation", "The way ingredients are prepared and delivered, such as an oral solution, spray or capsule.", "Which formulation and route?"),
        ("evidence", "Medicine and evidence", "A product used within a medicinal framework. Its specific approval status and evidence still need to be identified.", "Which product, in whom, for which outcome?"),
    ]
    lis = "".join(f'''<li class="sci-chain__step"><span class="sci-chain__icon">{ICONS[k]}</span><h3 class="sci-chain__title">{t}</h3><p>{d}</p><p class="sci-chain__ask"><span>Ask:</span> {q}</p></li>'''
                  for k, t, d, q in steps)
    return f'''<figure class="sci-chain" aria-labelledby="chain-cap">
          <ol class="sci-chain__list" role="list">{lis}</ol>
          <figcaption id="chain-cap" class="sci-chain__cap">Four separate questions. Each step needs its own evidence: a plant does not become a proven medicine automatically, and a finding for one compound or product does not transfer to another.</figcaption>
        </figure>'''


def page_cannabinoids():
    pre = "../"
    body = f'''
    {hero("Science · Understanding cannabinoids", "Cannabis, cannabinoids and medicines: understanding the difference",
          "The word cannabis can refer to a plant, a preparation made from it, or products with very different compositions. Cannabinoids are compounds discussed within this field. Two of the best known are cannabidiol, usually called CBD, and delta-9-tetrahydrocannabinol, usually called THC.",
          "science/cannabinoids.html", pre, fig=ecs_video(pre))}

    <section class="section section-light" aria-labelledby="distinctions-title">
      <div class="wrap">
        <div class="prose-measure">
          <h2 id="distinctions-title">Start with four distinctions</h2>
          <p>The organising question is: <strong>which compound, in which product, studied in which people, for which outcome?</strong> {cites("englund-2023", "nhs-cbpm", pre=pre)}</p>
        </div>
        {chain(pre)}
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="ecs-title">
      <div class="wrap prose-measure">
        <h2 id="ecs-title">A signalling system already present in the body</h2>
        {figure("synapse", pre)}
        <p>The body produces signalling molecules called endocannabinoids, including anandamide and 2-AG. The endocannabinoid system includes these molecules, receptors such as CB1 and CB2, and enzymes involved in making and breaking down the signals. {cites("health-canada-hcp-2018", pre=pre)}</p>
        <p>In cell experiments, THC and 2-AG both activated CB1 signalling, and CBD reduced that signalling. {cites("laprairie-2015", pre=pre)} A laboratory mechanism is a reason to investigate, not evidence that adding a cannabinoid will improve health or correct a deficiency.</p>
      </div>
    </section>

    <section class="section section-light" aria-labelledby="actions-title">
      <div class="wrap prose-measure">
        <h2 id="actions-title">Different compounds, different actions</h2>
        <p>In experiments in people, THC impaired memory and produced temporary psychotic symptoms such as paranoia. {cites("englund-2013", "englund-2023", pre=pre)}</p>
        <p>CBD does not produce the THC-like high. {cites("health-canada-about-cannabis", pre=pre)} Non-intoxicating does not mean inactive or risk-free. {cites("health-canada-cbd", pre=pre)} For example, the UK product information for one CBD medicine lists sleepiness among its side effects. {cites("epidyolex-smpc", pre=pre)}</p>
        <p>CBD is being investigated for several possible medical applications. Whether it helps depends on the product, the population and the outcome being studied. A possible mechanism is a reason to investigate a treatment, not proof of clinical benefit. {cites("mcguire-2018", "boggs-2018", pre=pre)}</p>
        <p>Other cannabinoid names, including CBG, CBN and THCV, may appear in research or product descriptions. Each requires its own evidence assessment; CBD or THC findings cannot be assigned to another molecule. This introductory page makes no treatment claims for these compounds.</p>
        <p><a href="cbd-thc.html">CBD and THC: different effects, complex interactions</a></p>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="route-title">
      <div class="wrap prose-measure">
        <h2 id="route-title">Why formulation and route matter</h2>
        <p>Swallowing a compound and inhaling it are different exposures. Food, accompanying ingredients and other medicines can also change how a compound is handled. A concentration printed on a label does not by itself tell us how much reaches the bloodstream, the brain or a relevant biological target.</p>
        <p>For example, CBD dissolves poorly in water. Taken by mouth on an empty stomach, only about 6% of a dose is estimated to reach the bloodstream, and a high-fat meal increases absorption several-fold. {cites("perucca-2020", "taylor-2018", pre=pre)} CBD can also change how some other medicines are handled; the UK product information for one CBD medicine describes an interaction with clobazam. {cites("epidyolex-smpc", pre=pre)}</p>
        <p>For NWPharmaTech’s formulation research, see the <a href="{pre}science/formulation.html#formulation">formulation explainer</a>. It distinguishes what the formulation is designed to do from what has been measured.</p>
        <p><a href="cannabinoid-medicines.html">From cannabis to medicines: why products are not interchangeable</a></p>
      </div>
    </section>

    <section class="section section-light" aria-labelledby="further-x">
      <div class="wrap prose-measure">
        {further_reading(pre)}
        {programme_note(pre)}
        {REVIEW}
      </div>
    </section>'''
    return dict(path="science/cannabinoids.html", title="Understanding cannabinoids", h1="Cannabis, cannabinoids and medicines",
                desc="Plain-language foundations: the difference between cannabis, cannabinoids, formulations and medicines, the endocannabinoid system, and why route and product matter.",
                body=body, scripts=["ecs-video.js"])


def compare_panel(pid, title, thc, cbd):
    col = lambda name, items: f'<div class="sci-col"><h4 class="sci-col__name">{name}</h4><ul>{"".join(f"<li>{x}</li>" for x in items)}</ul></div>'
    return f'<section class="sci-panel" id="{pid}" aria-labelledby="{pid}-h"><h3 class="sci-panel__title" id="{pid}-h">{title}</h3><div class="sci-pair">{col("THC", thc)}{col("CBD", cbd)}</div></section>'


def page_cbd_thc():
    pre = "../"
    c = lambda *ids: cites(*ids, pre=pre)
    panels = "".join([
        compare_panel("cmp-effects", "Effects",
                      [f"Activates the cannabinoid receptor CB1 in cell experiments. {c('laprairie-2015')}",
                       f"In experiments in people, impaired memory and produced temporary psychotic symptoms such as paranoia. {c('englund-2013', 'englund-2023')}"],
                      [f"Has different, more complex pharmacology. In cell experiments it can reduce CB1 signalling (negative allosteric modulation); that is a laboratory finding, not a clinical effect. {c('laprairie-2015')}",
                       f"Does not produce the THC-like high. {c('health-canada-about-cannabis')} Non-intoxicating does not mean inactive or risk-free. {c('health-canada-cbd')} Sleepiness is a listed side effect of one CBD medicine. {c('epidyolex-smpc')}"]),
        compare_panel("cmp-clinical", "Clinical evidence",
                      [f"In experimental settings, THC can produce temporary psychotic symptoms. {c('englund-2013')}",
                       f"Observational research links daily use, and especially daily use of high-potency cannabis, with higher odds of psychotic disorder. This is an association, not a prediction for any individual. {c('diforti-2019')}",
                       f"THC-containing medicines exist for specified uses, for example a THC and CBD spray for MS-related spasticity. {c('sativex-smpc')}"],
                      [f"Licensed in the UK as one specific medicine for seizures in specified epilepsy conditions. {c('epidyolex-smpc')}",
                       f"In psychiatry, small trials of other CBD preparations have produced mixed results. {c('mcguire-2018', 'boggs-2018')}",
                       "Not established as a treatment for people at clinical high risk. NWPT-SM32300 is investigational."]),
        compare_panel("cmp-interactions", "Interactions",
                      [f"Combining THC with CBD does not reliably reduce THC’s effects. {c('englund-2023', 'chesney-2025')}",
                       f"A high oral CBD dose given with THC increased THC exposure and impairment in one study. {c('zamarripa-2023')}"],
                      [f"CBD can change how some other medicines are handled; the UK product information for one CBD medicine describes an interaction with clobazam. {c('epidyolex-smpc')}",
                       "Effects depend on dose, timing, route, formulation and the people studied."]),
    ])
    rows = [
        ("Laboratory", "laprairie-2015", "Cells expressing CB1 receptors", "CBD applied to cells", "CBD reduced CB1 signalling, consistent with negative allosteric modulation", "A laboratory mechanism, not clinical protection"),
        ("Human experiment", "englund-2013", "48 healthy participants", "Oral CBD or placebo before intravenous THC", "Reduced selected paranoia and memory effects of THC; the average positive-symptom difference was not significant", "Route and timing differ from ordinary cannabis use"),
        ("Human experiment", "englund-2023", "46 healthy, infrequent cannabis users", "Inhaled cannabis: fixed THC with increasing CBD", "More CBD did not protect against the acute adverse effects measured", "Particular ratios in an acute experiment, not every regimen"),
        ("Human experiment", "zamarripa-2023", "18 healthy adults", "Oral extract: the same THC dose with or without high-dose CBD", "Greater THC exposure and impairment with CBD added", "Small, single doses; participants also took probe drugs"),
        ("Human experiment", "chesney-2025", "30 people with schizophrenia or schizoaffective disorder and cannabis use disorder", "Oral CBD or placebo before inhaled cannabis", "No reduction in acute memory or psychotic effects; these appeared worse", "Does not establish the effects of CBD alone or of longer treatment"),
    ]
    body = f'''
    {hero("Science · Understanding cannabinoids", "CBD and THC: different effects, complex interactions",
          "The two names are often grouped together. Their effects should not be.", "science/cbd-thc.html", pre)}

    <section class="section section-light" aria-labelledby="distinct-title">
      <div class="wrap">
        <div class="prose-measure">
          <h2 id="distinct-title">Two distinct compounds</h2>
          <p>THC and CBD are distinct compounds. In cell experiments THC activates the cannabinoid receptor CB1, and in experiments in people it impaired memory and produced temporary psychotic symptoms. CBD has different pharmacology and does not produce the THC-like high. They are not simple opposites. {c("laprairie-2015", "englund-2013", "englund-2023", "health-canada-about-cannabis")}</p>
        </div>
        {figure("molecules", pre)}
        <div class="sci-compare" data-sci-tabs="Compare THC and CBD">
          {panels}
        </div>
        <p class="fineprint sci-compare__note">Laboratory mechanisms, experiments in people and product-specific evidence answer different questions; each statement names its source.</p>
      </div>
    </section>

    <section class="section section-alt" id="cancel" aria-labelledby="cancel-title">
      <div class="wrap">
        <div class="prose-measure">
          <h2 id="cancel-title">Does CBD cancel out THC?</h2>
          <p class="sci-answer">Not reliably.</p>
          <p>Some experiments have found reductions in selected effects when CBD was given before THC; others have found no protection or stronger adverse effects. {c("englund-2013", "englund-2023", "zamarripa-2023", "chesney-2025")}</p>
          <p>A 2013 experiment found benefits on selected paranoia and memory measures, but not a statistically significant difference in the average positive-symptom score. A 2023 trial adding CBD to inhaled THC found no protective effect on the outcomes tested. Another 2023 trial found greater impairment with a high oral CBD dose combined with THC. In a 2025 trial in people with schizophrenia and cannabis use disorder, CBD pretreatment appeared to worsen the acute memory and psychotic effects of inhaled cannabis. These studies used different regimens and populations.</p>
        </div>
        {study_table(rows, "Evidence on CBD and THC together", pre)}
        <div class="prose-measure">
          <p>This evidence does not support using CBD as an antidote or assuming that a CBD-containing cannabis product is safe. It also does not answer every question about CBD used without THC in a different clinical study.</p>
        </div>
      </div>
    </section>

    <section class="section section-light" aria-labelledby="psychosis-title">
      <div class="wrap prose-measure">
        <h2 id="psychosis-title">What about psychosis?</h2>
        <p>THC can produce temporary psychotic symptoms in experimental settings. {c("englund-2013")} Observational research also links daily cannabis use, and especially daily use of high-potency cannabis, with higher odds of psychotic disorder. {c("diforti-2019")} Those findings describe groups; they do not predict an individual’s outcome.</p>
        <p>Research into purified CBD as a potential psychiatric treatment asks a separate question. Small trials have produced mixed results. {c("mcguire-2018", "boggs-2018")} A rationale for research is not an established treatment benefit, and it is not evidence that NWPT-SM32300 works.</p>
        <p><a href="psychiatry.html#cbd-studies">CBD studies in psychiatry</a></p>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="safety-title">
      <div class="wrap prose-measure">
        <h2 id="safety-title">Safety belongs in the comparison</h2>
        <p>CBD can cause unwanted effects and interact with medicines. The UK product information for one CBD medicine lists sleepiness and raised liver enzymes (especially with valproate), and an interaction with clobazam. {c("epidyolex-smpc")} A trial of a purified CBD solution reported diarrhoea, vomiting, fatigue, fever, sleepiness and abnormal liver tests. {c("devinsky-2017")} The exact risks depend on the preparation, dose, other treatments and patient.</p>
        {programme_note(pre)}
        {REVIEW}
      </div>
    </section>'''
    return dict(path="science/cbd-thc.html", title="CBD and THC", h1="CBD and THC: different effects, complex interactions",
                desc="THC and CBD are distinct compounds, not simple opposites. What experiments show about combining them, what the psychosis research says, and why safety belongs in the comparison.",
                body=body, script=True)


def page_medicines():
    pre = "../"
    c = lambda *ids: cites(*ids, pre=pre)
    cats = [("Licensed medicine", "A particular product has an authorisation covering specified uses and conditions; check the current local label."),
            ("Unlicensed medicinal product", "Medicinal supply can occur through a specific framework, but this is not a marketing authorisation proving efficacy for each use."),
            ("Investigational medicine", "A product being studied; trial activity does not itself establish benefit."),
            ("Consumer CBD product", "A commercial product category; it should not be treated as equivalent to a tested medicine.")]
    cat_rows = "".join(f'<tr><th scope="row" data-label="Category">{a}</th><td data-label="How to interpret it">{b}</td></tr>' for a, b in cats)
    ex = [("Epidyolex", "A CBD medicine", "The UK product information lists Epidyolex as an add-on treatment for seizures associated with Lennox–Gastaut or Dravet syndrome, together with clobazam, and for seizures associated with tuberous sclerosis complex, in patients aged 2 years and older.", "epidyolex-smpc"),
          ("Sativex", "A THC and CBD oromucosal spray", "For symptom improvement in adults with moderate to severe spasticity due to multiple sclerosis who have not responded adequately to other anti-spasticity medicines and who show clinically significant improvement during an initial trial of treatment.", "sativex-smpc"),
          ("Nabilone", "A synthetic cannabinoid", "For nausea and vomiting caused by cancer chemotherapy that has not responded adequately to conventional anti-sickness treatments. NHS England groups nabilone with synthetic cannabinoids that are structurally related to THC, rather than identical to it.", ("nabilone-smpc", "nhs-cbpm"))]
    ex_cards = "".join(f'<article class="card sci-product"><p class="sci-product__kind">{k}</p><h3>{n}</h3><p>{t}</p><p>{c(*(i if isinstance(i, tuple) else (i,)))}</p></article>' for n, k, t, i in ex)
    dims = [("Published studies", "What was found, in whom, compared with what."), ("Regulatory authorisation", "Which product may be marketed, for which uses."),
            ("Clinical guidelines", "What is recommended in care, and for whom."), ("Legal access", "How a product can be supplied or obtained.")]
    dim_html = "".join(f'<li><strong>{a}</strong><span>{b}</span></li>' for a, b in dims)
    body = f'''
    {hero("Science · Understanding cannabinoids", "From cannabis to medicines",
          "A shared origin does not make products interchangeable.", "science/cannabinoid-medicines.html", pre)}

    <section class="section section-light" aria-labelledby="question-title">
      <div class="wrap">
        <div class="prose-measure">
          <h2 id="question-title">Ask what the product is</h2>
          <p>The useful question is not simply whether something contains cannabis or CBD. It is what the product contains, how it is made, how it is administered, who it has been studied in and what its evidence supports.</p>
        </div>
        <div class="table-wrap table-wrap--stack sci-categories"><table><caption class="sci-caption">Four product categories</caption><thead><tr><th scope="col">Category</th><th scope="col">How to interpret it</th></tr></thead><tbody>{cat_rows}</tbody></table></div>
        <p class="sci-cites-line">{c("mhra-specials", "nhs-cbpm")}</p>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="examples-title">
      <div class="wrap">
        <div class="prose-measure">
          <h2 id="examples-title">UK examples</h2>
          <p>These examples show why the distinctions matter. Each describes a particular product and its UK indication.</p>
        </div>
        <div class="card-grid cols-3 sci-products">{ex_cards}</div>
        <div class="prose-measure">
          <p>These examples describe particular products and indications. They do not establish cannabis as a treatment for every condition, or transfer an approval to NWPT-SM32300.</p>
        </div>
      </div>
    </section>

    <section class="section section-light" aria-labelledby="steps-title">
      <div class="wrap prose-measure">
        <h2 id="steps-title">Read an evidence claim in six steps</h2>
        <ol class="sci-steps">
          <li>Which molecule or mixture?</li>
          <li>Which formulation and route?</li>
          <li>Which population and condition?</li>
          <li>Compared with what?</li>
          <li>Which outcome, over how long?</li>
          <li>What benefit, harm and uncertainty were found?</li>
        </ol>
        <h3>Four different questions, shown separately</h3>
        <p>Published studies, regulatory authorisations, clinical guidelines and legal access answer different questions. They should be read separately rather than combined into one “approved” label.</p>
        <ul class="sci-dimensions" role="list">{dim_html}</ul>
      </div>
    </section>

    <section class="section section-alt" aria-labelledby="further-x">
      <div class="wrap prose-measure">
        {further_reading(pre)}
        {programme_note(pre)}
        {REVIEW}
      </div>
    </section>'''
    return dict(path="science/cannabinoid-medicines.html", title="From cannabis to medicines", h1="From cannabis to medicines",
                desc="Licensed, unlicensed, investigational and consumer cannabinoid products are not interchangeable. UK examples and a six-step way to read an evidence claim.",
                body=body)


# ---------------------------------------------------------------- NWPT-051: /science/formulation
# The deeper formulation and research-question material that used to follow the two routes on /science, moved verbatim
# (source/science-formulation.html). Relative links and image paths gain "../" because the page is one level down.
FORMULATION_SRC = ROOT / "source" / "science-formulation.html"
MOVED_IDS = ["investigating", "formulation", "q2-h", "dg-title", "dg-desc", "ar", "conceptual-platform", "chrp-title"]


def up(frag):
    rel = lambda u: u if re.match(r"(?:[a-z]+:|/|#)", u) else "../" + u
    frag = re.sub(r'\b(href|src|poster)="([^"]+)"', lambda m: f'{m.group(1)}="{rel(m.group(2))}"', frag)
    return re.sub(r'\bsrcset="([^"]+)"', lambda m: 'srcset="' + ", ".join(" ".join([rel(x.split()[0])] + x.split()[1:]) for x in m.group(1).split(",")) + '"', frag)


def page_formulation():
    pre = "../"
    frag = FORMULATION_SRC.read_text().split("\n", 1)[1]
    # the capsule-to-measurement diagram gets an id, so old links to ids inside its SVG (#dg-title, #dg-desc, #ar), which
    # browsers cannot scroll to, can be forwarded to the figure itself (science-forward.js)
    assert frag.count('<figure class="nwpt-diagram">') == 1
    frag = frag.replace('<figure class="nwpt-diagram">', '<figure class="nwpt-diagram" id="capsule-diagram">')
    body = f'''
    {hero("Science · Our programme", "The investigational formulation and the research question",
          "What NWPT-SM32300 is designed to do, what has been measured, and which questions remain open.", "science/formulation.html", pre)}
    {up(frag)}
    <section class="section section-light" aria-label="Review status">
      <div class="wrap prose-measure">
        {REVIEW}
      </div>
    </section>'''
    return dict(path="science/formulation.html", title="NWPT formulation", h1="The investigational formulation and the research question",
                desc="NWPT-SM32300, NWPharmaTech’s investigational CBD micellar-emulsion softgel: what it is designed to do, what has been measured, and the open research question in clinical high risk.",
                body=body, css=[f"../assets/nwpt/formulation/module.css?v=nwpt032"])


# ---------------------------------------------------------------- page assembly (shell from a sub-directory page)
SHELL_SRC = SITE / "updates" / "why-early-intervention-matters.html"


def build_page(p):
    s = SHELL_SRC.read_text()
    title = f'{html.unescape(p["title"])} | NWPharmaTech'
    url = CANON + p["path"]
    esc = lambda x: html.escape(x, quote=True)
    s = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", s, 1)
    s = re.sub(r'<meta name="description" content="[^"]*" />', f'<meta name="description" content="{esc(p["desc"])}" />', s, 1)
    s = re.sub(r'<link rel="canonical" href="[^"]*" />', f'<link rel="canonical" href="{url}" />', s, 1)
    s = re.sub(r'<meta property="og:title" content="[^"]*" />', f'<meta property="og:title" content="{esc(title)}" />', s, 1)
    s = re.sub(r'<meta property="og:description" content="[^"]*" />', f'<meta property="og:description" content="{esc(p["desc"])}" />', s, 1)
    s = re.sub(r'<meta property="og:url" content="[^"]*" />', f'<meta property="og:url" content="{url}" />', s, 1)
    s = re.sub(r'<meta property="og:image:alt" content="[^"]*" />', '<meta property="og:image:alt" content="NWPharmaTech — Science" />', s, 1)
    s = re.sub(r'<meta name="twitter:title" content="[^"]*" />', f'<meta name="twitter:title" content="{esc(title)}" />', s, 1)
    s = re.sub(r'<meta name="twitter:description" content="[^"]*" />', f'<meta name="twitter:description" content="{esc(p["desc"])}" />', s, 1)
    s = re.sub(r"styles\.css\?v=[a-z0-9]+", f"styles.css?v={V}", s)
    a, b = s.index("<main"), s.index("</main>") + len("</main>")
    main = f'<main id="main" class="sci-page">\n    <!-- Generated by tools/build-science.py (NWPT-048). Edit the generator, not this file. -->{p["body"]}\n  </main>'
    s = s[:a] + main + s[b:]
    if p.get("css"):
        s = s.replace("</head>", "".join(f'  <link rel="stylesheet" href="{c}" />\n' for c in p["css"]) + "</head>", 1)
    for js in p.get("scripts", []):
        s = s.replace('<script src="../nav.js', f'<script src="../{js}?v={V}" defer></script>\n  <script src="../nav.js', 1)
    if p.get("script"):
        s = s.replace('<script src="../nav.js', f'<script src="../science-tabs.js?v={V}" defer></script>\n  <script src="../nav.js', 1)
    out = SITE / p["path"]
    out.parent.mkdir(exist_ok=True)
    out.write_text(s)
    return out


# ---------------------------------------------------------------- Science overview (two-route landing), idempotent
def science_overview():
    f = SITE / "science.html"
    s = f.read_text()
    s = s.replace("<h1>CHR-P research &amp; our programme</h1>", "<h1>The clinical questions and the compounds being studied</h1>", 1)
    s = s.replace("""          What clinical high risk means, why earlier intervention research matters, and what this investigational programme is designed to ask.""",
                  """          Understanding our research means understanding two connected areas: the psychiatric conditions we are investigating, and the compounds and formulations being studied. Explore either route, then follow the evidence behind individual statements.""", 1)
    s = s.replace('<a href="science.html" aria-current="page">Science hub</a>',
                  '<a href="science.html" aria-current="page">Science overview</a>\n          <a href="science/psychiatry.html">Psychiatry &amp; evidence</a>\n          <a href="science/cannabinoids.html">Understanding cannabinoids</a>', 1)
    block = f'''<!-- NWPT-048 routes start -->
    <section class="section section-light sci-routes-section" aria-labelledby="routes-title">
      <div class="wrap">
        <h2 id="routes-title" class="sci-visually-hidden">Two learning routes</h2>
        <div class="sci-routes">
          <article class="sci-route">
            <p class="sci-route__kicker">Route 1</p>
            <h3 class="sci-route__title"><a href="science/psychiatry.html">Psychiatry &amp; evidence</a></h3>
            <p>What does clinical high risk mean? What can existing care offer? What have studies found, and which questions remain unanswered? Start with the clinical context, then explore the research.</p>
            <p class="sci-route__label">Start with a question</p>
            <ul class="sci-route__questions">
              <li><a href="updates/why-early-intervention-matters.html">What does clinical high risk of psychosis mean?</a></li>
              <li><a href="updates/why-early-intervention-matters.html#current-care">What does current guidance recommend?</a></li>
              <li><a href="science/psychiatry.html#cbd-studies">What have CBD studies in psychiatry found?</a></li>
            </ul>
            <p class="sci-route__cta"><a class="btn btn-primary" href="science/psychiatry.html">Explore psychiatry &amp; evidence</a></p>
          </article>
          <article class="sci-route">
            <p class="sci-route__kicker">Route 2</p>
            <h3 class="sci-route__title"><a href="science/cannabinoids.html">Understanding cannabinoids</a></h3>
            <p>Cannabis is a plant containing many compounds. CBD and THC are different molecules with different effects. Learn how compounds, products, formulations and clinical evidence fit together.</p>
            <p class="sci-route__label">Start with a question</p>
            <ul class="sci-route__questions">
              <li><a href="science/cannabinoids.html">How do cannabis, cannabinoids and medicines differ?</a></li>
              <li><a href="science/cbd-thc.html#cancel">Does CBD cancel out THC?</a></li>
              <li><a href="science/cannabinoid-medicines.html">Why are cannabinoid products not interchangeable?</a></li>
            </ul>
            <p class="sci-route__cta"><a class="btn btn-primary" href="science/cannabinoids.html">Explore cannabinoids</a></p>
          </article>
        </div>
      </div>
    </section>
    <section class="section section-alt sci-intro-section" id="investigating" aria-labelledby="programme-intro-title">
      <div class="wrap prose-measure">
        <h2 id="programme-intro-title">Our programme</h2>
        <p><strong>NWPT-SM32300</strong> is NWPharmaTech’s investigational 300&nbsp;mg CBD micellar-emulsion softgel. The planned Phase&nbsp;2B study is designed to evaluate dose response, symptoms, safety and tolerability, and inform the next stage of development.</p>
        <p>Effectiveness in this population has <strong>not</strong> been established. General cannabinoid research does not establish that it is effective.</p>
        <ul class="sci-shared sci-intro-links" role="list" aria-label="Our programme">
          <li id="formulation"><a href="science/formulation.html"><strong>NWPT formulation</strong><span>What the formulation is designed to do, what has been measured, and the open research question</span></a></li>
          <li><a href="programme-room.html"><strong>Programme Room</strong><span>What has been studied, what is planned and what remains unknown</span></a></li>
        </ul>
        <p class="sci-intro-moved__label">On the formulation page:</p>
        <ul class="sci-intro-moved" aria-label="Sections on the formulation page">
          <li id="chrp-title"><a href="science/formulation.html#chrp-title">What CHR-P means</a></li>
          <li id="q2-h"><a href="science/formulation.html#q2-h">Why investigate a micellar softgel?</a></li>
          <li id="dg-title"><a id="dg-desc" href="science/formulation.html#capsule-diagram"><span id="ar">From capsule to measurement (diagram)</span></a></li>
          <li id="conceptual-platform"><a href="science/formulation.html#conceptual-platform">Conceptual delivery motif</a></li>
        </ul>
      </div>
    </section>
    <section class="section section-light" aria-labelledby="resources-title">
      <div class="wrap">
        <h2 id="resources-title" class="sci-visually-hidden">Shared resources</h2>
        <ul class="sci-shared" role="list" aria-label="Shared resources">
          <li><a href="evidence.html"><strong>Evidence library</strong><span>Sources behind statements on both routes</span></a></li>
          <li><a href="glossary.html"><strong>Glossary</strong><span>Terms used across the Science pages</span></a></li>
          <li><a href="resources/programme-brief.html"><strong>Programme brief</strong><span>The CHR-P programme at a glance</span></a></li>
        </ul>
        <div class="prose-measure">
          {further_reading("").replace('id="further-o"', 'id="further-o"')}
          {REVIEW}
        </div>
      </div>
    </section>
    <!-- NWPT-048 routes end -->
'''
    if "<!-- NWPT-048 routes start -->" in s:
        s = re.sub(r"<!-- NWPT-048 routes start -->.*?<!-- NWPT-048 routes end -->\n", block, s, flags=re.S)
        # NWPT-051: everything after the routes block moved verbatim to /science/formulation
        a = s.index("<!-- NWPT-048 routes end -->\n") + len("<!-- NWPT-048 routes end -->\n")
        b = s.index("</main>")
        if s[a:b].strip():
            assert s[a:b].strip() == FORMULATION_SRC.read_text().split("\n", 1)[1].strip(), "moved content differs from source/science-formulation.html"
            s = s[:a] + "  " + s[b:]
        s = s.replace('  <link rel="stylesheet" href="assets/nwpt/formulation/module.css?v=nwpt032" />\n', "")
        if "science-forward.js" not in s:
            s = s.replace('<script src="nav.js', f'<script src="science-forward.js?v={V}" defer></script>\n  <script src="nav.js', 1)
        s = s.replace('<a href="science/cannabinoids.html">Understanding cannabinoids</a>\n          <a href="evidence.html">Evidence</a>',
                      '<a href="science/cannabinoids.html">Understanding cannabinoids</a>\n          <a href="science/formulation.html">NWPT formulation</a>\n          <a href="evidence.html">Evidence</a>', 1)
    else:
        k = s.index('    <section class="section section-light" aria-labelledby="chrp-title">')
        s = s[:k] + "    " + block + s[k:]
    f.write_text(s)


# ---------------------------------------------------------------- Evidence library section, idempotent
def evidence_section():
    f = SITE / "evidence.html"
    s = f.read_text()
    cards = "".join(evidence_card(n) for n in NEW)
    sec = (f'<!-- NWPT-048 evidence start --><section class="nwpt-lib-section" data-section="cannabinoids" aria-labelledby="cat-cannabinoids"><h2 id="cat-cannabinoids">Cannabinoid science and medicines</h2>'
           f'<p class="nwpt-lib-note">Added for the Science pages.{" Entries marked “Source check in progress” are summarised from the cited records and are still being checked against the original publications." if PENDING else ""}</p>'
           f'<div class="nwpt-study-cards">{cards}</div></section><!-- NWPT-048 evidence end -->')
    if "<!-- NWPT-048 evidence start -->" in s:
        s = re.sub(r"<!-- NWPT-048 evidence start -->.*?<!-- NWPT-048 evidence end -->", sec, s, flags=re.S)
    else:
        k = s.index('<section class="nwpt-lib-section" data-section="programme"')
        s = s[:k] + sec + s[k:]
    chip = f'<button type="button" class="nwpt-chip" aria-pressed="false" data-filter="cannabinoids">Cannabinoid science and medicines <span class="nwpt-chip-n">{len(NEW)}</span></button>'
    s = re.sub(r'<button type="button" class="nwpt-chip" aria-pressed="false" data-filter="cannabinoids">.*?</button>', "", s)
    s = s.replace('<button type="button" class="nwpt-chip" aria-pressed="false" data-filter="programme">', chip + '<button type="button" class="nwpt-chip" aria-pressed="false" data-filter="programme">', 1)
    s = re.sub(r"evidence-library/module\.css\?v=[a-z0-9]+", f"evidence-library/module.css?v={V}", s)
    f.write_text(s)


GLOSS = [
    ("g-cannabis", "Cannabis", "The plant and, in everyday usage, preparations made from it. Preparations vary widely in composition."),
    ("g-cannabinoid", "Cannabinoid", "A compound in this area of pharmacology, such as CBD or THC. Cannabinoids do not all have the same effects."),
    ("g-cbd", "CBD (cannabidiol)", "A cannabinoid that does not produce the THC-like high. Non-intoxicating does not mean inactive or risk-free."),
    ("g-thc", "THC (delta-9-tetrahydrocannabinol)", "A cannabinoid that activates the cannabinoid receptor CB1 in cell experiments and, in experiments in people, impaired memory and produced temporary psychotic symptoms."),
    ("g-ecs", "Endocannabinoid system", "Signalling molecules made by the body (endocannabinoids, such as anandamide and 2-AG), receptors such as CB1 and CB2, and enzymes involved in making and breaking down the signals."),
    ("g-cb1", "CB1 receptor", "A cannabinoid receptor. In cell experiments, THC and 2-AG activated CB1 signalling, and CBD reduced that signalling. These are laboratory findings, not clinical effects."),
    ("g-nam", "Negative allosteric modulation", "A laboratory term: a compound binds a receptor at a different site and reduces the receptor’s response to other signals. A laboratory finding is not a clinical effect."),
    ("g-formulation", "Formulation", "The way ingredients are prepared and delivered, such as an oral solution, spray or capsule. Formulation, route and food can change exposure."),
    ("g-licensed", "Licensed medicine", "A particular product with an authorisation covering specified uses and conditions. The authorisation does not extend to other products containing the same compound."),
    ("g-unlicensed", "Unlicensed medicinal product", "A product supplied for medicinal use through a specific framework without a marketing authorisation for that use."),
    ("g-investigational", "Investigational medicine", "A product being studied in trials. Trial activity does not itself establish benefit."),
]


def glossary():
    f = SITE / "glossary.html"
    s = f.read_text()
    dl = "".join(f'\n          <dt id="{i}">{t}</dt>\n          <dd>{d}</dd>' for i, t, d in GLOSS)
    block = (f'<!-- NWPT-048 glossary start -->\n    <section class="section section-light" aria-labelledby="gloss-cannabinoids">\n      <div class="wrap">\n'
             f'        <h2 id="gloss-cannabinoids">Cannabinoid terms</h2>\n        <p class="muted">Used on the <a href="science/cannabinoids.html">Understanding cannabinoids</a> pages.</p>\n        <dl>{dl}\n        </dl>\n      </div>\n    </section>\n    <!-- NWPT-048 glossary end -->\n')
    if "<!-- NWPT-048 glossary start -->" in s:
        s = re.sub(r"<!-- NWPT-048 glossary start -->.*?<!-- NWPT-048 glossary end -->\n", block, s, flags=re.S)
    else:
        k = s.index("</main>")
        s = s[:k] + "    " + block + "  " + s[k:]
    f.write_text(s)


def main():
    pages = [page_psychiatry(), page_cannabinoids(), page_cbd_thc(), page_medicines(), page_formulation()]
    for p in pages:
        print("wrote", build_page(p).relative_to(SITE))
    science_overview()
    evidence_section()
    glossary()
    print("updated science.html, evidence.html, glossary.html")


if __name__ == "__main__":
    main()
