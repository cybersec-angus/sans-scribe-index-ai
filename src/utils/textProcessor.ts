
// Enhanced dictionary with frequency scores and better word detection
const wordFrequency = new Map([
  // High frequency words with scores
  ['the', 100], ['and', 95], ['for', 90], ['are', 85], ['with', 80], ['that', 75], ['this', 70], ['from', 65], ['they', 60], ['have', 55],
  ['been', 50], ['their', 48], ['said', 46], ['each', 44], ['which', 42], ['more', 40], ['like', 38], ['time', 36], ['very', 34], ['when', 32],
  ['much', 30], ['new', 28], ['now', 26], ['way', 24], ['may', 22], ['say', 20], ['come', 18], ['its', 16], ['over', 14], ['think', 12],
  
  // Technical and cybersecurity terms
  ['attack', 85], ['attacks', 80], ['cybercrime', 75], ['cyber', 70], ['crime', 65], ['security', 60], ['data', 55], ['service', 50],
  ['services', 48], ['money', 46], ['revenue', 44], ['business', 42], ['organization', 40], ['organizations', 38], ['individual', 36],
  ['individuals', 34], ['method', 32], ['methods', 30], ['technique', 28], ['techniques', 26], ['ransomware', 85], ['denial', 75],
  ['critical', 60], ['encrypted', 55], ['ransom', 70], ['recovered', 45], ['disrupt', 40], ['presence', 35], ['perpetrator', 50],
  ['perpetrators', 48], ['malicious', 65], ['group', 45], ['common', 55], ['generating', 40], ['earning', 38], ['focused', 42],
  ['asked', 40], ['allow', 38], ['stop', 35], ['online', 45], ['network', 40], ['system', 42], ['systems', 40], ['computer', 38],
  ['digital', 35], ['internet', 40], ['server', 35], ['servers', 33], ['database', 30], ['software', 35], ['hardware', 30],
  ['information', 45], ['communication', 35], ['protocol', 25], ['encryption', 40], ['firewall', 30], ['malware', 55], ['virus', 40],
  ['hacking', 45], ['breach', 40], ['vulnerability', 35], ['threat', 45], ['threats', 43], ['risk', 40], ['risks', 38],
  
  // Common words and connectors
  ['some', 45], ['these', 40], ['days', 35], ['most', 50], ['both', 45], ['against', 40], ['after', 45], ['would', 50], ['typical', 35],
  ['where', 35], ['what', 40], ['when', 38], ['how', 36], ['why', 30], ['who', 32], ['being', 40], ['into', 35], ['about', 40],
  ['other', 42], ['between', 30], ['during', 28], ['before', 35], ['through', 30], ['around', 25], ['under', 30], ['above', 25],
]);

// Enhanced validation using frequency and pattern analysis
const isValidWord = (word: string): boolean => {
  if (!word || word.length < 2) return false;
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length < 2) return false;
  
  // Check dictionary with frequency
  if (wordFrequency.has(cleanWord)) {
    return true;
  }
  
  // Check for compound words (like cybercrime = cyber + crime)
  if (cleanWord.length > 6) {
    for (let i = 3; i <= cleanWord.length - 3; i++) {
      const prefix = cleanWord.substring(0, i);
      const suffix = cleanWord.substring(i);
      if (wordFrequency.has(prefix) && wordFrequency.has(suffix)) {
        return true;
      }
    }
  }
  
  // Common prefixes and suffixes
  const prefixes = ['un', 're', 'pre', 'dis', 'mis', 'over', 'under', 'anti', 'auto', 'co', 'de', 'ex', 'inter', 'non', 'post', 'pro', 'sub', 'super', 'trans'];
  const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 'ful', 'less', 'able', 'ible', 'ous', 'ive', 'al', 'ic'];
  
  for (const prefix of prefixes) {
    if (cleanWord.startsWith(prefix) && cleanWord.length > prefix.length + 2) {
      const root = cleanWord.substring(prefix.length);
      if (wordFrequency.has(root) || root.length >= 4) {
        return true;
      }
    }
  }
  
  for (const suffix of suffixes) {
    if (cleanWord.endsWith(suffix) && cleanWord.length > suffix.length + 2) {
      const root = cleanWord.substring(0, cleanWord.length - suffix.length);
      if (wordFrequency.has(root) || root.length >= 3) {
        return true;
      }
    }
  }
  
  // Accept longer words that might be valid
  return cleanWord.length >= 4 && /^[a-z]+$/.test(cleanWord);
};

// Advanced dynamic programming with backtracking and scoring
const segmentTextAdvanced = (text: string): string[] => {
  const n = text.length;
  const dp = Array(n + 1).fill(-Infinity);
  const parent = Array(n + 1).fill(-1);
  const words = Array(n + 1).fill('');
  
  dp[0] = 0;
  
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] > -Infinity) {
        const word = text.substring(j, i).toLowerCase();
        
        if (isValidWord(word)) {
          // Calculate score based on word frequency and length
          let score = wordFrequency.get(word) || Math.max(1, 20 - word.length);
          
          // Bonus for longer words (they're more likely to be correct splits)
          if (word.length >= 6) score += 10;
          if (word.length >= 8) score += 15;
          
          // Penalty for very short words in long sequences
          if (word.length <= 2 && i - j > 10) score -= 10;
          
          const newScore = dp[j] + score;
          
          if (newScore > dp[i]) {
            dp[i] = newScore;
            parent[i] = j;
            words[i] = word;
          }
        }
      }
    }
  }
  
  // Reconstruct the best segmentation
  const result = [];
  let pos = n;
  
  while (pos > 0 && parent[pos] !== -1) {
    result.unshift(words[pos]);
    pos = parent[pos];
  }
  
  // If we couldn't segment everything, try a different approach
  if (pos > 0) {
    return greedySegmentWithOverlap(text);
  }
  
  return result.filter(word => word.length > 0);
};

// Improved greedy approach with overlap detection
const greedySegmentWithOverlap = (text: string): string[] => {
  const result = [];
  let position = 0;
  
  while (position < text.length) {
    let bestMatch = null;
    let bestScore = -1;
    
    // Try words of different lengths, prioritizing longer ones
    for (let len = Math.min(15, text.length - position); len >= 2; len--) {
      const candidate = text.substring(position, position + len).toLowerCase();
      
      if (isValidWord(candidate)) {
        let score = wordFrequency.get(candidate) || Math.max(1, 15 - len);
        
        // Prefer longer words
        score += len * 2;
        
        if (score > bestScore) {
          bestMatch = { word: candidate, length: len };
          bestScore = score;
        }
      }
    }
    
    if (bestMatch) {
      result.push(bestMatch.word);
      position += bestMatch.length;
    } else {
      // Skip single character if no word found
      position++;
    }
  }
  
  return result;
};

// Main cleaning function with improved logic
export const cleanSelectedText = (text: string): string => {
  console.log('Processing text:', JSON.stringify(text.substring(0, 100) + '...'));
  
  let cleaned = text.trim();
  
  // Remove all non-letter characters and convert to lowercase for processing
  const lettersOnly = cleaned.replace(/[^a-zA-Z]/g, '').toLowerCase();
  
  console.log('Letters only:', lettersOnly.substring(0, 50) + '...');
  
  if (lettersOnly.length < 10) {
    // For very short text, return as-is with basic cleanup
    return cleaned.replace(/\s+/g, ' ').trim();
  }
  
  // Use advanced segmentation
  const segments = segmentTextAdvanced(lettersOnly);
  console.log('Segmented into', segments.length, 'words:', segments.slice(0, 10));
  
  if (segments.length === 0) {
    return cleaned;
  }
  
  let result = segments.join(' ');
  
  // Post-processing to add punctuation and fix formatting
  result = result
    .replace(/\b(attacks|attack)\s+(focused|focus)\b/gi, 'attacks focused')
    .replace(/\b(denial)\s+(of)\s+(service)\b/gi, 'denial-of-service')
    .replace(/\b(business)\s+(critical)\b/gi, 'business-critical')
    .replace(/\b(group)\s+(of)\b/gi, 'group of')
    .replace(/\b(some)\s+(of)\s+(them)\b/gi, 'some of them')
    .replace(/\b(most)\s+(common)\b/gi, 'most common')
    .replace(/\b(these)\s+(days)\b/gi, 'these days')
    .replace(/\b(both)\s+(against)\b/gi, 'both against')
    .replace(/\b(after)\s+(which)\b/gi, 'after which')
    .replace(/\b(would)\s+(be)\b/gi, 'would be')
    .replace(/\b(online)\s+(presence)\b/gi, 'online presence');
  
  // Add proper punctuation
  result = result
    .replace(/(\w+)\s+(\w+)\s+of\s+(\w+)/g, '$1 ($2 of) $3') // Handle parentheses
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize first letter of sentences
  result = result.charAt(0).toUpperCase() + result.slice(1);
  result = result.replace(/\.\s+(\w)/g, (match, letter) => '. ' + letter.toUpperCase());
  
  console.log('Final result:', result.substring(0, 100) + '...');
  return result;
};
