
// Common English words dictionary for text reconstruction
const commonWords = new Set([
  // High frequency words
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with',
  
  // Common nouns and verbs
  'attack', 'attacks', 'data', 'service', 'services', 'money', 'revenue', 'business', 'organization', 'organizations', 'individual', 'individuals',
  'method', 'methods', 'technique', 'techniques', 'ransomware', 'denial', 'critical', 'encrypted', 'ransom', 'recovered', 'disrupt', 'presence',
  'perpetrator', 'perpetrators', 'malicious', 'group', 'common', 'generating', 'earning', 'focused', 'asked', 'allow', 'stop', 'online',
  
  // Additional common words
  'some', 'most', 'these', 'days', 'both', 'against', 'after', 'which', 'would', 'typical', 'see', 'we', 'they', 'them', 'their', 'there',
  'what', 'when', 'where', 'who', 'how', 'why', 'can', 'could', 'should', 'would', 'being', 'been', 'have', 'had', 'do', 'does', 'did',
  'get', 'got', 'make', 'made', 'take', 'taken', 'come', 'came', 'go', 'went', 'know', 'knew', 'think', 'thought', 'see', 'saw', 'look',
  'way', 'time', 'year', 'day', 'work', 'life', 'man', 'woman', 'child', 'world', 'school', 'state', 'family', 'student', 'group',
  'country', 'problem', 'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program', 'question', 'right', 'government',
  'number', 'night', 'point', 'home', 'water', 'room', 'mother', 'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study',
  'book', 'eye', 'job', 'word', 'though', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend', 'father',
  'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city', 'community', 'name', 'president', 'team', 'minute',
  'idea', 'kid', 'body', 'information', 'back', 'parent', 'face', 'others', 'level', 'office', 'door', 'health', 'person',
  'art', 'war', 'history', 'party', 'within', 'grow', 'result', 'open', 'change', 'morning', 'walk', 'reason', 'low', 'win',
  'research', 'girl', 'guy', 'early', 'food', 'before', 'moment', 'himself', 'air', 'teacher', 'force', 'offer', 'enough',
  'both', 'education', 'across', 'although', 'remember', 'foot', 'second', 'boy', 'maybe', 'toward', 'able', 'age', 'off',
  'policy', 'everything', 'love', 'process', 'music', 'including', 'consider', 'appear', 'actually', 'buy', 'probably',
  'human', 'wait', 'serve', 'market', 'die', 'send', 'expect', 'home', 'sense', 'build', 'stay', 'fall', 'oh', 'nation',
  'plan', 'cut', 'college', 'interest', 'death', 'course', 'someone', 'experience', 'behind', 'reach', 'local', 'kill',
  'six', 'remain', 'effect', 'use', 'yeah', 'suggest', 'class', 'control', 'raise', 'care', 'perhaps', 'little', 'late',
  'hard', 'field', 'else', 'pass', 'former', 'sell', 'major', 'sometimes', 'require', 'along', 'development', 'themselves',
  'report', 'role', 'better', 'economic', 'effort', 'up', 'decide', 'rate', 'strong', 'possible', 'heart', 'drug', 'show',
  'leader', 'light', 'voice', 'wife', 'whole', 'police', 'mind', 'finally', 'pull', 'return', 'free', 'military', 'price'
]);

// Function to check if a string is likely a valid English word
const isValidWord = (word: string): boolean => {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  return commonWords.has(cleanWord) && cleanWord.length > 1;
};

// Function to find the best word split at a given position
const findBestSplit = (text: string, startPos: number, maxLength: number = 15): { word: string; nextPos: number } | null => {
  // Try different word lengths, preferring longer valid words
  for (let len = Math.min(maxLength, text.length - startPos); len >= 2; len--) {
    const candidate = text.substring(startPos, startPos + len);
    if (isValidWord(candidate)) {
      return { word: candidate, nextPos: startPos + len };
    }
  }
  return null;
};

// Main text cleaning function
export const cleanSelectedText = (text: string): string => {
  console.log('Original text:', JSON.stringify(text));
  
  let cleaned = text;
  
  // Check if text has the characteristic spacing issue (lots of single chars followed by spaces)
  const spacedPattern = /(\w\s){8,}/;
  
  if (spacedPattern.test(cleaned)) {
    console.log('Detected spaced text pattern, attempting dictionary-based reconstruction...');
    
    // Remove all spaces to get the base text
    const noSpaces = cleaned.replace(/\s+/g, '');
    console.log('Text without spaces:', noSpaces);
    
    // Reconstruct using dictionary
    let result = '';
    let position = 0;
    
    while (position < noSpaces.length) {
      // Handle punctuation and special characters
      const currentChar = noSpaces[position];
      if (!/[a-zA-Z]/.test(currentChar)) {
        if (result && !/[\s\(\)\-\/]$/.test(result)) {
          result += ' ';
        }
        result += currentChar;
        if (/[.,:;!?]/.test(currentChar) && position < noSpaces.length - 1) {
          result += ' ';
        }
        position++;
        continue;
      }
      
      // Try to find a valid word starting at this position
      const wordMatch = findBestSplit(noSpaces, position);
      
      if (wordMatch) {
        // Add space before word if needed
        if (result && !/[\s\(\)\-\/]$/.test(result)) {
          result += ' ';
        }
        result += wordMatch.word;
        position = wordMatch.nextPos;
      } else {
        // If no valid word found, take single character
        if (result && !/[\s\(\)\-\/]$/.test(result)) {
          result += ' ';
        }
        result += currentChar;
        position++;
      }
    }
    
    cleaned = result;
  } else {
    console.log('No extreme spacing detected, applying targeted word boundary fixes...');
    
    // For text that's mostly correct but has some missing spaces
    // Use dictionary to detect concatenated words
    let result = '';
    let i = 0;
    
    while (i < cleaned.length) {
      const char = cleaned[i];
      
      if (/[a-zA-Z]/.test(char)) {
        // Find the end of this word-like sequence
        let wordEnd = i;
        while (wordEnd < cleaned.length && /[a-zA-Z]/.test(cleaned[wordEnd])) {
          wordEnd++;
        }
        
        const wordSequence = cleaned.substring(i, wordEnd);
        
        // Try to split this sequence using dictionary
        let sequenceResult = '';
        let pos = 0;
        
        while (pos < wordSequence.length) {
          const wordMatch = findBestSplit(wordSequence, pos);
          
          if (wordMatch) {
            if (sequenceResult) sequenceResult += ' ';
            sequenceResult += wordMatch.word;
            pos = wordMatch.nextPos;
          } else {
            sequenceResult += wordSequence[pos];
            pos++;
          }
        }
        
        result += sequenceResult;
        i = wordEnd;
      } else {
        result += char;
        i++;
      }
    }
    
    cleaned = result;
  }
  
  // Final cleanup
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+([.,:;!?])/g, '$1') // Remove space before punctuation
    .replace(/([.,:;!?])(\w)/g, '$1 $2') // Add space after punctuation
    .replace(/\(\s+/g, '(') // Remove space after opening parenthesis
    .replace(/\s+\)/g, ')') // Remove space before closing parenthesis
    .replace(/(\w)\s*\/\s*(\w)/g, '$1/$2'); // Fix spaces around slashes
  
  console.log('Final cleaned text:', JSON.stringify(cleaned));
  return cleaned;
};
