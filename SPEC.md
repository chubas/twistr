SPEC



----

Quoting the rules from the original challenge

### Rules

The core rules of the game:

- When the player starts a round, he is presented *six* letters, which must form at least one word using all of them. The letters are in a scrambled order.
- The player then has the opportunity to input words using a combination of the letters he was given. The words should be at least 3 letters size.
- If the inputted word is a *valid* dictionary word, the user earns points corresponding to the length of the word
- If the user inputs a valid word with all 6 letters, the player wins the round
- It is up to the solver to decide how the sequence of rounds will be (e.g. single-round game, automatic level change when the full word is discovered, add a timer and advance round when the round expires)
- Words should be taken only by their alphabetic value, this means that capitalization, apostrophes, accents, etc. should not count towards the word, need to remove duplicates

Variable rules (you can add them or change it for the full game experience)

- Add a timer per round, and game over if time expires before finding the full letter word
- Use penalties each time the user inputs an invalid word
- Change the number of letters to introduce a difficulty setting
- Precalculate all the possible words that can be formed with those letters before the round starts, and give points for full completion
- Use a continuous timer (not per round) and automatically change round whenever the full word is discovered. Add a small time bonus increment each time a correct word is entered
- Give the user the ability to shuffle the presented letters
