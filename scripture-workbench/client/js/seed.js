/**
 * Development seed corpus.
 *
 * Two passages, fully tokenized, in exactly the shape build_corpus.py emits.
 * This exists so the whole app can be built and iterated on before the real
 * corpus (a few hundred MB) is ready. Nothing downstream knows the difference.
 *
 * Tokens use a compact encoding to keep this file readable:
 *   "surface|strongs|morph|gloss"  joined by  " ~ "
 * Real corpus rows carry the same five fields plus edition markers.
 */

// ---------------------------------------------------------------------------
// Books present in the seed
// ---------------------------------------------------------------------------

export const BOOKS = [
  { book_id: 43, osis: 'John', name: 'John',   abbrev: 'Jn',  testament: 'NT', chapters: 21 },
  { book_id: 45, osis: 'Rom',  name: 'Romans', abbrev: 'Rom', testament: 'NT', chapters: 16 }
];

export const TRANSLATIONS = [
  { id: 'KJV',   name: 'King James Version',    lang: 'eng', year: 1611, license: 'PD',
    attribution: 'Public domain.', is_local: 1 },
  { id: 'WEB',   name: 'World English Bible',   lang: 'eng', year: 2006, license: 'PD',
    attribution: 'Public domain.', is_local: 1 },
  { id: 'THGNT', name: 'Greek New Testament',   lang: 'grc', year: 2017, license: 'CC BY 4.0',
    attribution: 'Tyndale House Cambridge / STEPBible, CC BY 4.0.', is_local: 1 },
  { id: 'ESV',   name: 'English Standard Version', lang: 'eng', year: 2001, license: 'Licensed',
    attribution: 'ESV® Bible, copyright © 2001 by Crossway. Used by permission.', is_local: 0 },
  { id: 'NKJV',  name: 'New King James Version', lang: 'eng', year: 1982, license: 'Licensed',
    attribution: 'New King James Version®. Copyright © 1982 by Thomas Nelson.', is_local: 0 }
];

// ---------------------------------------------------------------------------
// Verse text
// ---------------------------------------------------------------------------

export const VERSES = {
  KJV: {
    43001001: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
    43001002: 'The same was in the beginning with God.',
    43001003: 'All things were made by him; and without him was not any thing made that was made.',
    43001004: 'In him was life; and the life was the light of men.',
    43001005: 'And the light shineth in darkness; and the darkness comprehended it not.',
    45003021: 'But now the righteousness of God without the law is manifested, being witnessed by the law and the prophets;',
    45003022: 'Even the righteousness of God which is by faith of Jesus Christ unto all and upon all them that believe: for there is no difference:',
    45003023: 'For all have sinned, and come short of the glory of God;',
    45003024: 'Being justified freely by his grace through the redemption that is in Christ Jesus:',
    45003025: 'Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;',
    45003026: 'To declare, I say, at this time his righteousness: that he might be just, and the justifier of him which believeth in Jesus.'
  },
  WEB: {
    43001001: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
    43001002: 'The same was in the beginning with God.',
    43001003: 'All things were made through him. Without him, nothing was made that has been made.',
    43001004: 'In him was life, and the life was the light of men.',
    43001005: 'The light shines in the darkness, and the darkness hasn\u2019t overcome it.',
    45003021: 'But now apart from the law, a righteousness of God has been revealed, being testified by the law and the prophets;',
    45003022: 'even the righteousness of God through faith in Jesus Christ to all and on all those who believe. For there is no distinction,',
    45003023: 'for all have sinned, and fall short of the glory of God;',
    45003024: 'being justified freely by his grace through the redemption that is in Christ Jesus;',
    45003025: 'whom God sent to be an atoning sacrifice, through faith in his blood, for a demonstration of his righteousness through the passing over of prior sins, in God\u2019s forbearance;',
    45003026: 'to demonstrate his righteousness at this present time; that he might himself be just, and the justifier of him who has faith in Jesus.'
  },
  THGNT: {
    43001001: '\u1F18\u03BD \u1F00\u03C1\u03C7\u1FC7 \u1F26\u03BD \u1F41 \u03BB\u03CC\u03B3\u03BF\u03C2, \u03BA\u03B1\u1F76 \u1F41 \u03BB\u03CC\u03B3\u03BF\u03C2 \u1F26\u03BD \u03C0\u03C1\u1F78\u03C2 \u03C4\u1F78\u03BD \u03B8\u03B5\u03CC\u03BD, \u03BA\u03B1\u1F76 \u03B8\u03B5\u1F78\u03C2 \u1F26\u03BD \u1F41 \u03BB\u03CC\u03B3\u03BF\u03C2.',
    43001002: '\u03BF\u1F57\u03C4\u03BF\u03C2 \u1F26\u03BD \u1F10\u03BD \u1F00\u03C1\u03C7\u1FC7 \u03C0\u03C1\u1F78\u03C2 \u03C4\u1F78\u03BD \u03B8\u03B5\u03CC\u03BD.',
    43001003: '\u03C0\u03AC\u03BD\u03C4\u03B1 \u03B4\u03B9\u2019 \u03B1\u1F50\u03C4\u03BF\u1FE6 \u1F10\u03B3\u03AD\u03BD\u03B5\u03C4\u03BF, \u03BA\u03B1\u1F76 \u03C7\u03C9\u03C1\u1F76\u03C2 \u03B1\u1F50\u03C4\u03BF\u1FE6 \u1F10\u03B3\u03AD\u03BD\u03B5\u03C4\u03BF \u03BF\u1F50\u03B4\u1F72 \u1F15\u03BD \u1F43 \u03B3\u03AD\u03B3\u03BF\u03BD\u03B5\u03BD.',
    43001004: '\u1F10\u03BD \u03B1\u1F50\u03C4\u1FF7 \u03B6\u03C9\u1F74 \u1F26\u03BD, \u03BA\u03B1\u1F76 \u1F21 \u03B6\u03C9\u1F74 \u1F26\u03BD \u03C4\u1F78 \u03C6\u1FF6\u03C2 \u03C4\u1FF6\u03BD \u1F00\u03BD\u03B8\u03C1\u03CE\u03C0\u03C9\u03BD\u00B7',
    43001005: '\u03BA\u03B1\u1F76 \u03C4\u1F78 \u03C6\u1FF6\u03C2 \u1F10\u03BD \u03C4\u1FC7 \u03C3\u03BA\u03BF\u03C4\u03AF\u1FB3 \u03C6\u03B1\u03AF\u03BD\u03B5\u03B9, \u03BA\u03B1\u1F76 \u1F21 \u03C3\u03BA\u03BF\u03C4\u03AF\u03B1 \u03B1\u1F50\u03C4\u1F78 \u03BF\u1F50 \u03BA\u03B1\u03C4\u03AD\u03BB\u03B1\u03B2\u03B5\u03BD.',
    45003021: '\u039D\u03C5\u03BD\u1F76 \u03B4\u1F72 \u03C7\u03C9\u03C1\u1F76\u03C2 \u03BD\u03CC\u03BC\u03BF\u03C5 \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7 \u03B8\u03B5\u03BF\u1FE6 \u03C0\u03B5\u03C6\u03B1\u03BD\u03AD\u03C1\u03C9\u03C4\u03B1\u03B9, \u03BC\u03B1\u03C1\u03C4\u03C5\u03C1\u03BF\u03C5\u03BC\u03AD\u03BD\u03B7 \u1F51\u03C0\u1F78 \u03C4\u03BF\u1FE6 \u03BD\u03CC\u03BC\u03BF\u03C5 \u03BA\u03B1\u1F76 \u03C4\u1FF6\u03BD \u03C0\u03C1\u03BF\u03C6\u03B7\u03C4\u1FF6\u03BD,',
    45003022: '\u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7 \u03B4\u1F72 \u03B8\u03B5\u03BF\u1FE6 \u03B4\u03B9\u1F70 \u03C0\u03AF\u03C3\u03C4\u03B5\u03C9\u03C2 \u1F38\u03B7\u03C3\u03BF\u1FE6 \u03A7\u03C1\u03B9\u03C3\u03C4\u03BF\u1FE6, \u03B5\u1F30\u03C2 \u03C0\u03AC\u03BD\u03C4\u03B1\u03C2 \u03C4\u03BF\u1F7A\u03C2 \u03C0\u03B9\u03C3\u03C4\u03B5\u03CD\u03BF\u03BD\u03C4\u03B1\u03C2\u00B7 \u03BF\u1F50 \u03B3\u03AC\u03C1 \u1F10\u03C3\u03C4\u03B9\u03BD \u03B4\u03B9\u03B1\u03C3\u03C4\u03BF\u03BB\u03AE\u00B7',
    45003023: '\u03C0\u03AC\u03BD\u03C4\u03B5\u03C2 \u03B3\u1F70\u03C1 \u1F25\u03BC\u03B1\u03C1\u03C4\u03BF\u03BD \u03BA\u03B1\u1F76 \u1F51\u03C3\u03C4\u03B5\u03C1\u03BF\u1FE6\u03BD\u03C4\u03B1\u03B9 \u03C4\u1FC6\u03C2 \u03B4\u03CC\u03BE\u03B7\u03C2 \u03C4\u03BF\u1FE6 \u03B8\u03B5\u03BF\u1FE6,',
    45003024: '\u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03CD\u03BC\u03B5\u03BD\u03BF\u03B9 \u03B4\u03C9\u03C1\u03B5\u1F70\u03BD \u03C4\u1FC7 \u03B1\u1F50\u03C4\u03BF\u1FE6 \u03C7\u03AC\u03C1\u03B9\u03C4\u03B9 \u03B4\u03B9\u1F70 \u03C4\u1FC6\u03C2 \u1F00\u03C0\u03BF\u03BB\u03C5\u03C4\u03C1\u03CE\u03C3\u03B5\u03C9\u03C2 \u03C4\u1FC6\u03C2 \u1F10\u03BD \u03A7\u03C1\u03B9\u03C3\u03C4\u1FF7 \u1F38\u03B7\u03C3\u03BF\u1FE6\u00B7',
    45003025: '\u1F43\u03BD \u03C0\u03C1\u03BF\u03AD\u03B8\u03B5\u03C4\u03BF \u1F41 \u03B8\u03B5\u1F78\u03C2 \u1F31\u03BB\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF\u03BD \u03B4\u03B9\u1F70 \u03C0\u03AF\u03C3\u03C4\u03B5\u03C9\u03C2 \u1F10\u03BD \u03C4\u1FF7 \u03B1\u1F50\u03C4\u03BF\u1FE6 \u03B1\u1F35\u03BC\u03B1\u03C4\u03B9, \u03B5\u1F30\u03C2 \u1F14\u03BD\u03B4\u03B5\u03B9\u03BE\u03B9\u03BD \u03C4\u1FC6\u03C2 \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7\u03C2 \u03B1\u1F50\u03C4\u03BF\u1FE6 \u03B4\u03B9\u1F70 \u03C4\u1F74\u03BD \u03C0\u03AC\u03C1\u03B5\u03C3\u03B9\u03BD \u03C4\u1FF6\u03BD \u03C0\u03C1\u03BF\u03B3\u03B5\u03B3\u03BF\u03BD\u03CC\u03C4\u03C9\u03BD \u1F01\u03BC\u03B1\u03C1\u03C4\u03B7\u03BC\u03AC\u03C4\u03C9\u03BD',
    45003026: '\u1F10\u03BD \u03C4\u1FC7 \u1F00\u03BD\u03BF\u03C7\u1FC7 \u03C4\u03BF\u1FE6 \u03B8\u03B5\u03BF\u1FE6, \u03C0\u03C1\u1F78\u03C2 \u03C4\u1F74\u03BD \u1F14\u03BD\u03B4\u03B5\u03B9\u03BE\u03B9\u03BD \u03C4\u1FC6\u03C2 \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7\u03C2 \u03B1\u1F50\u03C4\u03BF\u1FE6 \u1F10\u03BD \u03C4\u1FF7 \u03BD\u1FE6\u03BD \u03BA\u03B1\u03B9\u03C1\u1FF7, \u03B5\u1F30\u03C2 \u03C4\u1F78 \u03B5\u1F36\u03BD\u03B1\u03B9 \u03B1\u1F50\u03C4\u1F78\u03BD \u03B4\u03AF\u03BA\u03B1\u03B9\u03BF\u03BD \u03BA\u03B1\u1F76 \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u1FE6\u03BD\u03C4\u03B1 \u03C4\u1F78\u03BD \u1F10\u03BA \u03C0\u03AF\u03C3\u03C4\u03B5\u03C9\u03C2 \u1F38\u03B7\u03C3\u03BF\u1FE6.'
  }
};

// ---------------------------------------------------------------------------
// Tokens — "surface|strongs|morph|gloss" joined by " ~ "
// ---------------------------------------------------------------------------

const TOKEN_SRC = {
  43001001: '\u1F18\u03BD|G1722|PREP|in ~ \u1F00\u03C1\u03C7\u1FC7|G0746|N-DSF|beginning ~ \u1F26\u03BD|G1510|V-IAI-3S|was ~ \u1F41|G3588|T-NSM|the ~ \u03BB\u03CC\u03B3\u03BF\u03C2|G3056|N-NSM|Word ~ \u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u1F41|G3588|T-NSM|the ~ \u03BB\u03CC\u03B3\u03BF\u03C2|G3056|N-NSM|Word ~ \u1F26\u03BD|G1510|V-IAI-3S|was ~ \u03C0\u03C1\u1F78\u03C2|G4314|PREP|with ~ \u03C4\u1F78\u03BD|G3588|T-ASM|the ~ \u03B8\u03B5\u03CC\u03BD|G2316|N-ASM|God ~ \u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u03B8\u03B5\u1F78\u03C2|G2316|N-NSM|God ~ \u1F26\u03BD|G1510|V-IAI-3S|was ~ \u1F41|G3588|T-NSM|the ~ \u03BB\u03CC\u03B3\u03BF\u03C2|G3056|N-NSM|Word',
  43001002: '\u03BF\u1F57\u03C4\u03BF\u03C2|G3778|D-NSM|this one ~ \u1F26\u03BD|G1510|V-IAI-3S|was ~ \u1F10\u03BD|G1722|PREP|in ~ \u1F00\u03C1\u03C7\u1FC7|G0746|N-DSF|beginning ~ \u03C0\u03C1\u1F78\u03C2|G4314|PREP|with ~ \u03C4\u1F78\u03BD|G3588|T-ASM|the ~ \u03B8\u03B5\u03CC\u03BD|G2316|N-ASM|God',
  43001003: '\u03C0\u03AC\u03BD\u03C4\u03B1|G3956|A-NPN|all things ~ \u03B4\u03B9\u2019|G1223|PREP|through ~ \u03B1\u1F50\u03C4\u03BF\u1FE6|G0846|P-GSM|him ~ \u1F10\u03B3\u03AD\u03BD\u03B5\u03C4\u03BF|G1096|V-2ADI-3S|came to be ~ \u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u03C7\u03C9\u03C1\u1F76\u03C2|G5565|PREP|apart from ~ \u03B1\u1F50\u03C4\u03BF\u1FE6|G0846|P-GSM|him ~ \u1F10\u03B3\u03AD\u03BD\u03B5\u03C4\u03BF|G1096|V-2ADI-3S|came to be ~ \u03BF\u1F50\u03B4\u1F72|G3761|CONJ-N|not even ~ \u1F15\u03BD|G1520|A-NSN|one ~ \u1F43|G3739|R-NSN|which ~ \u03B3\u03AD\u03B3\u03BF\u03BD\u03B5\u03BD|G1096|V-2RAI-3S|has come to be',
  43001004: '\u1F10\u03BD|G1722|PREP|in ~ \u03B1\u1F50\u03C4\u1FF7|G0846|P-DSM|him ~ \u03B6\u03C9\u1F74|G2222|N-NSF|life ~ \u1F26\u03BD|G1510|V-IAI-3S|was ~ \u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u1F21|G3588|T-NSF|the ~ \u03B6\u03C9\u1F74|G2222|N-NSF|life ~ \u1F26\u03BD|G1510|V-IAI-3S|was ~ \u03C4\u1F78|G3588|T-NSN|the ~ \u03C6\u1FF6\u03C2|G5457|N-NSN|light ~ \u03C4\u1FF6\u03BD|G3588|T-GPM|of the ~ \u1F00\u03BD\u03B8\u03C1\u03CE\u03C0\u03C9\u03BD|G0444|N-GPM|men',
  43001005: '\u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u03C4\u1F78|G3588|T-NSN|the ~ \u03C6\u1FF6\u03C2|G5457|N-NSN|light ~ \u1F10\u03BD|G1722|PREP|in ~ \u03C4\u1FC7|G3588|T-DSF|the ~ \u03C3\u03BA\u03BF\u03C4\u03AF\u1FB3|G4653|N-DSF|darkness ~ \u03C6\u03B1\u03AF\u03BD\u03B5\u03B9|G5316|V-PAI-3S|shines ~ \u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u1F21|G3588|T-NSF|the ~ \u03C3\u03BA\u03BF\u03C4\u03AF\u03B1|G4653|N-NSF|darkness ~ \u03B1\u1F50\u03C4\u1F78|G0846|P-ASN|it ~ \u03BF\u1F50|G3756|PRT-N|not ~ \u03BA\u03B1\u03C4\u03AD\u03BB\u03B1\u03B2\u03B5\u03BD|G2638|V-2AAI-3S|overcame / grasped',
  45003021: '\u039D\u03C5\u03BD\u1F76|G3570|ADV|now ~ \u03B4\u1F72|G1161|CONJ|but ~ \u03C7\u03C9\u03C1\u1F76\u03C2|G5565|PREP|apart from ~ \u03BD\u03CC\u03BC\u03BF\u03C5|G3551|N-GSM|law ~ \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7|G1343|N-NSF|righteousness ~ \u03B8\u03B5\u03BF\u1FE6|G2316|N-GSM|of God ~ \u03C0\u03B5\u03C6\u03B1\u03BD\u03AD\u03C1\u03C9\u03C4\u03B1\u03B9|G5319|V-RPI-3S|has been manifested ~ \u03BC\u03B1\u03C1\u03C4\u03C5\u03C1\u03BF\u03C5\u03BC\u03AD\u03BD\u03B7|G3140|V-PPP-NSF|being witnessed to ~ \u1F51\u03C0\u1F78|G5259|PREP|by ~ \u03C4\u03BF\u1FE6|G3588|T-GSM|the ~ \u03BD\u03CC\u03BC\u03BF\u03C5|G3551|N-GSM|law ~ \u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u03C4\u1FF6\u03BD|G3588|T-GPM|the ~ \u03C0\u03C1\u03BF\u03C6\u03B7\u03C4\u1FF6\u03BD|G4396|N-GPM|prophets',
  45003022: '\u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7|G1343|N-NSF|righteousness ~ \u03B4\u1F72|G1161|CONJ|and ~ \u03B8\u03B5\u03BF\u1FE6|G2316|N-GSM|of God ~ \u03B4\u03B9\u1F70|G1223|PREP|through ~ \u03C0\u03AF\u03C3\u03C4\u03B5\u03C9\u03C2|G4102|N-GSF|faith ~ \u1F38\u03B7\u03C3\u03BF\u1FE6|G2424|N-GSM|of Jesus ~ \u03A7\u03C1\u03B9\u03C3\u03C4\u03BF\u1FE6|G5547|N-GSM|Christ ~ \u03B5\u1F30\u03C2|G1519|PREP|to ~ \u03C0\u03AC\u03BD\u03C4\u03B1\u03C2|G3956|A-APM|all ~ \u03C4\u03BF\u1F7A\u03C2|G3588|T-APM|the ones ~ \u03C0\u03B9\u03C3\u03C4\u03B5\u03CD\u03BF\u03BD\u03C4\u03B1\u03C2|G4100|V-PAP-APM|believing ~ \u03BF\u1F50|G3756|PRT-N|not ~ \u03B3\u03AC\u03C1|G1063|CONJ|for ~ \u1F10\u03C3\u03C4\u03B9\u03BD|G1510|V-PAI-3S|there is ~ \u03B4\u03B9\u03B1\u03C3\u03C4\u03BF\u03BB\u03AE|G1293|N-NSF|distinction',
  45003023: '\u03C0\u03AC\u03BD\u03C4\u03B5\u03C2|G3956|A-NPM|all ~ \u03B3\u1F70\u03C1|G1063|CONJ|for ~ \u1F25\u03BC\u03B1\u03C1\u03C4\u03BF\u03BD|G0264|V-2AAI-3P|sinned ~ \u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u1F51\u03C3\u03C4\u03B5\u03C1\u03BF\u1FE6\u03BD\u03C4\u03B1\u03B9|G5302|V-PPI-3P|fall short ~ \u03C4\u1FC6\u03C2|G3588|T-GSF|of the ~ \u03B4\u03CC\u03BE\u03B7\u03C2|G1391|N-GSF|glory ~ \u03C4\u03BF\u1FE6|G3588|T-GSM|of the ~ \u03B8\u03B5\u03BF\u1FE6|G2316|N-GSM|God',
  45003024: '\u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03CD\u03BC\u03B5\u03BD\u03BF\u03B9|G1344|V-PPP-NPM|being justified ~ \u03B4\u03C9\u03C1\u03B5\u1F70\u03BD|G1432|ADV|freely / as a gift ~ \u03C4\u1FC7|G3588|T-DSF|by the ~ \u03B1\u1F50\u03C4\u03BF\u1FE6|G0846|P-GSM|his ~ \u03C7\u03AC\u03C1\u03B9\u03C4\u03B9|G5485|N-DSF|grace ~ \u03B4\u03B9\u1F70|G1223|PREP|through ~ \u03C4\u1FC6\u03C2|G3588|T-GSF|the ~ \u1F00\u03C0\u03BF\u03BB\u03C5\u03C4\u03C1\u03CE\u03C3\u03B5\u03C9\u03C2|G0629|N-GSF|redemption ~ \u03C4\u1FC6\u03C2|G3588|T-GSF|the one ~ \u1F10\u03BD|G1722|PREP|in ~ \u03A7\u03C1\u03B9\u03C3\u03C4\u1FF7|G5547|N-DSM|Christ ~ \u1F38\u03B7\u03C3\u03BF\u1FE6|G2424|N-DSM|Jesus',
  45003025: '\u1F43\u03BD|G3739|R-ASM|whom ~ \u03C0\u03C1\u03BF\u03AD\u03B8\u03B5\u03C4\u03BF|G4388|V-2AMI-3S|set forth publicly ~ \u1F41|G3588|T-NSM|the ~ \u03B8\u03B5\u1F78\u03C2|G2316|N-NSM|God ~ \u1F31\u03BB\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF\u03BD|G2435|N-ASN|propitiation / mercy seat ~ \u03B4\u03B9\u1F70|G1223|PREP|through ~ \u03C0\u03AF\u03C3\u03C4\u03B5\u03C9\u03C2|G4102|N-GSF|faith ~ \u1F10\u03BD|G1722|PREP|in ~ \u03C4\u1FF7|G3588|T-DSN|the ~ \u03B1\u1F50\u03C4\u03BF\u1FE6|G0846|P-GSM|his ~ \u03B1\u1F35\u03BC\u03B1\u03C4\u03B9|G0129|N-DSN|blood ~ \u03B5\u1F30\u03C2|G1519|PREP|for ~ \u1F14\u03BD\u03B4\u03B5\u03B9\u03BE\u03B9\u03BD|G1732|N-ASF|demonstration ~ \u03C4\u1FC6\u03C2|G3588|T-GSF|of the ~ \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7\u03C2|G1343|N-GSF|righteousness ~ \u03B1\u1F50\u03C4\u03BF\u1FE6|G0846|P-GSM|his ~ \u03B4\u03B9\u1F70|G1223|PREP|because of ~ \u03C4\u1F74\u03BD|G3588|T-ASF|the ~ \u03C0\u03AC\u03C1\u03B5\u03C3\u03B9\u03BD|G3929|N-ASF|passing over ~ \u03C4\u1FF6\u03BD|G3588|T-GPN|of the ~ \u03C0\u03C1\u03BF\u03B3\u03B5\u03B3\u03BF\u03BD\u03CC\u03C4\u03C9\u03BD|G4266|V-2RAP-GPN|previously committed ~ \u1F01\u03BC\u03B1\u03C1\u03C4\u03B7\u03BC\u03AC\u03C4\u03C9\u03BD|G0265|N-GPN|sins',
  45003026: '\u1F10\u03BD|G1722|PREP|in ~ \u03C4\u1FC7|G3588|T-DSF|the ~ \u1F00\u03BD\u03BF\u03C7\u1FC7|G0463|N-DSF|forbearance ~ \u03C4\u03BF\u1FE6|G3588|T-GSM|of the ~ \u03B8\u03B5\u03BF\u1FE6|G2316|N-GSM|God ~ \u03C0\u03C1\u1F78\u03C2|G4314|PREP|toward ~ \u03C4\u1F74\u03BD|G3588|T-ASF|the ~ \u1F14\u03BD\u03B4\u03B5\u03B9\u03BE\u03B9\u03BD|G1732|N-ASF|demonstration ~ \u03C4\u1FC6\u03C2|G3588|T-GSF|of the ~ \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7\u03C2|G1343|N-GSF|righteousness ~ \u03B1\u1F50\u03C4\u03BF\u1FE6|G0846|P-GSM|his ~ \u1F10\u03BD|G1722|PREP|at ~ \u03C4\u1FF7|G3588|T-DSM|the ~ \u03BD\u1FE6\u03BD|G3568|ADV|now ~ \u03BA\u03B1\u03B9\u03C1\u1FF7|G2540|N-DSM|time ~ \u03B5\u1F30\u03C2|G1519|PREP|for ~ \u03C4\u1F78|G3588|T-ASN|the ~ \u03B5\u1F36\u03BD\u03B1\u03B9|G1510|V-PAN|to be ~ \u03B1\u1F50\u03C4\u1F78\u03BD|G0846|P-ASM|himself ~ \u03B4\u03AF\u03BA\u03B1\u03B9\u03BF\u03BD|G1342|A-ASM|just ~ \u03BA\u03B1\u1F76|G2532|CONJ|and ~ \u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u1FE6\u03BD\u03C4\u03B1|G1344|V-PAP-ASM|justifying ~ \u03C4\u1F78\u03BD|G3588|T-ASM|the one ~ \u1F10\u03BA|G1537|PREP|out of ~ \u03C0\u03AF\u03C3\u03C4\u03B5\u03C9\u03C2|G4102|N-GSF|faith ~ \u1F38\u03B7\u03C3\u03BF\u1FE6|G2424|N-GSM|of Jesus'
};

/**
 * Edition apparatus. Words absent here are in every edition. Words listed
 * carry a restricted set — the rubric marker in the text pane.
 *
 * Romans 3:22 is the demonstration case: the Byzantine tradition and the
 * Textus Receptus continue "and upon all" after "to all", which the critical
 * editions do not carry. This is exactly the kind of thing the apparatus
 * indicator exists to surface.
 */
const ALL_EDITIONS = ['THGNT', 'NA28', 'SBLGNT', 'TREG', 'WH', 'TR', 'BYZ'];

export const VARIANTS = {
  // verse_id: { position: [editions] }
  45003022: { 11: ['TR', 'BYZ'] },   // πιστεύοντας — TR/Byz continue "καὶ ἐπὶ πάντας" here
  43001003: { 12: ['THGNT', 'NA28', 'SBLGNT', 'TREG', 'WH'] } // punctuation split before ὃ γέγονεν
};

// ---------------------------------------------------------------------------
// Lexicon
// ---------------------------------------------------------------------------

export const LEXICON = {
  G0129: { lemma: '\u03B1\u1F37\u03BC\u03B1', translit: 'haima', pos: 'noun',
    short: 'blood', full: 'Blood; by metonymy, life, and especially sacrificial death. In the epistles the phrase "his blood" almost always denotes the sacrificial death rather than the physical substance.' },
  G0264: { lemma: '\u1F01\u03BC\u03B1\u03C1\u03C4\u03AC\u03BD\u03C9', translit: 'hamartano', pos: 'verb',
    short: 'to sin, to miss the mark', full: 'Originally to miss a target; in the NT, to fail of the divine standard. The aorist in Romans 3:23 views the whole race\u2019s sinning as a single completed fact.' },
  G0265: { lemma: '\u1F01\u03BC\u03AC\u03C1\u03C4\u03B7\u03BC\u03B1', translit: 'hamartema', pos: 'noun',
    short: 'a sin, a sinful deed', full: 'The concrete act rather than the principle \u2014 distinguished from \u1F01\u03BC\u03B1\u03C1\u03C4\u03AF\u03B1, which can denote sin as a state or power.' },
  G0463: { lemma: '\u1F00\u03BD\u03BF\u03C7\u03AE', translit: 'anoche', pos: 'noun',
    short: 'forbearance, holding back', full: 'A holding back or suspension. Not pardon but delay of judgment \u2014 the temporary withholding that made the propitiation necessary as a vindication.' },
  G0629: { lemma: '\u1F00\u03C0\u03BF\u03BB\u03CD\u03C4\u03C1\u03C9\u03C3\u03B9\u03C2', translit: 'apolutrosis', pos: 'noun',
    short: 'redemption, release by ransom', full: 'Release secured by payment of a ransom (\u03BB\u03CD\u03C4\u03C1\u03BF\u03BD). The compound intensifies: a full and final buying out. Used of manumission of slaves and ransom of prisoners of war.' },
  G0746: { lemma: '\u1F00\u03C1\u03C7\u03AE', translit: 'arche', pos: 'noun',
    short: 'beginning, origin, rule', full: 'Beginning in time, or first cause, or position of rule. The anarthrous use in John 1:1 echoes Genesis 1:1 in the Septuagint.' },
  G1096: { lemma: '\u03B3\u03AF\u03BD\u03BF\u03BC\u03B1\u03B9', translit: 'ginomai', pos: 'verb',
    short: 'to become, to come into being', full: 'To come into existence \u2014 deliberately contrasted in John 1 with \u03B5\u1F30\u03BC\u03AF (to be), which is used of the Word. The Word was; everything else came to be.' },
  G1293: { lemma: '\u03B4\u03B9\u03B1\u03C3\u03C4\u03BF\u03BB\u03AE', translit: 'diastole', pos: 'noun',
    short: 'distinction, difference', full: 'A drawing apart, a distinction made between things. Used by Paul of the collapse of the Jew/Gentile distinction with respect to guilt.' },
  G1342: { lemma: '\u03B4\u03AF\u03BA\u03B1\u03B9\u03BF\u03C2', translit: 'dikaios', pos: 'adjective',
    short: 'just, righteous', full: 'Conforming to the standard. In Romans 3:26 the point is God\u2019s own conformity to his standard while acquitting the guilty \u2014 just, and the justifier.' },
  G1343: { lemma: '\u03B4\u03B9\u03BA\u03B1\u03B9\u03BF\u03C3\u03CD\u03BD\u03B7', translit: 'dikaiosune', pos: 'noun',
    short: 'righteousness, justice', full: 'The quality of being right, or the status of being declared right. Whether the genitive \u03B8\u03B5\u03BF\u1FE6 in Romans is possessive (God\u2019s own attribute) or a genitive of source (righteousness from God) is one of the load-bearing questions in the epistle.' },
  G1344: { lemma: '\u03B4\u03B9\u03BA\u03B1\u03B9\u03CC\u03C9', translit: 'dikaioo', pos: 'verb',
    short: 'to justify, to declare righteous', full: 'Forensic \u2014 to pronounce a verdict of righteous, not to make inwardly righteous. The -\u03CC\u03C9 ending on adjectival roots of this class is declarative, as in \u1F00\u03BE\u03B9\u03CC\u03C9, to deem worthy.' },
  G1391: { lemma: '\u03B4\u03CC\u03BE\u03B1', translit: 'doxa', pos: 'noun',
    short: 'glory, honour, splendour', full: 'In the Septuagint it renders \u05DB\u05B8\u05BC\u05D1\u05D5\u05B9\u05D3, the manifest weight or presence of God. "Fall short of the glory of God" trades on that: the standard is the divine presence itself.' },
  G1432: { lemma: '\u03B4\u03C9\u03C1\u03B5\u03AC\u03BD', translit: 'dorean', pos: 'adverb',
    short: 'freely, as a gift, without cause', full: 'Accusative of \u03B4\u03C9\u03C1\u03B5\u03AC used adverbially: gratis. The same word renders "without a cause" in John 15:25 \u2014 given without anything in the recipient to occasion it.' },
  G1510: { lemma: '\u03B5\u1F30\u03BC\u03AF', translit: 'eimi', pos: 'verb',
    short: 'to be, to exist', full: 'Existence as such. The imperfect \u1F26\u03BD in John 1:1 denotes continuous existence with no implied beginning \u2014 the deliberate contrast with \u1F10\u03B3\u03AD\u03BD\u03B5\u03C4\u03BF in verse 3.' },
  G1732: { lemma: '\u1F14\u03BD\u03B4\u03B5\u03B9\u03BE\u03B9\u03C2', translit: 'endeixis', pos: 'noun',
    short: 'demonstration, proof, showing forth', full: 'A pointing out, in the sense of evidentiary display \u2014 legal proof rather than mere illustration. The cross as exhibit.' },
  G2222: { lemma: '\u03B6\u03C9\u03AE', translit: 'zoe', pos: 'noun',
    short: 'life', full: 'Life as principle and vitality, as distinguished from \u03B2\u03AF\u03BF\u03C2, the course or means of living.' },
  G2316: { lemma: '\u03B8\u03B5\u03CC\u03C2', translit: 'theos', pos: 'noun',
    short: 'God, a god', full: 'The absence of the article on \u03B8\u03B5\u03CC\u03C2 in the third clause of John 1:1, with \u03BB\u03CC\u03B3\u03BF\u03C2 articular, marks \u03B8\u03B5\u03CC\u03C2 as predicate and is generally taken as qualitative rather than indefinite.' },
  G2424: { lemma: '\u1F38\u03B7\u03C3\u03BF\u1FE6\u03C2', translit: 'Iesous', pos: 'proper noun',
    short: 'Jesus', full: 'Greek form of \u05D9\u05B5\u05E9\u05C1\u05D5\u05BC\u05E2\u05B7, Yeshua.' },
  G2435: { lemma: '\u1F31\u03BB\u03B1\u03C3\u03C4\u03AE\u03C1\u03B9\u03BF\u03BD', translit: 'hilasterion', pos: 'noun',
    short: 'propitiation; mercy seat', full: 'In the Septuagint this is the standard rendering of \u05DB\u05B7\u05BC\u05E4\u05BC\u05B9\u05E8\u05B6\u05EA, the cover of the ark where blood was sprinkled on the Day of Atonement. Whether Paul intends the furniture (mercy seat) or the act (propitiatory sacrifice) is contested and materially changes the sentence. Occurs only here and Hebrews 9:5.' },
  G2532: { lemma: '\u03BA\u03B1\u03AF', translit: 'kai', pos: 'conjunction', short: 'and, also, even', full: 'Coordinating conjunction; frequently ascensive ("even") or epexegetical.' },
  G2540: { lemma: '\u03BA\u03B1\u03B9\u03C1\u03CC\u03C2', translit: 'kairos', pos: 'noun',
    short: 'appointed time, season', full: 'A juncture or opportune moment, as distinct from \u03C7\u03C1\u03CC\u03BD\u03BF\u03C2, duration. "The now time" contrasts with the period of forbearance just named.' },
  G2638: { lemma: '\u03BA\u03B1\u03C4\u03B1\u03BB\u03B1\u03BC\u03B2\u03AC\u03BD\u03C9', translit: 'katalambano', pos: 'verb',
    short: 'to seize, overtake, grasp', full: 'To lay hold of \u2014 either hostilely (overpower) or intellectually (comprehend). John 1:5 is deliberately ambiguous between the two and translations split on it.' },
  G3056: { lemma: '\u03BB\u03CC\u03B3\u03BF\u03C2', translit: 'logos', pos: 'noun',
    short: 'word, reason, account', full: 'Spoken word, discourse, or the rational principle. Draws on both the Hebrew \u05D3\u05B8\u05BC\u05D1\u05B8\u05E8 of creation and utterance, and Hellenistic usage for the ordering principle of the cosmos.' },
  G3140: { lemma: '\u03BC\u03B1\u03C1\u03C4\u03C5\u03C1\u03AD\u03C9', translit: 'martureo', pos: 'verb',
    short: 'to bear witness, testify', full: 'To give evidence. The present passive participle in Romans 3:21 keeps the law and prophets continuously testifying to a righteousness they do not themselves supply.' },
  G3551: { lemma: '\u03BD\u03CC\u03BC\u03BF\u03C2', translit: 'nomos', pos: 'noun',
    short: 'law', full: 'Law generally, the Mosaic law particularly, or the Pentateuch as a division of scripture. Romans 3:21 uses it in two senses in one verse \u2014 apart from law, witnessed by the law.' },
  G3570: { lemma: '\u03BD\u03C5\u03BD\u03AF', translit: 'nuni', pos: 'adverb',
    short: 'now, at this present moment', full: 'Emphatic form of \u03BD\u1FE6\u03BD. Here logical as well as temporal \u2014 marking the turn from indictment to remedy.' },
  G3929: { lemma: '\u03C0\u03AC\u03C1\u03B5\u03C3\u03B9\u03C2', translit: 'paresis', pos: 'noun',
    short: 'passing over, letting go unpunished', full: 'A dismissal or overlooking. Distinguished by many commentators from \u1F04\u03C6\u03B5\u03C3\u03B9\u03C2, remission \u2014 a passing by rather than a cancelling. Occurs only here in the NT, which makes the distinction hard to press from usage alone.' },
  G4100: { lemma: '\u03C0\u03B9\u03C3\u03C4\u03B5\u03CD\u03C9', translit: 'pisteuo', pos: 'verb',
    short: 'to believe, to trust', full: 'To place confidence in. The present participle denotes continuing trust rather than a completed act.' },
  G4102: { lemma: '\u03C0\u03AF\u03C3\u03C4\u03B9\u03C2', translit: 'pistis', pos: 'noun',
    short: 'faith, faithfulness, trust', full: 'Trust, or the faithfulness that warrants trust. Whether \u03C0\u03AF\u03C3\u03C4\u03B5\u03C9\u03C2 \u1F38\u03B7\u03C3\u03BF\u1FE6 \u03A7\u03C1\u03B9\u03C3\u03C4\u03BF\u1FE6 is objective ("faith in Christ") or subjective ("the faithfulness of Christ") is a live and consequential debate.' },
  G4266: { lemma: '\u03C0\u03C1\u03BF\u03B3\u03AF\u03BD\u03BF\u03BC\u03B1\u03B9', translit: 'proginomai', pos: 'verb',
    short: 'to happen before', full: 'To occur previously. Perfect participle: sins committed before, whose effects stand.' },
  G4388: { lemma: '\u03C0\u03C1\u03BF\u03C4\u03AF\u03B8\u03B7\u03BC\u03B9', translit: 'protithemi', pos: 'verb',
    short: 'to set forth publicly; to purpose', full: 'Either to display openly or to purpose beforehand. The middle voice permits both, and the choice affects whether the emphasis falls on eternal intention or public exhibition.' },
  G4396: { lemma: '\u03C0\u03C1\u03BF\u03C6\u03AE\u03C4\u03B7\u03C2', translit: 'prophetes', pos: 'noun',
    short: 'prophet', full: 'One who speaks forth on behalf of another; with the law, a standard designation for a division of the Hebrew scriptures.' },
  G4653: { lemma: '\u03C3\u03BA\u03BF\u03C4\u03AF\u03B1', translit: 'skotia', pos: 'noun',
    short: 'darkness', full: 'Darkness literally, and in John consistently as a moral and spiritual domain.' },
  G5302: { lemma: '\u1F51\u03C3\u03C4\u03B5\u03C1\u03AD\u03C9', translit: 'hustereo', pos: 'verb',
    short: 'to fall short, to lack', full: 'To come late, to be inferior, to be in want. The present tense in Romans 3:23 follows an aorist \u2014 they sinned, and they go on falling short.' },
  G5316: { lemma: '\u03C6\u03B1\u03AF\u03BD\u03C9', translit: 'phaino', pos: 'verb',
    short: 'to shine, to appear', full: 'To give light, or to be visible. Present tense in John 1:5: the shining is continuous.' },
  G5319: { lemma: '\u03C6\u03B1\u03BD\u03B5\u03C1\u03CC\u03C9', translit: 'phaneroo', pos: 'verb',
    short: 'to make manifest, reveal', full: 'To bring into the open what was there but hidden. The perfect passive holds the manifestation as an accomplished and standing state.' },
  G5457: { lemma: '\u03C6\u1FF6\u03C2', translit: 'phos', pos: 'noun',
    short: 'light', full: 'Light as illumination and as a sphere of moral reality.' },
  G5485: { lemma: '\u03C7\u03AC\u03C1\u03B9\u03C2', translit: 'charis', pos: 'noun',
    short: 'grace, favour', full: 'Favour freely shown, with no antecedent claim on the giver. Paired with \u03B4\u03C9\u03C1\u03B5\u03AC\u03BD in Romans 3:24 the redundancy is deliberate and emphatic.' },
  G5547: { lemma: '\u03A7\u03C1\u03B9\u03C3\u03C4\u03CC\u03C2', translit: 'Christos', pos: 'proper noun',
    short: 'Christ, Anointed One', full: 'Renders \u05DE\u05B8\u05E9\u05C1\u05B4\u05D9\u05D7\u05B7, Messiah.' },
  G5565: { lemma: '\u03C7\u03C9\u03C1\u03AF\u03C2', translit: 'choris', pos: 'preposition',
    short: 'apart from, without', full: 'Separately from, independent of. Emphatic by position at the head of Romans 3:21.' }
};

// ---------------------------------------------------------------------------
// Morphology code decoder (subset of STEPBible TEGMC)
// ---------------------------------------------------------------------------

export const MORPH_CODES = {
  N: 'noun', V: 'verb', A: 'adjective', T: 'article', P: 'personal pronoun',
  R: 'relative pronoun', D: 'demonstrative pronoun', PREP: 'preposition',
  CONJ: 'conjunction', ADV: 'adverb', 'PRT-N': 'negative particle',
  'CONJ-N': 'negative conjunction',
  // tense
  P_t: 'present', I: 'imperfect', F: 'future', A_t: 'aorist', R_t: 'perfect', L: 'pluperfect',
  // voice
  A_v: 'active', M: 'middle', P_v: 'passive',
  // mood
  I_m: 'indicative', S: 'subjunctive', O: 'optative', M_m: 'imperative',
  N_m: 'infinitive', P_m: 'participle',
  // case
  N_c: 'nominative', G: 'genitive', D_c: 'dative', A_c: 'accusative', V_c: 'vocative',
  // number / gender
  S_n: 'singular', P_n: 'plural',
  M_g: 'masculine', F_g: 'feminine', N_g: 'neuter'
};

// ---------------------------------------------------------------------------
// Cross-references (TSK / OpenBible shape)
// ---------------------------------------------------------------------------

export const CROSS_REFS = {
  45003023: [
    { start: 45003009, end: 45003009, label: 'Romans 3:9',      votes: 71 },
    { start: 48003022, end: 48003022, label: 'Galatians 3:22',  votes: 64 },
    { start: 45005012, end: 45005012, label: 'Romans 5:12',     votes: 58 },
    { start: 21007020, end: 21007020, label: 'Ecclesiastes 7:20', votes: 47 },
    { start: 11008046, end: 11008046, label: '1 Kings 8:46',    votes: 33 }
  ],
  45003024: [
    { start: 49001007, end: 49001007, label: 'Ephesians 1:7',   votes: 68 },
    { start: 51001014, end: 51001014, label: 'Colossians 1:14', votes: 55 },
    { start: 56003007, end: 56003007, label: 'Titus 3:7',       votes: 41 }
  ],
  45003025: [
    { start: 62002002, end: 62002002, label: '1 John 2:2',      votes: 82 },
    { start: 62004010, end: 62004010, label: '1 John 4:10',     votes: 77 },
    { start: 58009005, end: 58009005, label: 'Hebrews 9:5',     votes: 69 },
    { start: 58002017, end: 58002017, label: 'Hebrews 2:17',    votes: 61 },
    { start:  3016015, end:  3016015, label: 'Leviticus 16:15', votes: 54 }
  ],
  43001001: [
    { start:  1001001, end:  1001001, label: 'Genesis 1:1',     votes: 94 },
    { start: 62001001, end: 62001001, label: '1 John 1:1',      votes: 79 },
    { start: 66019013, end: 66019013, label: 'Revelation 19:13', votes: 66 },
    { start: 51001017, end: 51001017, label: 'Colossians 1:17', votes: 52 }
  ],
  43001003: [
    { start: 51001016, end: 51001016, label: 'Colossians 1:16', votes: 88 },
    { start: 58001002, end: 58001002, label: 'Hebrews 1:2',     votes: 74 },
    { start: 46008006, end: 46008006, label: '1 Corinthians 8:6', votes: 60 }
  ]
};

// ---------------------------------------------------------------------------
// Pericopes
// ---------------------------------------------------------------------------

export const PERICOPES = [
  { start: 43001001, end: 43001005, title: 'The Word in the beginning' },
  { start: 45003021, end: 45003026, title: 'The righteousness of God through faith' }
];

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export function parseTokens(verseId) {
  const src = TOKEN_SRC[verseId];
  if (!src) return [];
  const variants = VARIANTS[verseId] || {};
  return src.split(' ~ ').map((chunk, i) => {
    const [surface, strongs, morph, gloss] = chunk.split('|');
    const position = i + 1;
    return {
      verse_id: verseId,
      position,
      surface,
      strongs,
      morph,
      gloss,
      language: 'grc',
      editions: variants[position] || ALL_EDITIONS,
      is_variant: Boolean(variants[position])
    };
  });
}

export { ALL_EDITIONS };
