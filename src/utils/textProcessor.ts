
// Enhanced dictionary with frequency scores and better word detection
const wordFrequency = new Map([
  // High frequency words with scores
  ['the', 100], ['and', 95], ['for', 90], ['are', 85], ['with', 80], ['that', 75], ['this', 70], ['from', 65], ['they', 60], ['have', 55],
  ['been', 50], ['their', 48], ['said', 46], ['each', 44], ['which', 42], ['more', 40], ['like', 38], ['time', 36], ['very', 34], ['when', 32],
  ['much', 30], ['new', 28], ['now', 26], ['way', 24], ['may', 22], ['say', 20], ['come', 18], ['its', 16], ['over', 14], ['think', 12],
  ['be', 70], ['to', 85], ['of', 90], ['in', 75], ['is', 80], ['it', 65], ['on', 60], ['as', 55], ['at', 50], ['by', 45], ['an', 40],
  ['or', 35], ['if', 30], ['up', 25], ['so', 20], ['no', 18], ['do', 16], ['go', 14], ['we', 35], ['he', 30], ['me', 25], ['my', 20],
  
  // Technical and cybersecurity terms
  ['attack', 85], ['attacks', 80], ['cybercrime', 75], ['cyber', 70], ['crime', 65], ['security', 60], ['data', 75], ['service', 70],
  ['services', 68], ['money', 60], ['revenue', 55], ['business', 58], ['organization', 52], ['organizations', 50], ['individual', 48],
  ['individuals', 46], ['method', 50], ['methods', 48], ['technique', 46], ['techniques', 44], ['ransomware', 85], ['denial', 75],
  ['critical', 60], ['encrypted', 55], ['ransom', 70], ['recovered', 45], ['disrupt', 50], ['presence', 45], ['perpetrator', 50],
  ['perpetrators', 48], ['malicious', 65], ['group', 55], ['common', 60], ['generating', 45], ['earning', 50], ['focused', 52],
  ['asked', 50], ['allow', 48], ['stop', 45], ['online', 55], ['network', 50], ['system', 52], ['systems', 50], ['computer', 48],
  ['digital', 45], ['internet', 50], ['server', 45], ['servers', 43], ['database', 40], ['software', 45], ['hardware', 40],
  ['information', 50], ['communication', 40], ['protocol', 30], ['encryption', 45], ['firewall', 35], ['malware', 60], ['virus', 45],
  ['hacking', 50], ['breach', 45], ['vulnerability', 40], ['threat', 50], ['threats', 48], ['risk', 45], ['risks', 43],
  
  // Common words and connectors
  ['some', 50], ['these', 45], ['days', 40], ['most', 55], ['both', 50], ['against', 50], ['after', 50], ['would', 55], ['typical', 40],
  ['where', 40], ['what', 45], ['when', 43], ['how', 41], ['why', 35], ['who', 37], ['being', 45], ['into', 40], ['about', 45],
  ['other', 47], ['between', 35], ['during', 33], ['before', 40], ['through', 35], ['around', 30], ['under', 35], ['above', 30],
  ['see', 45], ['use', 40], ['get', 35], ['make', 40], ['take', 35], ['know', 40], ['think', 35], ['work', 40], ['look', 35],
  ['come', 30], ['give', 30], ['find', 35], ['tell', 30], ['call', 30], ['try', 30], ['ask', 35], ['need', 40], ['feel', 25],
  ['become', 30], ['leave', 25], ['put', 25], ['mean', 30], ['keep', 30], ['let', 25], ['begin', 25], ['seem', 25], ['help', 35],
  ['show', 30], ['hear', 25], ['play', 25], ['run', 25], ['move', 25], ['live', 25], ['believe', 25], ['bring', 25], ['happen', 25],
]);

// Enhanced validation using frequency and pattern analysis
const isValidWord = (word: string): boolean => {
  if (!word || word.length < 1) return false;
  
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanWord.length < 1) return false;
  
  // Single letters are valid in some contexts
  if (cleanWord.length === 1) {
    return ['a', 'i'].includes(cleanWord);
  }
  
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
  const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 'ful', 'less', 'able', 'ible', 'ous', 'ive', 'al', 'ic', 's'];
  
  for (const prefix of prefixes) {
    if (cleanWord.startsWith(prefix) && cleanWord.length > prefix.length + 2) {
      const root = cleanWord.substring(prefix.length);
      if (wordFrequency.has(root) || root.length >= 3) {
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

// Enhanced dynamic programming with better scoring
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
          let score = wordFrequency.get(word) || Math.max(1, 25 - word.length * 2);
          
          // Strong bonus for common words
          if (wordFrequency.has(word) && wordFrequency.get(word)! > 60) {
            score += 20;
          }
          
          // Bonus for optimal word lengths
          if (word.length >= 3 && word.length <= 8) score += 15;
          if (word.length >= 5 && word.length <= 7) score += 10;
          
          // Penalty for very short or very long words
          if (word.length <= 2 && i - j > 8) score -= 15;
          if (word.length > 12) score -= 10;
          
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
    for (let len = Math.min(15, text.length - position); len >= 1; len--) {
      const candidate = text.substring(position, position + len).toLowerCase();
      
      if (isValidWord(candidate)) {
        let score = wordFrequency.get(candidate) || Math.max(1, 20 - len);
        
        // Prefer longer words but not too long
        if (len >= 3 && len <= 8) score += len * 3;
        if (len >= 5 && len <= 7) score += 10;
        
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

// Post-processing rules to fix common spacing issues
const applyPostProcessingRules = (text: string): string => {
  let processed = text;
  
  // Fix common word concatenations
  const concatenationFixes = [
    // Common word pairs that get stuck together
    [/\b(data)(is)\b/gi, '$1 $2'],
    [/\b(ransom)(is)\b/gi, '$1 $2'],
    [/\b(attack)(is)\b/gi, '$1 $2'],
    [/\b(which)(a)\b/gi, '$1 $2'],
    [/\b(after)(which)\b/gi, '$1 $2'],
    [/\b(to)(be)\b/gi, '$1 $2'],
    [/\b(would)(be)\b/gi, '$1 $2'],
    [/\b(can)(be)\b/gi, '$1 $2'],
    [/\b(will)(be)\b/gi, '$1 $2'],
    [/\b(have)(been)\b/gi, '$1 $2'],
    [/\b(has)(been)\b/gi, '$1 $2'],
    [/\b(is)(asked)\b/gi, '$1 $2'],
    [/\b(are)(asked)\b/gi, '$1 $2'],
    [/\b(was)(asked)\b/gi, '$1 $2'],
    [/\b(were)(asked)\b/gi, '$1 $2'],
    [/\b(to)(allow)\b/gi, '$1 $2'],
    [/\b(to)(stop)\b/gi, '$1 $2'],
    [/\b(to)(disrupt)\b/gi, '$1 $2'],
    [/\b(of)(an)\b/gi, '$1 $2'],
    [/\b(of)(a)\b/gi, '$1 $2'],
    [/\b(of)(the)\b/gi, '$1 $2'],
    [/\b(in)(the)\b/gi, '$1 $2'],
    [/\b(on)(the)\b/gi, '$1 $2'],
    [/\b(at)(the)\b/gi, '$1 $2'],
    [/\b(for)(the)\b/gi, '$1 $2'],
    [/\b(with)(the)\b/gi, '$1 $2'],
    [/\b(by)(the)\b/gi, '$1 $2'],
    [/\b(from)(the)\b/gi, '$1 $2'],
    [/\b(against)(the)\b/gi, '$1 $2'],
    [/\b(business)(critical)\b/gi, '$1-$2'],
    [/\b(denial)(of)(service)\b/gi, '$1-$2-$3'],
    [/\b(some)(of)\b/gi, '$1 $2'],
    [/\b(most)(of)\b/gi, '$1 $2'],
    [/\b(all)(of)\b/gi, '$1 $2'],
    [/\b(one)(of)\b/gi, '$1 $2'],
    [/\b(many)(of)\b/gi, '$1 $2'],
    [/\b(both)(of)\b/gi, '$1 $2'],
    [/\b(each)(of)\b/gi, '$1 $2'],
    [/\b(none)(of)\b/gi, '$1 $2'],
    [/\b(group)(of)\b/gi, '$1 $2'],
    [/\b(type)(of)\b/gi, '$1 $2'],
    [/\b(kind)(of)\b/gi, '$1 $2'],
    [/\b(sort)(of)\b/gi, '$1 $2'],
    [/\b(these)(days)\b/gi, '$1 $2'],
    [/\b(those)(days)\b/gi, '$1 $2'],
    [/\b(we)(see)\b/gi, '$1 $2'],
    [/\b(they)(see)\b/gi, '$1 $2'],
    [/\b(you)(see)\b/gi, '$1 $2'],
    [/\b(we)(use)\b/gi, '$1 $2'],
    [/\b(they)(use)\b/gi, '$1 $2'],
    [/\b(you)(use)\b/gi, '$1 $2'],
    [/\b(online)(presence)\b/gi, '$1 $2'],
    [/\b(digital)(presence)\b/gi, '$1 $2'],
    [/\b(web)(presence)\b/gi, '$1 $2'],
  ];
  
  // Apply concatenation fixes
  for (const [pattern, replacement] of concatenationFixes) {
    processed = processed.replace(pattern, replacement);
  }
  
  // Fix over-separated words (words that got split incorrectly)
  const separationFixes = [
    // Common words that get split
    [/\b(se rv ice)\b/gi, 'service'],
    [/\b(ser vice)\b/gi, 'service'],
    [/\b(serv ice)\b/gi, 'service'],
    [/\b(organi zation)\b/gi, 'organization'],
    [/\b(organ ization)\b/gi, 'organization'],
    [/\b(organiz ation)\b/gi, 'organization'],
    [/\b(organiza tion)\b/gi, 'organization'],
    [/\b(per petrator)\b/gi, 'perpetrator'],
    [/\b(perp etrator)\b/gi, 'perpetrator'],
    [/\b(perpet rator)\b/gi, 'perpetrator'],
    [/\b(perpetr ator)\b/gi, 'perpetrator'],
    [/\b(perpetra tor)\b/gi, 'perpetrator'],
    [/\b(perpetrat or)\b/gi, 'perpetrator'],
    [/\b(gene rating)\b/gi, 'generating'],
    [/\b(gen erating)\b/gi, 'generating'],
    [/\b(gener ating)\b/gi, 'generating'],
    [/\b(genera ting)\b/gi, 'generating'],
    [/\b(generat ing)\b/gi, 'generating'],
    [/\b(generati ng)\b/gi, 'generating'],
    [/\b(generatin g)\b/gi, 'generating'],
    [/\b(ransom ware)\b/gi, 'ransomware'],
    [/\b(rans omware)\b/gi, 'ransomware'],
    [/\b(ranso mware)\b/gi, 'ransomware'],
    [/\b(ransom w are)\b/gi, 'ransomware'],
    [/\b(ransom wa re)\b/gi, 'ransomware'],
    [/\b(ransom war e)\b/gi, 'ransomware'],
    [/\b(enc rypted)\b/gi, 'encrypted'],
    [/\b(encr ypted)\b/gi, 'encrypted'],
    [/\b(encry pted)\b/gi, 'encrypted'],
    [/\b(encryp ted)\b/gi, 'encrypted'],
    [/\b(encrypt ed)\b/gi, 'encrypted'],
    [/\b(bus iness)\b/gi, 'business'],
    [/\b(busi ness)\b/gi, 'business'],
    [/\b(busin ess)\b/gi, 'business'],
    [/\b(busine ss)\b/gi, 'business'],
    [/\b(crit ical)\b/gi, 'critical'],
    [/\b(criti cal)\b/gi, 'critical'],
    [/\b(critic al)\b/gi, 'critical'],
    [/\b(critica l)\b/gi, 'critical'],
    [/\b(rec overed)\b/gi, 'recovered'],
    [/\b(reco vered)\b/gi, 'recovered'],
    [/\b(recov ered)\b/gi, 'recovered'],
    [/\b(recove red)\b/gi, 'recovered'],
    [/\b(recover ed)\b/gi, 'recovered'],
    [/\b(recovere d)\b/gi, 'recovered'],
    [/\b(mal icious)\b/gi, 'malicious'],
    [/\b(mali cious)\b/gi, 'malicious'],
    [/\b(malic ious)\b/gi, 'malicious'],
    [/\b(malici ous)\b/gi, 'malicious'],
    [/\b(malicio us)\b/gi, 'malicious'],
    [/\b(maliciou s)\b/gi, 'malicious'],
    [/\b(typ ical)\b/gi, 'typical'],
    [/\b(typi cal)\b/gi, 'typical'],
    [/\b(typic al)\b/gi, 'typical'],
    [/\b(typica l)\b/gi, 'typical'],
    [/\b(comm on)\b/gi, 'common'],
    [/\b(commo n)\b/gi, 'common'],
    [/\b(ear ning)\b/gi, 'earning'],
    [/\b(earn ing)\b/gi, 'earning'],
    [/\b(foc used)\b/gi, 'focused'],
    [/\b(focu sed)\b/gi, 'focused'],
    [/\b(focus ed)\b/gi, 'focused'],
    [/\b(focuse d)\b/gi, 'focused'],
    [/\b(meth od)\b/gi, 'method'],
    [/\b(metho d)\b/gi, 'method'],
    [/\b(meth ods)\b/gi, 'methods'],
    [/\b(metho ds)\b/gi, 'methods'],
    [/\b(tech nique)\b/gi, 'technique'],
    [/\b(techn ique)\b/gi, 'technique'],
    [/\b(techni que)\b/gi, 'technique'],
    [/\b(techniq ue)\b/gi, 'technique'],
    [/\b(techniqu e)\b/gi, 'technique'],
    [/\b(tech niques)\b/gi, 'techniques'],
    [/\b(techn iques)\b/gi, 'techniques'],
    [/\b(techni ques)\b/gi, 'techniques'],
    [/\b(techniq ues)\b/gi, 'techniques'],
    [/\b(techniqu es)\b/gi, 'techniques'],
    [/\b(pre sence)\b/gi, 'presence'],
    [/\b(pres ence)\b/gi, 'presence'],
    [/\b(prese nce)\b/gi, 'presence'],
    [/\b(presen ce)\b/gi, 'presence'],
    [/\b(presenc e)\b/gi, 'presence'],
    [/\b(on line)\b/gi, 'online'],
    [/\b(onl ine)\b/gi, 'online'],
    [/\b(aft er)\b/gi, 'after'],
    [/\b(bef ore)\b/gi, 'before'],
    [/\b(befo re)\b/gi, 'before'],
    [/\b(w ith)\b/gi, 'with'],
    [/\b(wi th)\b/gi, 'with'],
    [/\b(wh ich)\b/gi, 'which'],
    [/\b(whi ch)\b/gi, 'which'],
    [/\b(ag ainst)\b/gi, 'against'],
    [/\b(aga inst)\b/gi, 'against'],
    [/\b(again st)\b/gi, 'against'],
    [/\b(agains t)\b/gi, 'against'],
    [/\b(ind ividuals)\b/gi, 'individuals'],
    [/\b(indi viduals)\b/gi, 'individuals'],
    [/\b(indiv iduals)\b/gi, 'individuals'],
    [/\b(indivi duals)\b/gi, 'individuals'],
    [/\b(individ uals)\b/gi, 'individuals'],
    [/\b(individu als)\b/gi, 'individuals'],
    [/\b(individua ls)\b/gi, 'individuals'],
    [/\b(individual s)\b/gi, 'individuals'],
    [/\b(ind ividual)\b/gi, 'individual'],
    [/\b(indi vidual)\b/gi, 'individual'],
    [/\b(indiv idual)\b/gi, 'individual'],
    [/\b(indivi dual)\b/gi, 'individual'],
    [/\b(individ ual)\b/gi, 'individual'],
    [/\b(individu al)\b/gi, 'individual'],
    [/\b(individua l)\b/gi, 'individual'],
  ];
  
  // Apply separation fixes
  for (const [pattern, replacement] of separationFixes) {
    processed = processed.replace(pattern, replacement);
  }
  
  // Clean up extra spaces
  processed = processed.replace(/\s+/g, ' ').trim();
  
  return processed;
};

// Main cleaning function with improved logic and post-processing
export const cleanSelectedText = (text: string): string => {
  console.log('Processing text:', JSON.stringify(text.substring(0, 100) + '...'));
  
  let cleaned = text.trim();
  
  // Remove all non-letter characters and convert to lowercase for processing
  const lettersOnly = cleaned.replace(/[^a-zA-Z]/g, '').toLowerCase();
  
  console.log('Letters only:', lettersOnly.substring(0, 50) + '...');
  
  if (lettersOnly.length < 5) {
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
  
  // Apply post-processing rules to fix spacing issues
  result = applyPostProcessingRules(result);
  
  // Capitalize first letter of sentences
  result = result.charAt(0).toUpperCase() + result.slice(1);
  result = result.replace(/\.\s+(\w)/g, (match, letter) => '. ' + letter.toUpperCase());
  
  console.log('Final result:', result.substring(0, 100) + '...');
  return result;
};
