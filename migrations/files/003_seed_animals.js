// Seed animal data
export async function up(connection) {
    console.log('   🦁 Seeding animal data...');
    
    const animals = [
        {
            name: 'Lion',
            species: 'Panthera leo',
            description: 'The lion is a large cat of the genus Panthera native to Africa and India.',
            habitat: 'Savanna',
            diet: 'Carnivore',
            conservation_status: 'Vulnerable',
            fun_facts: JSON.stringify([
                'Lions can sleep up to 20 hours a day',
                'A lions roar can be heard from 5 miles away',
                'Female lions do most of the hunting'
            ])
        },
        {
            name: 'Elephant',
            species: 'Loxodonta africana',
            description: 'African elephants are the largest land animals on Earth.',
            habitat: 'Savanna',
            diet: 'Herbivore',
            conservation_status: 'Endangered',
            fun_facts: JSON.stringify([
                'Elephants can weigh up to 6 tons',
                'They have excellent memories',
                'Baby elephants are called calves'
            ])
        },
        {
            name: 'Tiger',
            species: 'Panthera tigris',
            description: 'Tigers are the largest wild cats in the world.',
            habitat: 'Forest',
            diet: 'Carnivore',
            conservation_status: 'Endangered',
            fun_facts: JSON.stringify([
                'Tigers are excellent swimmers',
                'Each tiger has unique stripe patterns',
                'Tigers are mostly solitary animals'
            ])
        }
    ];
    
    for (const animal of animals) {
        // Check if animal already exists
        const [existing] = await connection.execute(
            'SELECT id FROM animals WHERE name = ? AND species = ?',
            [animal.name, animal.species]
        );
        
        if (existing.length === 0) {
            await connection.execute(`
                INSERT INTO animals (name, species, description, habitat, diet, conservation_status, fun_facts)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                animal.name,
                animal.species,
                animal.description,
                animal.habitat,
                animal.diet,
                animal.conservation_status,
                animal.fun_facts
            ]);
        }
    }
    
    console.log(`   ✅ Seeded ${animals.length} animals`);
}