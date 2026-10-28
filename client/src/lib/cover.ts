/**
 * Book covers are generated, not uploaded: the API has no images, and a catalogue of
 * typographic covers reads as a real shelf. Genre picks the cloth colour (so a genre is
 * recognisable at a glance) and the title picks one of four geometric motifs.
 */
export const CLOTHS = [
    "#7a2e3a", // oxblood
    "#2f5d46", // forest
    "#25395e", // navy
    "#8a6516", // ochre
    "#226b70", // teal
    "#5b3a63", // plum
    "#455064", // slate
    "#9c4f2f", // clay
] as const;

export const MOTIFS = 4;

// FNV-1a: tiny, stable, well distributed for short strings.
export const hash = (input: string) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
};

export const coverFor = (genre: string, title: string) => ({
    cloth: CLOTHS[hash(genre.trim().toLowerCase()) % CLOTHS.length] ?? CLOTHS[0],
    motif: hash(title.trim().toLowerCase()) % MOTIFS,
});
