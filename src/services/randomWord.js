export default async function getRandomWordFromAPI() {
  try {
    // fetch word from api
    const response = await fetch('https://random-word-api.herokuapp.com/word?number=1');
    
    // check if response is ok
    if (!response.ok) {
      throw new Error('Failed to fetch a random word');
    }
    
    // parse
    const word = await response.json();
    
    // return word
    return word[0];
    
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
