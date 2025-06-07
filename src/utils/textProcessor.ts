
// Comprehensive dictionary for text reconstruction including technical terms
const commonWords = new Set([
  // High frequency words
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with',
  
  // Cybersecurity and technical terms
  'cybercrime', 'cyber', 'crime', 'attack', 'attacks', 'data', 'service', 'services', 'money', 'revenue', 'business', 'organization', 'organizations', 'individual', 'individuals',
  'method', 'methods', 'technique', 'techniques', 'ransomware', 'denial', 'critical', 'encrypted', 'ransom', 'recovered', 'disrupt', 'presence',
  'perpetrator', 'perpetrators', 'malicious', 'group', 'common', 'generating', 'earning', 'focused', 'asked', 'allow', 'stop', 'online',
  'security', 'network', 'system', 'systems', 'computer', 'digital', 'internet', 'web', 'server', 'servers', 'database', 'software',
  'hardware', 'technology', 'information', 'communication', 'protocol', 'encryption', 'decryption', 'firewall', 'malware', 'virus',
  'trojan', 'phishing', 'hacking', 'hacker', 'hackers', 'breach', 'vulnerability', 'threat', 'threats', 'risk', 'risks',
  'typical', 'would', 'after', 'which', 'both', 'against', 'most',
  
  // Common nouns and verbs
  'some', 'these', 'days', 'see', 'we', 'they', 'them', 'their', 'there', 'what', 'when', 'where', 'who', 'how', 'why',
  'can', 'could', 'should', 'would', 'being', 'been', 'have', 'had', 'do', 'does', 'did', 'get', 'got', 'make', 'made',
  'take', 'taken', 'come', 'came', 'go', 'went', 'know', 'knew', 'think', 'thought', 'see', 'saw', 'look', 'way', 'time',
  'year', 'day', 'work', 'life', 'man', 'woman', 'child', 'world', 'school', 'state', 'family', 'student', 'country',
  'problem', 'hand', 'part', 'place', 'case', 'week', 'company', 'program', 'question', 'right', 'government', 'number',
  'night', 'point', 'home', 'water', 'room', 'mother', 'area', 'story', 'fact', 'month', 'lot', 'study', 'book', 'eye',
  'job', 'word', 'though', 'issue', 'side', 'kind', 'head', 'house', 'friend', 'father', 'power', 'hour', 'game', 'line',
  'end', 'member', 'law', 'car', 'city', 'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body', 'back',
  'parent', 'face', 'others', 'level', 'office', 'door', 'health', 'person', 'art', 'war', 'history', 'party', 'within',
  'grow', 'result', 'open', 'change', 'morning', 'walk', 'reason', 'low', 'win', 'research', 'girl', 'guy', 'early', 'food',
  'before', 'moment', 'himself', 'air', 'teacher', 'force', 'offer', 'enough', 'education', 'across', 'although', 'remember',
  'foot', 'second', 'boy', 'maybe', 'toward', 'able', 'age', 'off', 'policy', 'everything', 'love', 'process', 'music',
  'including', 'consider', 'appear', 'actually', 'buy', 'probably', 'human', 'wait', 'serve', 'market', 'die', 'send',
  'expect', 'sense', 'build', 'stay', 'fall', 'oh', 'nation', 'plan', 'cut', 'college', 'interest', 'death', 'course',
  'someone', 'experience', 'behind', 'reach', 'local', 'kill', 'six', 'remain', 'effect', 'use', 'yeah', 'suggest', 'class',
  'control', 'raise', 'care', 'perhaps', 'little', 'late', 'hard', 'field', 'else', 'pass', 'former', 'sell', 'major',
  'sometimes', 'require', 'along', 'development', 'themselves', 'report', 'role', 'better', 'economic', 'effort', 'up',
  'decide', 'rate', 'strong', 'possible', 'heart', 'drug', 'show', 'leader', 'light', 'voice', 'wife', 'whole', 'police',
  'mind', 'finally', 'pull', 'return', 'free', 'military', 'price'
]);

// Enhanced function to check if a string is likely a valid English word
const isValidWord = (word: string): boolean => {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  
  // Check dictionary first
  if (commonWords.has(cleanWord)) {
    return true;
  }
  
  // Check for compound words (like cybercrime = cyber + crime)
  if (cleanWord.length > 6) {
    for (let i = 3; i <= cleanWord.length - 3; i++) {
      const prefix = cleanWord.substring(0, i);
      const suffix = cleanWord.substring(i);
      if (commonWords.has(prefix) && commonWords.has(suffix)) {
        return true;
      }
    }
  }
  
  // Accept words with common prefixes/suffixes
  const commonPrefixes = ['un', 're', 'pre', 'dis', 'mis', 'over', 'under', 'out', 'up', 'sub', 'inter', 'trans', 'super', 'anti', 'auto', 'co', 'de', 'ex', 'extra', 'hyper', 'il', 'im', 'in', 'ir', 'macro', 'micro', 'mid', 'mini', 'multi', 'non', 'post', 'pro', 'semi', 'tele', 'ultra'];
  const commonSuffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 'ful', 'less', 'able', 'ible', 'al', 'ic', 'ous', 'ive', 'age', 'ery', 'ory', 'ism', 'ist', 'ity', 'ty', 'ward', 'wise', 'like', 'ship', 'hood', 'dom', 'th', 'en', 'fy', 'ize', 'ise'];
  
  for (const prefix of commonPrefixes) {
    if (cleanWord.startsWith(prefix) && cleanWord.length > prefix.length + 2) {
      const root = cleanWord.substring(prefix.length);
      if (commonWords.has(root)) {
        return true;
      }
    }
  }
  
  for (const suffix of commonSuffixes) {
    if (cleanWord.endsWith(suffix) && cleanWord.length > suffix.length + 2) {
      const root = cleanWord.substring(0, cleanWord.length - suffix.length);
      if (commonWords.has(root)) {
        return true;
      }
    }
  }
  
  return cleanWord.length > 1;
};

// Improved function to find the best word split at a given position
const findBestSplit = (text: string, startPos: number, maxLength: number = 20): { word: string; nextPos: number } | null => {
  // Try different word lengths, preferring longer valid words
  for (let len = Math.min(maxLength, text.length - startPos); len >= 2; len--) {
    const candidate = text.substring(startPos, startPos + len);
    if (isValidWord(candidate)) {
      return { word: candidate, nextPos: startPos + len };
    }
  }
  return null;
};

// Advanced pattern detection for different types of text corruption
const detectTextPattern = (text: string): 'extreme_spacing' | 'missing_spaces' | 'mixed' | 'normal' => {
  const spacedPattern = /(\w\s){8,}/;
  const missingSpacePattern = /[a-z][A-Z]|[a-z]{3,}[a-z]{3,}/;
  const spaceCount = (text.match(/\s/g) || []).length;
  const charCount = text.replace(/\s/g, '').length;
  const spaceRatio = spaceCount / charCount;
  
  if (spacedPattern.test(text) || spaceRatio > 0.3) {
    return 'extreme_spacing';
  } else if (missingSpacePattern.test(text)) {
    return 'missing_spaces';
  } else if (spaceRatio < 0.1 && charCount > 20) {
    return 'mixed';
  }
  return 'normal';
};

// Main text cleaning function with improved algorithms
export const cleanSelectedText = (text: string): string => {
  console.log('Original text:', JSON.stringify(text));
  
  let cleaned = text.trim();
  const pattern = detectTextPattern(cleaned);
  
  console.log('Detected pattern:', pattern);
  
  if (pattern === 'extreme_spacing') {
    console.log('Processing extreme spacing pattern...');
    
    // Remove all spaces to get the base text
    const noSpaces = cleaned.replace(/\s+/g, '');
    console.log('Text without spaces:', noSpaces);
    
    // Reconstruct using enhanced dictionary
    let result = '';
    let position = 0;
    
    while (position < noSpaces.length) {
      const currentChar = noSpaces[position];
      
      // Handle punctuation and special characters
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
  } else if (pattern === 'missing_spaces' || pattern === 'mixed') {
    console.log('Processing missing spaces pattern...');
    
    // Handle concatenated words by finding word boundaries
    let result = '';
    let i = 0;
    
    while (i < cleaned.length) {
      const char = cleaned[i];
      
      if (/[a-zA-Z]/.test(char)) {
        // Find the end of this sequence of letters
        let wordEnd = i;
        while (wordEnd < cleaned.length && /[a-zA-Z]/.test(cleaned[wordEnd])) {
          wordEnd++;
        }
        
        const sequence = cleaned.substring(i, wordEnd);
        
        // Try to split this sequence using dictionary
        let sequenceResult = '';
        let pos = 0;
        
        while (pos < sequence.length) {
          const wordMatch = findBestSplit(sequence, pos);
          
          if (wordMatch) {
            if (sequenceResult) sequenceResult += ' ';
            sequenceResult += wordMatch.word;
            pos = wordMatch.nextPos;
          } else {
            sequenceResult += sequence[pos];
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
  
  // Final cleanup and formatting
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+([.,:;!?])/g, '$1') // Remove space before punctuation
    .replace(/([.,:;!?])(\w)/g, '$1 $2') // Add space after punctuation
    .replace(/\(\s+/g, '(') // Remove space after opening parenthesis
    .replace(/\s+\)/g, ')') // Remove space before closing parenthesis
    .replace(/(\w)\s*\/\s*(\w)/g, '$1/$2') // Fix spaces around slashes
    .replace(/(\w)\s*-\s*(\w)/g, '$1-$2'); // Fix spaces around hyphens
  
  console.log('Final cleaned text:', JSON.stringify(cleaned));
  return cleaned;
};
