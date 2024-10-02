# Define the bins
vowelsBin = {
    'A': 9,
    'E': 12,
    'I': 9,
    'O': 8,
    'U': 4,
}

consonantsBin = {
    'B': 2,
    'C': 2,
    'D': 4,
    'F': 2,
    'G': 3,
    'H': 2,
    'J': 1,
    'K': 1,
    'L': 4,
    'M': 2,
    'N': 6,
    'P': 2,
    'Q': 1,
    'R': 6,
    'S': 4,
    'T': 6,
    'V': 1,
    'W': 1,
    'X': 1,
    'Y': 1,
    'Z': 1,
}

# Merge bins into a total letter bin
totalBin = vowelsBin.copy()
totalBin.update(consonantsBin)

# Define vowels
vowels = set('AEIOU')

# Read words from words_alpha.txt
with open('words_alpha.txt', 'r') as f_in:
    words = f_in.read().splitlines()

valid_words = []

for word in words:
    word = word.strip().upper()
    if not word.isalpha():
        continue
    length = len(word)
    if length < 4 or length > 9:
        continue
    vowel_count = sum(1 for letter in word if letter in vowels)
    consonant_count = length - vowel_count
    if vowel_count > 5 or consonant_count > 6:
        continue
    from collections import Counter
    letter_counts = Counter(word)
    # Check if word can be formed from the bins
    if all(letter_counts[letter] <= totalBin.get(letter, 0) for letter in letter_counts):
        valid_words.append(word)

# Write valid words to words.txt
with open('words.txt', 'w') as f_out:
    for word in valid_words:
        f_out.write(word + '\n')
