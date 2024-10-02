## 2 player games website

- **Sumo Game**
- **Pong Game**
- **Words Game**
- **Math Game**
- **Reflex Game**




#### Words Game Python Script For Word Filtering 

Python script to filter a large dictionary (`words_alpha.txt`) to create a smaller, optimized word list (`words.txt`). The goal is to speed up the game by reducing the size of the word list players need to download.

##### The script removes:
- Words with fewer than 4 letters or more than 9 letters.
- Words with more than 5 vowels.
- Words with more than 6 consonants.
- Words that can't be made using a limited number of specific letters (based on predefined letter counts of the game).

By doing this, only valid, playable words remain, improving performance for the game.

### Acknowledgements

The original word list (`words_alpha.txt`) comes from [https://github.com/dwyl](https://github.com/dwyl), which has over 466,000 English words. You can find it here: [https://github.com/dwyl/english-words](https://github.com/dwyl/english-words).
