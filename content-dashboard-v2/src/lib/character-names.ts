// 200+ diverse first names from various cultures and regions
export const CHARACTER_NAMES: string[] = [
  // American/Western
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia',
  'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Mila', 'Ella', 'Avery',
  'Sofia', 'Camila', 'Aria', 'Scarlett', 'Victoria', 'Madison', 'Luna', 'Grace',
  'Chloe', 'Penelope', 'Layla', 'Riley', 'Zoey', 'Nora', 'Lily', 'Eleanor',
  'Hannah', 'Lillian', 'Addison', 'Aubrey', 'Ellie', 'Stella', 'Natalie', 'Zoe',
  'Leah', 'Hazel', 'Violet', 'Aurora', 'Savannah', 'Audrey', 'Brooklyn', 'Bella',
  'Claire', 'Skylar', 'Lucy', 'Paisley', 'Everly', 'Anna', 'Caroline', 'Nova',
  'Genesis', 'Emilia', 'Kennedy', 'Samantha', 'Maya', 'Willow', 'Kinsley', 'Naomi',
  'Aaliyah', 'Elena', 'Sarah', 'Ariana', 'Allison', 'Gabriella', 'Alice', 'Madelyn',
  'Cora', 'Ruby', 'Eva', 'Serenity', 'Autumn', 'Adeline', 'Hailey', 'Gianna',
  'Valentina', 'Isla', 'Eliana', 'Quinn', 'Nevaeh', 'Ivy', 'Sadie', 'Piper',
  'Lydia', 'Alexa', 'Josephine', 'Emery', 'Julia', 'Delilah', 'Arianna', 'Vivian',
  // Hispanic/Latina
  'Lucia', 'Catalina', 'Fernanda', 'Valeria', 'Daniela', 'Mariana', 'Andrea',
  'Alejandra', 'Veronica', 'Camila', 'Paola', 'Monica', 'Patricia', 'Sandra',
  'Bianca', 'Natalia', 'Lorena', 'Claudia', 'Diana', 'Adriana', 'Alicia',
  'Cristina', 'Esperanza', 'Graciela', 'Guadalupe', 'Leticia', 'Marisol',
  // East Asian
  'Mei', 'Yuki', 'Sakura', 'Hana', 'Yuna', 'Ji-won', 'Soo-ah', 'Min-ji',
  'Jiyeon', 'Nari', 'Eunji', 'Jinhee', 'Minji', 'Seoyeon', 'Chaeyoung',
  'Xiao', 'Ling', 'Fang', 'Wei', 'Jing', 'Hui', 'Yan', 'Xin', 'Rui',
  'Ayaka', 'Misaki', 'Haruka', 'Akari', 'Yuna', 'Rin', 'Aoi', 'Nana',
  // South Asian
  'Priya', 'Ananya', 'Deepika', 'Shruti', 'Pooja', 'Divya', 'Kavya', 'Neha',
  'Sneha', 'Rashmi', 'Sunita', 'Meena', 'Geeta', 'Nisha', 'Rekha', 'Sona',
  'Anjali', 'Kritika', 'Shalini', 'Riya', 'Ishita', 'Tanvi', 'Swati',
  // Middle Eastern / North African
  'Layla', 'Noor', 'Yasmin', 'Fatima', 'Zara', 'Aisha', 'Rania', 'Hana',
  'Sara', 'Mariam', 'Dina', 'Lina', 'Rana', 'Mona', 'Amira', 'Nadia',
  'Leila', 'Samira', 'Yasmine', 'Huda', 'Reem', 'Hessa', 'Alia',
  // African / Sub-Saharan
  'Amara', 'Nia', 'Zara', 'Aisha', 'Fatou', 'Aminata', 'Kadiatou', 'Mariama',
  'Keita', 'Adaeze', 'Chioma', 'Ngozi', 'Amina', 'Halima', 'Rokia', 'Safiatou',
  'Binta', 'Fatoumata', 'Oumou', 'Bintu', 'Ramata', 'Coumba', 'Kadija',
  // European
  'Ingrid', 'Astrid', 'Freya', 'Sigrid', 'Helga', 'Brunhilde', 'Sonja',
  'Katja', 'Anja', 'Birgit', 'Greta', 'Lena', 'Nina', 'Petra', 'Renate',
  'Brigitte', 'Claudine', 'Sylvie', 'Isabelle', 'Monique', 'Nathalie',
  'Agnieszka', 'Katarzyna', 'Magdalena', 'Monika', 'Anna', 'Joanna', 'Marta',
  'Olga', 'Irina', 'Natasha', 'Tatiana', 'Oksana', 'Yulia', 'Svetlana',
  'Anastasia', 'Ekaterina', 'Daria', 'Alina', 'Yelena',
]

/**
 * Pick N unique names from the pool. Falls back to prefix+index if pool exhausted.
 */
export function pickUniqueNames(count: number, existing: Set<string> = new Set()): string[] {
  const available = CHARACTER_NAMES.filter((n) => !existing.has(n))
  const shuffled = [...available].sort(() => Math.random() - 0.5)
  const picked: string[] = []

  for (let i = 0; i < count; i++) {
    if (i < shuffled.length) {
      picked.push(shuffled[i])
    } else {
      // Fallback: generate unique name with suffix
      let fallback = `Character${i + 1}`
      let suffix = 1
      while (existing.has(fallback) || picked.includes(fallback)) {
        fallback = `Character${i + 1}_${suffix++}`
      }
      picked.push(fallback)
    }
  }

  return picked
}

/**
 * Generate prefix-based names like "Coca Cola 1", "Coca Cola 2", etc.
 */
export function generatePrefixNames(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`)
}
