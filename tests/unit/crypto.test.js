describe('Key Splitting Logic', () => {
    test('XOR Split and Recombine', () => {
        const fullKey = new Uint8Array(32).fill(1); // Dummy key
        const partA = new Uint8Array(32).fill(2);
        const partB = new Uint8Array(32).fill(3);
        const partC = new Uint8Array(32);

        // Split Logic: C = K ^ A ^ B
        for (let i = 0; i < 32; i++) {
            partC[i] = fullKey[i] ^ partA[i] ^ partB[i];
        }

        // Recombine Logic: K = A ^ B ^ C
        const recombined = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            recombined[i] = partA[i] ^ partB[i] ^ partC[i];
        }

        expect(recombined).toEqual(fullKey);
    });
});
