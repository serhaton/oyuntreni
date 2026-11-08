import type { LetterEntry } from './types';

/**
 * Turkish alphabet (29 letters), in order, with example words.
 * The same animal often starts with a different letter in each language
 * (Kedi = K, Cat = C), so every language has its own file.
 */
export const LETTERS_TR: LetterEntry[] = [
  { upper: 'A', lower: 'a', word: 'Arı', passenger: 'bee' },
  { upper: 'B', lower: 'b', word: 'Balık', passenger: 'fish' },
  { upper: 'C', lower: 'c', word: 'Civciv', passenger: 'chick' },
  { upper: 'Ç', lower: 'ç', word: 'Çilek', passenger: 'strawberry' },
  { upper: 'D', lower: 'd', word: 'Deve', passenger: 'camel' },
  { upper: 'E', lower: 'e', word: 'Eşek', passenger: 'donkey' },
  { upper: 'F', lower: 'f', word: 'Fil', passenger: 'elephant' },
  { upper: 'G', lower: 'g', word: 'Geyik', passenger: 'deer' },
  // No Turkish word starts with Ğ, so we use a word that contains it.
  { upper: 'Ğ', lower: 'ğ', word: 'Kurbağa', passenger: 'frog', spokenName: 'yumuşak ge' },
  { upper: 'H', lower: 'h', word: 'Horoz', passenger: 'rooster' },
  { upper: 'I', lower: 'ı', word: 'Istakoz', passenger: 'lobster' },
  { upper: 'İ', lower: 'i', word: 'İnek', passenger: 'cow' },
  { upper: 'J', lower: 'j', word: 'Jaguar', passenger: 'jaguar' },
  { upper: 'K', lower: 'k', word: 'Kedi', passenger: 'cat' },
  { upper: 'L', lower: 'l', word: 'Lama', passenger: 'llama' },
  { upper: 'M', lower: 'm', word: 'Maymun', passenger: 'monkey' },
  { upper: 'N', lower: 'n', word: 'Nar', passenger: 'pomegranate' },
  { upper: 'O', lower: 'o', word: 'Otobüs', passenger: 'bus' },
  { upper: 'Ö', lower: 'ö', word: 'Ördek', passenger: 'duck' },
  { upper: 'P', lower: 'p', word: 'Penguen', passenger: 'penguin' },
  { upper: 'R', lower: 'r', word: 'Rakun', passenger: 'raccoon' },
  { upper: 'S', lower: 's', word: 'Sincap', passenger: 'squirrel' },
  { upper: 'Ş', lower: 'ş', word: 'Şempanze', passenger: 'chimpanzee' },
  { upper: 'T', lower: 't', word: 'Tavşan', passenger: 'rabbit' },
  { upper: 'U', lower: 'u', word: 'Uçak', passenger: 'airplane' },
  { upper: 'Ü', lower: 'ü', word: 'Üzüm', passenger: 'grapes' },
  { upper: 'V', lower: 'v', word: 'Vapur', passenger: 'ferry' },
  { upper: 'Y', lower: 'y', word: 'Yunus', passenger: 'dolphin' },
  { upper: 'Z', lower: 'z', word: 'Zürafa', passenger: 'giraffe' },
];
