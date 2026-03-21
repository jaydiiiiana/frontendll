export const BAD_WORDS = [
  'nigger', 'niga', 'nigg@', 'ni ga', 'nigga', 'n.i.g.g.a', 'n!gga', 
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'dick', 'pussy',
  'tangina', 'putangina', 'gago', 'kupal', 'pakyu', 'pokpok', 'bobo', 'hayop',
  'tanga', 'ulol', 'panot', 'duwag', 'lintik', 'salot', 'tarantado', 'yawa', 'piste', 'pisti',
  'crush mo si', 'nililigawan mo si', 'nililigawan mo', 'crush mo', 'mahal mo si', 
  'kala mo', 'si ano', 'sino si', 'pakilala mo si', 'ano name', 'name ni', 'ano pangalan',
  'drop name', 'dropname', 'drop names', 'dropnames', 'name reveal', 'naming names'
];

export function containsBadWords(text: string): boolean {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase()
    .replace(/[0-9]/g, (n) => {
      const map: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't' };
      return map[n] || n;
    })
    .replace(/@/g, 'a')
    .replace(/\*/g, 'i')
    .replace(/_/g, 'i')
    .replace(/\!/g, 'i')
    .replace(/\$/g, 's')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');

  for (const word of BAD_WORDS) {
    if (normalizedText.includes(word)) return true;
  }

  const noSpaces = normalizedText.replace(/\s/g, '');
  for (const word of BAD_WORDS) {
    if (noSpaces.includes(word.replace(/\s/g, ''))) return true;
  }

  return false;
}
