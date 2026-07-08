/**
 * Splits a long text string (such as extracted textbook contents) into smaller 
 * semantic chunks with a sliding window overlap. 
 * This enables precise vector embeddings and prevents context loss at chunk boundaries.
 * 
 * @param {string} text - The input text content to split.
 * @param {number} [chunkSize=800] - Target character size of each chunk.
 * @param {number} [chunkOverlap=150] - Number of characters to overlap between adjacent chunks.
 * @returns {string[]} Array of partitioned text chunks.
 */
export function splitText(text, chunkSize = 800, chunkOverlap = 150) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return [];
  }

  if (chunkSize <= 0) {
    throw new Error('chunkSize must be greater than 0');
  }

  if (chunkOverlap < 0) {
    throw new Error('chunkOverlap cannot be negative');
  }

  if (chunkOverlap >= chunkSize) {
    throw new Error('chunkOverlap must be strictly smaller than chunkSize');
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    // Determine initial end boundary of this chunk
    let endIndex = startIndex + chunkSize;

    // If we haven't reached the end of the text yet, let's adjust the boundary
    // to avoid splitting a word in half.
    if (endIndex < text.length) {
      // Look for the last space character in the trailing 10% of the chunk
      const searchRange = Math.floor(chunkSize * 0.1);
      const lastSpace = text.lastIndexOf(' ', endIndex);
      
      // If we found a space within a reasonable range, split there instead
      if (lastSpace > endIndex - searchRange && lastSpace > startIndex) {
        endIndex = lastSpace;
      }
    } else {
      endIndex = text.length;
    }

    const chunkContent = text.substring(startIndex, endIndex).trim();
    
    // Only push non-empty chunks
    if (chunkContent.length > 0) {
      chunks.push(chunkContent);
    }

    // Move our window forward, retaining the specified overlap
    const nextStartIndex = endIndex - chunkOverlap;

    // Safety check: ensure the sliding window always advances to prevent infinite loops
    if (nextStartIndex <= startIndex) {
      startIndex = endIndex;
    } else {
      startIndex = nextStartIndex;
    }
  }

  return chunks;
}
