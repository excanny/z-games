
// // animalController.js
// import AnimalRepository from '../repositories/AnimalRepository.js';

// class AnimalController {
//   constructor() {
//     this.animalRepository = new AnimalRepository();
//   }

//   // GET /api/animals - Get all available animals
//   async getAllAnimals(req, res) {
//     try {
//       const animals = await this.animalRepository.getAvailableAnimals();
      
//       res.status(200).json({
//         success: true,
//         count: animals.length,
//         data: animals
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: 'Failed to retrieve animals',
//         error: error.message
//       });
//     }
//   }

//   // GET /api/animals/:name - Get specific animal by name
//   async getAnimalByName(req, res) {
//     try {
//       const { name } = req.params;
      
//       if (!name || name.trim() === '') {
//         return res.status(400).json({
//           success: false,
//           message: 'Animal name is required'
//         });
//       }

//       const animal = await this.animalRepository.findByName(name);
      
//       if (!animal) {
//         return res.status(404).json({
//           success: false,
//           message: `Animal with name '${name}' not found`
//         });
//       }

//       res.status(200).json({
//         success: true,
//         data: animal
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: 'Failed to retrieve animal',
//         error: error.message
//       });
//     }
//   }

//   // GET /api/animals/game/:gameName - Get animals by game
//   async getAnimalsByGame(req, res) {
//     try {
//       const { gameName } = req.params;
      
//       if (!gameName || gameName.trim() === '') {
//         return res.status(400).json({
//           success: false,
//           message: 'Game name is required'
//         });
//       }

//       const animals = await this.animalRepository.findByGame(gameName);
      
//       res.status(200).json({
//         success: true,
//         count: animals.length,
//         game: gameName,
//         data: animals
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: `Failed to retrieve animals for game '${gameName}'`,
//         error: error.message
//       });
//     }
//   }

//   // POST /api/animals/initialize - Initialize animals database
//   async initializeAnimals(req, res) {
//     try {
//       const { animals } = req.body;
      
//       if (!animals || !Array.isArray(animals) || animals.length === 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'Animals array is required and must not be empty'
//         });
//       }

//       // Validate animal structure
//       const invalidAnimals = animals.filter(animal => 
//         !animal.name || !animal.superpower || !animal.superpower.description
//       );

//       if (invalidAnimals.length > 0) {
//         return res.status(400).json({
//           success: false,
//           message: 'All animals must have name and superpower.description',
//           invalidCount: invalidAnimals.length
//         });
//       }

//       const result = await this.animalRepository.initializeAnimals(animals);
      
//       res.status(201).json({
//         success: true,
//         message: 'Animals database initialized successfully',
//         count: result.length,
//         data: result
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: 'Failed to initialize animals database',
//         error: error.message
//       });
//     }
//   }

//   // GET /api/animals/search - Search animals with query parameters
//   async searchAnimals(req, res) {
//     try {
//       const { name, game } = req.query;
      
//       if (name && game) {
//         return res.status(400).json({
//           success: false,
//           message: 'Please provide either name or game parameter, not both'
//         });
//       }

//       if (!name && !game) {
//         return res.status(400).json({
//           success: false,
//           message: 'Please provide either name or game parameter'
//         });
//       }

//       let result;
//       if (name) {
//         result = await this.animalRepository.findByName(name);
//         if (!result) {
//           return res.status(404).json({
//             success: false,
//             message: `Animal with name '${name}' not found`
//           });
//         }
//       } else {
//         result = await this.animalRepository.findByGame(game);
//       }

//       res.status(200).json({
//         success: true,
//         data: result,
//         searchType: name ? 'name' : 'game',
//         searchValue: name || game
//       });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: 'Search failed',
//         error: error.message
//       });
//     }
//   }
// }

// export default AnimalController;